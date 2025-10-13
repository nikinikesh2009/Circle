import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { ThemeProvider } from "@/lib/theme-provider";
import { AppSidebar } from "@/components/app-sidebar";
import { BottomNav } from "@/components/BottomNav";
import { AIAssistantFAB } from "@/components/AIAssistantFAB";
import { ThemeToggle } from "@/components/ThemeToggle";

import NotFound from "@/pages/not-found";
import Login from "@/pages/Login";
import Signup from "@/pages/Signup";
import Home from "@/pages/Home";
import Chat from "@/pages/Chat";
import Support from "@/pages/Support";
import AIAssistant from "@/pages/AIAssistant";
import Profile from "@/pages/Profile";

function Router() {
  return (
    <Switch>
      <Route path="/login" component={Login} />
      <Route path="/signup" component={Signup} />
      <Route path="/" component={Home} />
      <Route path="/discover" component={Home} />
      <Route path="/chat" component={Chat} />
      <Route path="/support" component={Support} />
      <Route path="/ai" component={AIAssistant} />
      <Route path="/profile" component={Profile} />
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  const style = {
    "--sidebar-width": "16rem",
    "--sidebar-width-icon": "4rem",
  };

  return (
    <QueryClientProvider client={queryClient}>
      <ThemeProvider defaultTheme="dark">
        <TooltipProvider>
          <SidebarProvider style={style as React.CSSProperties}>
            <div className="flex h-screen w-full">
              <AppSidebar />
              <div className="flex flex-col flex-1 overflow-hidden">
                <header className="flex items-center justify-between p-4 border-b border-border lg:hidden">
                  <SidebarTrigger data-testid="button-sidebar-toggle" />
                  <div className="flex items-center gap-3">
                    <div className="h-8 w-8 rounded-full bg-primary flex items-center justify-center">
                      <span className="text-primary-foreground font-bold text-lg">C</span>
                    </div>
                    <span className="font-bold text-xl">Circle</span>
                  </div>
                  <ThemeToggle />
                </header>
                <main className="flex-1 overflow-auto pb-16 lg:pb-0">
                  <Router />
                </main>
              </div>
            </div>
            <BottomNav />
            <AIAssistantFAB onClick={() => window.location.href = "/ai"} />
          </SidebarProvider>
          <Toaster />
        </TooltipProvider>
      </ThemeProvider>
    </QueryClientProvider>
  );
}

export default App;
