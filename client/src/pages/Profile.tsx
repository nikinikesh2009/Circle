import { useState } from "react";
import { UserAvatar } from "@/components/UserAvatar";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Settings, Edit, Plus, X, Target } from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { CircleCard } from "@/components/CircleCard";
import { useAuth } from "@/lib/auth-context";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { queryClient, apiRequest } from "@/lib/queryClient";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { ContentContainer } from "@/components/ContentContainer";

export default function Profile() {
  const { user, refreshUser } = useAuth();
  const { toast } = useToast();
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [editData, setEditData] = useState({
    name: user?.name || "",
    bio: user?.bio || "",
    targets: user?.targets || [],
  });
  const [newTarget, setNewTarget] = useState("");

  const { data: userCircles = [] } = useQuery<any[]>({
    queryKey: ["/api/circles/my"],
  });

  const updateProfileMutation = useMutation({
    mutationFn: async (data: { name?: string; bio?: string; targets?: string[] }) => {
      const response = await apiRequest("PATCH", "/api/user/profile", data);
      return response.json();
    },
    onSuccess: async (updatedUser) => {
      await refreshUser();
      queryClient.invalidateQueries({ queryKey: ["/api/auth/me"] });
      toast({ title: "Success", description: "Profile updated successfully!" });
      setEditDialogOpen(false);
    },
    onError: (error: Error) => {
      toast({ variant: "destructive", title: "Error", description: error.message });
    },
  });

  const handleOpenEditDialog = () => {
    setEditData({
      name: user?.name || "",
      bio: user?.bio || "",
      targets: user?.targets || [],
    });
    setEditDialogOpen(true);
  };

  const handleAddTarget = () => {
    if (newTarget.trim()) {
      setEditData({
        ...editData,
        targets: [...editData.targets, newTarget.trim()],
      });
      setNewTarget("");
    }
  };

  const handleRemoveTarget = (index: number) => {
    setEditData({
      ...editData,
      targets: editData.targets.filter((_, i) => i !== index),
    });
  };

  const handleSaveProfile = () => {
    updateProfileMutation.mutate(editData);
  };

  return (
    <ContentContainer className="py-4 lg:py-6">
      <div className="space-y-6">
        <Card className="p-6">
          <div className="flex flex-col md:flex-row gap-6 items-start md:items-center">
            <UserAvatar
              fallback={user?.name?.substring(0, 2).toUpperCase() || "U"}
              alt={user?.name || "User"}
              status="online"
              size="lg"
              className="h-24 w-24"
            />
            <div className="flex-1 space-y-2">
              <div>
                <h1 className="text-2xl font-bold">{user?.name}</h1>
                <p className="text-muted-foreground">@{user?.username}</p>
              </div>
              <p className="text-sm">
                {user?.bio || "No bio yet. Add one to tell others about yourself!"}
              </p>
              {user?.targets && user.targets.length > 0 && (
                <div className="flex flex-wrap gap-2 mt-2">
                  <Target className="h-4 w-4 text-muted-foreground mt-1" />
                  {user.targets.map((target, index) => (
                    <Badge key={index} variant="secondary" data-testid={`badge-target-${index}`}>
                      {target}
                    </Badge>
                  ))}
                </div>
              )}
              <div className="flex gap-4 text-sm">
                <div>
                  <span className="font-semibold">{userCircles.length}</span>
                  <span className="text-muted-foreground ml-1">Circles</span>
                </div>
                <div>
                  <span className="font-semibold">{user?.targets?.length || 0}</span>
                  <span className="text-muted-foreground ml-1">Goals</span>
                </div>
              </div>
            </div>
            <div className="flex gap-2">
              <Button 
                variant="outline" 
                size="icon" 
                onClick={handleOpenEditDialog}
                data-testid="button-edit-profile"
              >
                <Edit className="h-4 w-4" />
              </Button>
              <Button variant="outline" size="icon" data-testid="button-settings">
                <Settings className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </Card>

        <Tabs defaultValue="circles" className="w-full">
          <TabsList>
            <TabsTrigger value="circles" data-testid="tab-circles">My Circles</TabsTrigger>
            <TabsTrigger value="activity" data-testid="tab-activity">Activity</TabsTrigger>
          </TabsList>
          <TabsContent value="circles" className="mt-6">
            {userCircles.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {userCircles.map((circle: any) => (
                  <CircleCard
                    key={circle.id}
                    {...circle}
                    onClick={() => console.log(`Circle ${circle.name} clicked`)}
                  />
                ))}
              </div>
            ) : (
              <Card className="p-6">
                <p className="text-muted-foreground text-center py-8">
                  You haven't joined any circles yet. Discover circles to connect with communities!
                </p>
              </Card>
            )}
          </TabsContent>
          <TabsContent value="activity" className="mt-6">
            <Card className="p-6">
              <p className="text-muted-foreground text-center py-8">
                Your recent activity will appear here
              </p>
            </Card>
          </TabsContent>
        </Tabs>

        <Dialog open={editDialogOpen} onOpenChange={setEditDialogOpen}>
          <DialogContent className="sm:max-w-[500px]">
            <DialogHeader>
              <DialogTitle>Edit Profile</DialogTitle>
              <DialogDescription>
                Update your profile information and goals
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="name">Name</Label>
                <Input
                  id="name"
                  value={editData.name}
                  onChange={(e) => setEditData({ ...editData, name: e.target.value })}
                  placeholder="Your name"
                  data-testid="input-profile-name"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="bio">Bio</Label>
                <Textarea
                  id="bio"
                  value={editData.bio}
                  onChange={(e) => setEditData({ ...editData, bio: e.target.value })}
                  placeholder="Tell others about yourself..."
                  rows={4}
                  data-testid="input-profile-bio"
                />
              </div>
              <div className="space-y-2">
                <Label>Goals & Targets</Label>
                <div className="flex gap-2">
                  <Input
                    value={newTarget}
                    onChange={(e) => setNewTarget(e.target.value)}
                    onKeyPress={(e) => e.key === 'Enter' && handleAddTarget()}
                    placeholder="Add a goal..."
                    data-testid="input-new-target"
                  />
                  <Button 
                    type="button" 
                    size="icon" 
                    onClick={handleAddTarget}
                    data-testid="button-add-target"
                  >
                    <Plus className="h-4 w-4" />
                  </Button>
                </div>
                {editData.targets.length > 0 && (
                  <div className="flex flex-wrap gap-2 mt-2">
                    {editData.targets.map((target, index) => (
                      <Badge 
                        key={index} 
                        variant="secondary" 
                        className="gap-1"
                        data-testid={`edit-target-${index}`}
                      >
                        {target}
                        <X
                          className="h-3 w-3 cursor-pointer hover-elevate active-elevate-2"
                          onClick={() => handleRemoveTarget(index)}
                          data-testid={`button-remove-target-${index}`}
                        />
                      </Badge>
                    ))}
                  </div>
                )}
              </div>
            </div>
            <DialogFooter>
              <Button
                variant="outline"
                onClick={() => setEditDialogOpen(false)}
                data-testid="button-cancel-edit"
              >
                Cancel
              </Button>
              <Button
                onClick={handleSaveProfile}
                disabled={updateProfileMutation.isPending || !editData.name.trim()}
                data-testid="button-save-profile"
              >
                {updateProfileMutation.isPending ? "Saving..." : "Save Changes"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </ContentContainer>
  );
}
