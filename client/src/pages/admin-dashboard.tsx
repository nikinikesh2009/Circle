import { useState, useEffect } from "react";
import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from "@/hooks/use-toast";
import {
  Shield,
  Users,
  UserCog,
  FileText,
  LogOut,
  Plus,
  Ban,
  Eye,
  EyeOff
} from "lucide-react";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { adminApiRequest } from "@/lib/adminApiRequest";

interface Admin {
  id: string;
  email: string;
  role: string;
  isActive: boolean;
  lastLogin: string | null;
  createdAt: string;
}

interface AuditLog {
  id: number;
  adminId: string | null;
  action: string;
  resourceType: string;
  resourceId: string | null;
  details: any;
  ipAddress: string | null;
  userAgent: string | null;
  createdAt: string;
}

export default function AdminDashboard() {
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const [admin, setAdmin] = useState<any>(null);
  const [admins, setAdmins] = useState<Admin[]>([]);
  const [auditLogs, setAuditLogs] = useState<AuditLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [newAdminEmail, setNewAdminEmail] = useState("");
  const [newAdminPassword, setNewAdminPassword] = useState("");
  const [showNewPassword, setShowNewPassword] = useState(false);

  useEffect(() => {
    // Check admin auth
    const adminAuth = localStorage.getItem("adminAuth");
    if (!adminAuth) {
      setLocation("/admin/login");
      return;
    }

    setAdmin(JSON.parse(adminAuth));
    loadData();
  }, [setLocation]);

  const loadData = async () => {
    try {
      setLoading(true);

      // Load admins
      const adminsRes = await adminApiRequest("GET", "/api/admin/list");
      if (adminsRes.ok) {
        const adminsData = await adminsRes.json();
        setAdmins(adminsData);
      }

      // Load audit logs
      const logsRes = await adminApiRequest("GET", "/api/admin/audit-logs");
      if (logsRes.ok) {
        const logsData = await logsRes.json();
        setAuditLogs(logsData);
      }
    } catch (error) {
      console.error("Failed to load data:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem("adminAuth");
    localStorage.removeItem("adminToken");
    setLocation("/admin/login");
    toast({
      title: "Logged Out",
      description: "You have been logged out of the admin dashboard.",
    });
  };

  const handleCreateAdmin = async () => {
    if (!newAdminEmail || !newAdminPassword) {
      toast({
        title: "Missing Information",
        description: "Please enter both email and password.",
        variant: "destructive",
      });
      return;
    }

    if (newAdminPassword.length !== 32) {
      toast({
        title: "Invalid Password",
        description: "Password must be exactly 32 characters.",
        variant: "destructive",
      });
      return;
    }

    try {
      const response = await adminApiRequest("POST", "/api/admin/create", {
        email: newAdminEmail,
        password: newAdminPassword,
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to create admin");
      }

      toast({
        title: "Admin Created",
        description: `Successfully created admin account for ${newAdminEmail}`,
      });

      setShowCreateDialog(false);
      setNewAdminEmail("");
      setNewAdminPassword("");
      loadData();
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to create admin",
        variant: "destructive",
      });
    }
  };

  const handleDeactivateAdmin = async (adminId: string, email: string) => {
    if (!confirm(`Are you sure you want to deactivate ${email}?`)) {
      return;
    }

    try {
      const response = await adminApiRequest("POST", `/api/admin/deactivate/${adminId}`);

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || "Failed to deactivate admin");
      }

      toast({
        title: "Admin Deactivated",
        description: `Successfully deactivated ${email}`,
      });

      loadData();
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to deactivate admin",
        variant: "destructive",
      });
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-900 flex items-center justify-center">
        <div className="text-white text-xl">Loading admin dashboard...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-900 text-white">
      <div className="border-b border-slate-700 bg-slate-800/50 backdrop-blur">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center space-x-3">
              <Shield className="h-6 w-6 text-purple-400" />
              <div>
                <h1 className="text-xl font-bold">Admin Dashboard</h1>
                <p className="text-sm text-slate-400">{admin?.email}</p>
              </div>
            </div>
            <Button
              variant="outline"
              onClick={handleLogout}
              className="border-slate-600 text-slate-300 hover:bg-slate-700"
              data-testid="button-admin-logout"
            >
              <LogOut className="h-4 w-4 mr-2" />
              Logout
            </Button>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <Tabs defaultValue="admins" className="space-y-6">
          <TabsList className="bg-slate-800 border-slate-700">
            <TabsTrigger value="admins" data-testid="tab-admins">
              <UserCog className="h-4 w-4 mr-2" />
              Admins
            </TabsTrigger>
            <TabsTrigger value="users" data-testid="tab-users">
              <Users className="h-4 w-4 mr-2" />
              Users
            </TabsTrigger>
            <TabsTrigger value="audit" data-testid="tab-audit">
              <FileText className="h-4 w-4 mr-2" />
              Audit Logs
            </TabsTrigger>
          </TabsList>

          <TabsContent value="admins" className="space-y-4">
            <div className="flex justify-between items-center">
              <h2 className="text-2xl font-bold">Admin Management</h2>
              <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
                <DialogTrigger asChild>
                  <Button className="bg-purple-600 hover:bg-purple-700" data-testid="button-create-admin">
                    <Plus className="h-4 w-4 mr-2" />
                    Create Admin
                  </Button>
                </DialogTrigger>
                <DialogContent className="bg-slate-800 border-slate-700 text-white">
                  <DialogHeader>
                    <DialogTitle>Create New Admin</DialogTitle>
                    <DialogDescription className="text-slate-400">
                      Create a new administrator account with 32-digit password
                    </DialogDescription>
                  </DialogHeader>
                  <div className="space-y-4">
                    <div className="space-y-2">
                      <label className="text-sm font-medium">Email</label>
                      <Input
                        type="email"
                        value={newAdminEmail}
                        onChange={(e) => setNewAdminEmail(e.target.value)}
                        className="bg-slate-700 border-slate-600"
                        data-testid="input-new-admin-email"
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="text-sm font-medium">32-Digit Password</label>
                      <div className="relative">
                        <Input
                          type={showNewPassword ? "text" : "password"}
                          value={newAdminPassword}
                          onChange={(e) => setNewAdminPassword(e.target.value)}
                          className="bg-slate-700 border-slate-600 pr-10"
                          maxLength={32}
                          data-testid="input-new-admin-password"
                        />
                        <button
                          type="button"
                          onClick={() => setShowNewPassword(!showNewPassword)}
                          className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400"
                        >
                          {showNewPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                        </button>
                      </div>
                      <p className="text-xs text-slate-400">
                        Length: {newAdminPassword.length}/32 characters
                      </p>
                    </div>
                    <Button
                      onClick={handleCreateAdmin}
                      className="w-full bg-purple-600 hover:bg-purple-700"
                      data-testid="button-submit-create-admin"
                    >
                      Create Admin
                    </Button>
                  </div>
                </DialogContent>
              </Dialog>
            </div>

            <div className="grid gap-4">
              {admins.map((adminItem) => (
                <Card key={adminItem.id} className="bg-slate-800/50 border-slate-700" data-testid={`admin-card-${adminItem.id}`}>
                  <CardHeader>
                    <div className="flex justify-between items-start">
                      <div>
                        <CardTitle className="text-white">{adminItem.email}</CardTitle>
                        <CardDescription className="text-slate-400">
                          Role: {adminItem.role} • {adminItem.isActive ? "Active" : "Inactive"}
                        </CardDescription>
                      </div>
                      {adminItem.id !== admin?.id && adminItem.isActive && (
                        <Button
                          variant="destructive"
                          size="sm"
                          onClick={() => handleDeactivateAdmin(adminItem.id, adminItem.email)}
                          data-testid={`button-deactivate-${adminItem.id}`}
                        >
                          <Ban className="h-4 w-4 mr-2" />
                          Deactivate
                        </Button>
                      )}
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="text-sm text-slate-400 space-y-1">
                      <p>Created: {new Date(adminItem.createdAt).toLocaleString()}</p>
                      <p>Last Login: {adminItem.lastLogin ? new Date(adminItem.lastLogin).toLocaleString() : "Never"}</p>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </TabsContent>

          <TabsContent value="users" className="space-y-4">
            <h2 className="text-2xl font-bold">User Management</h2>
            <Card className="bg-slate-800/50 border-slate-700">
              <CardContent className="pt-6">
                <p className="text-slate-400">
                  User management features would integrate with Firebase Admin SDK to list, suspend, and manage user accounts.
                </p>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="audit" className="space-y-4">
            <h2 className="text-2xl font-bold">Audit Logs</h2>
            <div className="space-y-2">
              {auditLogs.slice(0, 50).map((log) => (
                <Card key={log.id} className="bg-slate-800/50 border-slate-700" data-testid={`audit-log-${log.id}`}>
                  <CardContent className="pt-6">
                    <div className="flex justify-between items-start">
                      <div className="space-y-1">
                        <p className="font-medium text-white">{log.action}</p>
                        <p className="text-sm text-slate-400">
                          {log.resourceType} {log.resourceId && `• ID: ${log.resourceId}`}
                        </p>
                        <p className="text-xs text-slate-500">
                          IP: {log.ipAddress} • {new Date(log.createdAt).toLocaleString()}
                        </p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
