import { Switch, Route, Redirect } from "wouter";
import { queryClient } from "@/services/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { ThemeProvider } from "@/services/theme-provider";
import { AuthProvider, useAuth } from "@/features/auth/auth-context";
import { AdminAuthProvider, useAdminAuth } from "@/features/admin/hooks/useAdminAuth";
import { Layout } from "@/layout/Layout";

import NotFound from "@/pages/not-found";
import Login from "@/features/auth/pages/Login";
import Signup from "@/features/auth/pages/Signup";
import Home from "@/features/circles/pages/Home";
import Explore from "@/features/circles/pages/Explore";
import Chat from "@/features/chat/pages/Chat";
import DirectMessages from "@/features/chat/pages/DirectMessages";
import DMChat from "@/features/chat/pages/DMChat";
import Support from "@/pages/Support";
import AIAssistant from "@/features/ai/pages/AIAssistant";
import Profile from "@/features/profile/pages/Profile";
import UserProfile from "@/features/profile/pages/UserProfile";

import AdminLoginStep1 from "@/features/admin/pages/LoginStep1";
import AdminLoginStep2 from "@/features/admin/pages/LoginStep2";
import AdminLoginStep3 from "@/features/admin/pages/LoginStep3";
import DashboardOverview from "@/features/admin/pages/DashboardOverview";
import UsersPanel from "@/features/admin/pages/UsersPanel";
import CirclesPanel from "@/features/admin/pages/CirclesPanel";
import AIPanel from "@/features/admin/pages/AIPanel";
import SettingsPanel from "@/features/admin/pages/SettingsPanel";
import LogsPanel from "@/features/admin/pages/LogsPanel";

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

function ProtectedAdminRoute({ component: Component }: { component: React.ComponentType }) {
  const { isAuthenticated } = useAdminAuth();

  if (!isAuthenticated) {
    return <Redirect to="/admin/login/step1" />;
  }

  return <Component />;
}

function Router() {
  return (
    <Switch>
      <Route path="/login" component={Login} />
      <Route path="/signup" component={Signup} />
      
      {/* Admin Routes */}
      <Route path="/admin/login/step1" component={AdminLoginStep1} />
      <Route path="/admin/login/step2" component={AdminLoginStep2} />
      <Route path="/admin/login/step3" component={AdminLoginStep3} />
      <Route path="/admin/dashboard">{() => <ProtectedAdminRoute component={DashboardOverview} />}</Route>
      <Route path="/admin/users">{() => <ProtectedAdminRoute component={UsersPanel} />}</Route>
      <Route path="/admin/circles">{() => <ProtectedAdminRoute component={CirclesPanel} />}</Route>
      <Route path="/admin/ai">{() => <ProtectedAdminRoute component={AIPanel} />}</Route>
      <Route path="/admin/settings">{() => <ProtectedAdminRoute component={SettingsPanel} />}</Route>
      <Route path="/admin/logs">{() => <ProtectedAdminRoute component={LogsPanel} />}</Route>
      
      {/* User Routes */}
      <Route path="/">{() => <ProtectedRouteWithLayout component={Home} />}</Route>
      <Route path="/explore">{() => <ProtectedRouteWithLayout component={Explore} />}</Route>
      <Route path="/chat">{() => <ProtectedRouteWithLayout component={Chat} />}</Route>
      <Route path="/chat/:circleId">{() => <ProtectedRouteWithLayout component={Chat} />}</Route>
      <Route path="/dm">{() => <ProtectedRouteWithLayout component={DirectMessages} />}</Route>
      <Route path="/dm/:conversationId">{() => <ProtectedRouteWithLayout component={DMChat} />}</Route>
      <Route path="/support">{() => <ProtectedRouteWithLayout component={Support} />}</Route>
      <Route path="/ai">{() => <ProtectedRouteWithLayout component={AIAssistant} />}</Route>
      <Route path="/profile">{() => <ProtectedRouteWithLayout component={Profile} />}</Route>
      <Route path="/user/:userId">{() => <ProtectedRouteWithLayout component={UserProfile} />}</Route>
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
          <AdminAuthProvider>
            <TooltipProvider>
              <AppContent />
              <Toaster />
            </TooltipProvider>
          </AdminAuthProvider>
        </AuthProvider>
      </ThemeProvider>
    </QueryClientProvider>
  );
}

export default App;
