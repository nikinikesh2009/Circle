import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { AdminLayout } from "../components/AdminLayout";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Search, Trash2, TrendingUp } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/services/queryClient";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";

export default function CirclesPanel() {
  const [searchQuery, setSearchQuery] = useState("");
  const { toast } = useToast();

  const { data: circles = [], isLoading } = useQuery<any[]>({
    queryKey: ["/api/circles"],
  });

  const updateCircleMutation = useMutation({
    mutationFn: async ({ id, updates }: { id: string; updates: any }) => {
      const response = await apiRequest("PUT", `/api/admin/circles/${id}`, updates);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/circles"] });
      toast({ title: "Circle updated successfully" });
    },
  });

  const deleteCircleMutation = useMutation({
    mutationFn: async (circleId: string) => {
      const response = await apiRequest("DELETE", `/api/admin/circles/${circleId}`);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/circles"] });
      toast({ title: "Circle deleted successfully" });
    },
  });

  const filteredCircles = circles.filter((circle) =>
    circle.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    circle.description?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold">Circles</h1>
          <p className="text-muted-foreground">Manage platform circles</p>
        </div>

        <div className="relative max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search circles..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10"
            data-testid="input-search-circles"
          />
        </div>

        <Card>
          <CardHeader>
            <CardTitle>All Circles ({filteredCircles.length})</CardTitle>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <p className="text-center text-muted-foreground py-8">Loading circles...</p>
            ) : filteredCircles.length > 0 ? (
              <div className="space-y-4">
                {filteredCircles.map((circle) => (
                  <div
                    key={circle.id}
                    className="p-4 rounded-md border border-border hover:bg-muted/50 transition-colors"
                  >
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <h3 className="font-medium">{circle.name}</h3>
                          {circle.isOfficial && (
                            <Badge variant="default" className="text-xs">Official</Badge>
                          )}
                          {circle.isPrivate && (
                            <Badge variant="secondary" className="text-xs">Private</Badge>
                          )}
                        </div>
                        <p className="text-sm text-muted-foreground mt-1 line-clamp-2">
                          {circle.description}
                        </p>
                        <p className="text-xs text-muted-foreground mt-2">
                          {circle.memberCount} members • {circle.category || 'No category'}
                        </p>
                      </div>

                      <div className="flex flex-col gap-2">
                        <div className="flex items-center space-x-2">
                          <Switch
                            id={`official-${circle.id}`}
                            checked={circle.isOfficial}
                            onCheckedChange={(checked) =>
                              updateCircleMutation.mutate({
                                id: circle.id,
                                updates: { isOfficial: checked },
                              })
                            }
                            data-testid={`switch-official-${circle.id}`}
                          />
                          <Label htmlFor={`official-${circle.id}`} className="text-xs">
                            <TrendingUp className="h-3 w-3 inline mr-1" />
                            Trending
                          </Label>
                        </div>
                        <Button
                          size="sm"
                          variant="destructive"
                          onClick={() => {
                            if (confirm(`Delete circle "${circle.name}"? This cannot be undone.`)) {
                              deleteCircleMutation.mutate(circle.id);
                            }
                          }}
                          disabled={deleteCircleMutation.isPending}
                          data-testid={`button-delete-circle-${circle.id}`}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-center text-muted-foreground py-8">No circles found</p>
            )}
          </CardContent>
        </Card>
      </div>
    </AdminLayout>
  );
}
