import { useState } from "react";
import { CircleListItem } from "@/components/CircleListItem";
import { MessageBubble } from "@/components/MessageBubble";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Send, MoreVertical } from "lucide-react";
import { ScrollArea } from "@/components/ui/scroll-area";

// todo: remove mock functionality
const mockCircles = [
  { id: "1", name: "Tech Innovators", lastMessage: "Sarah: The new React features are amazing!", timestamp: "2m ago", unreadCount: 5 },
  { id: "2", name: "Fitness Squad", lastMessage: "Mike: Anyone up for a morning run?", timestamp: "1h ago", unreadCount: 0 },
  { id: "3", name: "Book Club", lastMessage: "Emma: Just finished chapter 5, thoughts?", timestamp: "3h ago", unreadCount: 2 },
];

const mockMessages = [
  { id: "1", content: "Hey everyone! Did you see the new React 19 features?", sender: { name: "Sarah", fallback: "SA" }, timestamp: "10:30 AM", isSent: false },
  { id: "2", content: "Yes! The new compiler looks amazing. Can't wait to try it out!", sender: { name: "You", fallback: "ME" }, timestamp: "10:32 AM", isSent: true },
  { id: "3", content: "The automatic memoization will be a game changer", sender: { name: "Alex", fallback: "AL" }, timestamp: "10:33 AM", isSent: false },
];

export default function Chat() {
  const [selectedCircle, setSelectedCircle] = useState(mockCircles[0]);
  const [message, setMessage] = useState("");

  const handleSend = () => {
    if (message.trim()) {
      console.log("Sending message:", message);
      setMessage("");
    }
  };

  return (
    <div className="flex h-full">
      {/* Circles List - Hidden on mobile, shown on desktop */}
      <div className="hidden lg:block w-80 border-r border-border">
        <div className="p-4 border-b border-border">
          <h2 className="font-semibold text-lg">Messages</h2>
        </div>
        <ScrollArea className="h-[calc(100vh-8rem)]">
          <div className="p-2 space-y-1">
            {mockCircles.map((circle) => (
              <CircleListItem
                key={circle.id}
                {...circle}
                isActive={selectedCircle.id === circle.id}
                onClick={() => setSelectedCircle(circle)}
              />
            ))}
          </div>
        </ScrollArea>
      </div>

      {/* Chat Area */}
      <div className="flex-1 flex flex-col">
        {/* Chat Header */}
        <div className="p-4 border-b border-border flex items-center justify-between">
          <div>
            <h2 className="font-semibold">{selectedCircle.name}</h2>
            <p className="text-sm text-muted-foreground">42 members online</p>
          </div>
          <Button variant="ghost" size="icon" data-testid="button-chat-options">
            <MoreVertical className="h-5 w-5" />
          </Button>
        </div>

        {/* Messages */}
        <ScrollArea className="flex-1 p-4">
          {mockMessages.map((msg) => (
            <MessageBubble key={msg.id} {...msg} />
          ))}
        </ScrollArea>

        {/* Message Input */}
        <div className="p-4 border-t border-border">
          <div className="flex gap-2">
            <Input
              placeholder="Type a message..."
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleSend()}
              data-testid="input-message"
            />
            <Button
              onClick={handleSend}
              size="icon"
              data-testid="button-send-message"
            >
              <Send className="h-5 w-5" />
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
