import { useState, useRef, useEffect } from "react";
import { useMutation } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { MessageBubble } from "@/components/MessageBubble";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Send, Sparkles } from "lucide-react";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Card } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";

interface Message {
  id: string;
  role: "user" | "assistant";
  content: string;
  sender: { name: string; fallback: string };
  timestamp: string;
  isSent: boolean;
  isAI?: boolean;
}

const suggestedPrompts = [
  "Find circles about web development",
  "Help me write a good circle description",
  "What are the most active circles?",
  "Suggest topics for a tech circle",
];

export default function AIAssistant() {
  const [messages, setMessages] = useState<Message[]>([
    {
      id: "1",
      role: "assistant",
      content: "Hello! I'm your AI assistant for Circle. I can help you with circle recommendations, answer questions, and provide suggestions. How can I help you today?",
      sender: { name: "AI Assistant", fallback: "AI" },
      timestamp: "Just now",
      isSent: false,
      isAI: true,
    },
  ]);
  const [input, setInput] = useState("");
  const scrollRef = useRef<HTMLDivElement>(null);
  const { toast } = useToast();

  const aiChatMutation = useMutation({
    mutationFn: async (payload: { userMessage: string; conversationHistory: Message[] }) => {
      const chatMessages = payload.conversationHistory
        .filter((m) => m.id !== "1")
        .map((m) => ({
          role: m.role,
          content: m.content,
        }));

      chatMessages.push({ role: "user", content: payload.userMessage });

      const response = await apiRequest("POST", "/api/ai/chat", {
        messages: chatMessages,
      });
      return response.json();
    },
    onSuccess: (data) => {
      const aiMessage: Message = {
        id: Date.now().toString(),
        role: "assistant",
        content: data.message,
        sender: { name: "AI Assistant", fallback: "AI" },
        timestamp: new Date().toLocaleTimeString([], {
          hour: "2-digit",
          minute: "2-digit",
        }),
        isSent: false,
        isAI: true,
      };
      setMessages((prev) => [...prev, aiMessage]);
    },
    onError: (error: Error) => {
      toast({
        variant: "destructive",
        title: "Error",
        description: error.message || "Failed to get AI response",
      });
    },
  });

  const handleSend = () => {
    if (input.trim() && !aiChatMutation.isPending) {
      const userMessage: Message = {
        id: Date.now().toString(),
        role: "user",
        content: input,
        sender: { name: "You", fallback: "ME" },
        timestamp: new Date().toLocaleTimeString([], {
          hour: "2-digit",
          minute: "2-digit",
        }),
        isSent: true,
        isAI: false,
      };

      setMessages((prev) => {
        const updated = [...prev, userMessage];
        aiChatMutation.mutate({ userMessage: input, conversationHistory: updated });
        return updated;
      });
      setInput("");
    }
  };

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollIntoView({ behavior: "smooth" });
    }
  }, [messages]);

  return (
    <div className="flex flex-col h-full">
      <div className="border-b border-border px-4 sm:px-6 lg:px-8 py-4">
        <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-full bg-gradient-to-br from-primary to-primary/80 flex items-center justify-center">
              <Sparkles className="h-5 w-5 text-primary-foreground" />
            </div>
            <div>
              <h1 className="text-xl font-semibold">AI Assistant</h1>
              <p className="text-sm text-muted-foreground">Powered by GPT-5</p>
            </div>
        </div>
      </div>

      <ScrollArea className="flex-1">
        <div className="px-4 sm:px-6 lg:px-8 py-6">
          <div className="space-y-6">
            {messages.map((msg) => (
              <MessageBubble key={msg.id} {...msg} />
            ))}

            {aiChatMutation.isPending && (
              <div className="flex items-center gap-2 text-muted-foreground">
                <div className="h-2 w-2 rounded-full bg-primary animate-pulse" />
                <div className="h-2 w-2 rounded-full bg-primary animate-pulse delay-75" />
                <div className="h-2 w-2 rounded-full bg-primary animate-pulse delay-150" />
                <span className="text-sm ml-2">AI is thinking...</span>
              </div>
            )}

            {messages.length === 1 && (
              <div className="mt-8">
                <p className="text-sm text-muted-foreground mb-4">
                  Try asking me about:
                </p>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {suggestedPrompts.map((prompt, index) => (
                    <Card
                      key={index}
                      className="p-4 cursor-pointer hover-elevate active-elevate-2 transition-transform hover:-translate-y-1"
                      onClick={() => setInput(prompt)}
                      data-testid={`suggestion-${index}`}
                    >
                      <p className="text-sm">{prompt}</p>
                    </Card>
                  ))}
                </div>
              </div>
            )}
            <div ref={scrollRef} />
          </div>
        </div>
      </ScrollArea>

      <div className="border-t border-border px-4 sm:px-6 lg:px-8 py-4">
        <div className="flex gap-2">
            <Input
              placeholder="Ask me anything..."
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleSend()}
              disabled={aiChatMutation.isPending}
              data-testid="input-ai-message"
            />
            <Button
              onClick={handleSend}
              size="icon"
              disabled={!input.trim() || aiChatMutation.isPending}
              data-testid="button-send-ai-message"
            >
              <Send className="h-5 w-5" />
            </Button>
        </div>
      </div>
    </div>
  );
}
