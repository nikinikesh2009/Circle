import { useEffect } from 'react';
import { useLocation } from 'wouter';

export default function HomeRedirect() {
  const [, setLocation] = useLocation();

  useEffect(() => {
    setLocation('/dashboard');
  }, [setLocation]);

  return (
    <div className="min-h-screen bg-background flex items-center justify-center">
      <div className="w-16 h-16 rounded-full bg-gradient-to-br from-primary via-secondary to-accent animate-pulse" />
    </div>
  );
}
