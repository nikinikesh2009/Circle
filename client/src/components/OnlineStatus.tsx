import { cn } from "@/lib/utils";

type OnlineStatusProps = {
  status: "online" | "offline" | "away" | "busy";
  className?: string;
  showRing?: boolean;
};

export function OnlineStatus({ status, className, showRing = true }: OnlineStatusProps) {
  return (
    <span
      className={cn(
        "absolute bottom-0 right-0 block h-3 w-3 rounded-full",
        showRing && "ring-2 ring-background",
        status === "online" && "bg-status-online",
        status === "offline" && "bg-status-offline",
        status === "away" && "bg-status-away",
        status === "busy" && "bg-status-busy",
        className
      )}
    />
  );
}
