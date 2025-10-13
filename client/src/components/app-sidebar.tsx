import { Home, Compass, MessageCircle, User, HelpCircle, Bot } from "lucide-react";
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarHeader,
  SidebarFooter,
} from "@/components/ui/sidebar";
import { Link, useLocation } from "wouter";
import { UserAvatar } from "./UserAvatar";
import { ThemeToggle } from "./ThemeToggle";

const navItems = [
  { title: "Home", url: "/", icon: Home, testId: "nav-home" },
  { title: "Discover", url: "/discover", icon: Compass, testId: "nav-discover" },
  { title: "Messages", url: "/chat", icon: MessageCircle, testId: "nav-chat" },
  { title: "Profile", url: "/profile", icon: User, testId: "nav-profile" },
];

const supportItems = [
  { title: "AI Assistant", url: "/ai", icon: Bot, testId: "nav-ai" },
  { title: "Help & Support", url: "/support", icon: HelpCircle, testId: "nav-support" },
];

export function AppSidebar() {
  const [location] = useLocation();

  return (
    <Sidebar>
      <SidebarHeader className="border-b border-sidebar-border p-4">
        <div className="flex items-center gap-3">
          <div className="h-8 w-8 rounded-full bg-primary flex items-center justify-center">
            <span className="text-primary-foreground font-bold text-lg">C</span>
          </div>
          <span className="font-bold text-xl">Circle</span>
        </div>
      </SidebarHeader>
      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel>Main</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {navItems.map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton
                    asChild
                    isActive={location === item.url}
                    data-testid={item.testId}
                  >
                    <Link href={item.url}>
                      <item.icon />
                      <span>{item.title}</span>
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
        <SidebarGroup>
          <SidebarGroupLabel>Support</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {supportItems.map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton
                    asChild
                    isActive={location === item.url}
                    data-testid={item.testId}
                  >
                    <Link href={item.url}>
                      <item.icon />
                      <span>{item.title}</span>
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
      <SidebarFooter className="border-t border-sidebar-border p-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <UserAvatar
              fallback="JD"
              alt="John Doe"
              status="online"
              size="sm"
            />
            <div className="flex flex-col">
              <span className="text-sm font-medium">John Doe</span>
              <span className="text-xs text-muted-foreground">@johndoe</span>
            </div>
          </div>
          <ThemeToggle />
        </div>
      </SidebarFooter>
    </Sidebar>
  );
}
