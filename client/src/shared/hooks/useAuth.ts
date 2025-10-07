import { useAuthContext } from '@/shared/contexts/AuthContext';

export const useAuth = () => {
  return useAuthContext();
};
