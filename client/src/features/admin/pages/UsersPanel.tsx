import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { AdminLayout } from "../components/AdminLayout";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Search, Ban, CheckCircle, Trash2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/services/queryClient";
import { Badge } from "@/components/ui/badge";

export default function UsersPanel() {
  const [searchQuery, setSearchQuery] = useState("");
  const { toast } = useToast();

  const { data: users = [], isLoading } = useQuery<any[]>({
    queryKey: ["/api/admin/users"],
  });

  const banMutation = useMutation({
    mutationFn: async (userId: string) => {
      const response = await apiRequest("POST", `/api/admin/users/${userId}/ban`);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/users"] });
      toast({ title: "User banned successfully" });
    },
  });

  const unbanMutation = useMutation({
    mutationFn: async (userId: string) => {
      const response = await apiRequest("POST", `/api/admin/users/${userId}/unban`);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/users"] });
      toast({ title: "User unbanned successfully" });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (userId: string) => {
      const response = await apiRequest("DELETE", `/api/admin/users/${userId}`);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/users"] });
      toast({ title: "User deleted successfully" });
    },
  });

  const filteredUsers = users.filter((user) =>
    user.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    user.email?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    user.username?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold">Users</h1>
          <p className="text-muted-foreground">Manage platform users</p>
        </div>

        <div className="flex gap-4 flex-wrap">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search users..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
              data-testid="input-search-users"
            />
          </div>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>All Users ({filteredUsers.length})</CardTitle>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <p className="text-center text-muted-foreground py-8">Loading users...</p>
            ) : filteredUsers.length > 0 ? (
              <div className="space-y-2">
                {filteredUsers.map((user) => (
                  <div
                    key={user.id}
                    className="flex items-center justify-between p-4 rounded-md border border-border hover:bg-muted/50 transition-colors"
                  >
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <p className="font-medium truncate">{user.name}</p>
                        {user.status === 'banned' && (
                          <Badge variant="destructive" className="text-xs">Banned</Badge>
                        )}
                        {user.status === 'online' && (
                          <Badge variant="default" className="text-xs">Online</Badge>
                        )}
                      </div>
                      <p className="text-sm text-muted-foreground truncate">@{user.username}</p>
                      <p className="text-xs text-muted-foreground truncate">{user.email}</p>
                    </div>
                    <div className="flex gap-2 ml-4">
                      {user.status === 'banned' ? (
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => unbanMutation.mutate(user.id)}
                          disabled={unbanMutation.isPending}
                          data-testid={`button-unban-${user.id}`}
                        >
                          <CheckCircle className="h-4 w-4 mr-1" />
                          Unban
                        </Button>
                      ) : (
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => banMutation.mutate(user.id)}
                          disabled={banMutation.isPending}
                          data-testid={`button-ban-${user.id}`}
                        >
                          <Ban className="h-4 w-4 mr-1" />
                          Ban
                        </Button>
                      )}
                      <Button
                        size="sm"
                        variant="destructive"
                        onClick={() => {
                          if (confirm(`Delete user ${user.name}? This cannot be undone.`)) {
                            deleteMutation.mutate(user.id);
                          }
                        }}
                        disabled={deleteMutation.isPending}
                        data-testid={`button-delete-${user.id}`}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-center text-muted-foreground py-8">No users found</p>
            )}
          </CardContent>
        </Card>
      </div>
    </AdminLayout>
  );
}
