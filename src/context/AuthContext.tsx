import React, { createContext, useContext, useState, useEffect } from 'react';
import { 
  onAuthStateChanged, 
  signInWithEmailAndPassword, 
  createUserWithEmailAndPassword, 
  signInWithPopup, 
  signOut as fbSignOut,
  User as FirebaseUser
} from 'firebase/auth';
import { auth, googleProvider } from '../lib/firebase';
import { usersService } from '../services/firebaseService';
import { User, LoginCredentials, RegisterCredentials } from '../types/auth';
import { UserRole } from '../types/database';

interface AuthContextType {
  user: User | null;
  firebaseUser: FirebaseUser | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (credentials: LoginCredentials) => Promise<{ success: boolean; error?: string }>;
  loginWithGoogle: () => Promise<{ success: boolean; error?: string; isUnauthorizedDomain?: boolean; domain?: string }>;
  quickLoginAs: (role: 'admin' | 'student') => void;
  register: (credentials: RegisterCredentials) => Promise<{ success: boolean; error?: string }>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

// Admin identifier configuration
const ADMIN_EMAILS = ['wanky7713@gmail.com', 'wanky@kominote.online'];

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [firebaseUser, setFirebaseUser] = useState<FirebaseUser | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  // Sync with real Firebase Auth
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (fbUser) => {
      setFirebaseUser(fbUser);
      if (fbUser) {
        try {
          // Check if profile exists in Firestore
          let profile = await usersService.getProfile(fbUser.uid);
          
          const isAdminEmail = ADMIN_EMAILS.includes((fbUser.email || '').toLowerCase());
          const targetRole: UserRole = isAdminEmail ? 'admin' : (profile?.role || 'student');

          if (!profile) {
            profile = await usersService.createOrUpdateProfile(fbUser.uid, {
              email: fbUser.email || '',
              full_name: fbUser.displayName || 'Elèv Kominote',
              avatar_url: fbUser.photoURL || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80',
              role: targetRole,
            });
          } else if (isAdminEmail && profile.role !== 'admin') {
            profile = await usersService.createOrUpdateProfile(fbUser.uid, {
              role: 'admin',
            });
          }

          const appUser: User = {
            id: profile.id,
            email: profile.email,
            full_name: profile.full_name,
            role: profile.role,
            headline: profile.headline,
            bio: profile.bio,
            avatar_url: profile.avatar_url,
            created_at: profile.created_at,
          };
          setUser(appUser);
        } catch (err) {
          console.error('Error fetching Firestore profile for auth user:', err);
          const isAdminEmail = ADMIN_EMAILS.includes((fbUser.email || '').toLowerCase());
          const fallbackUser: User = {
            id: fbUser.uid,
            email: fbUser.email || '',
            full_name: fbUser.displayName || 'Elèv Kominote',
            role: isAdminEmail ? 'admin' : 'student',
            avatar_url: fbUser.photoURL || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80',
            created_at: new Date().toISOString(),
          };
          setUser(fallbackUser);
        }
      } else {
        setUser(null);
      }
      setIsLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const login = async (credentials: LoginCredentials): Promise<{ success: boolean; error?: string }> => {
    setIsLoading(true);
    try {
      const userCred = await signInWithEmailAndPassword(auth, credentials.email, credentials.password);
      if (userCred.user) {
        return { success: true };
      }
      return { success: false, error: 'Koneksyon an pa reyisi.' };
    } catch (err: any) {
      console.error('Firebase login error:', err);
      let message = 'Imèl oswa modpas la pa kòrèk.';
      if (err.code === 'auth/user-not-found') message = 'Pa gen kont ki asosye ak imèl sa a.';
      if (err.code === 'auth/wrong-password') message = 'Modpas ou tape a pa kòrèk.';
      if (err.code === 'auth/invalid-credential') message = 'Enfòmasyon koneksyon yo pa kòrèk.';
      return { success: false, error: message };
    } finally {
      setIsLoading(false);
    }
  };

  const loginWithGoogle = async (): Promise<{ success: boolean; error?: string; isUnauthorizedDomain?: boolean; domain?: string }> => {
    setIsLoading(true);
    try {
      const res = await signInWithPopup(auth, googleProvider);
      if (res.user) {
        return { success: true };
      }
      return { success: false, error: 'Koneksyon ak Google anile.' };
    } catch (err: any) {
      console.warn('Google sign in notice:', err);
      const isUnauthorized = 
        err?.code === 'auth/unauthorized-domain' || 
        (typeof err?.message === 'string' && err.message.includes('auth/unauthorized-domain')) ||
        (typeof err?.message === 'string' && err.message.includes('unauthorized-domain'));

      if (isUnauthorized) {
        const domain = typeof window !== 'undefined' ? window.location.hostname : '';
        return {
          success: false,
          isUnauthorizedDomain: true,
          domain,
          error: `Domèn "${domain}" poko nan lis Authorized Domains nan pwojè Firebase ou a.`
        };
      }
      if (err?.code === 'auth/popup-closed-by-user') {
        return { success: false, error: 'Ou te fèmen fenèt koneksyon Google la anvan li te fini.' };
      }
      if (err?.code === 'auth/popup-blocked') {
        return { success: false, error: 'Navigatè w la bloke pop-up la. Tanpri pèmèt li pou w ka konekte.' };
      }
      return { success: false, error: err?.message || 'Erè pandan koneksyon Google la.' };
    } finally {
      setIsLoading(false);
    }
  };

  const quickLoginAs = (role: 'admin' | 'student') => {
    const isWanky = role === 'admin';
    const fallbackUser: User = isWanky ? {
      id: 'admin-wanky-user',
      email: 'wanky7713@gmail.com',
      full_name: 'Dr Wanky Massenat',
      role: 'admin',
      avatar_url: 'https://i.postimg.cc/vH7SzM7b/6.png',
      headline: 'Fondatè Kominote Online',
      bio: 'Medikal • Espesyalis nan Teknoloji • Webmaster • Antreprenè',
      created_at: new Date().toISOString(),
    } : {
      id: 'student-demo-user',
      email: 'elev@kominote.online',
      full_name: 'Elèv Kominote Online',
      role: 'student',
      headline: 'Elèv Manm',
      avatar_url: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80',
      created_at: new Date().toISOString(),
    };
    setUser(fallbackUser);
  };

  const register = async (credentials: RegisterCredentials): Promise<{ success: boolean; error?: string }> => {
    setIsLoading(true);
    try {
      // PLATFORM RULE: Public users can register ONLY as students
      const assignedRole: UserRole = 'student';

      const userCred = await createUserWithEmailAndPassword(auth, credentials.email, credentials.password);
      if (userCred.user) {
        await usersService.createOrUpdateProfile(userCred.user.uid, {
          email: credentials.email,
          full_name: credentials.full_name,
          role: assignedRole,
          created_at: new Date().toISOString(),
        });
        return { success: true };
      }
      return { success: false, error: 'Kreyasyon kont lan pa reyisi.' };
    } catch (err: any) {
      console.error('Firebase registration error:', err);
      let message = 'Erè pandan kreyasyon kont lan.';
      if (err.code === 'auth/email-already-in-use') message = 'Adrès imèl sa a deja itilize.';
      if (err.code === 'auth/weak-password') message = 'Modpas la dwe gen omwen 6 karaktè.';
      return { success: false, error: message };
    } finally {
      setIsLoading(false);
    }
  };

  const logout = async (): Promise<void> => {
    try {
      await fbSignOut(auth);
    } catch (err) {
      console.warn('Firebase signout error:', err);
    }
    setUser(null);
    setFirebaseUser(null);
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        firebaseUser,
        isAuthenticated: !!user,
        isLoading,
        login,
        loginWithGoogle,
        quickLoginAs,
        register,
        logout,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
