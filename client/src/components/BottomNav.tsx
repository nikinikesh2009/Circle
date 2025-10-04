import { Link, useLocation } from 'wouter';
import { Home, MessageSquare, Users, Grid3x3, User } from 'lucide-react';

export default function BottomNav() {
  const [location] = useLocation();

  const navItems = [
    { path: '/dashboard', icon: Home, label: 'Home', testId: 'bottom-nav-home' },
    { path: '/feed', icon: MessageSquare, label: 'Feed', testId: 'bottom-nav-feed' },
    { path: '/chat', icon: MessageSquare, label: 'Chat', testId: 'bottom-nav-chat' },
    { path: '/groups', icon: Grid3x3, label: 'Groups', testId: 'bottom-nav-groups' },
    { path: '/profile', icon: User, label: 'Profile', testId: 'bottom-nav-profile' },
  ];

  return (
    <nav className="md:hidden fixed bottom-0 left-0 right-0 z-50 bg-card/95 backdrop-blur-lg border-t border-border safe-area-inset-bottom">
      <div className="flex items-center justify-around h-16 px-2">
        {navItems.map((item) => {
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
  );
}
