import { useState } from "react";
import { CircleCard } from "@/components/CircleCard";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Search, Plus } from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useQuery, useMutation } from "@tanstack/react-query";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";

export default function Home() {
  const [searchQuery, setSearchQuery] = useState("");
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [newCircle, setNewCircle] = useState({
    name: "",
    description: "",
    category: "",
  });
  const { toast } = useToast();

  const { data: allCircles = [], isLoading } = useQuery<any[]>({
    queryKey: ["/api/circles"],
  });

  const { data: myCircles = [] } = useQuery<any[]>({
    queryKey: ["/api/circles/my"],
  });

  const createCircleMutation = useMutation({
    mutationFn: async (data: typeof newCircle) => {
      const response = await apiRequest("POST", "/api/circles", data);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/circles"] });
      queryClient.invalidateQueries({ queryKey: ["/api/circles/my"] });
      toast({ title: "Success", description: "Circle created successfully!" });
      setCreateDialogOpen(false);
      setNewCircle({ name: "", description: "", category: "" });
    },
    onError: (error: Error) => {
      toast({ variant: "destructive", title: "Error", description: error.message });
    },
  });

  const joinCircleMutation = useMutation({
    mutationFn: async (circleId: string) => {
      const response = await apiRequest("POST", `/api/circles/${circleId}/join`);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/circles"] });
      queryClient.invalidateQueries({ queryKey: ["/api/circles/my"] });
      toast({ title: "Success", description: "Joined circle successfully!" });
    },
    onError: (error: Error) => {
      toast({ variant: "destructive", title: "Error", description: error.message });
    },
  });

  const leaveCircleMutation = useMutation({
    mutationFn: async (circleId: string) => {
      const response = await apiRequest("POST", `/api/circles/${circleId}/leave`);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/circles"] });
      queryClient.invalidateQueries({ queryKey: ["/api/circles/my"] });
      toast({ title: "Success", description: "Left circle successfully!" });
    },
    onError: (error: Error) => {
      toast({ variant: "destructive", title: "Error", description: error.message });
    },
  });

  const myCircleIds = new Set(myCircles.map((c: any) => c.id));
  const circlesWithMembership = allCircles.map((circle: any) => ({
    ...circle,
    isMember: myCircleIds.has(circle.id),
  }));

  const filteredCircles = circlesWithMembership.filter((circle: any) =>
    circle.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-full">
        <p className="text-muted-foreground">Loading circles...</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full">
      <div className="p-4 lg:p-6 space-y-6">
        <div className="flex items-center gap-4 flex-wrap">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search circles..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
              data-testid="input-search-circles"
            />
          </div>
          <Dialog open={createDialogOpen} onOpenChange={setCreateDialogOpen}>
            <DialogTrigger asChild>
              <Button data-testid="button-create-circle">
                <Plus className="h-4 w-4 mr-2" />
                Create Circle
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Create a new circle</DialogTitle>
                <DialogDescription>
                  Start a community around your interests
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="name">Circle name</Label>
                  <Input
                    id="name"
                    value={newCircle.name}
                    onChange={(e) => setNewCircle({ ...newCircle, name: e.target.value })}
                    placeholder="Tech Innovators"
                    data-testid="input-circle-name"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="category">Category</Label>
                  <Input
                    id="category"
                    value={newCircle.category}
                    onChange={(e) => setNewCircle({ ...newCircle, category: e.target.value })}
                    placeholder="Technology"
                    data-testid="input-circle-category"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="description">Description</Label>
                  <Textarea
                    id="description"
                    value={newCircle.description}
                    onChange={(e) => setNewCircle({ ...newCircle, description: e.target.value })}
                    placeholder="A community for developers and tech enthusiasts..."
                    data-testid="input-circle-description"
                  />
                </div>
              </div>
              <DialogFooter>
                <Button
                  onClick={() => createCircleMutation.mutate(newCircle)}
                  disabled={createCircleMutation.isPending || !newCircle.name || !newCircle.description}
                  data-testid="button-create-circle-submit"
                >
                  {createCircleMutation.isPending ? "Creating..." : "Create Circle"}
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>

        <Tabs defaultValue="all" className="w-full">
          <TabsList>
            <TabsTrigger value="all" data-testid="tab-all">All</TabsTrigger>
            <TabsTrigger value="my-circles" data-testid="tab-my-circles">My Circles</TabsTrigger>
            <TabsTrigger value="discover" data-testid="tab-discover">Discover</TabsTrigger>
          </TabsList>
          <TabsContent value="all" className="mt-6">
            {filteredCircles.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {filteredCircles.map((circle: any) => (
                  <CircleCard
                    key={circle.id}
                    {...circle}
                    onClick={() => console.log(`Circle ${circle.name} clicked`)}
                  />
                ))}
              </div>
            ) : (
              <p className="text-center text-muted-foreground py-8">No circles found</p>
            )}
          </TabsContent>
          <TabsContent value="my-circles" className="mt-6">
            {myCircles.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {myCircles.map((circle: any) => (
                  <CircleCard
                    key={circle.id}
                    {...circle}
                    isMember={true}
                    onClick={() => console.log(`Circle ${circle.name} clicked`)}
                  />
                ))}
              </div>
            ) : (
              <p className="text-center text-muted-foreground py-8">
                You haven't joined any circles yet. Discover circles to get started!
              </p>
            )}
          </TabsContent>
          <TabsContent value="discover" className="mt-6">
            {filteredCircles.filter((c: any) => !c.isMember).length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {filteredCircles.filter((c: any) => !c.isMember).map((circle: any) => (
                  <CircleCard
                    key={circle.id}
                    {...circle}
                    onClick={() => console.log(`Circle ${circle.name} clicked`)}
                  />
                ))}
              </div>
            ) : (
              <p className="text-center text-muted-foreground py-8">No new circles to discover</p>
            )}
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
