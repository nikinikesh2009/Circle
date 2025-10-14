import { useState } from "react";
import { CircleCard } from "@/components/CircleCard";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Search, Plus } from "lucide-react";
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
import { ContentContainer } from "@/components/ContentContainer";

export default function Explore() {
  const [searchQuery, setSearchQuery] = useState("");
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [newCircle, setNewCircle] = useState({
    name: "",
    description: "",
    category: "",
  });
  const { toast } = useToast();

  const { data: exploreCircles = [], isLoading } = useQuery<any[]>({
    queryKey: ["/api/circles/explore"],
  });

  const createCircleMutation = useMutation({
    mutationFn: async (data: typeof newCircle) => {
      const response = await apiRequest("POST", "/api/circles", data);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/circles/explore"] });
      toast({ title: "Success", description: "Circle created successfully!" });
      setCreateDialogOpen(false);
      setNewCircle({ name: "", description: "", category: "" });
    },
    onError: (error: Error) => {
      toast({ variant: "destructive", title: "Error", description: error.message });
    },
  });

  const filteredCircles = exploreCircles.filter((circle: any) => 
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
    <ContentContainer className="py-4 lg:py-6">
      <div className="space-y-6">
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

        <div>
          <h2 className="text-2xl font-bold mb-4">Explore Circles</h2>
          {filteredCircles.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {filteredCircles.map((circle: any) => (
                <CircleCard
                  key={circle.id}
                  {...circle}
                  isMember={false}
                  onClick={() => console.log(`Circle ${circle.name} clicked`)}
                />
              ))}
            </div>
          ) : (
            <p className="text-center text-muted-foreground py-8">
              {searchQuery ? "No circles found matching your search" : "No new circles to explore"}
            </p>
          )}
        </div>
      </div>
    </ContentContainer>
  );
}
