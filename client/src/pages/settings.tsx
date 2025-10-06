import { useState, useEffect } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Settings as SettingsIcon, Bell, Brain, Clock, Save, HelpCircle, Info, Shield, ChevronRight, BookOpen, MessageCircle, GitBranch } from 'lucide-react';
import { Link } from 'wouter';
import { type UserPreferences } from '@shared/schema';
import { apiRequest } from '@/lib/queryClient';

export default function Settings() {
  const { currentUser } = useAuth();
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  
  const [preferences, setPreferences] = useState<UserPreferences | null>(null);
  const [formData, setFormData] = useState({
    notificationPreferences: {
      enablePush: true,
      enablePopups: true,
      quietHoursStart: '22:00',
      quietHoursEnd: '07:00',
      motivationFrequency: 'medium' as 'low' | 'medium' | 'high',
    },
    aiPreferences: {
      personalityStyle: 'balanced' as 'supportive' | 'strict' | 'balanced' | 'friendly',
      plannerEnabled: true,
      autoScheduleTasks: true,
      habitNudgesEnabled: true,
      focusModeEnabled: true,
    },
    schedulePreferences: {
      wakeUpTime: '07:00',
      sleepTime: '23:00',
      workStartTime: '09:00',
      workEndTime: '17:00',
      preferredBreakDuration: 15,
      preferredFocusDuration: 25,
    }
  });

  useEffect(() => {
    loadPreferences();
  }, [currentUser]);

  const loadPreferences = async () => {
    if (!currentUser) return;
    setLoading(true);
    try {
      const response = await apiRequest('GET', `/api/preferences?userId=${currentUser.uid}`);
      if (response.ok) {
        const data = await response.json();
        if (data) {
          setPreferences(data);
          setFormData({
            notificationPreferences: data.notificationPreferences,
            aiPreferences: data.aiPreferences,
            schedulePreferences: data.schedulePreferences
          });
        }
      }
    } catch (error) {
      console.error('Failed to load preferences:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    if (!currentUser) return;
    setSaving(true);
    try {
      const response = await apiRequest('POST', '/api/preferences', {
        userId: currentUser.uid,
        ...formData
      });

      if (response.ok) {
        toast({
          title: "Settings saved",
          description: "Your preferences have been updated successfully.",
        });
        await loadPreferences();
      } else {
        throw new Error('Failed to save preferences');
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to save preferences. Please try again.",
        variant: "destructive",
      });
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-background via-background/95 to-muted/20">
      <div className="max-w-4xl mx-auto px-3 py-4">
        <div className="mb-4">
          <div className="flex items-center gap-2 mb-1.5">
            <SettingsIcon className="w-6 h-6 text-primary" />
            <h1 className="text-2xl font-bold bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent">
              Settings
            </h1>
          </div>
          <p className="text-sm text-muted-foreground">Customize your AI discipline platform</p>
        </div>

        <Tabs defaultValue="notifications" className="space-y-4">
          <TabsList className="grid w-full grid-cols-3 h-9">
            <TabsTrigger value="notifications" data-testid="tab-notifications" className="text-xs">
              <Bell className="w-3.5 h-3.5 mr-1.5" />
              Notifications
            </TabsTrigger>
            <TabsTrigger value="ai" data-testid="tab-ai" className="text-xs">
              <Brain className="w-3.5 h-3.5 mr-1.5" />
              AI Settings
            </TabsTrigger>
            <TabsTrigger value="schedule" data-testid="tab-schedule" className="text-xs">
              <Clock className="w-3.5 h-3.5 mr-1.5" />
              Schedule
            </TabsTrigger>
          </TabsList>

          <TabsContent value="notifications" data-testid="content-notifications">
            <Card>
              <CardHeader className="p-4">
                <CardTitle className="text-lg">Notification Preferences</CardTitle>
                <CardDescription className="text-xs">
                  Control how and when you receive notifications
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4 p-4 pt-0">
                <div className="flex items-center justify-between">
                  <div>
                    <Label htmlFor="enablePush" className="text-sm">Push Notifications</Label>
                    <p className="text-xs text-muted-foreground">Receive notifications even when app is closed</p>
                  </div>
                  <Switch
                    id="enablePush"
                    checked={formData.notificationPreferences.enablePush}
                    onCheckedChange={(checked) => setFormData({
                      ...formData,
                      notificationPreferences: { ...formData.notificationPreferences, enablePush: checked }
                    })}
                    data-testid="switch-enablePush"
                  />
                </div>

                <div className="flex items-center justify-between">
                  <div>
                    <Label htmlFor="enablePopups" className="text-sm">In-App Popups</Label>
                    <p className="text-xs text-muted-foreground">Show motivational popups and reminders</p>
                  </div>
                  <Switch
                    id="enablePopups"
                    checked={formData.notificationPreferences.enablePopups}
                    onCheckedChange={(checked) => setFormData({
                      ...formData,
                      notificationPreferences: { ...formData.notificationPreferences, enablePopups: checked }
                    })}
                    data-testid="switch-enablePopups"
                  />
                </div>

                <div className="space-y-1.5">
                  <Label className="text-sm">Quiet Hours</Label>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <Label htmlFor="quietHoursStart" className="text-xs text-muted-foreground">Start</Label>
                      <Input
                        id="quietHoursStart"
                        type="time"
                        value={formData.notificationPreferences.quietHoursStart || ''}
                        onChange={(e) => setFormData({
                          ...formData,
                          notificationPreferences: { ...formData.notificationPreferences, quietHoursStart: e.target.value }
                        })}
                        className="h-8 text-sm"
                        data-testid="input-quietHoursStart"
                      />
                    </div>
                    <div>
                      <Label htmlFor="quietHoursEnd" className="text-xs text-muted-foreground">End</Label>
                      <Input
                        id="quietHoursEnd"
                        type="time"
                        value={formData.notificationPreferences.quietHoursEnd || ''}
                        onChange={(e) => setFormData({
                          ...formData,
                          notificationPreferences: { ...formData.notificationPreferences, quietHoursEnd: e.target.value }
                        })}
                        className="h-8 text-sm"
                        data-testid="input-quietHoursEnd"
                      />
                    </div>
                  </div>
                </div>

                <div className="space-y-1.5">
                  <Label htmlFor="motivationFrequency" className="text-sm">Motivation Message Frequency</Label>
                  <Select
                    value={formData.notificationPreferences.motivationFrequency}
                    onValueChange={(value: 'low' | 'medium' | 'high') => setFormData({
                      ...formData,
                      notificationPreferences: { ...formData.notificationPreferences, motivationFrequency: value }
                    })}
                  >
                    <SelectTrigger id="motivationFrequency" data-testid="select-motivationFrequency">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="low">Low (1-2 per day)</SelectItem>
                      <SelectItem value="medium">Medium (3-4 per day)</SelectItem>
                      <SelectItem value="high">High (5+ per day)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="ai" data-testid="content-ai">
            <Card>
              <CardHeader>
                <CardTitle>AI Behavior</CardTitle>
                <CardDescription>
                  Customize how AI assists you
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="space-y-2">
                  <Label htmlFor="personalityStyle">AI Personality Style</Label>
                  <Select
                    value={formData.aiPreferences.personalityStyle}
                    onValueChange={(value: 'supportive' | 'strict' | 'balanced' | 'friendly') => setFormData({
                      ...formData,
                      aiPreferences: { ...formData.aiPreferences, personalityStyle: value }
                    })}
                  >
                    <SelectTrigger id="personalityStyle" data-testid="select-personalityStyle">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="supportive">Supportive & Encouraging</SelectItem>
                      <SelectItem value="strict">Strict & Disciplined</SelectItem>
                      <SelectItem value="balanced">Balanced</SelectItem>
                      <SelectItem value="friendly">Friendly & Casual</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="flex items-center justify-between">
                  <div>
                    <Label htmlFor="plannerEnabled">AI Daily Planner</Label>
                    <p className="text-sm text-muted-foreground">Let AI generate daily schedules</p>
                  </div>
                  <Switch
                    id="plannerEnabled"
                    checked={formData.aiPreferences.plannerEnabled}
                    onCheckedChange={(checked) => setFormData({
                      ...formData,
                      aiPreferences: { ...formData.aiPreferences, plannerEnabled: checked }
                    })}
                    data-testid="switch-plannerEnabled"
                  />
                </div>

                <div className="flex items-center justify-between">
                  <div>
                    <Label htmlFor="autoScheduleTasks">Auto-Schedule Tasks</Label>
                    <p className="text-sm text-muted-foreground">Automatically optimize task timing</p>
                  </div>
                  <Switch
                    id="autoScheduleTasks"
                    checked={formData.aiPreferences.autoScheduleTasks}
                    onCheckedChange={(checked) => setFormData({
                      ...formData,
                      aiPreferences: { ...formData.aiPreferences, autoScheduleTasks: checked }
                    })}
                    data-testid="switch-autoScheduleTasks"
                  />
                </div>

                <div className="flex items-center justify-between">
                  <div>
                    <Label htmlFor="habitNudgesEnabled">AI Habit Nudges</Label>
                    <p className="text-sm text-muted-foreground">Receive AI reminders for habits</p>
                  </div>
                  <Switch
                    id="habitNudgesEnabled"
                    checked={formData.aiPreferences.habitNudgesEnabled}
                    onCheckedChange={(checked) => setFormData({
                      ...formData,
                      aiPreferences: { ...formData.aiPreferences, habitNudgesEnabled: checked }
                    })}
                    data-testid="switch-habitNudgesEnabled"
                  />
                </div>

                <div className="flex items-center justify-between">
                  <div>
                    <Label htmlFor="focusModeEnabled">Focus Mode</Label>
                    <p className="text-sm text-muted-foreground">Enable AI-powered focus sessions</p>
                  </div>
                  <Switch
                    id="focusModeEnabled"
                    checked={formData.aiPreferences.focusModeEnabled}
                    onCheckedChange={(checked) => setFormData({
                      ...formData,
                      aiPreferences: { ...formData.aiPreferences, focusModeEnabled: checked }
                    })}
                    data-testid="switch-focusModeEnabled"
                  />
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="schedule" data-testid="content-schedule">
            <Card>
              <CardHeader>
                <CardTitle>Schedule Preferences</CardTitle>
                <CardDescription>
                  Set your daily routine for AI schedule generation
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="wakeUpTime">Wake Up Time</Label>
                    <Input
                      id="wakeUpTime"
                      type="time"
                      value={formData.schedulePreferences.wakeUpTime}
                      onChange={(e) => setFormData({
                        ...formData,
                        schedulePreferences: { ...formData.schedulePreferences, wakeUpTime: e.target.value }
                      })}
                      data-testid="input-wakeUpTime"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="sleepTime">Sleep Time</Label>
                    <Input
                      id="sleepTime"
                      type="time"
                      value={formData.schedulePreferences.sleepTime}
                      onChange={(e) => setFormData({
                        ...formData,
                        schedulePreferences: { ...formData.schedulePreferences, sleepTime: e.target.value }
                      })}
                      data-testid="input-sleepTime"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="workStartTime">Work Start Time</Label>
                    <Input
                      id="workStartTime"
                      type="time"
                      value={formData.schedulePreferences.workStartTime}
                      onChange={(e) => setFormData({
                        ...formData,
                        schedulePreferences: { ...formData.schedulePreferences, workStartTime: e.target.value }
                      })}
                      data-testid="input-workStartTime"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="workEndTime">Work End Time</Label>
                    <Input
                      id="workEndTime"
                      type="time"
                      value={formData.schedulePreferences.workEndTime}
                      onChange={(e) => setFormData({
                        ...formData,
                        schedulePreferences: { ...formData.schedulePreferences, workEndTime: e.target.value }
                      })}
                      data-testid="input-workEndTime"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="preferredBreakDuration">Break Duration (minutes)</Label>
                    <Input
                      id="preferredBreakDuration"
                      type="number"
                      min="5"
                      max="60"
                      value={formData.schedulePreferences.preferredBreakDuration}
                      onChange={(e) => setFormData({
                        ...formData,
                        schedulePreferences: { ...formData.schedulePreferences, preferredBreakDuration: parseInt(e.target.value) }
                      })}
                      data-testid="input-preferredBreakDuration"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="preferredFocusDuration">Focus Duration (minutes)</Label>
                    <Input
                      id="preferredFocusDuration"
                      type="number"
                      min="15"
                      max="120"
                      value={formData.schedulePreferences.preferredFocusDuration}
                      onChange={(e) => setFormData({
                        ...formData,
                        schedulePreferences: { ...formData.schedulePreferences, preferredFocusDuration: parseInt(e.target.value) }
                      })}
                      data-testid="input-preferredFocusDuration"
                    />
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        <div className="mt-4 flex justify-end">
          <Button 
            onClick={handleSave} 
            disabled={saving}
            size="sm"
            className="gap-1.5"
            data-testid="button-save"
          >
            <Save className="w-3.5 h-3.5" />
            {saving ? 'Saving...' : 'Save Settings'}
          </Button>
        </div>

        <Card className="mt-6">
          <CardHeader className="p-4">
            <CardTitle className="text-lg">More Information</CardTitle>
            <CardDescription className="text-xs">
              Learn more about The Circle
            </CardDescription>
          </CardHeader>
          <CardContent className="p-4 pt-0 space-y-2">
            <Link href="/documentation">
              <button className="w-full flex items-center justify-between p-3 rounded-lg hover:bg-muted transition-colors text-left group" data-testid="link-documentation">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-primary/10 rounded-lg">
                    <BookOpen className="w-4 h-4 text-primary" />
                  </div>
                  <div>
                    <div className="font-medium text-sm">Documentation</div>
                    <div className="text-xs text-muted-foreground">Complete guides and tutorials</div>
                  </div>
                </div>
                <ChevronRight className="w-4 h-4 text-muted-foreground group-hover:translate-x-1 transition-transform" />
              </button>
            </Link>

            <Link href="/help">
              <button className="w-full flex items-center justify-between p-3 rounded-lg hover:bg-muted transition-colors text-left group" data-testid="link-help">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-secondary/10 rounded-lg">
                    <MessageCircle className="w-4 h-4 text-secondary" />
                  </div>
                  <div>
                    <div className="font-medium text-sm">Help & Support</div>
                    <div className="text-xs text-muted-foreground">FAQ and contact support</div>
                  </div>
                </div>
                <ChevronRight className="w-4 h-4 text-muted-foreground group-hover:translate-x-1 transition-transform" />
              </button>
            </Link>

            <Link href="/faq">
              <button className="w-full flex items-center justify-between p-3 rounded-lg hover:bg-muted transition-colors text-left group" data-testid="link-faq">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-accent/10 rounded-lg">
                    <HelpCircle className="w-4 h-4 text-accent" />
                  </div>
                  <div>
                    <div className="font-medium text-sm">FAQ</div>
                    <div className="text-xs text-muted-foreground">Quick answers to common questions</div>
                  </div>
                </div>
                <ChevronRight className="w-4 h-4 text-muted-foreground group-hover:translate-x-1 transition-transform" />
              </button>
            </Link>

            <Link href="/changelog">
              <button className="w-full flex items-center justify-between p-3 rounded-lg hover:bg-muted transition-colors text-left group" data-testid="link-changelog">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-purple-500/10 rounded-lg">
                    <GitBranch className="w-4 h-4 text-purple-500" />
                  </div>
                  <div>
                    <div className="font-medium text-sm">Changelog</div>
                    <div className="text-xs text-muted-foreground">Version history and updates</div>
                  </div>
                </div>
                <ChevronRight className="w-4 h-4 text-muted-foreground group-hover:translate-x-1 transition-transform" />
              </button>
            </Link>

            <Link href="/about">
              <button className="w-full flex items-center justify-between p-3 rounded-lg hover:bg-muted transition-colors text-left group" data-testid="link-about">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-secondary/10 rounded-lg">
                    <Info className="w-4 h-4 text-secondary" />
                  </div>
                  <div>
                    <div className="font-medium text-sm">About</div>
                    <div className="text-xs text-muted-foreground">Learn about The Circle</div>
                  </div>
                </div>
                <ChevronRight className="w-4 h-4 text-muted-foreground group-hover:translate-x-1 transition-transform" />
              </button>
            </Link>

            <Link href="/privacy">
              <button className="w-full flex items-center justify-between p-3 rounded-lg hover:bg-muted transition-colors text-left group" data-testid="link-privacy">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-purple-500/10 rounded-lg">
                    <Shield className="w-4 h-4 text-purple-500" />
                  </div>
                  <div>
                    <div className="font-medium text-sm">Privacy Policy</div>
                    <div className="text-xs text-muted-foreground">How we protect your data</div>
                  </div>
                </div>
                <ChevronRight className="w-4 h-4 text-muted-foreground group-hover:translate-x-1 transition-transform" />
              </button>
            </Link>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
