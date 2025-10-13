import { Home, Compass, MessageCircle, User } from "lucide-react";
import { cn } from "@/lib/utils";
import { Link, useLocation } from "wouter";

export function BottomNav() {
  const [location] = useLocation();

  const navItems = [
    { icon: Home, label: "Home", path: "/", testId: "nav-home" },
    { icon: Compass, label: "Discover", path: "/discover", testId: "nav-discover" },
    { icon: MessageCircle, label: "Chat", path: "/chat", testId: "nav-chat" },
    { icon: User, label: "Profile", path: "/profile", testId: "nav-profile" },
  ];

  return (
    <nav className="lg:hidden fixed bottom-0 left-0 right-0 z-50 bg-card border-t border-card-border safe-area-inset-bottom">
      <div className="flex items-center justify-around h-16">
        {navItems.map(({ icon: Icon, label, path, testId }) => {
          const isActive = location === path;
          return (
            <Link key={path} href={path}>
              <button
                className={cn(
                  "flex flex-col items-center justify-center gap-1 px-4 py-2 rounded-lg transition-colors hover-elevate active-elevate-2",
                  isActive && "text-primary"
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
