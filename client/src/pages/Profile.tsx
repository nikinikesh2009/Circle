import { UserAvatar } from "@/components/UserAvatar";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Settings, Edit } from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { CircleCard } from "@/components/CircleCard";
import { useAuth } from "@/lib/auth-context";
import { useQuery } from "@tanstack/react-query";
import techCover from '@assets/stock_images/tech_community_codin_056fa929.jpg';
import bookCover from '@assets/stock_images/book_club_reading_li_02f53848.jpg';

export default function Profile() {
  const { user } = useAuth();

  const { data: userCircles = [] } = useQuery<any[]>({
    queryKey: ["/api/circles/my"],
  });

  return (
    <div className="flex flex-col h-full">
      <div className="p-4 lg:p-6 space-y-6 max-w-4xl mx-auto w-full">
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
              <div className="flex gap-4 text-sm">
                <div>
                  <span className="font-semibold">{userCircles.length}</span>
                  <span className="text-muted-foreground ml-1">Circles</span>
                </div>
                <div>
                  <span className="font-semibold">0</span>
                  <span className="text-muted-foreground ml-1">Messages</span>
                </div>
                <div>
                  <span className="font-semibold">1</span>
                  <span className="text-muted-foreground ml-1">Days Active</span>
                </div>
              </div>
            </div>
            <div className="flex gap-2">
              <Button variant="outline" size="icon" data-testid="button-edit-profile">
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
      </div>
    </div>
  );
}
