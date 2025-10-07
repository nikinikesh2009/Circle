import { useState } from 'react';
import { Link, useLocation } from 'wouter';
import { Home, Calendar, Target, Zap, MessageCircle, Grid, Users, Newspaper, Sword, Sparkles, CheckSquare, UsersRound, User, HelpCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";

export default function BottomNav() {
  const [location] = useLocation();
  const [showMenu, setShowMenu] = useState(false);

  const mainNavItems = [
    { path: '/dashboard', icon: Home, label: 'Home', testId: 'bottom-nav-home' },
    { path: '/planner', icon: Calendar, label: 'Planner', testId: 'bottom-nav-planner' },
  ];

  const rightNavItems = [
    { path: '/habits', icon: Target, label: 'Habits', testId: 'bottom-nav-habits' },
    { path: '/messages', icon: MessageCircle, label: 'Messages', testId: 'bottom-nav-messages' },
  ];

  const allFeatures = [
    { path: '/dashboard', icon: Home, label: 'Dashboard', testId: 'menu-dashboard' },
    { path: '/messages', icon: Sparkles, label: 'AI Chat / Messages', testId: 'menu-ai-chat' },
    { path: '/battles', icon: Sword, label: 'Battles', testId: 'menu-battles' },
    { path: '/community', icon: Users, label: 'Community', testId: 'menu-community' },
    { path: '/planner', icon: Calendar, label: 'Planner', testId: 'menu-planner' },
    { path: '/habits', icon: CheckSquare, label: 'Habits', testId: 'menu-habits' },
    { path: '/groups', icon: UsersRound, label: 'Groups', testId: 'menu-groups' },
    { path: '/profile', icon: User, label: 'Profile', testId: 'menu-profile' },
    { path: '/help', icon: HelpCircle, label: 'Help', testId: 'menu-help' },
  ];

  const menuPaths = allFeatures.map(f => f.path);
  const isMenuActive = menuPaths.includes(location);

  const handleMenuItemClick = (path: string) => {
    setShowMenu(false);
    window.location.href = path;
  };

  return (
    <>
      <nav className="lg:hidden fixed bottom-0 left-0 right-0 z-50 bg-card/95 backdrop-blur-lg border-t border-border safe-area-inset-bottom">
        <div className="flex items-center justify-around h-16 px-2 relative">
          {mainNavItems.map((item) => {
            const Icon = item.icon;
            const isActive = location === item.path;
            
            return (
              <Link key={item.path} href={item.path}>
                <button
                  className={`flex flex-col items-center justify-center w-16 h-12 rounded-lg transition-all ${
                    isActive
                      ? 'text-primary bg-primary/10'
                      : 'text-muted-foreground hover:text-foreground hover:bg-muted'
                  }`}
                  data-testid={item.testId}
                >
                  <Icon className="w-5 h-5 mb-0.5" />
                  <span className="text-[10px] font-medium">{item.label}</span>
                </button>
              </Link>
            );
          })}

          <Popover open={showMenu} onOpenChange={setShowMenu}>
            <PopoverTrigger asChild>
              <button
                className={`flex flex-col items-center justify-center w-14 h-14 rounded-2xl transition-all transform hover:scale-105 ${
                  isMenuActive
                    ? 'bg-gradient-to-br from-primary via-secondary to-accent text-primary-foreground shadow-lg shadow-primary/50'
                    : 'bg-gradient-to-br from-primary/80 via-secondary/80 to-accent/80 text-primary-foreground shadow-md hover:shadow-lg hover:shadow-primary/30'
                }`}
                data-testid="bottom-nav-menu-trigger"
              >
                <Grid className="w-6 h-6" />
                <span className="text-[9px] font-bold mt-0.5">Menu</span>
              </button>
            </PopoverTrigger>
            <PopoverContent 
              className="w-80 mb-2 p-4" 
              align="center" 
              side="top"
              data-testid="popover-menu-content"
            >
              <div className="space-y-1">
                <h3 className="text-lg font-semibold mb-3 bg-gradient-to-r from-primary via-secondary to-accent bg-clip-text text-transparent">
                  All Features
                </h3>
                <div className="grid gap-2">
                  {allFeatures.map((item) => {
                    const Icon = item.icon;
                    const isActive = location === item.path;
                    
                    return (
                      <Button
                        key={item.path}
                        variant={isActive ? "default" : "ghost"}
                        className={`h-auto py-3 px-3 justify-start ${
                          isActive ? 'bg-gradient-to-r from-primary via-secondary to-accent text-primary-foreground' : ''
                        }`}
                        onClick={() => handleMenuItemClick(item.path)}
                        data-testid={item.testId}
                      >
                        <Icon className="w-5 h-5 mr-3 flex-shrink-0" />
                        <span className="font-medium text-sm">{item.label}</span>
                      </Button>
                    );
                  })}
                </div>
              </div>
            </PopoverContent>
          </Popover>

          {rightNavItems.map((item) => {
            const Icon = item.icon;
            const isActive = location === item.path;
            
            return (
              <Link key={item.path} href={item.path}>
                <button
                  className={`flex flex-col items-center justify-center w-16 h-12 rounded-lg transition-all ${
                    isActive
                      ? 'text-primary bg-primary/10'
                      : 'text-muted-foreground hover:text-foreground hover:bg-muted'
                  }`}
                  data-testid={item.testId}
                >
                  <Icon className="w-5 h-5 mb-0.5" />
                  <span className="text-[10px] font-medium">{item.label}</span>
                </button>
              </Link>
            );
          })}
        </div>
      </nav>

    </>
  );
}
