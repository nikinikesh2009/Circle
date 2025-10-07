import { useState } from 'react';
import { Link, useLocation } from 'wouter';
import { useAuth } from '@/hooks/useAuth';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import { Mail, Lock, Eye, EyeOff, UserPlus, CheckCircle, XCircle } from 'lucide-react';

export default function Register() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const { register } = useAuth();
  const [, setLocation] = useLocation();
  const { toast } = useToast();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password || !confirmPassword) return;

    if (password !== confirmPassword) {
      toast({
        title: "Password Mismatch",
        description: "Passwords do not match. Please try again.",
        variant: "destructive",
      });
      return;
    }

    if (password.length < 6) {
      toast({
        title: "Password Too Short",
        description: "Password must be at least 6 characters long.",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);
    try {
      await register(email, password);
      toast({
        title: "Welcome to The Circle!",
        description: "Your account has been created successfully.",
      });
      setLocation('/dashboard');
    } catch (error: any) {
      toast({
        title: "Registration Failed",
        description: "Unable to create account. Please try again with a different email or check your connection.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const passwordStrength = password.length >= 6 ? 'strong' : password.length >= 4 ? 'medium' : 'weak';
  const passwordsMatch = password && confirmPassword && password === confirmPassword;

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-primary/5 flex items-center justify-center p-4">
      <div className="max-w-md w-full animate-fade-in-up">
        <div className="text-center mb-8">
          <div className="flex justify-center mb-6">
            <div className="relative">
              <div className="w-20 h-20 rounded-full bg-gradient-to-br from-primary to-secondary flex items-center justify-center shadow-2xl">
                <svg className="w-12 h-12 text-primary-foreground" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <circle cx="12" cy="12" r="10" strokeWidth="2"/>
                </svg>
              </div>
              <div className="absolute inset-0 rounded-full bg-gradient-to-br from-primary to-secondary blur-xl opacity-50"></div>
            </div>
          </div>
          <h2 className="text-4xl font-extrabold mb-3 bg-gradient-to-r from-primary via-secondary to-accent bg-clip-text text-transparent">
            Create Your Account
          </h2>
          <p className="text-lg text-muted-foreground">Join The Circle and start your journey today</p>
        </div>

        <Card className="border-2 border-border/50 shadow-2xl rounded-3xl overflow-hidden bg-gradient-to-br from-card to-primary/5">
          <CardContent className="p-8 md:p-10">
            <form onSubmit={handleSubmit}>
              <div className="space-y-6">
                <div className="space-y-2">
                  <label className="block text-sm font-semibold text-foreground flex items-center gap-2" htmlFor="register-email">
                    <Mail className="w-4 h-4 text-primary" />
                    Email
                  </label>
                  <div className="relative">
                    <Input
                      type="email"
                      id="register-email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="you@example.com"
                      className="bg-background border-input pl-11 focus:ring-2 focus:ring-primary/50 transition-all duration-200 h-12"
                      data-testid="input-email"
                      required
                    />
                    <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground pointer-events-none" />
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="block text-sm font-semibold text-foreground flex items-center gap-2" htmlFor="register-password">
                    <Lock className="w-4 h-4 text-primary" />
                    Password
                  </label>
                  <div className="relative">
                    <Input
                      type={showPassword ? "text" : "password"}
                      id="register-password"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="••••••••"
                      className="bg-background border-input pl-11 pr-12 focus:ring-2 focus:ring-primary/50 transition-all duration-200 h-12"
                      data-testid="input-password"
                      required
                    />
                    <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground pointer-events-none" />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                      data-testid="button-toggle-password"
                    >
                      {showPassword ? (
                        <EyeOff className="w-5 h-5" />
                      ) : (
                        <Eye className="w-5 h-5" />
                      )}
                    </button>
                  </div>
                  {password && (
                    <div className="flex items-center gap-2 mt-2">
                      <div className="flex-1 h-1.5 bg-border rounded-full overflow-hidden">
                        <div 
                          className={`h-full transition-all duration-300 ${
                            passwordStrength === 'strong' ? 'w-full bg-green-500' :
                            passwordStrength === 'medium' ? 'w-2/3 bg-yellow-500' :
                            'w-1/3 bg-red-500'
                          }`}
                        />
                      </div>
                      <span className={`text-xs font-medium ${
                        passwordStrength === 'strong' ? 'text-green-600 dark:text-green-500' :
                        passwordStrength === 'medium' ? 'text-yellow-600 dark:text-yellow-500' :
                        'text-red-600 dark:text-red-500'
                      }`}>
                        {passwordStrength === 'strong' ? 'Strong' :
                         passwordStrength === 'medium' ? 'Medium' :
                         'Weak'}
                      </span>
                    </div>
                  )}
                </div>

                <div className="space-y-2">
                  <label className="block text-sm font-semibold text-foreground flex items-center gap-2" htmlFor="register-confirm-password">
                    <Lock className="w-4 h-4 text-primary" />
                    Confirm Password
                  </label>
                  <div className="relative">
                    <Input
                      type={showConfirmPassword ? "text" : "password"}
                      id="register-confirm-password"
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      placeholder="••••••••"
                      className="bg-background border-input pl-11 pr-12 focus:ring-2 focus:ring-primary/50 transition-all duration-200 h-12"
                      data-testid="input-confirm-password"
                      required
                    />
                    <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground pointer-events-none" />
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
                  {confirmPassword && (
                    <div className="flex items-center gap-2 mt-2">
                      {passwordsMatch ? (
                        <>
                          <CheckCircle className="w-4 h-4 text-green-600 dark:text-green-500" />
                          <span className="text-xs font-medium text-green-600 dark:text-green-500">Passwords match</span>
                        </>
                      ) : (
                        <>
                          <XCircle className="w-4 h-4 text-red-600 dark:text-red-500" />
                          <span className="text-xs font-medium text-red-600 dark:text-red-500">Passwords don't match</span>
                        </>
                      )}
                    </div>
                  )}
                </div>
              </div>

              <Button 
                type="submit" 
                className="w-full mt-8 h-12 text-lg font-bold bg-gradient-to-r from-primary via-secondary to-accent hover:shadow-2xl hover:shadow-primary/50 transition-all duration-300 hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed"
                disabled={loading}
                data-testid="button-create-account"
              >
                {loading ? (
                  <>
                    <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin mr-2"></div>
                    Creating Account...
                  </>
                ) : (
                  <>
                    <UserPlus className="w-5 h-5 mr-2" />
                    Create Account
                  </>
                )}
              </Button>
            </form>

            <div className="mt-8 text-center">
              <p className="text-sm text-muted-foreground">
                Already have an account?{' '}
                <Link href="/login">
                  <span className="text-primary font-semibold hover:underline cursor-pointer transition-all hover:text-secondary" data-testid="link-sign-in">
                    Sign in
                  </span>
                </Link>
              </p>
            </div>
          </CardContent>
        </Card>

        <Link href="/">
          <button 
            className="mt-6 w-full px-4 py-3 text-sm font-medium text-muted-foreground hover:text-foreground transition-colors hover:bg-card/50 rounded-xl"
            data-testid="button-back-home"
          >
            ← Back to home
          </button>
        </Link>
      </div>
    </div>
  );
}
