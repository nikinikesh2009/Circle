import { UserAvatar } from "@/features/profile/components/UserAvatar";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

type CircleListItemProps = {
  id: string;
  name: string;
  lastMessage?: string;
  timestamp?: string;
  unreadCount?: number;
  avatar?: string;
  isActive?: boolean;
  onClick?: () => void;
};

export function CircleListItem({
  name,
  lastMessage,
  timestamp,
  unreadCount = 0,
  avatar,
  isActive = false,
  onClick,
}: CircleListItemProps) {
  return (
    <div
      className={cn(
        "flex items-center gap-3 p-3 rounded-lg cursor-pointer hover-elevate active-elevate-2",
        isActive && "bg-accent"
      )}
      onClick={onClick}
      data-testid={`circle-item-${name.toLowerCase().replace(/\s+/g, '-')}`}
    >
      <UserAvatar
        src={avatar}
        alt={name}
        fallback={name.substring(0, 2).toUpperCase()}
        size="md"
      />
      <div className="flex-1 min-w-0">
        <div className="flex items-center justify-between mb-1">
          <h4 className="font-medium text-sm truncate">{name}</h4>
          {timestamp && (
            <span className="text-xs text-muted-foreground flex-shrink-0">
              {timestamp}
            </span>
          )}
        </div>
        {lastMessage && (
          <p className="text-sm text-muted-foreground truncate">
            {lastMessage}
          </p>
        )}
      </div>
      {unreadCount > 0 && (
        <Badge
          variant="default"
          className="ml-auto flex-shrink-0 h-5 min-w-5 px-1.5 rounded-full"
          data-testid="badge-unread-count"
        >
          {unreadCount > 99 ? "99+" : unreadCount}
        </Badge>
      )}
    </div>
  );
}
