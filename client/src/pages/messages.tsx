import { useState, useEffect, useRef } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useAuth } from "@/hooks/useAuth";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { Send, Loader2, Bot, Settings, Sparkles, Trash2 } from "lucide-react";
import { type AiChatMessage, type AiSettings } from "@shared/schema";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { useToast } from "@/hooks/use-toast";

export default function Messages() {
  const { currentUser } = useAuth();
  const [message, setMessage] = useState("");
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const { toast } = useToast();

  const { data: messages = [], isLoading } = useQuery<AiChatMessage[]>({
    queryKey: ["/api/ai/messages"],
    enabled: !!currentUser,
  });

  const { data: aiSettings, refetch: refetchSettings } = useQuery<AiSettings>({
    queryKey: ["/api/ai/settings"],
    enabled: !!currentUser,
  });

  const sendMutation = useMutation({
    mutationFn: async (content: string) => {
      const response = await apiRequest("POST", "/api/ai/chat", { message: content });
      if (!response.ok) throw new Error("Failed to send message");
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/ai/messages"] });
      setMessage("");
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: "Failed to send message. Please try again.",
        variant: "destructive",
      });
    },
  });

  const updateSettingsMutation = useMutation({
    mutationFn: async (settings: Partial<AiSettings>) => {
      const response = await apiRequest("PUT", "/api/ai/settings", settings);
      if (!response.ok) throw new Error("Failed to update settings");
      return response.json();
    },
    onSuccess: () => {
      refetchSettings();
      setIsSettingsOpen(false);
      toast({
        title: "Settings updated",
        description: "Your AI assistant settings have been saved.",
      });
    },
  });

  const createTasksMutation = useMutation({
    mutationFn: async (tasks: any[]) => {
      const response = await apiRequest("POST", "/api/ai/create-tasks", { tasks });
      if (!response.ok) throw new Error("Failed to create tasks");
      return response.json();
    },
    onSuccess: (data) => {
      toast({
        title: "Tasks created!",
        description: `Successfully created ${data.tasks.length} task(s).`,
      });
      // Send a message to AI confirming task creation
      const taskTitles = data.tasks.map((t: any) => t.title).join(", ");
      sendMutation.mutate(`I've confirmed the task creation. Tasks created: ${taskTitles}`);
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to create tasks. Please try again.",
        variant: "destructive",
      });
    },
  });

  const handleConfirmTasks = (tasks: any[]) => {
    createTasksMutation.mutate(tasks);
  };

  const handleDeclineTasks = () => {
    sendMutation.mutate("I've decided not to create those tasks right now. Let's discuss something else.");
  };

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const handleSend = (e: React.FormEvent) => {
    e.preventDefault();
    if (!message.trim() || sendMutation.isPending) return;
    sendMutation.mutate(message.trim());
  };

  return (
    <div className="flex flex-col h-[calc(100vh-4rem)] bg-gradient-to-b from-background to-muted/10">
      {/* Header */}
      <div className="border-b border-border bg-card/50 backdrop-blur-lg">
        <div className="max-w-4xl mx-auto px-4 py-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-gradient-to-br from-primary to-secondary flex items-center justify-center">
                <Bot className="w-6 h-6 text-white" />
              </div>
              <div>
                <h2 className="text-lg font-bold">AI Productivity Assistant</h2>
                <p className="text-xs text-muted-foreground">
                  Powered by DeepSeek · {aiSettings?.personality || "friendly"} mode
                </p>
              </div>
            </div>
            <Dialog open={isSettingsOpen} onOpenChange={setIsSettingsOpen}>
              <DialogTrigger asChild>
                <Button variant="ghost" size="sm" data-testid="button-ai-settings">
                  <Settings className="w-4 h-4" />
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>AI Assistant Settings</DialogTitle>
                  <DialogDescription>
                    Customize how your AI assistant behaves and helps you
                  </DialogDescription>
                </DialogHeader>
                <div className="space-y-4 py-4">
                  <div className="space-y-2">
                    <Label>Personality</Label>
                    <Select
                      value={aiSettings?.personality || "friendly"}
                      onValueChange={(value) => updateSettingsMutation.mutate({ personality: value as any })}
                    >
                      <SelectTrigger data-testid="select-personality">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="professional">Professional</SelectItem>
                        <SelectItem value="friendly">Friendly</SelectItem>
                        <SelectItem value="motivating">Motivating</SelectItem>
                        <SelectItem value="coach">Coach</SelectItem>
                      </SelectContent>
                    </Select>
                    <p className="text-xs text-muted-foreground">
                      Choose how your AI assistant communicates with you
                    </p>
                  </div>

                  <div className="space-y-2">
                    <Label>Custom System Prompt (Optional)</Label>
                    <Textarea
                      placeholder="Add custom instructions for your AI assistant..."
                      value={aiSettings?.customSystemPrompt || ""}
                      onChange={(e) => {}}
                      onBlur={(e) => updateSettingsMutation.mutate({ customSystemPrompt: e.target.value })}
                      className="min-h-[100px]"
                      data-testid="textarea-custom-prompt"
                    />
                    <p className="text-xs text-muted-foreground">
                      Override the default personality with custom instructions
                    </p>
                  </div>

                  <div className="flex items-center justify-between">
                    <div className="space-y-0.5">
                      <Label>Enable Task Suggestions</Label>
                      <p className="text-xs text-muted-foreground">
                        AI can suggest and create tasks
                      </p>
                    </div>
                    <Switch
                      checked={aiSettings?.enableTaskSuggestions ?? true}
                      onCheckedChange={(checked) => updateSettingsMutation.mutate({ enableTaskSuggestions: checked })}
                      data-testid="switch-task-suggestions"
                    />
                  </div>

                  <div className="flex items-center justify-between">
                    <div className="space-y-0.5">
                      <Label>Enable Productivity Check-ins</Label>
                      <p className="text-xs text-muted-foreground">
                        AI will ask about your progress
                      </p>
                    </div>
                    <Switch
                      checked={aiSettings?.enableProductivityCheckins ?? true}
                      onCheckedChange={(checked) => updateSettingsMutation.mutate({ enableProductivityCheckins: checked })}
                      data-testid="switch-productivity-checkins"
                    />
                  </div>
                </div>
              </DialogContent>
            </Dialog>
          </div>
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto">
        <div className="max-w-4xl mx-auto px-4 py-6">
          {isLoading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="w-8 h-8 animate-spin text-primary" />
            </div>
          ) : messages.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center mb-4">
                <Sparkles className="w-8 h-8 text-primary" />
              </div>
              <h3 className="text-xl font-bold mb-2">Welcome to Your AI Assistant!</h3>
              <p className="text-muted-foreground max-w-md mb-6">
                I'm here to help you plan your day, create tasks, track your productivity, and stay motivated. 
                Let's discuss what you want to accomplish today!
              </p>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3 w-full max-w-2xl">
                <Button
                  variant="outline"
                  className="justify-start h-auto py-3 px-4"
                  onClick={() => setMessage("Let's discuss my day and plan some tasks")}
                  data-testid="button-suggestion-plan"
                >
                  <div className="text-left">
                    <div className="font-semibold">Plan My Day</div>
                    <div className="text-xs text-muted-foreground">Discuss and organize today's tasks</div>
                  </div>
                </Button>
                <Button
                  variant="outline"
                  className="justify-start h-auto py-3 px-4"
                  onClick={() => setMessage("How's my productivity going?")}
                  data-testid="button-suggestion-productivity"
                >
                  <div className="text-left">
                    <div className="font-semibold">Check My Progress</div>
                    <div className="text-xs text-muted-foreground">Review habits and achievements</div>
                  </div>
                </Button>
                <Button
                  variant="outline"
                  className="justify-start h-auto py-3 px-4"
                  onClick={() => setMessage("I need help staying motivated")}
                  data-testid="button-suggestion-motivation"
                >
                  <div className="text-left">
                    <div className="font-semibold">Get Motivated</div>
                    <div className="text-xs text-muted-foreground">Boost energy and focus</div>
                  </div>
                </Button>
                <Button
                  variant="outline"
                  className="justify-start h-auto py-3 px-4"
                  onClick={() => setMessage("What should I focus on right now?")}
                  data-testid="button-suggestion-focus"
                >
                  <div className="text-left">
                    <div className="font-semibold">Find Focus</div>
                    <div className="text-xs text-muted-foreground">Prioritize what matters most</div>
                  </div>
                </Button>
              </div>
            </div>
          ) : (
            <div className="space-y-4">
              {messages.map((msg) => (
                <div
                  key={msg.id}
                  className={`flex gap-3 ${msg.role === "user" ? "justify-end" : "justify-start"}`}
                  data-testid={`message-${msg.id}`}
                >
                  {msg.role === "assistant" && (
                    <div className="w-8 h-8 rounded-full bg-gradient-to-br from-primary to-secondary flex items-center justify-center flex-shrink-0">
                      <Bot className="w-5 h-5 text-white" />
                    </div>
                  )}
                  <div className="flex flex-col gap-2 max-w-[80%]">
                    <div
                      className={`rounded-2xl px-4 py-3 ${
                        msg.role === "user"
                          ? "bg-primary text-primary-foreground"
                          : "bg-muted"
                      }`}
                    >
                      <p className="text-sm whitespace-pre-wrap">{msg.content}</p>
                      <p className="text-xs opacity-60 mt-1">
                        {new Date(msg.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </p>
                    </div>
                    
                    {/* Task Suggestions */}
                    {msg.role === "assistant" && msg.taskSuggestions && (
                      <Card className="p-4 bg-card border-primary/20">
                        <div className="flex items-center gap-2 mb-3">
                          <Sparkles className="w-4 h-4 text-primary" />
                          <h4 className="font-semibold text-sm">Task Suggestions</h4>
                        </div>
                        <div className="space-y-2 mb-3">
                          {msg.taskSuggestions.tasks.map((task, idx) => (
                            <div key={idx} className="flex gap-2 items-start text-sm" data-testid={`task-suggestion-${idx}`}>
                              <div className="w-5 h-5 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0 mt-0.5">
                                <span className="text-xs font-semibold text-primary">{idx + 1}</span>
                              </div>
                              <div className="flex-1">
                                <div className="font-medium">{task.title}</div>
                                {task.description && (
                                  <div className="text-xs text-muted-foreground">{task.description}</div>
                                )}
                                <div className="flex gap-2 mt-1 text-xs text-muted-foreground">
                                  {task.timeEstimate && <span>⏱️ {task.timeEstimate}</span>}
                                  {task.category && <span>📂 {task.category}</span>}
                                  {task.priority && <span>🎯 {task.priority}</span>}
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>
                        <div className="flex gap-2">
                          <Button
                            size="sm"
                            onClick={() => handleConfirmTasks(msg.taskSuggestions!.tasks)}
                            disabled={createTasksMutation.isPending}
                            data-testid="button-confirm-tasks"
                          >
                            {createTasksMutation.isPending ? (
                              <>
                                <Loader2 className="w-3 h-3 mr-1 animate-spin" />
                                Creating...
                              </>
                            ) : (
                              "Create These Tasks"
                            )}
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={handleDeclineTasks}
                            disabled={createTasksMutation.isPending}
                            data-testid="button-decline-tasks"
                          >
                            Not Now
                          </Button>
                        </div>
                      </Card>
                    )}
                  </div>
                  {msg.role === "user" && (
                    <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                      <span className="text-sm font-semibold text-primary">
                        {currentUser?.email?.[0].toUpperCase()}
                      </span>
                    </div>
                  )}
                </div>
              ))}
              {sendMutation.isPending && (
                <div className="flex gap-3 justify-start">
                  <div className="w-8 h-8 rounded-full bg-gradient-to-br from-primary to-secondary flex items-center justify-center flex-shrink-0">
                    <Bot className="w-5 h-5 text-white" />
                  </div>
                  <div className="bg-muted rounded-2xl px-4 py-3">
                    <div className="flex gap-1">
                      <div className="w-2 h-2 rounded-full bg-foreground/40 animate-bounce"></div>
                      <div className="w-2 h-2 rounded-full bg-foreground/40 animate-bounce" style={{ animationDelay: '0.2s' }}></div>
                      <div className="w-2 h-2 rounded-full bg-foreground/40 animate-bounce" style={{ animationDelay: '0.4s' }}></div>
                    </div>
                  </div>
                </div>
              )}
              <div ref={messagesEndRef} />
            </div>
          )}
        </div>
      </div>

      {/* Input */}
      <div className="border-t border-border bg-card/50 backdrop-blur-lg">
        <div className="max-w-4xl mx-auto px-4 py-3">
          <form onSubmit={handleSend} className="flex gap-2">
            <Input
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              placeholder="Ask me anything about your productivity..."
              className="flex-1"
              disabled={sendMutation.isPending}
              data-testid="input-ai-message"
            />
            <Button
              type="submit"
              size="icon"
              disabled={!message.trim() || sendMutation.isPending}
              data-testid="button-send-ai"
            >
              {sendMutation.isPending ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <Send className="w-4 h-4" />
              )}
            </Button>
          </form>
          <p className="text-xs text-muted-foreground mt-2 text-center">
            AI can make mistakes. Always verify important information.
          </p>
        </div>
      </div>
    </div>
  );
}
