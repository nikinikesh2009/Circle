import { useState, useEffect, useRef } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useAuth } from "@/hooks/useAuth";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Loader2, Send, Trash2, Bot, User, Sparkles, Calendar, Target, Brain, Paperclip, X, Image as ImageIcon, FileText, Music, Mic } from "lucide-react";
import { type ChatMessage } from "@shared/schema";
import { storage } from "@/lib/firebase";
import { ref as storageRef, uploadBytes, getDownloadURL } from "firebase/storage";
import { marked } from 'marked';
import DOMPurify from 'dompurify';

export default function Chat() {
  const { currentUser } = useAuth();
  const [message, setMessage] = useState("");
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [filePreview, setFilePreview] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const { data: messages = [], isLoading } = useQuery<ChatMessage[]>({
    queryKey: [`/api/chat/messages?userId=${currentUser?.uid}`],
    enabled: !!currentUser,
  });

  const sendMutation = useMutation({
    mutationFn: async (content: string) => {
      return apiRequest("POST", "/api/chat/messages", { 
        userId: currentUser?.uid,
        role: "user", 
        content 
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [`/api/chat/messages?userId=${currentUser?.uid}`] });
      setMessage("");
    },
  });

  const clearMutation = useMutation({
    mutationFn: async () => {
      return apiRequest("DELETE", `/api/chat/messages?userId=${currentUser?.uid}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [`/api/chat/messages?userId=${currentUser?.uid}`] });
    },
  });

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if ((!message.trim() && !selectedFile) || sendMutation.isPending || uploading) return;

    try {
      let fileData = null;
      if (selectedFile) {
        setUploading(true);
        fileData = await uploadFile(selectedFile);
        removeFile();
      }

      const content = message.trim() || (fileData ? `[Uploaded ${fileData.type}]` : "");
      
      await apiRequest("POST", "/api/chat/messages", { 
        userId: currentUser?.uid,
        role: "user", 
        content,
        ...(fileData && {
          fileUrl: fileData.url,
          fileType: fileData.type,
          fileName: fileData.fileName,
          mimeType: fileData.mimeType
        })
      });

      queryClient.invalidateQueries({ queryKey: [`/api/chat/messages?userId=${currentUser?.uid}`] });
      setMessage("");
    } catch (error) {
      console.error("Error sending message:", error);
      alert("Failed to send message. Please try again.");
    } finally {
      setUploading(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSubmit(e);
    }
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const maxSize = 10 * 1024 * 1024;
    if (file.size > maxSize) {
      alert("File size must be less than 10MB");
      return;
    }

    const allowedTypes = [
      "image/jpeg", "image/png", "image/gif", "image/webp",
      "audio/mpeg", "audio/wav", "audio/flac", "audio/ogg",
      "application/pdf"
    ];

    if (!allowedTypes.includes(file.type)) {
      alert("Unsupported file type. Please upload images, audio files, or PDFs.");
      return;
    }

    setSelectedFile(file);

    if (file.type.startsWith("image/")) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setFilePreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    } else {
      setFilePreview(null);
    }
  };

  const removeFile = () => {
    setSelectedFile(null);
    setFilePreview(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const uploadFile = async (file: File): Promise<{url: string, type: string, fileName: string, mimeType: string}> => {
    const fileExtension = file.name.split('.').pop();
    const fileName = `${currentUser?.uid}/${Date.now()}.${fileExtension}`;
    const fileRef = storageRef(storage, `chat-files/${fileName}`);
    
    await uploadBytes(fileRef, file);
    const url = await getDownloadURL(fileRef);

    let fileType: "image" | "audio" | "document" = "document";
    if (file.type.startsWith("image/")) fileType = "image";
    else if (file.type.startsWith("audio/")) fileType = "audio";
    else if (file.type === "application/pdf") fileType = "document";

    return {
      url,
      type: fileType,
      fileName: file.name,
      mimeType: file.type
    };
  };

  const quickActions = [
    {
      icon: Brain,
      label: "Solve a Problem",
      prompt: "I have a problem I need help solving: ",
      testId: "quick-solve-problem"
    },
    {
      icon: Calendar,
      label: "Plan My Day",
      prompt: "Can you help me plan my day? Here's what I need to do: ",
      testId: "quick-plan-day"
    },
    {
      icon: Target,
      label: "Set a Goal",
      prompt: "I want to set a goal and need help breaking it down: ",
      testId: "quick-set-goal"
    },
  ];

  const handleQuickAction = (prompt: string) => {
    setMessage(prompt);
  };

  if (!currentUser) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p className="text-muted-foreground">Please log in to use AI Chat</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-[calc(100vh-4rem)] md:h-[calc(100vh-4rem)]">
      <div className="flex-shrink-0 border-b border-border bg-card/50 backdrop-blur-lg px-3 py-2">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-lg md:text-xl font-bold bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent">
              AI Problem Solver
            </h1>
            <p className="text-xs text-muted-foreground">
              Get actionable solutions and guidance
            </p>
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={() => clearMutation.mutate()}
            disabled={clearMutation.isPending || messages.length === 0}
            data-testid="button-clear-chat"
          >
            <Trash2 className="w-3.5 h-3.5 md:mr-1.5" />
            <span className="hidden md:inline text-xs">Clear</span>
          </Button>
        </div>
        
        {messages.length === 0 && (
          <div className="mt-2 flex gap-1.5 flex-wrap">
            {quickActions.map((action) => {
              const Icon = action.icon;
              return (
                <Button
                  key={action.label}
                  variant="outline"
                  size="sm"
                  onClick={() => handleQuickAction(action.prompt)}
                  className="gap-1.5 h-7 text-xs px-2"
                  data-testid={action.testId}
                >
                  <Icon className="w-3 h-3" />
                  <span>{action.label}</span>
                </Button>
              );
            })}
          </div>
        )}
      </div>

      <div className="flex-1 overflow-y-auto bg-gradient-to-br from-background via-background to-muted/20">
        <div className="max-w-4xl mx-auto px-3 py-3 space-y-3" data-testid="chat-messages-container">
            {isLoading ? (
              <div className="flex items-center justify-center h-full">
                <Loader2 className="w-6 h-6 animate-spin text-primary" />
              </div>
            ) : messages.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-full text-center space-y-3">
                <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center">
                  <Bot className="w-6 h-6 text-primary" />
                </div>
                <div>
                  <h3 className="text-base font-semibold text-foreground">Start a conversation</h3>
                  <p className="text-xs text-muted-foreground mt-1">
                    Ask me anything! I'm here to help.
                  </p>
                </div>
              </div>
            ) : (
              messages.map((msg) => (
                <div
                  key={msg.id}
                  className={`flex gap-2 ${msg.role === "user" ? "justify-end" : "justify-start"}`}
                  data-testid={`message-${msg.role}-${msg.id}`}
                >
                  {msg.role === "assistant" && (
                    <div className="w-6 h-6 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                      <Bot className="w-4 h-4 text-primary" />
                    </div>
                  )}
                  <div
                    className={`max-w-[80%] rounded-xl px-3 py-2 ${
                      msg.role === "user"
                        ? "bg-primary text-primary-foreground"
                        : "bg-muted text-foreground"
                    }`}
                  >
                    {msg.fileUrl && (
                      <div className="mb-2">
                        {msg.fileType === "image" && (
                          <img 
                            src={`/api/proxy/file?url=${encodeURIComponent(msg.fileUrl)}`} 
                            alt={msg.fileName || "Uploaded image"} 
                            className="max-w-full rounded max-h-64 object-contain"
                          />
                        )}
                        {msg.fileType === "audio" && (
                          <div className="flex items-center gap-2 p-2 bg-background/20 rounded">
                            <Music className="w-5 h-5" />
                            <div className="flex-1">
                              <p className="text-xs font-medium">{msg.fileName}</p>
                              <audio controls src={`/api/proxy/file?url=${encodeURIComponent(msg.fileUrl)}`} className="w-full mt-1" />
                            </div>
                          </div>
                        )}
                        {msg.fileType === "document" && (
                          <a 
                            href={`/api/proxy/file?url=${encodeURIComponent(msg.fileUrl)}`} 
                            target="_blank" 
                            rel="noopener noreferrer"
                            className="flex items-center gap-2 p-2 bg-background/20 rounded hover:bg-background/30 transition"
                          >
                            <FileText className="w-5 h-5" />
                            <div className="flex-1">
                              <p className="text-xs font-medium">{msg.fileName}</p>
                              <p className="text-xs opacity-70">Click to view PDF</p>
                            </div>
                          </a>
                        )}
                      </div>
                    )}
                    {msg.role === "assistant" ? (
                      <div 
                        className="text-sm prose prose-sm dark:prose-invert max-w-none" 
                        data-testid={`text-message-${msg.id}`}
                        dangerouslySetInnerHTML={{ __html: DOMPurify.sanitize(marked(msg.content) as string) }}
                      />
                    ) : (
                      <p className="text-sm whitespace-pre-wrap break-words" data-testid={`text-message-${msg.id}`}>
                        {msg.content}
                      </p>
                    )}
                  </div>
                  {msg.role === "user" && (
                    <div className="w-6 h-6 rounded-full bg-secondary/10 flex items-center justify-center flex-shrink-0">
                      <User className="w-4 h-4 text-secondary" />
                    </div>
                  )}
                </div>
              ))
            )}
            {sendMutation.isPending && (
              <div className="flex gap-2 justify-start">
                <div className="w-6 h-6 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                  <Bot className="w-4 h-4 text-primary" />
                </div>
                <div className="bg-muted rounded-xl px-3 py-2">
                  <Loader2 className="w-4 h-4 animate-spin text-primary" />
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>
        </div>

      <div className="flex-shrink-0 border-t border-border bg-card/95 backdrop-blur-lg">
        <form onSubmit={handleSubmit} className="max-w-4xl mx-auto p-2.5 space-y-2">
          {selectedFile && (
            <div className="flex items-center gap-2 p-2 bg-muted rounded-lg">
              {filePreview ? (
                <img src={filePreview} alt="Preview" className="w-10 h-10 object-cover rounded" />
              ) : (
                <div className="w-10 h-10 bg-primary/10 rounded flex items-center justify-center">
                  {selectedFile.type.startsWith("audio/") ? (
                    <Music className="w-5 h-5 text-primary" />
                  ) : (
                    <FileText className="w-5 h-5 text-primary" />
                  )}
                </div>
              )}
              <div className="flex-1 min-w-0">
                <p className="text-xs font-medium truncate">{selectedFile.name}</p>
                <p className="text-xs text-muted-foreground">{(selectedFile.size / 1024 / 1024).toFixed(2)} MB</p>
              </div>
              <Button
                type="button"
                variant="ghost"
                size="icon"
                className="h-7 w-7"
                onClick={removeFile}
                data-testid="button-remove-file"
              >
                <X className="w-3.5 h-3.5" />
              </Button>
            </div>
          )}
          <div className="flex gap-2">
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*,audio/*,application/pdf"
              onChange={handleFileSelect}
              className="hidden"
              data-testid="input-file"
            />
            <Button
              type="button"
              variant="outline"
              size="icon"
              onClick={() => fileInputRef.current?.click()}
              disabled={uploading || sendMutation.isPending}
              className="h-9 w-9 flex-shrink-0"
              data-testid="button-attach-file"
            >
              <Paperclip className="w-4 h-4" />
            </Button>
            <Textarea
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Type your message..."
              className="min-h-[36px] max-h-[120px] resize-none text-sm"
              disabled={sendMutation.isPending || uploading}
              data-testid="input-message"
            />
            <Button
              type="submit"
              size="icon"
              className="h-9 w-9 flex-shrink-0"
              disabled={(!message.trim() && !selectedFile) || sendMutation.isPending || uploading}
              data-testid="button-send"
            >
              {sendMutation.isPending || uploading ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <Send className="w-4 h-4" />
              )}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
