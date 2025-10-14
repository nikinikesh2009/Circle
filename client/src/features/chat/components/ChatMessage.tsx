import { useState, useEffect } from "react";
import { cn } from "@/lib/utils";
import { UserAvatar } from "./UserAvatar";
import { Button } from "@/components/ui/button";
import { useQuery } from "@tanstack/react-query";
import { useLocation } from "wouter";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { MoreVertical, Smile, Edit2, Trash2 } from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";

interface Reaction {
  emoji: string;
  count: number;
  userReacted: boolean;
}

interface ChatMessageProps {
  id: string;
  content: string;
  sender: {
    id: string;
    name: string;
    username: string;
    avatar?: string;
  };
  createdAt: string;
  isEdited?: boolean;
  isDeleted?: boolean;
  isOwn: boolean;
  currentUserId: string;
  circleId: string;
}

const QUICK_REACTIONS = ["👍", "❤️", "😂", "😮", "🎉", "🔥"];

export function ChatMessage({
  id,
  content,
  sender,
  createdAt,
  isEdited,
  isDeleted,
  isOwn,
  currentUserId,
  circleId,
}: ChatMessageProps) {
  const [showEditDialog, setShowEditDialog] = useState(false);
  const [editContent, setEditContent] = useState(content);
  const [showReactionPicker, setShowReactionPicker] = useState(false);
  const { toast } = useToast();
  const [, navigate] = useLocation();

  // Sync editContent when content changes (from WebSocket or refetch)
  useEffect(() => {
    setEditContent(content);
  }, [content]);

  // Load reactions from API
  const { data: apiReactions = [] } = useQuery<Array<{ userId: string; emoji: string }>>({
    queryKey: ["/api/messages", id, "reactions"],
  });

  // Convert API reactions to UI format
  const reactions: Reaction[] = apiReactions.reduce((acc: Reaction[], r) => {
    const existing = acc.find(item => item.emoji === r.emoji);
    if (existing) {
      existing.count++;
      if (r.userId === currentUserId) {
        existing.userReacted = true;
      }
    } else {
      acc.push({
        emoji: r.emoji,
        count: 1,
        userReacted: r.userId === currentUserId,
      });
    }
    return acc;
  }, []);

  const handleEdit = async () => {
    try {
      await apiRequest("PATCH", `/api/messages/${id}`, { content: editContent });
      toast({ title: "Message updated" });
      setShowEditDialog(false);
      queryClient.invalidateQueries({ queryKey: ["/api/circles", circleId, "messages"] });
    } catch (error) {
      toast({ title: "Failed to edit message", variant: "destructive" });
    }
  };

  const handleDelete = async () => {
    if (!confirm("Delete this message?")) return;
    try {
      await apiRequest("DELETE", `/api/messages/${id}`);
      toast({ title: "Message deleted" });
      queryClient.invalidateQueries({ queryKey: ["/api/circles", circleId, "messages"] });
    } catch (error) {
      toast({ title: "Failed to delete message", variant: "destructive" });
    }
  };

  const handleReaction = async (emoji: string) => {
    try {
      const existing = reactions.find(r => r.emoji === emoji);
      if (existing?.userReacted) {
        await apiRequest("DELETE", `/api/messages/${id}/reactions/${emoji}`);
      } else {
        await apiRequest("POST", `/api/messages/${id}/reactions`, { emoji });
      }
      // Refetch reactions to update UI
      queryClient.invalidateQueries({ queryKey: ["/api/messages", id, "reactions"] });
    } catch (error) {
      toast({ title: "Failed to add reaction", variant: "destructive" });
    }
  };

  // Handle long press for mobile
  const [pressTimer, setPressTimer] = useState<NodeJS.Timeout | null>(null);

  const handleTouchStart = () => {
    const timer = setTimeout(() => {
      if (navigator.vibrate) {
        navigator.vibrate(50);
      }
      setShowReactionPicker(true);
    }, 500);
    setPressTimer(timer);
  };

  const handleTouchEnd = () => {
    if (pressTimer) {
      clearTimeout(pressTimer);
      setPressTimer(null);
    }
  };

  return (
    <>
      <div
        className={cn(
          "flex gap-3 mb-4 group",
          isOwn ? "flex-row-reverse" : "flex-row"
        )}
        data-testid={`message-${isOwn ? 'sent' : 'received'}`}
        onTouchStart={handleTouchStart}
        onTouchEnd={handleTouchEnd}
        onMouseDown={handleTouchStart}
        onMouseUp={handleTouchEnd}
      >
        {!isOwn && (
          <UserAvatar
            src={sender.avatar}
            alt={sender.name}
            fallback={sender.name[0]}
            size="sm"
          />
        )}
        
        <div
          className={cn(
            "flex flex-col max-w-[75%] md:max-w-[70%]",
            isOwn ? "items-end" : "items-start"
          )}
        >
          {!isOwn && (
            sender.id ? (
              <button
                onClick={() => navigate(`/user/${sender.id}`)}
                className="text-xs text-muted-foreground mb-1 px-1 hover:text-primary transition-colors cursor-pointer"
                data-testid="button-username"
              >
                {sender.name}
              </button>
            ) : (
              <span className="text-xs text-muted-foreground mb-1 px-1">
                {sender.name}
              </span>
            )
          )}
          
          <div className="relative">
            <div
              className={cn(
                "rounded-2xl px-4 py-2 relative",
                isOwn
                  ? "bg-primary text-primary-foreground"
                  : "bg-muted",
                isDeleted && "opacity-60"
              )}
            >
              <p className={cn(
                "text-sm whitespace-pre-wrap break-words",
                isDeleted && "italic text-muted-foreground"
              )}>
                {isDeleted ? "Message deleted" : content}
              </p>
              {isEdited && !isDeleted && (
                <span className="text-xs opacity-70 ml-2">(edited)</span>
              )}
            </div>

            {/* Reactions display */}
            {reactions.length > 0 && (
              <div className="flex gap-1 mt-1 flex-wrap">
                {reactions.map((reaction) => (
                  <button
                    key={reaction.emoji}
                    onClick={() => handleReaction(reaction.emoji)}
                    className={cn(
                      "text-xs px-2 py-0.5 rounded-full border",
                      reaction.userReacted
                        ? "bg-primary/20 border-primary"
                        : "bg-muted border-border"
                    )}
                    data-testid={`reaction-${reaction.emoji}`}
                  >
                    {reaction.emoji} {reaction.count}
                  </button>
                ))}
              </div>
            )}

            {/* Message actions menu */}
            {isOwn && (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="absolute -top-2 -right-2 h-6 w-6 opacity-0 group-hover:opacity-100 transition-opacity"
                    data-testid={`message-actions-${id}`}
                  >
                    <MoreVertical className="h-4 w-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuItem onClick={() => setShowEditDialog(true)} data-testid="menu-edit">
                    <Edit2 className="h-4 w-4 mr-2" />
                    Edit
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={handleDelete} data-testid="menu-delete">
                    <Trash2 className="h-4 w-4 mr-2" />
                    Delete
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            )}
          </div>

          <div className="flex items-center gap-2 mt-1">
            <span className="text-xs text-muted-foreground px-1">
              {formatDistanceToNow(new Date(createdAt), { addSuffix: true })}
            </span>
            {!isOwn && (
              <Button
                variant="ghost"
                size="icon"
                className="h-5 w-5 opacity-0 group-hover:opacity-100 transition-opacity"
                onClick={() => setShowReactionPicker(!showReactionPicker)}
                data-testid="reaction-button"
              >
                <Smile className="h-4 w-4" />
              </Button>
            )}
          </div>

          {/* Quick reaction picker */}
          {showReactionPicker && (
            <div className="flex gap-1 mt-2 p-2 bg-card border border-border rounded-lg shadow-lg">
              {QUICK_REACTIONS.map((emoji) => (
                <button
                  key={emoji}
                  onClick={() => {
                    handleReaction(emoji);
                    setShowReactionPicker(false);
                  }}
                  className="text-xl hover-elevate active-elevate-2 p-2 rounded-md transition-transform hover:scale-125"
                  data-testid={`quick-reaction-${emoji}`}
                >
                  {emoji}
                </button>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Edit Dialog */}
      <Dialog open={showEditDialog} onOpenChange={setShowEditDialog}>
        <DialogContent data-testid="edit-message-dialog">
          <DialogHeader>
            <DialogTitle>Edit Message</DialogTitle>
          </DialogHeader>
          <Input
            value={editContent}
            onChange={(e) => setEditContent(e.target.value)}
            placeholder="Edit your message..."
            data-testid="input-edit-message"
          />
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowEditDialog(false)}>
              Cancel
            </Button>
            <Button onClick={handleEdit} data-testid="button-save-edit">
              Save
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
