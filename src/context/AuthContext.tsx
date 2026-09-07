import React, { createContext, useContext, useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { usersService } from '../services/firebaseService';
import { User, LoginCredentials, RegisterCredentials } from '../types/auth';
import { UserRole } from '../types/database';

interface AuthContextType {
  user: User | null;
  firebaseUser: null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (credentials: LoginCredentials) => Promise<{ success: boolean; error?: string }>;
  loginWithGoogle: () => Promise<{ success: boolean; error?: string; isUnauthorizedDomain?: boolean; domain?: string }>;
  quickLoginAs: (role: 'admin' | 'student') => void;
  register: (credentials: RegisterCredentials) => Promise<{ success: boolean; error?: string }>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const ADMIN_EMAILS = [
  'wanky7713@gmail.com',
  'wanky@kominote.online',
  'tabletwanky@gmail.com',
  'wankymassenat@gmail.com',
  'motivationmtv2026@gmail.com',
];

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  useEffect(() => {
    let mounted = true;

    const init = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        if (session?.user && mounted) {
          await loadProfile(session.user);
        }
      } catch (err) {
        console.error('Session init error:', err);
      } finally {
        if (mounted) setIsLoading(false);
      }
    };

    init();

    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (_event, session) => {
      if (!mounted) return;
      if (session?.user) {
        await loadProfile(session.user);
      } else {
        setUser(null);
      }
      setIsLoading(false);
    });

    return () => {
      mounted = false;
      subscription.unsubscribe();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const loadProfile = async (authUser: any) => {
    try {
      let profile = await usersService.getProfile(authUser.id);

      const isAdminEmail = ADMIN_EMAILS.includes((authUser.email || '').toLowerCase());
      const targetRole: UserRole = isAdminEmail ? 'admin' : (profile?.role || 'student');

      if (!profile) {
        profile = await usersService.createOrUpdateProfile(authUser.id, {
          email: authUser.email || '',
          full_name: authUser.user_metadata?.full_name || authUser.user_metadata?.name || 'Elèv Kominote',
          avatar_url: authUser.user_metadata?.avatar_url || '',
          role: targetRole,
        });
      } else if (isAdminEmail && profile.role !== 'admin') {
        await usersService.createOrUpdateProfile(authUser.id, { role: 'admin' });
        profile = await usersService.getProfile(authUser.id);
      }

      if (profile) {
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
      }
    } catch (err) {
      console.error('Error fetching profile for auth user:', err);
      const isAdminEmail = ADMIN_EMAILS.includes((authUser.email || '').toLowerCase());
      const fallbackUser: User = {
        id: authUser.id,
        email: authUser.email || '',
        full_name: authUser.user_metadata?.full_name || 'Elèv Kominote',
        role: isAdminEmail ? 'admin' : 'student',
        avatar_url: authUser.user_metadata?.avatar_url || '',
        created_at: new Date().toISOString(),
      };
      setUser(fallbackUser);
    }
  };

  const login = async (credentials: LoginCredentials): Promise<{ success: boolean; error?: string }> => {
    setIsLoading(true);
    try {
      const { error } = await supabase.auth.signInWithPassword({
        email: credentials.email,
        password: credentials.password,
      });
      if (error) {
        let message = 'Imèl oswa modpas la pa kòrèk.';
        if (error.message.includes('Invalid login')) message = 'Enfòmasyon koneksyon yo pa kòrèk.';
        if (error.message.includes('Email not confirmed')) message = 'Ou poko verifye imèl ou.';
        return { success: false, error: message };
      }
      return { success: true };
    } catch (err: any) {
      console.error('Login error:', err);
      return { success: false, error: 'Imèl oswa modpas la pa kòrèk.' };
    } finally {
      setIsLoading(false);
    }
  };

  const loginWithGoogle = async (): Promise<{ success: boolean; error?: string; isUnauthorizedDomain?: boolean; domain?: string }> => {
    setIsLoading(true);
    try {
      const { error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: { redirectTo: window.location.origin },
      });
      if (error) {
        return { success: false, error: error.message || 'Koneksyon ak Google anile.' };
      }
      return { success: true };
    } catch (err: any) {
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
      const { data, error } = await supabase.auth.signUp({
        email: credentials.email,
        password: credentials.password,
        options: {
          data: { full_name: credentials.full_name },
        },
      });

      if (error) {
        let message = 'Nou pa t kapab kreye kont ou. Tanpri eseye ankò.';
        if (error.message.includes('already registered')) message = 'Gen yon kont ki deja itilize imèl sa a.';
        if (error.message.includes('password')) message = 'Modpas la pa ase solid.';
        if (error.message.includes('email')) message = 'Adrès imèl la pa valab.';
        return { success: false, error: message };
      }

      if (data.user) {
        await usersService.createOrUpdateProfile(data.user.id, {
          email: credentials.email,
          full_name: credentials.full_name,
          role: 'student',
          avatar_url: '',
          created_at: new Date().toISOString(),
        });
      }

      return { success: true };
    } catch (err: any) {
      console.error('Registration error:', err);
      return { success: false, error: 'Nou pa t kapab kreye kont ou. Tanpri eseye ankò.' };
    } finally {
      setIsLoading(false);
    }
  };

  const logout = async (): Promise<void> => {
    try {
      await supabase.auth.signOut();
    } catch (err) {
      console.warn('Signout error:', err);
    }
    setUser(null);
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        firebaseUser: null,
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
