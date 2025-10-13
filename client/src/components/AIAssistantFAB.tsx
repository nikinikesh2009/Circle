import { Bot } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

type AIAssistantFABProps = {
  onClick?: () => void;
  className?: string;
};

export function AIAssistantFAB({ onClick, className }: AIAssistantFABProps) {
  return (
    <Button
      size="icon"
      className={cn(
        "fixed bottom-20 lg:bottom-6 right-6 h-14 w-14 rounded-full shadow-lg z-40",
        "bg-gradient-to-br from-primary to-primary/80",
        className
      )}
      onClick={onClick}
      data-testid="button-ai-assistant"
    >
      <Bot className="h-6 w-6" />
    </Button>
  );
}
