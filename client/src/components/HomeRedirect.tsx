import { useEffect } from 'react';
import { useLocation } from 'wouter';
import { useAuth } from '@/hooks/useAuth';

export default function HomeRedirect() {
  const { currentUser, loading } = useAuth();
  const [, setLocation] = useLocation();

  useEffect(() => {
    if (!loading) {
      if (currentUser) {
        setLocation('/dashboard');
      } else {
        setLocation('/login');
      }
    }
  }, [currentUser, loading, setLocation]);

  return (
    <div className="min-h-screen bg-background flex items-center justify-center">
      <div className="w-16 h-16 rounded-full bg-gradient-to-br from-primary via-secondary to-accent animate-pulse" />
    </div>
  );
}
