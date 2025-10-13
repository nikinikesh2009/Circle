import { Switch, Route, Redirect } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { ThemeProvider } from "@/lib/theme-provider";
import { AuthProvider, useAuth } from "@/lib/auth-context";
import { Layout } from "@/components/Layout";

import NotFound from "@/pages/not-found";
import Login from "@/pages/Login";
import Signup from "@/pages/Signup";
import Home from "@/pages/Home";
import Explore from "@/pages/Explore";
import Chat from "@/pages/Chat";
import Support from "@/pages/Support";
import AIAssistant from "@/pages/AIAssistant";
import Profile from "@/pages/Profile";

function ProtectedRouteWithLayout({ component: Component }: { component: React.ComponentType }) {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="text-center">
          <div className="h-12 w-12 rounded-full bg-primary flex items-center justify-center mx-auto mb-4 animate-pulse">
            <span className="text-primary-foreground font-bold text-2xl">C</span>
          </div>
          <p className="text-muted-foreground">Loading...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return <Redirect to="/login" />;
  }

  return (
    <Layout>
      <Component />
    </Layout>
  );
}

function Router() {
  return (
    <Switch>
      <Route path="/login" component={Login} />
      <Route path="/signup" component={Signup} />
      <Route path="/">{() => <ProtectedRouteWithLayout component={Home} />}</Route>
      <Route path="/explore">{() => <ProtectedRouteWithLayout component={Explore} />}</Route>
      <Route path="/chat">{() => <ProtectedRouteWithLayout component={Chat} />}</Route>
      <Route path="/chat/:circleId">{() => <ProtectedRouteWithLayout component={Chat} />}</Route>
      <Route path="/support">{() => <ProtectedRouteWithLayout component={Support} />}</Route>
      <Route path="/ai">{() => <ProtectedRouteWithLayout component={AIAssistant} />}</Route>
      <Route path="/profile">{() => <ProtectedRouteWithLayout component={Profile} />}</Route>
      <Route component={NotFound} />
    </Switch>
  );
}

function AppContent() {
  return <Router />;
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <ThemeProvider defaultTheme="dark">
        <AuthProvider>
          <TooltipProvider>
            <AppContent />
            <Toaster />
          </TooltipProvider>
        </AuthProvider>
      </ThemeProvider>
    </QueryClientProvider>
  );
}

export default App;
