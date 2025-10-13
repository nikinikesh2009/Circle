import { UserAvatar } from "@/components/UserAvatar";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Settings, Edit } from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { CircleCard } from "@/components/CircleCard";
import techCover from '@assets/stock_images/tech_community_codin_056fa929.jpg';
import bookCover from '@assets/stock_images/book_club_reading_li_02f53848.jpg';

// todo: remove mock functionality
const userCircles = [
  { id: "1", name: "Tech Innovators", description: "A community for developers and tech enthusiasts", coverImage: techCover, memberCount: 1250, isPrivate: false, isMember: true, category: "Technology" },
  { id: "3", name: "Book Club", description: "Monthly book discussions and recommendations", coverImage: bookCover, memberCount: 534, isPrivate: false, isMember: true, category: "Literature" },
];

export default function Profile() {
  return (
    <div className="flex flex-col h-full">
      <div className="p-4 lg:p-6 space-y-6 max-w-4xl mx-auto w-full">
        <Card className="p-6">
          <div className="flex flex-col md:flex-row gap-6 items-start md:items-center">
            <UserAvatar
              fallback="JD"
              alt="John Doe"
              status="online"
              size="lg"
              className="h-24 w-24"
            />
            <div className="flex-1 space-y-2">
              <div>
                <h1 className="text-2xl font-bold">John Doe</h1>
                <p className="text-muted-foreground">@johndoe</p>
              </div>
              <p className="text-sm">
                Developer passionate about building communities and sharing knowledge.
                Love coding, reading, and connecting with like-minded people.
              </p>
              <div className="flex gap-4 text-sm">
                <div>
                  <span className="font-semibold">2</span>
                  <span className="text-muted-foreground ml-1">Circles</span>
                </div>
                <div>
                  <span className="font-semibold">248</span>
                  <span className="text-muted-foreground ml-1">Messages</span>
                </div>
                <div>
                  <span className="font-semibold">24</span>
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
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {userCircles.map((circle) => (
                <CircleCard
                  key={circle.id}
                  {...circle}
                  onClick={() => console.log(`Circle ${circle.name} clicked`)}
                />
              ))}
            </div>
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
