import { useState } from "react";
import { CircleCard } from "@/components/CircleCard";
import { Input } from "@/components/ui/input";
import { Search } from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import techCover from '@assets/stock_images/tech_community_codin_056fa929.jpg';
import fitnessCover from '@assets/stock_images/fitness_workout_gym__660c579b.jpg';
import bookCover from '@assets/stock_images/book_club_reading_li_02f53848.jpg';
import gamingCover from '@assets/stock_images/gaming_esports_playe_5e7d5b73.jpg';

// todo: remove mock functionality
const mockCircles = [
  { id: "1", name: "Tech Innovators", description: "A community for developers and tech enthusiasts to share ideas", coverImage: techCover, memberCount: 1250, isPrivate: false, isMember: true, category: "Technology" },
  { id: "2", name: "Fitness Squad", description: "Join us for workout challenges, nutrition tips, and motivation", coverImage: fitnessCover, memberCount: 892, isPrivate: false, isMember: false, category: "Health" },
  { id: "3", name: "Book Club", description: "Monthly book discussions and literary recommendations", coverImage: bookCover, memberCount: 534, isPrivate: false, isMember: true, category: "Literature" },
  { id: "4", name: "Gaming Legends", description: "Connect with gamers, share strategies, and find teammates", coverImage: gamingCover, memberCount: 2103, isPrivate: false, isMember: false, category: "Gaming" },
];

export default function Home() {
  const [searchQuery, setSearchQuery] = useState("");

  return (
    <div className="flex flex-col h-full">
      <div className="p-4 lg:p-6 space-y-6">
        <div className="flex items-center gap-4">
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
        </div>

        <Tabs defaultValue="all" className="w-full">
          <TabsList>
            <TabsTrigger value="all" data-testid="tab-all">All</TabsTrigger>
            <TabsTrigger value="my-circles" data-testid="tab-my-circles">My Circles</TabsTrigger>
            <TabsTrigger value="discover" data-testid="tab-discover">Discover</TabsTrigger>
          </TabsList>
          <TabsContent value="all" className="mt-6">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {mockCircles.map((circle) => (
                <CircleCard
                  key={circle.id}
                  {...circle}
                  onClick={() => console.log(`Circle ${circle.name} clicked`)}
                />
              ))}
            </div>
          </TabsContent>
          <TabsContent value="my-circles" className="mt-6">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {mockCircles.filter(c => c.isMember).map((circle) => (
                <CircleCard
                  key={circle.id}
                  {...circle}
                  onClick={() => console.log(`Circle ${circle.name} clicked`)}
                />
              ))}
            </div>
          </TabsContent>
          <TabsContent value="discover" className="mt-6">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {mockCircles.filter(c => !c.isMember).map((circle) => (
                <CircleCard
                  key={circle.id}
                  {...circle}
                  onClick={() => console.log(`Circle ${circle.name} clicked`)}
                />
              ))}
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
