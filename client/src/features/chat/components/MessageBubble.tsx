import { cn } from "@/lib/utils";
import { UserAvatar } from "@/features/profile/components/UserAvatar";

type MessageBubbleProps = {
  content: string;
  sender: {
    name: string;
    avatar?: string;
    fallback: string;
  };
  timestamp: string;
  isSent: boolean;
  isAI?: boolean;
};

export function MessageBubble({
  content,
  sender,
  timestamp,
  isSent,
  isAI = false,
}: MessageBubbleProps) {
  return (
    <div
      className={cn(
        "flex gap-3 mb-4",
        isSent ? "flex-row-reverse" : "flex-row"
      )}
      data-testid={`message-${isSent ? 'sent' : 'received'}`}
    >
      {!isSent && (
        <UserAvatar
          src={sender.avatar}
          alt={sender.name}
          fallback={sender.fallback}
          size="sm"
        />
      )}
      <div
        className={cn(
          "flex flex-col max-w-[70%]",
          isSent ? "items-end" : "items-start"
        )}
      >
        {!isSent && !isAI && (
          <span className="text-xs text-muted-foreground mb-1 px-1">
            {sender.name}
          </span>
        )}
        <div
          className={cn(
            "rounded-2xl px-4 py-2",
            isSent
              ? "bg-primary text-primary-foreground"
              : isAI
              ? "bg-accent/50 border border-accent-border"
              : "bg-muted"
          )}
        >
          <p className="text-sm">{content}</p>
        </div>
        <span className="text-xs text-muted-foreground mt-1 px-1">
          {timestamp}
        </span>
      </div>
    </div>
  );
}
