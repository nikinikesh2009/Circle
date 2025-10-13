import { Home, Compass, MessageCircle, MessageSquare, User } from "lucide-react";
import { cn } from "@/lib/utils";
import { Link, useLocation } from "wouter";

export function BottomNav() {
  const [location] = useLocation();

  const navItems = [
    { icon: Home, label: "Home", path: "/", testId: "nav-home" },
    { icon: Compass, label: "Explore", path: "/explore", testId: "nav-explore" },
    { icon: MessageCircle, label: "Chat", path: "/chat", testId: "nav-chat" },
    { icon: MessageSquare, label: "DMs", path: "/dm", testId: "nav-dm" },
    { icon: User, label: "Profile", path: "/profile", testId: "nav-profile" },
  ];

  return (
    <nav className="lg:hidden fixed bottom-0 left-0 right-0 z-50 bg-card border-t border-border safe-area-inset-bottom">
      <div className="flex items-center justify-around h-16">
        {navItems.map(({ icon: Icon, label, path, testId }) => {
          const isActive = location === path || 
            (path === "/chat" && location.startsWith("/chat")) ||
            (path === "/dm" && location.startsWith("/dm"));
          return (
            <Link key={path} href={path}>
              <button
                className={cn(
                  "flex flex-col items-center justify-center gap-1 px-4 py-2 rounded-lg transition-colors hover-elevate active-elevate-2",
                  isActive ? "text-primary" : "text-muted-foreground"
                )}
                data-testid={testId}
              >
                <Icon className="h-5 w-5" />
                <span className="text-xs font-medium">{label}</span>
              </button>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
