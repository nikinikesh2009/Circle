import { useQuery } from "@tanstack/react-query";
import { useLocation } from "wouter";
import { useAuth } from "@/lib/auth-context";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Skeleton } from "@/components/ui/skeleton";
import { Search, MessageSquare } from "lucide-react";
import { useState } from "react";

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

export default function DirectMessages() {
  const { user } = useAuth();
  const [, navigate] = useLocation();
  const [searchQuery, setSearchQuery] = useState("");

  const { data: conversations = [], isLoading } = useQuery<Conversation[]>({
    queryKey: ["/api/dm/conversations"],
  });

  const filteredConversations = conversations.filter((conv) => {
    if (!conv.otherUser) return false;
    const searchLower = searchQuery.toLowerCase();
    return (
      conv.otherUser.name.toLowerCase().includes(searchLower) ||
      conv.otherUser.username.toLowerCase().includes(searchLower)
    );
  });

  const getInitials = (name: string) => {
    return name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase()
      .slice(0, 2);
  };

  return (
    <div className="h-full flex flex-col">
      <div className="border-b px-4 sm:px-6 lg:px-8 py-4">
        <h1 className="text-2xl font-bold mb-4" data-testid="text-dm-title">Direct Messages</h1>
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search conversations..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10"
            data-testid="input-dm-search"
          />
        </div>
      </div>

      <ScrollArea className="flex-1">
        {isLoading ? (
          <div className="p-4 space-y-4">
            {[1, 2, 3, 4, 5].map((i) => (
              <div key={i} className="flex items-center gap-3">
                <Skeleton className="h-12 w-12 rounded-full" />
                <div className="flex-1">
                  <Skeleton className="h-4 w-32 mb-2" />
                  <Skeleton className="h-3 w-48" />
                </div>
              </div>
            ))}
          </div>
        ) : filteredConversations.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-64 text-center p-4">
            <MessageSquare className="h-12 w-12 text-muted-foreground mb-4" />
            <h3 className="text-lg font-semibold mb-2" data-testid="text-no-conversations">
              {searchQuery ? "No conversations found" : "No conversations yet"}
            </h3>
            <p className="text-sm text-muted-foreground max-w-sm">
              {searchQuery
                ? "Try searching with a different name"
                : "Start a conversation by selecting a user from a circle"}
            </p>
          </div>
        ) : (
          <div className="px-4 sm:px-6 lg:px-8 py-4">
            <div className="space-y-2">
            {filteredConversations.map((conv) => (
              <Button
                key={conv.id}
                variant="ghost"
                className="w-full justify-start h-auto p-3 hover-elevate"
                onClick={() => navigate(`/dm/${conv.id}`)}
                data-testid={`button-conversation-${conv.id}`}
              >
                <Avatar className="h-12 w-12 mr-3">
                  <AvatarImage src={conv.otherUser?.avatar} />
                  <AvatarFallback>
                    {conv.otherUser ? getInitials(conv.otherUser.name) : "?"}
                  </AvatarFallback>
                </Avatar>
                <div className="flex-1 text-left">
                  <p className="font-semibold" data-testid={`text-conversation-name-${conv.id}`}>
                    {conv.otherUser?.name || "Unknown User"}
                  </p>
                  <p className="text-sm text-muted-foreground" data-testid={`text-conversation-username-${conv.id}`}>
                    @{conv.otherUser?.username || "unknown"}
                  </p>
                </div>
              </Button>
            ))}
            </div>
          </div>
        )}
      </ScrollArea>
    </div>
  );
}
