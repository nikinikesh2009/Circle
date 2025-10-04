import { useState } from "react";
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
import NotFound from "@/pages/not-found";
import { Link, useLocation } from 'wouter';
import { Menu, X } from 'lucide-react';

function Navigation() {
  const { currentUser, logout } = useAuth();
  const [location] = useLocation();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  if (!currentUser) return null;

  const handleLogout = async () => {
    await logout();
    setIsMobileMenuOpen(false);
  };

  const navLinks = [
    { path: '/dashboard', label: 'Home', testId: 'nav-home' },
    { path: '/feed', label: 'Feed', testId: 'nav-feed' },
    { path: '/groups', label: 'Groups', testId: 'nav-groups' },
    { path: '/community', label: 'Community', testId: 'nav-community' },
    { path: '/profile', label: 'Profile', testId: 'nav-profile' },
  ];

  const handleLinkClick = () => {
    setIsMobileMenuOpen(false);
  };

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
              <button 
                onClick={handleLogout}
                className="hidden md:block px-4 py-2 text-sm font-medium text-muted-foreground hover:text-foreground transition-colors"
                data-testid="button-logout"
              >
                Logout
              </button>
              <button
                onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
                className="md:hidden p-2 rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
                aria-label={isMobileMenuOpen ? "Close menu" : "Open menu"}
                aria-expanded={isMobileMenuOpen}
                data-testid="button-hamburger"
              >
                {isMobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
              </button>
            </div>
          </div>
        </div>
      </nav>

      {isMobileMenuOpen && (
        <div 
          className="fixed inset-0 bg-background/80 backdrop-blur-sm z-40 md:hidden"
          onClick={() => setIsMobileMenuOpen(false)}
          aria-hidden="true"
          data-testid="mobile-menu-backdrop"
        >
          <div 
            className="fixed top-16 right-0 h-[calc(100vh-4rem)] w-64 bg-card border-l border-border transform transition-transform duration-300 ease-in-out translate-x-0"
            onClick={(e) => e.stopPropagation()}
            aria-label="Mobile navigation menu"
            data-testid="mobile-menu"
          >
            <div className="flex flex-col p-4 space-y-2">
              {navLinks.map((link) => (
                <Link key={link.path} href={link.path}>
                  <button 
                    onClick={handleLinkClick}
                    className={`w-full text-left px-4 py-3 rounded-lg text-sm font-medium transition-colors hover:bg-muted ${
                      location === link.path 
                        ? 'bg-muted text-foreground' 
                        : 'text-muted-foreground'
                    }`}
                    data-testid={`mobile-${link.testId}`}
                  >
                    {link.label}
                  </button>
                </Link>
              ))}
              <div className="pt-2 mt-2 border-t border-border">
                <button 
                  onClick={handleLogout}
                  className="w-full text-left px-4 py-3 rounded-lg text-sm font-medium text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
                  data-testid="mobile-button-logout"
                >
                  Logout
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

function AppContent() {
  return (
    <>
      <Navigation />
      <Switch>
        <Route path="/" component={Landing} />
        <Route path="/login" component={Login} />
        <Route path="/register" component={Register} />
        <Route path="/dashboard">
          <ProtectedRoute>
            <Dashboard />
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
        <Route component={NotFound} />
      </Switch>
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
