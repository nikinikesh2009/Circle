import { useState } from 'react';
import { Link, useLocation } from 'wouter';
import { Home, Calendar, Target, Zap, MessageSquare, Menu, Users, Newspaper, Sword } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

export default function BottomNav() {
  const [location] = useLocation();
  const [showMenu, setShowMenu] = useState(false);

  const mainNavItems = [
    { path: '/dashboard', icon: Home, label: 'Home', testId: 'bottom-nav-home' },
    { path: '/planner', icon: Calendar, label: 'Planner', testId: 'bottom-nav-planner' },
  ];

  const rightNavItems = [
    { path: '/habits', icon: Target, label: 'Habits', testId: 'bottom-nav-habits' },
    { path: '/chat', icon: MessageSquare, label: 'AI Chat', testId: 'bottom-nav-chat' },
  ];

  const menuItems = [
    { path: '/battles', icon: Sword, label: 'Battles', description: 'Head-to-head challenges', testId: 'menu-battles' },
    { path: '/focus', icon: Zap, label: 'Focus Mode', description: 'Stay concentrated', testId: 'menu-focus' },
    { path: '/groups', icon: Users, label: 'Groups', description: 'Connect with communities', testId: 'menu-groups' },
    { path: '/feed', icon: Newspaper, label: 'Feed', description: 'Community updates', testId: 'menu-feed' },
  ];

  const isMenuActive = ['/battles', '/focus', '/groups', '/feed'].includes(location);

  const handleMenuItemClick = (path: string) => {
    setShowMenu(false);
    window.location.href = path;
  };

  return (
    <>
      <nav className="md:hidden fixed bottom-0 left-0 right-0 z-50 bg-card/95 backdrop-blur-lg border-t border-border safe-area-inset-bottom">
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

          <button
            onClick={() => setShowMenu(true)}
            className={`flex flex-col items-center justify-center w-14 h-14 rounded-2xl transition-all transform hover:scale-105 ${
              isMenuActive
                ? 'bg-gradient-to-br from-primary via-secondary to-accent text-primary-foreground shadow-lg shadow-primary/50'
                : 'bg-gradient-to-br from-primary/80 via-secondary/80 to-accent/80 text-primary-foreground shadow-md hover:shadow-lg hover:shadow-primary/30'
            }`}
            data-testid="bottom-nav-menu"
          >
            <Menu className="w-6 h-6" />
            <span className="text-[9px] font-bold mt-0.5">More</span>
          </button>

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

      <Dialog open={showMenu} onOpenChange={setShowMenu}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="text-2xl bg-gradient-to-r from-primary via-secondary to-accent bg-clip-text text-transparent">
              Quick Access
            </DialogTitle>
          </DialogHeader>
          <div className="grid gap-3 py-4">
            {menuItems.map((item) => {
              const Icon = item.icon;
              const isActive = location === item.path;
              
              return (
                <Button
                  key={item.path}
                  variant={isActive ? "default" : "outline"}
                  className={`h-auto py-4 px-4 justify-start ${
                    isActive ? 'bg-gradient-to-r from-primary via-secondary to-accent' : ''
                  }`}
                  onClick={() => handleMenuItemClick(item.path)}
                  data-testid={item.testId}
                >
                  <Icon className="w-5 h-5 mr-3 flex-shrink-0" />
                  <div className="flex flex-col items-start">
                    <span className="font-semibold">{item.label}</span>
                    <span className="text-xs text-muted-foreground">{item.description}</span>
                  </div>
                </Button>
              );
            })}
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
