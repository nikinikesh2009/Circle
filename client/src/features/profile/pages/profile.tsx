import { useState, useRef, useEffect } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Card, CardContent } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import { User, Flame, Trophy, Calendar, Heart, Lock, Eye, EyeOff, CheckCircle, Camera, Globe, FileText, Settings, Upload } from 'lucide-react';
import { ref as dbRef, update } from 'firebase/database';
import { ref as storageRef, uploadBytesResumable, getDownloadURL } from 'firebase/storage';
import { db, storage } from '@/lib/firebase';

export default function Profile() {
  const { userData, updateUserPassword, refreshUserData, currentUser } = useAuth();
  const { toast } = useToast();
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmNewPassword, setConfirmNewPassword] = useState('');
  const [updating, setUpdating] = useState(false);
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const [country, setCountry] = useState(userData?.country || '');
  const [bio, setBio] = useState(userData?.bio || '');
  const [autoShareProgress, setAutoShareProgress] = useState(userData?.autoShareProgress || false);
  const [profilePhotoPreview, setProfilePhotoPreview] = useState<string | null>(null);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (userData) {
      setCountry(userData.country || '');
      setBio(userData.bio || '');
      setAutoShareProgress(userData.autoShareProgress || false);
    }
  }, [userData]);

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
        title: "Success!",
        description: "Your password has been updated successfully.",
      });
      setCurrentPassword('');
      setNewPassword('');
      setConfirmNewPassword('');
    } catch (error: any) {
      console.error('Error updating password:', error);
      
      if (error.code === 'auth/wrong-password') {
        toast({
          title: "Error",
          description: "Current password is incorrect.",
          variant: "destructive",
        });
      } else if (error.code === 'auth/weak-password') {
        toast({
          title: "Error",
          description: "New password is too weak. Please use a stronger password.",
          variant: "destructive",
        });
      } else if (error.code === 'auth/requires-recent-login') {
        toast({
          title: "Error",
          description: "Please log out and log back in before changing your password.",
          variant: "destructive",
        });
      } else {
        toast({
          title: "Error",
          description: error.message || "Failed to update password. Please try again.",
          variant: "destructive",
        });
      }
    } finally {
      setUpdating(false);
    }
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 5 * 1024 * 1024) {
      toast({
        title: "File Too Large",
        description: "Please select an image smaller than 5MB.",
        variant: "destructive",
      });
      return;
    }

    if (!file.type.startsWith('image/')) {
      toast({
        title: "Invalid File Type",
        description: "Please select an image file.",
        variant: "destructive",
      });
      return;
    }

    setSelectedFile(file);
    const reader = new FileReader();
    reader.onloadend = () => {
      setProfilePhotoPreview(reader.result as string);
    };
    reader.readAsDataURL(file);
  };

  const handleProfileUpdate = async () => {
    if (!currentUser || !userData) return;

    setSaving(true);
    setUploadProgress(0);

    try {
      let photoURL = userData.profilePhoto;

      if (selectedFile) {
        const photoRef = storageRef(storage, `profiles/${currentUser.uid}/photo.jpg`);
        const uploadTask = uploadBytesResumable(photoRef, selectedFile);

        await new Promise<void>((resolve, reject) => {
          uploadTask.on(
            'state_changed',
            (snapshot) => {
              const progress = (snapshot.bytesTransferred / snapshot.totalBytes) * 100;
              setUploadProgress(progress);
            },
            (error) => reject(error),
            async () => {
              photoURL = await getDownloadURL(uploadTask.snapshot.ref);
              resolve();
            }
          );
        });
      }

      const userRef = dbRef(db, `users/${currentUser.uid}`);
      await update(userRef, {
        country: country || null,
        bio: bio || null,
        profilePhoto: photoURL || null,
        autoShareProgress: autoShareProgress,
      });

      await refreshUserData();

      toast({
        title: "Success!",
        description: "Your profile has been updated successfully.",
      });

      setSelectedFile(null);
      setProfilePhotoPreview(null);
      setUploadProgress(0);
    } catch (error: any) {
      console.error('Error updating profile:', error);
      toast({
        title: "Error",
        description: error.message || "Failed to update profile. Please try again.",
        variant: "destructive",
      });
    } finally {
      setSaving(false);
    }
  };

  const getUserInitials = () => {
    if (!userData?.email) return '?';
    const parts = userData.email.split('@')[0].split('.');
    if (parts.length >= 2) {
      return (parts[0][0] + parts[1][0]).toUpperCase();
    }
    return userData.email[0].toUpperCase();
  };

  if (!userData) return null;

  const displayPhoto = profilePhotoPreview || userData.profilePhoto;
  const bioCharCount = bio.length;
  const bioMaxChars = 200;

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-primary/5">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12 space-y-10">
        
        {/* Page Header */}
        <div className="animate-fade-in-up">
          <h1 className="text-4xl md:text-5xl font-extrabold mb-3 bg-gradient-to-r from-primary via-secondary to-accent bg-clip-text text-transparent">
            Your Profile
          </h1>
          <p className="text-lg text-muted-foreground">Manage your account and track your progress</p>
        </div>

        {/* User Profile Header */}
        <div className="animate-fade-in-up" style={{ animationDelay: '0.1s' }}>
          <Card className="relative overflow-hidden border-2 border-primary/30 bg-gradient-to-br from-primary/10 via-card to-secondary/10 shadow-2xl rounded-3xl">
            <div className="absolute inset-0 bg-gradient-to-r from-primary/5 via-transparent to-secondary/5"></div>
            <CardContent className="relative p-8 md:p-10">
              <div className="flex flex-col md:flex-row items-center gap-8">
                {displayPhoto ? (
                  <img
                    src={displayPhoto}
                    alt="Profile"
                    className="w-24 h-24 rounded-full object-cover shadow-2xl border-4 border-primary/20"
                    data-testid="img-profile-photo"
                  />
                ) : (
                  <div className="w-24 h-24 rounded-full bg-gradient-to-br from-primary to-secondary flex items-center justify-center shadow-2xl">
                    <span className="text-3xl font-bold text-primary-foreground" data-testid="text-user-initials">
                      {getUserInitials()}
                    </span>
                  </div>
                )}
                <div className="text-center md:text-left flex-1">
                  <h2 className="text-3xl md:text-4xl font-bold mb-2 text-foreground" data-testid="text-user-email">
                    {userData.email}
                  </h2>
                  <div className="space-y-1">
                    {userData.country && (
                      <p className="text-muted-foreground text-lg flex items-center gap-2 justify-center md:justify-start" data-testid="text-user-country">
                        <Globe className="w-4 h-4" />
                        {userData.country}
                      </p>
                    )}
                    {userData.bio && (
                      <p className="text-muted-foreground text-lg flex items-center gap-2 justify-center md:justify-start" data-testid="text-user-bio">
                        <FileText className="w-4 h-4" />
                        {userData.bio}
                      </p>
                    )}
                    <p className="text-muted-foreground text-lg">
                      Member since {userData.createdAt.toLocaleDateString('en-US', { year: 'numeric', month: 'long' })}
                    </p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Profile Information Section */}
        <div className="animate-fade-in-up space-y-6" style={{ animationDelay: '0.15s' }}>
          <div className="flex items-center gap-3">
            <Settings className="w-6 h-6 text-primary" />
            <h2 className="text-3xl font-bold">Profile Information</h2>
          </div>

          <Card className="border-border/50 shadow-xl rounded-3xl overflow-hidden">
            <CardContent className="p-8 md:p-10">
              <div className="space-y-6">
                {/* Profile Photo Upload */}
                <div className="space-y-3">
                  <label className="block text-sm font-semibold text-foreground flex items-center gap-2">
                    <Camera className="w-4 h-4 text-primary" />
                    Profile Photo
                  </label>
                  <div className="flex items-center gap-4">
                    {displayPhoto ? (
                      <img
                        src={displayPhoto}
                        alt="Profile preview"
                        className="w-20 h-20 rounded-full object-cover border-2 border-border"
                        data-testid="img-profile-preview"
                      />
                    ) : (
                      <div className="w-20 h-20 rounded-full bg-gradient-to-br from-primary/20 to-secondary/20 flex items-center justify-center border-2 border-border">
                        <span className="text-2xl font-bold text-muted-foreground">
                          {getUserInitials()}
                        </span>
                      </div>
                    )}
                    <div className="flex-1">
                      <input
                        type="file"
                        ref={fileInputRef}
                        onChange={handleFileSelect}
                        accept="image/*"
                        className="hidden"
                        data-testid="input-profile-photo"
                      />
                      <Button
                        type="button"
                        variant="outline"
                        onClick={() => fileInputRef.current?.click()}
                        className="w-full sm:w-auto"
                        data-testid="button-upload-photo"
                      >
                        <Upload className="w-4 h-4 mr-2" />
                        Choose Photo
                      </Button>
                      <p className="text-xs text-muted-foreground mt-2">Max file size: 5MB</p>
                    </div>
                  </div>
                  {uploadProgress > 0 && uploadProgress < 100 && (
                    <div className="w-full bg-secondary rounded-full h-2">
                      <div
                        className="bg-primary h-2 rounded-full transition-all duration-300"
                        style={{ width: `${uploadProgress}%` }}
                        data-testid="progress-upload"
                      ></div>
                    </div>
                  )}
                </div>

                {/* Country Input */}
                <div className="space-y-2">
                  <label className="block text-sm font-semibold text-foreground flex items-center gap-2">
                    <Globe className="w-4 h-4 text-primary" />
                    Country
                  </label>
                  <Input
                    type="text"
                    value={country}
                    onChange={(e) => setCountry(e.target.value)}
                    placeholder="Enter your country"
                    className="bg-background border-input focus:ring-2 focus:ring-primary/50 transition-all duration-200"
                    data-testid="input-country"
                  />
                </div>

                {/* Bio Textarea */}
                <div className="space-y-2">
                  <label className="block text-sm font-semibold text-foreground flex items-center gap-2">
                    <FileText className="w-4 h-4 text-primary" />
                    Bio
                  </label>
                  <Textarea
                    value={bio}
                    onChange={(e) => {
                      if (e.target.value.length <= bioMaxChars) {
                        setBio(e.target.value);
                      }
                    }}
                    placeholder="Tell us about yourself..."
                    rows={4}
                    className="bg-background border-input focus:ring-2 focus:ring-primary/50 transition-all duration-200 resize-none"
                    data-testid="textarea-bio"
                  />
                  <p className="text-xs text-muted-foreground text-right" data-testid="text-bio-count">
                    {bioCharCount} / {bioMaxChars} characters
                  </p>
                </div>

                {/* Auto-Share Progress Toggle */}
                <div className="flex items-center justify-between p-4 rounded-lg bg-primary/5 border border-primary/10">
                  <div className="flex-1">
                    <label className="block text-sm font-semibold text-foreground flex items-center gap-2 mb-1">
                      <Settings className="w-4 h-4 text-primary" />
                      Auto-Share Progress
                    </label>
                    <p className="text-xs text-muted-foreground">
                      Automatically create a post when you complete your daily streak
                    </p>
                  </div>
                  <Switch
                    checked={autoShareProgress}
                    onCheckedChange={setAutoShareProgress}
                    className="ml-4"
                    data-testid="switch-auto-share"
                  />
                </div>

                {/* Save Button */}
                <Button
                  onClick={handleProfileUpdate}
                  disabled={saving}
                  className="w-full relative overflow-hidden font-bold text-lg px-8 py-6 bg-gradient-to-r from-primary via-secondary to-accent hover:shadow-2xl hover:shadow-primary/50 transition-all duration-300 hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed"
                  data-testid="button-save-profile"
                >
                  {saving ? (
                    <>
                      <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin mr-2"></div>
                      Saving Profile...
                    </>
                  ) : (
                    <>
                      <CheckCircle className="w-5 h-5 mr-2" />
                      Save Profile
                    </>
                  )}
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Stats Display */}
        <div className="animate-fade-in-up space-y-6" style={{ animationDelay: '0.2s' }}>
          <div className="flex items-center gap-3">
            <Trophy className="w-6 h-6 text-primary" />
            <h2 className="text-3xl font-bold">Your Stats</h2>
          </div>
          
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {/* Current Streak */}
            <Card className="group relative overflow-hidden border-border/50 bg-gradient-to-br from-card to-accent/5 hover:from-accent/10 hover:to-card transition-all duration-500 hover:-translate-y-1 hover:scale-105 shadow-xl hover:shadow-2xl hover:shadow-accent/30 rounded-3xl">
              <CardContent className="p-8">
                <div className="flex items-center justify-between mb-6">
                  <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-accent/30 to-accent/10 flex items-center justify-center group-hover:scale-110 transition-transform duration-300">
                    <Flame className="w-8 h-8 text-accent" />
                  </div>
                </div>
                <p className="text-5xl font-black mb-3 bg-gradient-to-r from-accent to-accent/70 bg-clip-text text-transparent" data-testid="text-current-streak">
                  {userData.streak}
                </p>
                <p className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">Current Streak</p>
              </CardContent>
            </Card>

            {/* Best Streak */}
            <Card className="group relative overflow-hidden border-border/50 bg-gradient-to-br from-card to-primary/5 hover:from-primary/10 hover:to-card transition-all duration-500 hover:-translate-y-1 hover:scale-105 shadow-xl hover:shadow-2xl hover:shadow-primary/30 rounded-3xl">
              <CardContent className="p-8">
                <div className="flex items-center justify-between mb-6">
                  <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-primary/30 to-primary/10 flex items-center justify-center group-hover:scale-110 transition-transform duration-300">
                    <Trophy className="w-8 h-8 text-primary" />
                  </div>
                </div>
                <p className="text-5xl font-black mb-3 bg-gradient-to-r from-primary to-primary/70 bg-clip-text text-transparent" data-testid="text-best-streak">
                  {userData.bestStreak}
                </p>
                <p className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">Best Streak</p>
              </CardContent>
            </Card>

            {/* Total Days */}
            <Card className="group relative overflow-hidden border-border/50 bg-gradient-to-br from-card to-secondary/5 hover:from-secondary/10 hover:to-card transition-all duration-500 hover:-translate-y-1 hover:scale-105 shadow-xl hover:shadow-2xl hover:shadow-secondary/30 rounded-3xl">
              <CardContent className="p-8">
                <div className="flex items-center justify-between mb-6">
                  <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-secondary/30 to-secondary/10 flex items-center justify-center group-hover:scale-110 transition-transform duration-300">
                    <Calendar className="w-8 h-8 text-secondary" />
                  </div>
                </div>
                <p className="text-5xl font-black mb-3 bg-gradient-to-r from-secondary to-secondary/70 bg-clip-text text-transparent" data-testid="text-total-days">
                  {userData.totalDays}
                </p>
                <p className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">Total Days</p>
              </CardContent>
            </Card>

            {/* Likes Given */}
            <Card className="group relative overflow-hidden border-border/50 bg-gradient-to-br from-card to-red-500/5 hover:from-red-500/10 hover:to-card transition-all duration-500 hover:-translate-y-1 hover:scale-105 shadow-xl hover:shadow-2xl hover:shadow-red-500/30 rounded-3xl">
              <CardContent className="p-8">
                <div className="flex items-center justify-between mb-6">
                  <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-red-500/30 to-red-500/10 flex items-center justify-center group-hover:scale-110 transition-transform duration-300">
                    <Heart className="w-8 h-8 text-red-500" />
                  </div>
                </div>
                <p className="text-5xl font-black mb-3 bg-gradient-to-r from-red-500 to-red-500/70 bg-clip-text text-transparent" data-testid="text-likes-given">
                  {userData.likesGiven}
                </p>
                <p className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">Likes Given</p>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Password Update Section */}
        <div className="animate-fade-in-up space-y-6" style={{ animationDelay: '0.3s' }}>
          <div className="flex items-center gap-3">
            <Lock className="w-6 h-6 text-primary" />
            <h2 className="text-3xl font-bold">Security</h2>
          </div>

          <Card className="border-border/50 shadow-xl rounded-3xl overflow-hidden">
            <CardContent className="p-8 md:p-10">
              <h3 className="text-xl font-bold mb-6 flex items-center gap-2">
                <Lock className="w-5 h-5 text-primary" />
                Update Password
              </h3>
              
              <form onSubmit={handlePasswordUpdate} className="space-y-6">
                {/* Current Password */}
                <div className="space-y-2">
                  <label 
                    className="block text-sm font-semibold text-foreground" 
                    htmlFor="current-password"
                  >
                    Current Password
                  </label>
                  <div className="relative">
                    <Input
                      type={showCurrentPassword ? "text" : "password"}
                      id="current-password"
                      value={currentPassword}
                      onChange={(e) => setCurrentPassword(e.target.value)}
                      placeholder="Enter your current password"
                      className="bg-background border-input pr-12 focus:ring-2 focus:ring-primary/50 transition-all duration-200"
                      data-testid="input-current-password"
                    />
                    <button
                      type="button"
                      onClick={() => setShowCurrentPassword(!showCurrentPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                      data-testid="button-toggle-current-password"
                    >
                      {showCurrentPassword ? (
                        <EyeOff className="w-5 h-5" />
                      ) : (
                        <Eye className="w-5 h-5" />
                      )}
                    </button>
                  </div>
                </div>

                {/* New Password */}
                <div className="space-y-2">
                  <label 
                    className="block text-sm font-semibold text-foreground" 
                    htmlFor="new-password"
                  >
                    New Password
                  </label>
                  <div className="relative">
                    <Input
                      type={showNewPassword ? "text" : "password"}
                      id="new-password"
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                      placeholder="Enter your new password"
                      className="bg-background border-input pr-12 focus:ring-2 focus:ring-primary/50 transition-all duration-200"
                      data-testid="input-new-password"
                    />
                    <button
                      type="button"
                      onClick={() => setShowNewPassword(!showNewPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                      data-testid="button-toggle-new-password"
                    >
                      {showNewPassword ? (
                        <EyeOff className="w-5 h-5" />
                      ) : (
                        <Eye className="w-5 h-5" />
                      )}
                    </button>
                  </div>
                </div>

                {/* Confirm New Password */}
                <div className="space-y-2">
                  <label 
                    className="block text-sm font-semibold text-foreground" 
                    htmlFor="confirm-new-password"
                  >
                    Confirm New Password
                  </label>
                  <div className="relative">
                    <Input
                      type={showConfirmPassword ? "text" : "password"}
                      id="confirm-new-password"
                      value={confirmNewPassword}
                      onChange={(e) => setConfirmNewPassword(e.target.value)}
                      placeholder="Confirm your new password"
                      className="bg-background border-input pr-12 focus:ring-2 focus:ring-primary/50 transition-all duration-200"
                      data-testid="input-confirm-new-password"
                    />
                    <button
                      type="button"
                      onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                      data-testid="button-toggle-confirm-password"
                    >
                      {showConfirmPassword ? (
                        <EyeOff className="w-5 h-5" />
                      ) : (
                        <Eye className="w-5 h-5" />
                      )}
                    </button>
                  </div>
                </div>

                <Button 
                  type="submit" 
                  disabled={updating}
                  className="relative overflow-hidden font-bold text-lg px-8 py-6 bg-gradient-to-r from-primary via-secondary to-accent hover:shadow-2xl hover:shadow-primary/50 transition-all duration-300 hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed"
                  data-testid="button-update-password"
                >
                  {updating ? (
                    <>
                      <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin mr-2"></div>
                      Updating Password...
                    </>
                  ) : (
                    <>
                      <CheckCircle className="w-5 h-5 mr-2" />
                      Update Password
                    </>
                  )}
                </Button>
              </form>
            </CardContent>
          </Card>
        </div>

      </div>
    </div>
  );
}
