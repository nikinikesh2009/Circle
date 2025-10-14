import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { AdminLayout } from "../components/AdminLayout";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Settings } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/services/queryClient";

export default function SettingsPanel() {
  const [announcement, setAnnouncement] = useState("");
  const { toast } = useToast();

  const { data: settings = [] } = useQuery<any[]>({
    queryKey: ["/api/admin/settings"],
  });

  const updateSettingMutation = useMutation({
    mutationFn: async ({ key, value }: { key: string; value: string }) => {
      const response = await apiRequest("PUT", "/api/admin/settings", { key, value });
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/settings"] });
      toast({ title: "Setting updated successfully" });
    },
  });

  const getSetting = (key: string) => {
    return settings.find((s) => s.key === key)?.value === "true";
  };

  const toggleSetting = (key: string, currentValue: boolean) => {
    updateSettingMutation.mutate({ key, value: (!currentValue).toString() });
  };

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold">Settings</h1>
          <p className="text-muted-foreground">Platform configuration</p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Settings className="h-5 w-5" />
              Feature Toggles
            </CardTitle>
            <CardDescription>Enable or disable platform features</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <Label htmlFor="dm-toggle">Direct Messaging</Label>
              <Switch
                id="dm-toggle"
                checked={getSetting("dm_enabled")}
                onCheckedChange={() => toggleSetting("dm_enabled", getSetting("dm_enabled"))}
                data-testid="switch-dm"
              />
            </div>
            <div className="flex items-center justify-between">
              <Label htmlFor="explore-toggle">Explore Page</Label>
              <Switch
                id="explore-toggle"
                checked={getSetting("explore_enabled")}
                onCheckedChange={() => toggleSetting("explore_enabled", getSetting("explore_enabled"))}
                data-testid="switch-explore"
              />
            </div>
            <div className="flex items-center justify-between">
              <Label htmlFor="circle-creation-toggle">Circle Creation</Label>
              <Switch
                id="circle-creation-toggle"
                checked={getSetting("circle_creation_enabled")}
                onCheckedChange={() => toggleSetting("circle_creation_enabled", getSetting("circle_creation_enabled"))}
                data-testid="switch-circle-creation"
              />
            </div>
            <div className="flex items-center justify-between">
              <Label htmlFor="ai-toggle">AI Assistant</Label>
              <Switch
                id="ai-toggle"
                checked={getSetting("ai_enabled")}
                onCheckedChange={() => toggleSetting("ai_enabled", getSetting("ai_enabled"))}
                data-testid="switch-ai"
              />
            </div>
            <div className="flex items-center justify-between">
              <Label htmlFor="maintenance-toggle">Maintenance Mode</Label>
              <Switch
                id="maintenance-toggle"
                checked={getSetting("maintenance_mode")}
                onCheckedChange={() => toggleSetting("maintenance_mode", getSetting("maintenance_mode"))}
                data-testid="switch-maintenance"
              />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Global Announcement</CardTitle>
            <CardDescription>Display a banner message to all users</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <Input
              placeholder="Enter announcement message"
              value={announcement}
              onChange={(e) => setAnnouncement(e.target.value)}
              data-testid="input-announcement"
            />
            <Button
              onClick={() => {
                updateSettingMutation.mutate({ key: "announcement", value: announcement });
                setAnnouncement("");
              }}
              disabled={!announcement || updateSettingMutation.isPending}
              data-testid="button-save-announcement"
            >
              Save Announcement
            </Button>
          </CardContent>
        </Card>
      </div>
    </AdminLayout>
  );
}
