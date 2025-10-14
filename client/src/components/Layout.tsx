import { ReactNode } from "react";
import { useLocation } from "wouter";
import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/app-sidebar";
import { BottomNav } from "@/components/BottomNav";
import { AIAssistantFAB } from "@/components/AIAssistantFAB";
import { ThemeToggle } from "@/components/ThemeToggle";
import { NotificationBell } from "@/components/NotificationBell";
import { ContentContainer } from "@/components/ContentContainer";

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
    <SidebarProvider style={style as React.CSSProperties}>
      <div className="flex h-screen w-full">
        {!isFullScreenChat && <AppSidebar />}
        <div className="flex flex-col flex-1 overflow-hidden">
          {/* Mobile Header - Hidden in full-screen chat */}
          {!isFullScreenChat && (
            <header className="flex items-center justify-between w-full border-b border-border lg:hidden">
              <ContentContainer className="py-2">
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
              </ContentContainer>
            </header>
          )}
          
          {/* Desktop Header - Hidden in full-screen chat */}
          {!isFullScreenChat && (
            <header className="hidden lg:flex items-center justify-between w-full border-b border-border">
              <ContentContainer className="py-2">
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
              </ContentContainer>
            </header>
          )}
          
          <main className={`flex-1 overflow-auto w-full ${!isFullScreenChat ? 'pb-16 lg:pb-0' : ''}`}>
            {children}
          </main>
        </div>
      </div>
      {!isFullScreenChat && <BottomNav />}
      {!isFullScreenChat && <AIAssistantFAB onClick={() => navigate("/ai")} />}
    </SidebarProvider>
  );
}
