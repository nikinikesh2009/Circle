import { ReactNode } from "react";
import { useLocation } from "wouter";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import {
  LayoutDashboard,
  Users,
  Circle as CircleIcon,
  Bot,
  Settings,
  FileText,
  LogOut,
  Menu,
  Shield
} from "lucide-react";
import { useAdminAuth } from "../hooks/useAdminAuth";

interface AdminLayoutProps {
  children: ReactNode;
}

const navItems = [
  { title: "Dashboard", icon: LayoutDashboard, path: "/admin/dashboard" },
  { title: "Users", icon: Users, path: "/admin/users" },
  { title: "Circles", icon: CircleIcon, path: "/admin/circles" },
  { title: "AI Settings", icon: Bot, path: "/admin/ai" },
  { title: "Settings", icon: Settings, path: "/admin/settings" },
  { title: "Logs", icon: FileText, path: "/admin/logs" },
];

function AdminSidebarContent() {
  const [location, navigate] = useLocation();
  const { logout } = useAdminAuth();

  return (
    <div className="flex flex-col h-full">
      <div className="p-4 border-b border-border">
        <div className="flex items-center gap-2">
          <Shield className="h-6 w-6 text-primary" />
          <div>
            <h2 className="font-bold text-lg">Admin Portal</h2>
            <p className="text-xs text-muted-foreground">Circle Platform</p>
          </div>
        </div>
      </div>

      <nav className="flex-1 p-4 space-y-1">
        {navItems.map((item) => {
          const isActive = location === item.path;
          return (
            <button
              key={item.path}
              onClick={() => navigate(item.path)}
              className={cn(
                "w-full flex items-center gap-3 px-3 py-2 rounded-md text-sm transition-colors",
                isActive
                  ? "bg-primary text-primary-foreground"
                  : "hover:bg-muted text-foreground"
              )}
              data-testid={`nav-${item.path.split('/').pop()}`}
            >
              <item.icon className="h-4 w-4" />
              <span>{item.title}</span>
            </button>
          );
        })}
      </nav>

      <div className="p-4 border-t border-border">
        <Button
          variant="outline"
          className="w-full justify-start"
          onClick={() => {
            logout();
            navigate("/admin/login/step1");
          }}
          data-testid="button-admin-logout"
        >
          <LogOut className="h-4 w-4 mr-2" />
          Logout
        </Button>
      </div>
    </div>
  );
}

export function AdminLayout({ children }: AdminLayoutProps) {
  return (
    <div className="min-h-screen bg-background">
      {/* Desktop Sidebar */}
      <aside className="hidden lg:fixed lg:inset-y-0 lg:flex lg:w-64 lg:flex-col lg:border-r lg:border-border">
        <AdminSidebarContent />
      </aside>

      {/* Mobile Header */}
      <header className="lg:hidden sticky top-0 z-50 w-full border-b border-border bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="flex h-14 items-center px-4 gap-4">
          <Sheet>
            <SheetTrigger asChild>
              <Button variant="ghost" size="icon" data-testid="button-menu">
                <Menu className="h-5 w-5" />
              </Button>
            </SheetTrigger>
            <SheetContent side="left" className="w-64 p-0">
              <AdminSidebarContent />
            </SheetContent>
          </Sheet>
          
          <div className="flex items-center gap-2">
            <Shield className="h-5 w-5 text-primary" />
            <h1 className="font-bold">Admin Portal</h1>
          </div>
        </div>
      </header>

      {/* Main Content - Mobile First Responsive */}
      <main className="lg:pl-64">
        <div className="w-full mx-auto px-4 sm:px-6 lg:px-8 py-6 max-w-7xl">
          {children}
        </div>
      </main>
    </div>
  );
}
