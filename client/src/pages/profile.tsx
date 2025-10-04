import { useState } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';

export default function Profile() {
  const { userData, updateUserPassword } = useAuth();
  const { toast } = useToast();
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmNewPassword, setConfirmNewPassword] = useState('');
  const [updating, setUpdating] = useState(false);

  const handlePasswordUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!currentPassword || !newPassword || !confirmNewPassword) {
      toast({
        title: "Missing Information",
        description: "Please fill in all password fields.",
        variant: "destructive",
      });
      return;
    }

    if (newPassword !== confirmNewPassword) {
      toast({
        title: "Password Mismatch",
        description: "New passwords do not match.",
        variant: "destructive",
      });
      return;
    }

    if (newPassword.length < 6) {
      toast({
        title: "Password Too Short",
        description: "New password must be at least 6 characters long.",
        variant: "destructive",
      });
      return;
    }

    setUpdating(true);
    try {
      await updateUserPassword(currentPassword, newPassword);
      toast({
        title: "Password Updated",
        description: "Your password has been successfully updated.",
      });
      setCurrentPassword('');
      setNewPassword('');
      setConfirmNewPassword('');
    } catch (error: any) {
      toast({
        title: "Update Failed",
        description: error.message || "Failed to update password. Please check your current password.",
        variant: "destructive",
      });
    } finally {
      setUpdating(false);
    }
  };

  if (!userData) return null;

  const completionRate = userData.totalDays > 0 ? Math.round((userData.streak / userData.totalDays) * 100) : 0;
  const initials = userData.email.substring(0, 2).toUpperCase();

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="mb-8">
        <h1 className="text-3xl md:text-4xl font-bold mb-2">Your Profile</h1>
        <p className="text-muted-foreground">Manage your account settings and view your progress</p>
      </div>

      {/* Profile Card */}
      <Card className="border-border mb-6">
        <CardContent className="p-8">
          <div className="flex flex-col md:flex-row items-center gap-6 mb-8">
            <div className="w-24 h-24 rounded-full bg-gradient-to-br from-primary to-secondary flex items-center justify-center text-3xl font-bold text-primary-foreground">
              <span data-testid="text-user-initials">{initials}</span>
            </div>
            <div className="text-center md:text-left flex-1">
              <h2 className="text-2xl font-bold mb-1" data-testid="text-user-email">{userData.email}</h2>
              <p className="text-muted-foreground">Member since {userData.createdAt.toLocaleDateString('en-US', { year: 'numeric', month: 'long' })}</p>
            </div>
          </div>

          {/* Stats Grid */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
            <div className="text-center p-4 bg-background rounded-lg">
              <p className="text-3xl font-bold text-accent" data-testid="text-current-streak">{userData.streak}</p>
              <p className="text-sm text-muted-foreground mt-1">Current Streak</p>
            </div>
            <div className="text-center p-4 bg-background rounded-lg">
              <p className="text-3xl font-bold text-primary" data-testid="text-total-days">{userData.totalDays}</p>
              <p className="text-sm text-muted-foreground mt-1">Total Days</p>
            </div>
            <div className="text-center p-4 bg-background rounded-lg">
              <p className="text-3xl font-bold text-secondary" data-testid="text-likes-given">{userData.likesGiven}</p>
              <p className="text-sm text-muted-foreground mt-1">Likes Given</p>
            </div>
            <div className="text-center p-4 bg-background rounded-lg">
              <p className="text-3xl font-bold text-foreground" data-testid="text-completion-rate">{completionRate}%</p>
              <p className="text-sm text-muted-foreground mt-1">Completion</p>
            </div>
          </div>

          {/* Account Info */}
          <div className="border-t border-border pt-6">
            <h3 className="text-lg font-semibold mb-4">Account Information</h3>
            <div className="space-y-3">
              <div className="flex justify-between items-center py-2">
                <span className="text-muted-foreground">Email</span>
                <span className="font-medium" data-testid="text-profile-email">{userData.email}</span>
              </div>
              <div className="flex justify-between items-center py-2">
                <span className="text-muted-foreground">Account Status</span>
                <span className="px-3 py-1 bg-secondary/10 text-secondary text-sm font-medium rounded-full">Active</span>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Password Update Section */}
      <Card className="border-border">
        <CardContent className="p-8">
          <h3 className="text-lg font-semibold mb-4">Update Password</h3>
          <form onSubmit={handlePasswordUpdate}>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-2" htmlFor="current-password">Current Password</label>
                <Input
                  type="password"
                  id="current-password"
                  value={currentPassword}
                  onChange={(e) => setCurrentPassword(e.target.value)}
                  placeholder="••••••••"
                  className="bg-background border-input"
                  data-testid="input-current-password"
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-2" htmlFor="new-password">New Password</label>
                <Input
                  type="password"
                  id="new-password"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  placeholder="••••••••"
                  className="bg-background border-input"
                  data-testid="input-new-password"
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-2" htmlFor="confirm-new-password">Confirm New Password</label>
                <Input
                  type="password"
                  id="confirm-new-password"
                  value={confirmNewPassword}
                  onChange={(e) => setConfirmNewPassword(e.target.value)}
                  placeholder="••••••••"
                  className="bg-background border-input"
                  data-testid="input-confirm-new-password"
                />
              </div>
            </div>

            <Button 
              type="submit" 
              disabled={updating}
              className="mt-6 bg-primary text-primary-foreground hover:bg-primary/90"
              data-testid="button-update-password"
            >
              {updating ? 'Updating...' : 'Update Password'}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
