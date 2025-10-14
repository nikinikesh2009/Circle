import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { OnlineStatus } from "./OnlineStatus";
import { cn } from "@/lib/utils";

type UserAvatarProps = {
  src?: string;
  alt: string;
  fallback: string;
  status?: "online" | "offline" | "away" | "busy";
  className?: string;
  size?: "sm" | "md" | "lg";
};

export function UserAvatar({ src, alt, fallback, status, className, size = "md" }: UserAvatarProps) {
  const sizeClasses = {
    sm: "h-8 w-8",
    md: "h-10 w-10",
    lg: "h-12 w-12",
  };

  return (
    <div className="relative inline-block">
      <Avatar className={cn(sizeClasses[size], className)}>
        <AvatarImage src={src} alt={alt} />
        <AvatarFallback>{fallback}</AvatarFallback>
      </Avatar>
      {status && <OnlineStatus status={status} />}
    </div>
  );
}
