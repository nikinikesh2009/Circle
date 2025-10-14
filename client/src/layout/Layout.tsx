import { ReactNode, type CSSProperties } from "react";
import { useLocation } from "wouter";
import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { AppSidebar } from "@/layout/app-sidebar";
import { BottomNav } from "@/layout/BottomNav";
import { AIAssistantFAB } from "@/layout/AIAssistantFAB";
import { ThemeToggle } from "@/layout/ThemeToggle";
import { NotificationBell } from "@/features/notifications/components/NotificationBell";

interface LayoutProps {
  children: ReactNode;
}

export function Layout({ children }: LayoutProps) {
  const [location, navigate] = useLocation();
  
  // Detect if we're in a chat or DM conversation (full-screen mode)
  const isFullScreenChat = location.startsWith("/chat/") || location.startsWith("/dm/");
  
  const style = {
    "--sidebar-width": "16rem",
    "--sidebar-width-icon": "4rem",
  };

  return (
    <SidebarProvider style={style as CSSProperties} defaultOpen={false}>
      <div className="flex h-screen w-full">
        {!isFullScreenChat && <AppSidebar />}
        <div className="flex flex-col flex-1 overflow-hidden w-full lg:w-auto">
          {/* Mobile Header - Hidden in full-screen chat */}
          {!isFullScreenChat && (
            <header className="w-full border-b border-border lg:hidden">
              <div className="mx-auto w-full max-w-7xl px-4 sm:px-6 lg:px-8 py-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <SidebarTrigger data-testid="button-sidebar-toggle" />
                    <div className="h-8 w-8 rounded-full bg-primary flex items-center justify-center">
                      <span className="text-primary-foreground font-bold text-lg">C</span>
                    </div>
                    <span className="font-bold text-xl">Circle</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <NotificationBell />
                    <ThemeToggle />
                  </div>
                </div>
              </div>
            </header>
          )}
          
          {/* Desktop Header - Hidden in full-screen chat */}
          {!isFullScreenChat && (
            <header className="hidden lg:block w-full border-b border-border">
              <div className="mx-auto w-full max-w-7xl px-4 sm:px-6 lg:px-8 py-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="h-8 w-8 rounded-full bg-primary flex items-center justify-center">
                      <span className="text-primary-foreground font-bold text-lg">C</span>
                    </div>
                    <span className="font-bold text-xl">Circle</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <NotificationBell />
                    <ThemeToggle />
                  </div>
                </div>
              </div>
            </header>
          )}
          
          <main className={`flex-1 overflow-auto w-full ${!isFullScreenChat ? 'pb-16 lg:pb-0' : ''}`}>
            {isFullScreenChat ? (
              children
            ) : (
              <div className="mx-auto w-full max-w-7xl px-4 sm:px-6 lg:px-8 py-6">
                {children}
              </div>
            )}
          </main>
        </div>
      </div>
      {!isFullScreenChat && <BottomNav />}
      {!isFullScreenChat && <AIAssistantFAB onClick={() => navigate("/ai")} />}
    </SidebarProvider>
  );
}
