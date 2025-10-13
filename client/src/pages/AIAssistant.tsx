import { useState } from "react";
import { MessageBubble } from "@/components/MessageBubble";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Send, Sparkles } from "lucide-react";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Card } from "@/components/ui/card";

// todo: remove mock functionality
const mockConversation = [
  {
    id: "1",
    content: "Hello! I'm your AI assistant. I can help you with circle recommendations, answer questions, and provide suggestions. How can I help you today?",
    sender: { name: "AI Assistant", fallback: "AI" },
    timestamp: "Just now",
    isSent: false,
    isAI: true,
  },
];

const suggestedPrompts = [
  "Find circles about web development",
  "Help me write a good circle description",
  "What are the most active circles?",
  "Suggest a reply to the latest message",
];

export default function AIAssistant() {
  const [messages, setMessages] = useState(mockConversation);
  const [input, setInput] = useState("");

  const handleSend = () => {
    if (input.trim()) {
      const userMessage = {
        id: Date.now().toString(),
        content: input,
        sender: { name: "You", fallback: "ME" },
        timestamp: "Just now",
        isSent: true,
        isAI: false,
      };

      const aiResponse = {
        id: (Date.now() + 1).toString(),
        content: "I understand your question. Let me help you with that...",
        sender: { name: "AI Assistant", fallback: "AI" },
        timestamp: "Just now",
        isSent: false,
        isAI: true,
      };

      setMessages([...messages, userMessage, aiResponse]);
      setInput("");
    }
  };

  return (
    <div className="flex flex-col h-full">
      <div className="p-4 lg:p-6 border-b border-border">
        <div className="flex items-center gap-3 max-w-4xl mx-auto">
          <div className="h-10 w-10 rounded-full bg-gradient-to-br from-primary to-primary/80 flex items-center justify-center">
            <Sparkles className="h-5 w-5 text-primary-foreground" />
          </div>
          <div>
            <h1 className="text-xl font-semibold">AI Assistant</h1>
            <p className="text-sm text-muted-foreground">Powered by ChatGPT</p>
          </div>
        </div>
      </div>

      <ScrollArea className="flex-1 p-4 lg:p-6">
        <div className="max-w-4xl mx-auto space-y-6">
          {messages.map((msg) => (
            <MessageBubble key={msg.id} {...msg} />
          ))}

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
        </div>
      </ScrollArea>

      <div className="p-4 lg:p-6 border-t border-border">
        <div className="max-w-4xl mx-auto flex gap-2">
          <Input
            placeholder="Ask me anything..."
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleSend()}
            data-testid="input-ai-message"
          />
          <Button onClick={handleSend} size="icon" data-testid="button-send-ai-message">
            <Send className="h-5 w-5" />
          </Button>
        </div>
      </div>
    </div>
  );
}
