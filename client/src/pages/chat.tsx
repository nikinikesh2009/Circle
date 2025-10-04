import { useState, useEffect, useRef } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useAuth } from "@/hooks/useAuth";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Loader2, Send, Trash2, Bot, User, Sparkles, Calendar, Target, Brain } from "lucide-react";
import { type ChatMessage } from "@shared/schema";

export default function Chat() {
  const { currentUser } = useAuth();
  const [message, setMessage] = useState("");
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

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (message.trim() && !sendMutation.isPending) {
      sendMutation.mutate(message.trim());
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSubmit(e);
    }
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
      <div className="flex-shrink-0 border-b border-border bg-card/50 backdrop-blur-lg px-4 py-3">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-xl md:text-2xl font-bold bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent">
              AI Problem Solver
            </h1>
            <p className="text-xs md:text-sm text-muted-foreground mt-0.5">
              Get actionable solutions and step-by-step guidance
            </p>
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={() => clearMutation.mutate()}
            disabled={clearMutation.isPending || messages.length === 0}
            data-testid="button-clear-chat"
          >
            <Trash2 className="w-4 h-4 md:mr-2" />
            <span className="hidden md:inline">Clear Chat</span>
          </Button>
        </div>
        
        {messages.length === 0 && (
          <div className="mt-3 flex gap-2 flex-wrap">
            {quickActions.map((action) => {
              const Icon = action.icon;
              return (
                <Button
                  key={action.label}
                  variant="outline"
                  size="sm"
                  onClick={() => handleQuickAction(action.prompt)}
                  className="gap-2"
                  data-testid={action.testId}
                >
                  <Icon className="w-3 h-3" />
                  <span className="text-xs">{action.label}</span>
                </Button>
              );
            })}
          </div>
        )}
      </div>

      <div className="flex-1 overflow-y-auto bg-gradient-to-br from-background via-background to-muted/20">
        <div className="max-w-4xl mx-auto px-4 py-4 space-y-4" data-testid="chat-messages-container">
            {isLoading ? (
              <div className="flex items-center justify-center h-full">
                <Loader2 className="w-8 h-8 animate-spin text-primary" />
              </div>
            ) : messages.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-full text-center space-y-4">
                <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center">
                  <Bot className="w-8 h-8 text-primary" />
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-foreground">Start a conversation</h3>
                  <p className="text-sm text-muted-foreground mt-1">
                    Ask me anything! I'm here to help.
                  </p>
                </div>
              </div>
            ) : (
              messages.map((msg) => (
                <div
                  key={msg.id}
                  className={`flex gap-3 ${msg.role === "user" ? "justify-end" : "justify-start"}`}
                  data-testid={`message-${msg.role}-${msg.id}`}
                >
                  {msg.role === "assistant" && (
                    <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                      <Bot className="w-5 h-5 text-primary" />
                    </div>
                  )}
                  <div
                    className={`max-w-[80%] rounded-2xl px-4 py-3 ${
                      msg.role === "user"
                        ? "bg-primary text-primary-foreground"
                        : "bg-muted text-foreground"
                    }`}
                  >
                    <p className="text-sm whitespace-pre-wrap break-words" data-testid={`text-message-${msg.id}`}>
                      {msg.content}
                    </p>
                  </div>
                  {msg.role === "user" && (
                    <div className="w-8 h-8 rounded-full bg-secondary/10 flex items-center justify-center flex-shrink-0">
                      <User className="w-5 h-5 text-secondary" />
                    </div>
                  )}
                </div>
              ))
            )}
            {sendMutation.isPending && (
              <div className="flex gap-3 justify-start">
                <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                  <Bot className="w-5 h-5 text-primary" />
                </div>
                <div className="bg-muted rounded-2xl px-4 py-3">
                  <Loader2 className="w-5 h-5 animate-spin text-primary" />
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>
        </div>

      <div className="flex-shrink-0 border-t border-border bg-card/95 backdrop-blur-lg">
        <form onSubmit={handleSubmit} className="max-w-4xl mx-auto p-4">
          <div className="flex gap-2">
            <Textarea
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Type your message... (Enter to send, Shift+Enter for new line)"
              className="min-h-[60px] max-h-[200px] resize-none"
              disabled={sendMutation.isPending}
              data-testid="input-message"
            />
            <Button
              type="submit"
              size="icon"
              className="h-[60px] w-[60px] flex-shrink-0"
              disabled={!message.trim() || sendMutation.isPending}
              data-testid="button-send"
            >
              {sendMutation.isPending ? (
                <Loader2 className="w-5 h-5 animate-spin" />
              ) : (
                <Send className="w-5 h-5" />
              )}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
