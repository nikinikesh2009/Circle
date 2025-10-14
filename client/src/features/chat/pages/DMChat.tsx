import { useState, useEffect, useRef } from "react";
import { useParams, useLocation } from "wouter";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useAuth } from "@/lib/auth-context";
import { useWebSocket } from "@/hooks/useWebSocket";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Send, ArrowLeft, MoreVertical } from "lucide-react";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Skeleton } from "@/components/ui/skeleton";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { formatDistanceToNow } from "date-fns";

interface DmMessage {
  id: string;
  conversationId: string;
  senderId: string;
  content: string;
  createdAt: string;
  sender?: {
    id: string;
    name: string;
    username: string;
    avatar?: string;
  };
}

interface Conversation {
  id: string;
  user1Id: string;
  user2Id: string;
  createdAt: string;
  otherUser: {
    id: string;
    name: string;
    username: string;
    avatar?: string;
  } | null;
}

export default function DMChat() {
  const { user } = useAuth();
  const [, navigate] = useLocation();
  const { conversationId } = useParams<{ conversationId: string }>();
  const [message, setMessage] = useState("");
  const [messages, setMessages] = useState<DmMessage[]>([]);
  const scrollRef = useRef<HTMLDivElement>(null);
  const { send, on, isConnected } = useWebSocket("/ws");

  // Get conversation details
  const { data: conversations = [] } = useQuery<Conversation[]>({
    queryKey: ["/api/dm/conversations"],
  });

  const conversation = conversations.find((c) => c.id === conversationId);

  // Get messages for this conversation
  const { data: initialMessages = [], isLoading: messagesLoading } = useQuery<DmMessage[]>({
    queryKey: ["/api/dm/conversations", conversationId, "messages"],
    enabled: !!conversationId,
  });

  // Update messages when initial messages load
  useEffect(() => {
    setMessages(initialMessages);
  }, [initialMessages]);

  // Listen for new DM messages via WebSocket
  useEffect(() => {
    const unsubscribe = on("dm", (data: { message: DmMessage }) => {
      if (data.message.conversationId === conversationId) {
        setMessages((prev) => [...prev, data.message]);
      }
    });

    return unsubscribe;
  }, [on, conversationId]);

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollIntoView({ behavior: "smooth" });
    }
  }, [messages]);

  // Send message mutation
  const sendMessageMutation = useMutation({
    mutationFn: async (content: string) => {
      const response = await apiRequest(
        "POST",
        `/api/dm/conversations/${conversationId}/messages`,
        { content }
      );
      return response.json() as Promise<DmMessage>;
    },
    onSuccess: (newMessage: DmMessage) => {
      setMessages((prev) => [...prev, newMessage]);
      setMessage("");
      
      // Broadcast via WebSocket with message ID
      send({
        type: "dm",
        conversationId,
        messageId: newMessage.id,
      });
    },
  });

  const handleSend = () => {
    if (!message.trim() || !conversationId) return;
    sendMessageMutation.mutate(message.trim());
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const getInitials = (name: string) => {
    return name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase()
      .slice(0, 2);
  };

  if (!conversationId) {
    return (
      <div className="flex items-center justify-center h-full">
        <p className="text-muted-foreground">No conversation selected</p>
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col">
      {/* Header */}
      <div className="border-b p-4 flex items-center gap-3">
        <Button
          variant="ghost"
          size="icon"
          onClick={() => navigate("/dm")}
          data-testid="button-back"
        >
          <ArrowLeft className="h-5 w-5" />
        </Button>
        
        {conversation?.otherUser && conversation.otherUser.id && (
          <>
            <Avatar 
              className="h-10 w-10 cursor-pointer" 
              onClick={() => navigate(`/user/${conversation.otherUser.id}`)}
            >
              <AvatarImage src={conversation.otherUser.avatar} />
              <AvatarFallback>
                {getInitials(conversation.otherUser.name)}
              </AvatarFallback>
            </Avatar>
            <button 
              onClick={() => navigate(`/user/${conversation.otherUser.id}`)} 
              className="flex-1 text-left"
            >
              <h2 className="font-semibold hover:text-primary transition-colors" data-testid="text-dm-chat-name">
                {conversation.otherUser.name}
              </h2>
              <p className="text-sm text-muted-foreground" data-testid="text-dm-chat-username">
                @{conversation.otherUser.username}
              </p>
            </button>
          </>
        )}
        
        <Button variant="ghost" size="icon" data-testid="button-dm-options">
          <MoreVertical className="h-5 w-5" />
        </Button>
      </div>

      {/* Messages */}
      <ScrollArea className="flex-1 p-4">
        {messagesLoading ? (
          <div className="space-y-4">
            {[1, 2, 3, 4, 5].map((i) => (
              <div key={i} className="flex gap-3">
                <Skeleton className="h-10 w-10 rounded-full" />
                <div className="flex-1">
                  <Skeleton className="h-4 w-24 mb-2" />
                  <Skeleton className="h-16 w-full" />
                </div>
              </div>
            ))}
          </div>
        ) : messages.length === 0 ? (
          <div className="flex items-center justify-center h-full">
            <p className="text-muted-foreground" data-testid="text-no-messages">
              No messages yet. Start the conversation!
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {messages.map((msg) => {
              const isCurrentUser = msg.senderId === user?.id;
              return (
                <div
                  key={msg.id}
                  className={`flex gap-3 ${isCurrentUser ? "flex-row-reverse" : ""}`}
                  data-testid={`message-${msg.id}`}
                >
                  <Avatar className="h-10 w-10">
                    <AvatarImage src={msg.sender?.avatar} />
                    <AvatarFallback>
                      {msg.sender ? getInitials(msg.sender.name) : "?"}
                    </AvatarFallback>
                  </Avatar>
                  <div className={`flex-1 ${isCurrentUser ? "text-right" : ""}`}>
                    <div className="flex items-center gap-2 mb-1">
                      {isCurrentUser ? (
                        <span className="text-sm font-semibold order-2">You</span>
                      ) : msg.senderId ? (
                        <button
                          onClick={() => navigate(`/user/${msg.senderId}`)}
                          className="text-sm font-semibold hover:text-primary transition-colors cursor-pointer"
                          data-testid="button-dm-username"
                        >
                          {msg.sender?.name || "Unknown"}
                        </button>
                      ) : (
                        <span className="text-sm font-semibold">
                          {msg.sender?.name || "Unknown"}
                        </span>
                      )}
                      <span className={`text-xs text-muted-foreground ${isCurrentUser ? "order-1" : ""}`}>
                        {formatDistanceToNow(new Date(msg.createdAt), { addSuffix: true })}
                      </span>
                    </div>
                    <div
                      className={`inline-block max-w-[70%] rounded-lg p-3 ${
                        isCurrentUser
                          ? "bg-primary text-primary-foreground"
                          : "bg-muted"
                      }`}
                      data-testid={`message-content-${msg.id}`}
                    >
                      <p className="text-sm whitespace-pre-wrap break-words">
                        {msg.content}
                      </p>
                    </div>
                  </div>
                </div>
              );
            })}
            <div ref={scrollRef} />
          </div>
        )}
      </ScrollArea>

      {/* Input */}
      <div className="border-t p-4">
        <div className="flex gap-2">
          <Input
            placeholder="Type a message..."
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            onKeyPress={handleKeyPress}
            disabled={sendMessageMutation.isPending}
            data-testid="input-dm-message"
          />
          <Button
            onClick={handleSend}
            disabled={!message.trim() || sendMessageMutation.isPending}
            data-testid="button-dm-send"
          >
            <Send className="h-5 w-5" />
          </Button>
        </div>
      </div>
    </div>
  );
}
