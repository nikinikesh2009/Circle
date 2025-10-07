import { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { 
  User as FirebaseUser, 
  signInWithEmailAndPassword, 
  createUserWithEmailAndPassword, 
  signOut, 
  onAuthStateChanged,
  updatePassword,
  reauthenticateWithCredential,
  EmailAuthProvider
} from 'firebase/auth';
import { ref, get, set, update } from 'firebase/database';
import { auth, db } from '@/lib/firebase';
import { User, InsertUser } from '@shared/schema';

interface AuthContextType {
  currentUser: FirebaseUser | null;
  userData: User | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  updateUserPassword: (currentPassword: string, newPassword: string) => Promise<void>;
  refreshUserData: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function useAuthContext() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuthContext must be used within an AuthProvider');
  }
  return context;
}

interface AuthProviderProps {
  children: ReactNode;
}

export function AuthProvider({ children }: AuthProviderProps) {
  const [currentUser, setCurrentUser] = useState<FirebaseUser | null>(null);
  const [userData, setUserData] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchUserData = async (firebaseUser: FirebaseUser) => {
    try {
      const userRef = ref(db, `users/${firebaseUser.uid}`);
      const snapshot = await get(userRef);
      if (snapshot.exists()) {
        const data = snapshot.val();
        const user: User = {
          id: firebaseUser.uid,
          email: firebaseUser.email!,
          createdAt: new Date(data.createdAt),
          streak: data.streak || 0,
          bestStreak: data.bestStreak || 0,
          totalDays: data.totalDays || 0,
          lastCompletedDate: data.lastCompletedDate,
          likesGiven: data.likesGiven || 0,
          country: data.country,
          bio: data.bio,
          profilePhoto: data.profilePhoto,
          autoShareProgress: data.autoShareProgress || false,
        };
        setUserData(user);
      }
    } catch (error) {
      console.error('Error fetching user data:', error);
    }
  };

  const refreshUserData = async () => {
    if (currentUser) {
      await fetchUserData(currentUser);
    }
  };

  const register = async (email: string, password: string) => {
    try {
      const { user } = await createUserWithEmailAndPassword(auth, email, password);
      
      const newUser: Omit<User, 'id'> = {
        email: user.email!,
        createdAt: new Date(),
        streak: 0,
        bestStreak: 0,
        totalDays: 0,
        likesGiven: 0,
        autoShareProgress: false,
      };

      await set(ref(db, `users/${user.uid}`), {
        ...newUser,
        createdAt: newUser.createdAt.toISOString(),
      });

      setUserData({ ...newUser, id: user.uid });
    } catch (error) {
      throw error;
    }
  };

  const login = async (email: string, password: string) => {
    try {
      await signInWithEmailAndPassword(auth, email, password);
    } catch (error) {
      throw error;
    }
  };

  const logout = async () => {
    try {
      await signOut(auth);
      setUserData(null);
    } catch (error) {
      throw error;
    }
  };

  const updateUserPassword = async (currentPassword: string, newPassword: string) => {
    if (!currentUser) throw new Error('No user logged in');

    const credential = EmailAuthProvider.credential(currentUser.email!, currentPassword);
    await reauthenticateWithCredential(currentUser, credential);
    await updatePassword(currentUser, newPassword);
  };

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      setCurrentUser(user);
      if (user) {
        await fetchUserData(user);
      } else {
        setUserData(null);
      }
      setLoading(false);
    });

    return unsubscribe;
  }, []);

  const value: AuthContextType = {
    currentUser,
    userData,
    loading,
    login,
    register,
    logout,
    updateUserPassword,
    refreshUserData,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}
