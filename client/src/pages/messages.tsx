import { useState, useEffect, useRef } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useAuth } from "@/hooks/useAuth";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { Send, Search, Loader2, User, MessageCircle } from "lucide-react";
import { type PrivateMessage } from "@shared/schema";

interface UserSearchResult {
  id: string;
  email: string;
}

interface Conversation {
  otherUserId: string;
  lastMessage: PrivateMessage;
  unreadCount: number;
  otherUser: {
    id: string;
    email: string;
  };
}

export default function Messages() {
  const { currentUser } = useAuth();
  const [selectedUserId, setSelectedUserId] = useState<string | null>(null);
  const [message, setMessage] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [showSearch, setShowSearch] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const { data: conversations = [] } = useQuery<Conversation[]>({
    queryKey: ["/api/private-messages/conversations"],
    enabled: !!currentUser,
  });

  const { data: searchResults = [] } = useQuery<UserSearchResult[]>({
    queryKey: ["/api/users/search", searchQuery],
    enabled: !!currentUser && searchQuery.length > 0,
    queryFn: async () => {
      const response = await fetch(`/api/users/search?query=${encodeURIComponent(searchQuery)}`, {
        credentials: "include",
      });
      if (!response.ok) throw new Error("Failed to search users");
      return response.json();
    },
  });

  const { data: messages = [] } = useQuery<PrivateMessage[]>({
    queryKey: ["/api/private-messages", selectedUserId],
    enabled: !!currentUser && !!selectedUserId,
    queryFn: async () => {
      const response = await fetch(`/api/private-messages/${selectedUserId}`, {
        credentials: "include",
      });
      if (!response.ok) throw new Error("Failed to fetch messages");
      return response.json();
    },
  });

  const sendMutation = useMutation({
    mutationFn: async (content: string) => {
      return apiRequest("POST", "/api/private-messages", {
        receiverId: selectedUserId,
        content,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/private-messages", selectedUserId] });
      queryClient.invalidateQueries({ queryKey: ["/api/private-messages/conversations"] });
      setMessage("");
    },
  });

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const handleSend = (e: React.FormEvent) => {
    e.preventDefault();
    if (!message.trim() || sendMutation.isPending) return;
    sendMutation.mutate(message.trim());
  };

  const selectedConversation = conversations.find(c => c.otherUserId === selectedUserId);
  const otherUserEmail = selectedConversation?.otherUser?.email || "User";

  return (
    <div className="flex h-[calc(100vh-4rem)]">
      <div className="w-full md:w-80 border-r border-border flex flex-col bg-card/30">
        <div className="p-3 border-b border-border">
          <div className="flex items-center gap-2 mb-2">
            <MessageCircle className="w-5 h-5 text-primary" />
            <h2 className="text-lg font-bold">Messages</h2>
          </div>
          <div className="relative">
            <Search className="absolute left-2 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              placeholder="Search users..."
              value={searchQuery}
              onChange={(e) => {
                setSearchQuery(e.target.value);
                setShowSearch(e.target.value.length > 0);
              }}
              className="pl-8 h-8 text-sm"
              data-testid="input-search-users"
            />
          </div>
        </div>

        {showSearch && searchQuery.length > 0 ? (
          <div className="flex-1 overflow-y-auto">
            {searchResults.length === 0 ? (
              <div className="p-4 text-center text-sm text-muted-foreground">
                No users found
              </div>
            ) : (
              searchResults.map((user) => (
                <button
                  key={user.id}
                  onClick={() => {
                    setSelectedUserId(user.id);
                    setShowSearch(false);
                    setSearchQuery("");
                  }}
                  className="w-full p-3 hover:bg-muted/50 transition-colors text-left border-b border-border/50"
                  data-testid={`user-result-${user.id}`}
                >
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center">
                      <User className="w-4 h-4 text-primary" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium truncate">{user.email}</p>
                    </div>
                  </div>
                </button>
              ))
            )}
          </div>
        ) : (
          <div className="flex-1 overflow-y-auto">
            {conversations.length === 0 ? (
              <div className="p-4 text-center text-sm text-muted-foreground">
                No conversations yet
              </div>
            ) : (
              conversations.map((conv) => (
                <button
                  key={conv.otherUserId}
                  onClick={() => setSelectedUserId(conv.otherUserId)}
                  className={`w-full p-3 hover:bg-muted/50 transition-colors text-left border-b border-border/50 ${
                    selectedUserId === conv.otherUserId ? "bg-muted" : ""
                  }`}
                  data-testid={`conversation-${conv.otherUserId}`}
                >
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center relative">
                      <User className="w-4 h-4 text-primary" />
                      {conv.unreadCount > 0 && (
                        <span className="absolute -top-1 -right-1 w-4 h-4 bg-red-500 text-white text-xs rounded-full flex items-center justify-center">
                          {conv.unreadCount}
                        </span>
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium truncate">{conv.otherUser.email}</p>
                      <p className="text-xs text-muted-foreground truncate">
                        {conv.lastMessage.content}
                      </p>
                    </div>
                  </div>
                </button>
              ))
            )}
          </div>
        )}
      </div>

      <div className="flex-1 flex flex-col">
        {selectedUserId ? (
          <>
            <div className="p-3 border-b border-border bg-card/50">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center">
                  <User className="w-4 h-4 text-primary" />
                </div>
                <h3 className="text-sm font-semibold" data-testid="text-chat-header">
                  {otherUserEmail}
                </h3>
              </div>
            </div>

            <div className="flex-1 overflow-y-auto p-3 space-y-2 bg-gradient-to-b from-background to-muted/10">
              {messages.map((msg) => (
                <div
                  key={msg.id}
                  className={`flex ${msg.senderId === currentUser?.uid ? "justify-end" : "justify-start"}`}
                  data-testid={`message-${msg.id}`}
                >
                  <div
                    className={`max-w-[75%] rounded-xl px-3 py-2 text-sm ${
                      msg.senderId === currentUser?.uid
                        ? "bg-primary text-primary-foreground"
                        : "bg-muted"
                    }`}
                  >
                    {msg.content}
                  </div>
                </div>
              ))}
              <div ref={messagesEndRef} />
            </div>

            <form onSubmit={handleSend} className="p-2.5 border-t border-border bg-card/50">
              <div className="flex gap-2">
                <Input
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  placeholder="Type a message..."
                  className="flex-1 h-9 text-sm"
                  disabled={sendMutation.isPending}
                  data-testid="input-message"
                />
                <Button
                  type="submit"
                  size="sm"
                  className="h-9 w-9"
                  disabled={!message.trim() || sendMutation.isPending}
                  data-testid="button-send"
                >
                  {sendMutation.isPending ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <Send className="w-4 h-4" />
                  )}
                </Button>
              </div>
            </form>
          </>
        ) : (
          <div className="flex-1 flex items-center justify-center text-center p-4">
            <div>
              <MessageCircle className="w-12 h-12 text-muted-foreground mx-auto mb-3" />
              <h3 className="text-lg font-semibold mb-1">Select a conversation</h3>
              <p className="text-sm text-muted-foreground">
                Choose a conversation or search for a user to start messaging
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
