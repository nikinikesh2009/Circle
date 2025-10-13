import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Users, Lock } from "lucide-react";
import { cn } from "@/lib/utils";

type CircleCardProps = {
  id: string;
  name: string;
  description: string;
  coverImage?: string;
  memberCount: number;
  isPrivate: boolean;
  isMember?: boolean;
  category?: string;
  onClick?: () => void;
};

export function CircleCard({
  name,
  description,
  coverImage,
  memberCount,
  isPrivate,
  isMember = false,
  category,
  onClick,
}: CircleCardProps) {
  return (
    <Card
      className={cn(
        "overflow-hidden cursor-pointer transition-all hover-elevate active-elevate-2",
        "hover:-translate-y-1"
      )}
      onClick={onClick}
      data-testid={`card-circle-${name.toLowerCase().replace(/\s+/g, '-')}`}
    >
      {coverImage && (
        <div className="relative h-32 overflow-hidden">
          <img
            src={coverImage}
            alt={name}
            className="w-full h-full object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
          {category && (
            <Badge className="absolute top-3 left-3" variant="secondary">
              {category}
            </Badge>
          )}
        </div>
      )}
      <div className="p-4">
        <div className="flex items-start justify-between gap-2 mb-2">
          <h3 className="font-semibold text-lg line-clamp-1">{name}</h3>
          {isPrivate && <Lock className="h-4 w-4 text-muted-foreground flex-shrink-0 mt-1" />}
        </div>
        <p className="text-sm text-muted-foreground line-clamp-2 mb-3">
          {description}
        </p>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-1 text-sm text-muted-foreground">
            <Users className="h-4 w-4" />
            <span>{memberCount.toLocaleString()} members</span>
          </div>
          <Button
            size="sm"
            variant={isMember ? "secondary" : "default"}
            onClick={(e) => {
              e.stopPropagation();
              console.log(`${isMember ? 'Leave' : 'Join'} circle clicked`);
            }}
            data-testid={`button-${isMember ? 'leave' : 'join'}-circle`}
          >
            {isMember ? "Joined" : "Join"}
          </Button>
        </div>
      </div>
    </Card>
  );
}
