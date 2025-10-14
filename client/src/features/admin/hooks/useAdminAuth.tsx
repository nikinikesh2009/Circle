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
    // Verify session with server on mount
    const verifySession = async () => {
      try {
        const response = await fetch('/api/admin/auth/verify', {
          credentials: 'include',
        });
        const data = await response.json();
        
        if (data.authenticated && data.token) {
          setIsAuthenticated(true);
          setSessionToken(data.token);
          setStep('complete');
          localStorage.setItem('admin-auth', JSON.stringify({ 
            isAuthenticated: true, 
            sessionToken: data.token, 
            step: 'complete' 
          }));
        } else {
          // Clear stale localStorage if server session is invalid
          localStorage.removeItem('admin-auth');
          setIsAuthenticated(false);
          setSessionToken(null);
          setStep('password');
        }
      } catch (error) {
        console.error('Failed to verify admin session', error);
        localStorage.removeItem('admin-auth');
        setIsAuthenticated(false);
      }
    };

    verifySession();
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
