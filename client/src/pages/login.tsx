import { useState } from 'react';
import { Link, useLocation } from 'wouter';
import { useAuth } from '@/hooks/useAuth';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';

export default function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();
  const [, setLocation] = useLocation();
  const { toast } = useToast();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) return;

    setLoading(true);
    try {
      await login(email, password);
      toast({
        title: "Welcome back!",
        description: "You've been successfully logged in.",
      });
      setLocation('/dashboard');
    } catch (error: any) {
      toast({
        title: "Login Failed",
        description: error.message || "Please check your credentials and try again.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4">
      <div className="max-w-md w-full">
        <div className="text-center mb-8">
          <div className="flex justify-center mb-4">
            <div className="w-16 h-16 rounded-full bg-gradient-to-br from-primary to-secondary flex items-center justify-center">
              <svg className="w-9 h-9 text-primary-foreground" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <circle cx="12" cy="12" r="10" strokeWidth="2"/>
              </svg>
            </div>
          </div>
          <h2 className="text-3xl font-bold mb-2">Welcome Back</h2>
          <p className="text-muted-foreground">Sign in to continue your journey</p>
        </div>

        <Card className="border-border">
          <CardContent className="p-8">
            <form onSubmit={handleSubmit}>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium mb-2" htmlFor="login-email">Email</label>
                  <Input
                    type="email"
                    id="login-email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="you@example.com"
                    className="bg-background border-input"
                    data-testid="input-email"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium mb-2" htmlFor="login-password">Password</label>
                  <Input
                    type="password"
                    id="login-password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••"
                    className="bg-background border-input"
                    data-testid="input-password"
                    required
                  />
                </div>
              </div>

              <Button 
                type="submit" 
                className="w-full mt-6 bg-gradient-to-r from-primary to-secondary text-primary-foreground font-semibold hover:opacity-90"
                disabled={loading}
                data-testid="button-sign-in"
              >
                {loading ? 'Signing in...' : 'Sign In'}
              </Button>
            </form>

            <div className="mt-6 text-center">
              <p className="text-sm text-muted-foreground">
                Don't have an account? 
                <Link href="/register">
                  <span className="text-primary font-medium hover:underline cursor-pointer ml-1" data-testid="link-register">
                    Create one
                  </span>
                </Link>
              </p>
            </div>
          </CardContent>
        </Card>

        <Link href="/">
          <button 
            className="mt-6 w-full px-4 py-2 text-sm text-muted-foreground hover:text-foreground transition-colors"
            data-testid="button-back-home"
          >
            ← Back to home
          </button>
        </Link>
      </div>
    </div>
  );
}
