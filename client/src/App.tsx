import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { AuthProvider } from "@/contexts/AuthContext";
import { useAuth } from "@/hooks/useAuth";
import ProtectedRoute from "@/components/ProtectedRoute";
import Landing from "@/pages/landing";
import Login from "@/pages/login";
import Register from "@/pages/register";
import Dashboard from "@/pages/dashboard";
import Profile from "@/pages/profile";
import Community from "@/pages/community";
import Feed from "@/pages/feed";
import Groups from "@/pages/groups";
import GroupDetail from "@/pages/group-detail";
import Chat from "@/pages/chat";
import Planner from "@/pages/planner";
import Habits from "@/pages/habits";
import Focus from "@/pages/focus";
import Settings from "@/pages/settings";
import NotFound from "@/pages/not-found";
import BottomNav from "@/components/BottomNav";
import { Link, useLocation } from 'wouter';
import { User, Settings as SettingsIcon } from 'lucide-react';

function Navigation() {
  const { currentUser, logout } = useAuth();
  const [location] = useLocation();

  if (!currentUser) return null;

  const handleLogout = async () => {
    await logout();
  };

  const navLinks = [
    { path: '/dashboard', label: 'Home', testId: 'nav-home' },
    { path: '/planner', label: 'Planner', testId: 'nav-planner' },
    { path: '/habits', label: 'Habits', testId: 'nav-habits' },
    { path: '/focus', label: 'Focus', testId: 'nav-focus' },
    { path: '/chat', label: 'AI Chat', testId: 'nav-chat' },
    { path: '/feed', label: 'Feed', testId: 'nav-feed' },
    { path: '/groups', label: 'Groups', testId: 'nav-groups' },
    { path: '/community', label: 'Community', testId: 'nav-community' },
  ];

  return (
    <>
      <nav className="border-b border-border bg-card/50 backdrop-blur-lg sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center space-x-8">
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 rounded-full bg-gradient-to-br from-primary to-secondary flex items-center justify-center">
                  <svg className="w-6 h-6 text-primary-foreground" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <circle cx="12" cy="12" r="10" strokeWidth="2"/>
                  </svg>
                </div>
                <span className="text-xl font-bold bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent">The Circle</span>
              </div>
              <div className="hidden md:flex space-x-1">
                {navLinks.map((link) => (
                  <Link key={link.path} href={link.path}>
                    <button 
                      className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors hover:bg-muted ${
                        location === link.path 
                          ? 'bg-muted text-foreground' 
                          : 'text-muted-foreground'
                      }`}
                      data-testid={link.testId}
                    >
                      {link.label}
                    </button>
                  </Link>
                ))}
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Link href="/profile">
                <button 
                  className={`p-2 rounded-lg transition-colors hover:bg-muted ${
                    location === '/profile' ? 'text-primary bg-muted' : 'text-muted-foreground'
                  }`}
                  aria-label="Profile"
                  data-testid="button-profile"
                >
                  <User className="w-5 h-5" />
                </button>
              </Link>
              <Link href="/settings">
                <button 
                  className={`p-2 rounded-lg transition-colors hover:bg-muted ${
                    location === '/settings' ? 'text-primary bg-muted' : 'text-muted-foreground'
                  }`}
                  aria-label="Settings"
                  data-testid="button-settings"
                >
                  <SettingsIcon className="w-5 h-5" />
                </button>
              </Link>
              <button 
                onClick={handleLogout}
                className="hidden md:block px-4 py-2 text-sm font-medium text-muted-foreground hover:text-foreground transition-colors"
                data-testid="button-logout"
              >
                Logout
              </button>
            </div>
          </div>
        </div>
      </nav>
    </>
  );
}

function AppContent() {
  const { currentUser } = useAuth();
  const [location] = useLocation();
  const showBottomNav = currentUser && !['/login', '/register', '/'].includes(location);

  return (
    <>
      <Navigation />
      <div className={showBottomNav ? 'pb-20 md:pb-0' : ''}>
        <Switch>
          <Route path="/" component={Landing} />
          <Route path="/login" component={Login} />
          <Route path="/register" component={Register} />
          <Route path="/dashboard">
            <ProtectedRoute>
              <Dashboard />
            </ProtectedRoute>
          </Route>
          <Route path="/chat">
            <ProtectedRoute>
              <Chat />
            </ProtectedRoute>
          </Route>
          <Route path="/feed">
            <ProtectedRoute>
              <Feed />
            </ProtectedRoute>
          </Route>
          <Route path="/profile">
            <ProtectedRoute>
              <Profile />
            </ProtectedRoute>
          </Route>
          <Route path="/community">
            <ProtectedRoute>
              <Community />
            </ProtectedRoute>
          </Route>
          <Route path="/groups/:id">
            <ProtectedRoute>
              <GroupDetail />
            </ProtectedRoute>
          </Route>
          <Route path="/groups">
            <ProtectedRoute>
              <Groups />
            </ProtectedRoute>
          </Route>
          <Route path="/planner">
            <ProtectedRoute>
              <Planner />
            </ProtectedRoute>
          </Route>
          <Route path="/habits">
            <ProtectedRoute>
              <Habits />
            </ProtectedRoute>
          </Route>
          <Route path="/focus">
            <ProtectedRoute>
              <Focus />
            </ProtectedRoute>
          </Route>
          <Route path="/settings">
            <ProtectedRoute>
              <Settings />
            </ProtectedRoute>
          </Route>
          <Route component={NotFound} />
        </Switch>
      </div>
      {showBottomNav && <BottomNav />}
    </>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <TooltipProvider>
          <Toaster />
          <AppContent />
        </TooltipProvider>
      </AuthProvider>
    </QueryClientProvider>
  );
}

export default App;
