import { useState, useEffect } from "react";
import { useParams, useLocation } from "wouter";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useAuth } from "@/lib/auth-context";
import { useWebSocket } from "@/hooks/useWebSocket";
import { CircleListItem } from "@/components/CircleListItem";
import { ChatMessage } from "@/components/ChatMessage";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Send, MoreVertical, ArrowLeft, Image, Paperclip, Mic } from "lucide-react";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Skeleton } from "@/components/ui/skeleton";

interface Circle {
  id: string;
  name: string;
  description: string;
  memberCount: number;
}

interface Message {
  id: string;
  circleId: string;
  userId: string;
  content: string;
  isEdited?: boolean;
  isDeleted?: boolean;
  createdAt: string;
  editedAt?: string;
  user?: {
    id: string;
    name: string;
    username: string;
    avatar?: string;
  };
}

export default function Chat() {
  const { user } = useAuth();
  const [, navigate] = useLocation();
  const { circleId } = useParams<{ circleId?: string }>();
  const [message, setMessage] = useState("");
  const [messages, setMessages] = useState<Message[]>([]);
  const { send, on, isConnected } = useWebSocket("/ws");

  const handleImageUpload = () => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = 'image/*';
    input.onchange = (e) => {
      const file = (e.target as HTMLInputElement).files?.[0];
      if (file) {
        // TODO: Implement image upload
        console.log('Image selected:', file);
      }
    };
    input.click();
  };

  const handleFileUpload = () => {
    const input = document.createElement('input');
    input.type = 'file';
    input.onchange = (e) => {
      const file = (e.target as HTMLInputElement).files?.[0];
      if (file) {
        // TODO: Implement file upload
        console.log('File selected:', file);
      }
    };
    input.click();
  };

  const handleVoiceRecord = () => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = 'audio/*';
    input.onchange = (e) => {
      const file = (e.target as HTMLInputElement).files?.[0];
      if (file) {
        // TODO: Implement voice message upload
        console.log('Audio file selected:', file);
      }
    };
    input.click();
  };

  // Get user's circles
  const { data: circles = [], isLoading: circlesLoading } = useQuery<Circle[]>({
    queryKey: ["/api/circles/my"],
  });

  // Refresh WebSocket circle membership when circles change
  useEffect(() => {
    if (circles.length > 0) {
      send({ type: "refresh_circles" });
    }
  }, [circles, send]);

  // Get messages for selected circle
  const { data: initialMessages = [], isLoading: messagesLoading } = useQuery<Message[]>({
    queryKey: ["/api/circles", circleId, "messages"],
    enabled: !!circleId,
  });

  // Update messages when initial messages load or circle changes
  useEffect(() => {
    setMessages(initialMessages);
  }, [initialMessages, circleId]);

  // Listen for new messages via WebSocket
  useEffect(() => {
    const unsubscribe = on("chat", (data: { message: Message }) => {
      if (data.message.circleId === circleId) {
        setMessages((prev) => [...prev, data.message]);
      }
    });

    return unsubscribe;
  }, [on, circleId]);

  // Auto-select first circle if none selected
  useEffect(() => {
    if (!circleId && circles.length > 0) {
      navigate(`/chat/${circles[0].id}`);
    }
  }, [circleId, circles, navigate]);

  const selectedCircle = circles.find((c) => c.id === circleId);

  const handleSend = () => {
    if (message.trim() && user && circleId) {
      send({
        type: "chat",
        circleId,
        userId: user.id,
        content: message.trim(),
      });
      setMessage("");
    }
  };

  const handleBackToList = () => {
    navigate("/chat");
  };

  if (circlesLoading) {
    return (
      <div className="flex h-full">
        <div className="hidden lg:block w-80 border-r border-border">
          <div className="p-4 border-b border-border">
            <h2 className="font-semibold text-lg">Messages</h2>
          </div>
          <div className="p-2 space-y-2">
            {[1, 2, 3].map((i) => (
              <Skeleton key={i} className="h-16 w-full" />
            ))}
          </div>
        </div>
        <div className="flex-1 flex items-center justify-center">
          <p className="text-muted-foreground">Loading...</p>
        </div>
      </div>
    );
  }

  if (circles.length === 0) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-center space-y-2">
          <p className="text-muted-foreground">No circles joined yet</p>
          <Button onClick={() => navigate("/")} data-testid="button-browse-circles">
            Browse Circles
          </Button>
        </div>
      </div>
    );
  }

  if (!circleId) {
    return (
      <div className="lg:hidden flex items-center justify-center h-full">
        <div className="p-4 w-full max-w-md space-y-2">
          <h2 className="font-semibold text-lg mb-4">Your Circles</h2>
          {circles.map((circle) => (
            <div
              key={circle.id}
              onClick={() => navigate(`/chat/${circle.id}`)}
              className="p-4 border border-border rounded-md hover-elevate cursor-pointer"
              data-testid={`circle-item-${circle.id}`}
            >
              <h3 className="font-semibold">{circle.name}</h3>
              <p className="text-sm text-muted-foreground">{circle.memberCount} members</p>
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-full w-full">
      {/* Circles List - Hidden on mobile, shown on desktop */}
      <div className="hidden lg:block w-80 border-r border-border">
        <div className="p-4 border-b border-border">
          <h2 className="font-semibold text-lg">Messages</h2>
        </div>
        <ScrollArea className="h-[calc(100vh-8rem)]">
          <div className="p-2 space-y-1">
            {circles.map((circle) => (
              <div
                key={circle.id}
                onClick={() => navigate(`/chat/${circle.id}`)}
                className={`p-3 rounded-md cursor-pointer hover-elevate ${
                  selectedCircle?.id === circle.id ? "bg-accent" : ""
                }`}
                data-testid={`circle-list-item-${circle.id}`}
              >
                <h3 className="font-semibold text-sm">{circle.name}</h3>
                <p className="text-xs text-muted-foreground">{circle.memberCount} members</p>
              </div>
            ))}
          </div>
        </ScrollArea>
      </div>

      {/* Chat Area */}
      <div className="flex-1 flex flex-col relative">
        {/* Chat Header */}
        <div className="p-4 border-b border-border flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Button
              variant="ghost"
              size="icon"
              onClick={handleBackToList}
              className="lg:hidden"
              data-testid="button-back-to-circles"
            >
              <ArrowLeft className="h-5 w-5" />
            </Button>
            <div>
              <h2 className="font-semibold" data-testid="text-circle-name">
                {selectedCircle?.name}
              </h2>
              <p className="text-sm text-muted-foreground" data-testid="text-member-count">
                {selectedCircle?.memberCount} members
              </p>
            </div>
          </div>
          <Button variant="ghost" size="icon" data-testid="button-chat-options">
            <MoreVertical className="h-5 w-5" />
          </Button>
        </div>

        {/* Messages */}
        <ScrollArea className="flex-1 p-4 pb-24">
          {messagesLoading ? (
            <div className="space-y-4">
              {[1, 2, 3].map((i) => (
                <Skeleton key={i} className="h-16 w-3/4" />
              ))}
            </div>
          ) : messages.length === 0 ? (
            <div className="flex items-center justify-center h-full">
              <p className="text-muted-foreground">No messages yet. Start the conversation!</p>
            </div>
          ) : (
            <div className="space-y-4">
              {messages.map((msg) => (
                <ChatMessage
                  key={msg.id}
                  id={msg.id}
                  content={msg.content}
                  sender={{
                    id: msg.user?.id || "",
                    name: msg.user?.name || "Unknown",
                    username: msg.user?.username || "",
                    avatar: msg.user?.avatar,
                  }}
                  createdAt={msg.createdAt}
                  isEdited={msg.isEdited}
                  isDeleted={msg.isDeleted}
                  isOwn={msg.userId === user?.id}
                  currentUserId={user?.id || ""}
                  circleId={circleId || ""}
                />
              ))}
            </div>
          )}
        </ScrollArea>

        {/* Message Input - Sticky to bottom */}
        <div className="sticky bottom-0 lg:bottom-0 left-0 right-0 p-4 border-t border-border bg-background mb-16 lg:mb-0">
          <div className="flex gap-2 items-end">
            <div className="flex gap-1">
              <Button
                variant="ghost"
                size="icon"
                onClick={handleImageUpload}
                disabled={!isConnected}
                data-testid="button-attach-image"
                title="Attach image"
              >
                <Image className="h-5 w-5" />
              </Button>
              <Button
                variant="ghost"
                size="icon"
                onClick={handleFileUpload}
                disabled={!isConnected}
                data-testid="button-attach-file"
                title="Attach file"
              >
                <Paperclip className="h-5 w-5" />
              </Button>
              <Button
                variant="ghost"
                size="icon"
                onClick={handleVoiceRecord}
                disabled={!isConnected}
                data-testid="button-record-voice"
                title="Record voice"
              >
                <Mic className="h-5 w-5" />
              </Button>
            </div>
            <Input
              placeholder="Type a message..."
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleSend()}
              disabled={!isConnected}
              className="flex-1"
              data-testid="input-message"
            />
            <Button
              onClick={handleSend}
              size="icon"
              disabled={!message.trim() || !isConnected}
              data-testid="button-send-message"
            >
              <Send className="h-5 w-5" />
            </Button>
          </div>
          {!isConnected && (
            <p className="text-xs text-muted-foreground mt-1">Connecting...</p>
          )}
        </div>
      </div>
    </div>
  );
}
