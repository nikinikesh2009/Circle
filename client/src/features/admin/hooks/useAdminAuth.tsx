import { createContext, useContext, useState, useEffect, ReactNode } from 'react';

interface AdminAuthContextType {
  isAuthenticated: boolean;
  step: 'password' | 'email' | 'backup' | 'complete';
  sessionToken: string | null;
  login: (token: string) => void;
  logout: () => void;
  setStep: (step: 'password' | 'email' | 'backup' | 'complete') => void;
}

const AdminAuthContext = createContext<AdminAuthContextType | undefined>(undefined);

export function AdminAuthProvider({ children }: { children: ReactNode }) {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [step, setStep] = useState<'password' | 'email' | 'backup' | 'complete'>('password');
  const [sessionToken, setSessionToken] = useState<string | null>(null);

  useEffect(() => {
    const stored = localStorage.getItem('admin-auth');
    if (stored) {
      try {
        const parsed = JSON.parse(stored);
        if (parsed.isAuthenticated && parsed.sessionToken) {
          setIsAuthenticated(parsed.isAuthenticated);
          setSessionToken(parsed.sessionToken);
          setStep(parsed.step || 'complete');
        }
      } catch (e) {
        console.error('Failed to parse admin auth', e);
      }
    }
  }, []);

  const login = (token: string) => {
    setIsAuthenticated(true);
    setSessionToken(token);
    setStep('complete');
    localStorage.setItem('admin-auth', JSON.stringify({ isAuthenticated: true, sessionToken: token, step: 'complete' }));
  };

  const logout = () => {
    setIsAuthenticated(false);
    setSessionToken(null);
    setStep('password');
    localStorage.removeItem('admin-auth');
  };

  const updateStep = (newStep: 'password' | 'email' | 'backup' | 'complete') => {
    setStep(newStep);
    const stored = localStorage.getItem('admin-auth');
    if (stored) {
      try {
        const parsed = JSON.parse(stored);
        localStorage.setItem('admin-auth', JSON.stringify({ ...parsed, step: newStep }));
      } catch (e) {
        console.error('Failed to update step', e);
      }
    }
  };

  return (
    <AdminAuthContext.Provider value={{ isAuthenticated, step, sessionToken, login, logout, setStep: updateStep }}>
      {children}
    </AdminAuthContext.Provider>
  );
}

export function useAdminAuth() {
  const context = useContext(AdminAuthContext);
  if (context === undefined) {
    throw new Error('useAdminAuth must be used within an AdminAuthProvider');
  }
  return context;
}
