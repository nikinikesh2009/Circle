import { useParams, useLocation } from "wouter";
import { UserAvatar } from "@/components/UserAvatar";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { MessageSquare, Target } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useAuth } from "@/lib/auth-context";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";

export default function UserProfile() {
  const { userId } = useParams();
  const [, navigate] = useLocation();
  const { user: currentUser } = useAuth();
  const { toast } = useToast();

  const { data: user, isLoading } = useQuery<any>({
    queryKey: ["/api/users", userId],
    enabled: !!userId,
  });

  const createConversationMutation = useMutation({
    mutationFn: async (otherUserId: string) => {
      const response = await apiRequest("POST", "/api/dm/conversations", { otherUserId });
      return response.json();
    },
    onSuccess: (conversation) => {
      navigate(`/dm/${conversation.id}`);
    },
    onError: (error: Error) => {
      toast({ variant: "destructive", title: "Error", description: error.message });
    },
  });

  const handleSendMessage = () => {
    if (userId) {
      createConversationMutation.mutate(userId);
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-full">
        <p className="text-muted-foreground">Loading profile...</p>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="flex items-center justify-center h-full">
        <p className="text-muted-foreground">User not found</p>
      </div>
    );
  }

  const isOwnProfile = currentUser?.id === userId;

  return (
    <div className="space-y-6">
        <Card className="p-6">
          <div className="flex flex-col md:flex-row gap-6 items-start md:items-center">
            <UserAvatar
              fallback={user?.name?.substring(0, 2).toUpperCase() || "U"}
              alt={user?.name || "User"}
              status={user?.status || "offline"}
              size="lg"
              className="h-24 w-24"
              data-testid="avatar-user-profile"
            />
            <div className="flex-1 space-y-2">
              <div>
                <h1 className="text-2xl font-bold" data-testid="text-user-name">{user?.name}</h1>
                <p className="text-muted-foreground" data-testid="text-user-username">@{user?.username}</p>
              </div>
              <p className="text-sm" data-testid="text-user-bio">
                {user?.bio || "No bio yet."}
              </p>
              {user?.targets && user.targets.length > 0 && (
                <div className="flex flex-wrap gap-2 mt-2">
                  <Target className="h-4 w-4 text-muted-foreground mt-1" />
                  {user.targets.map((target: string, index: number) => (
                    <Badge key={index} variant="secondary" data-testid={`badge-user-target-${index}`}>
                      {target}
                    </Badge>
                  ))}
                </div>
              )}
            </div>
            {!isOwnProfile && (
              <Button 
                onClick={handleSendMessage}
                disabled={createConversationMutation.isPending}
                data-testid="button-send-message"
              >
                <MessageSquare className="h-4 w-4 mr-2" />
                {createConversationMutation.isPending ? "Loading..." : "Send Message"}
              </Button>
            )}
          </div>
        </Card>

        <Card className="p-6">
          <h2 className="text-lg font-semibold mb-4">About</h2>
          <div className="space-y-4">
            <div>
              <h3 className="text-sm font-medium text-muted-foreground mb-2">Bio</h3>
              <p className="text-sm">{user?.bio || "No bio provided"}</p>
            </div>
            {user?.targets && user.targets.length > 0 && (
              <div>
                <h3 className="text-sm font-medium text-muted-foreground mb-2">Goals & Targets</h3>
                <ul className="list-disc list-inside space-y-1">
                  {user.targets.map((target: string, index: number) => (
                    <li key={index} className="text-sm" data-testid={`text-user-goal-${index}`}>
                      {target}
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        </Card>
    </div>
  );
}
