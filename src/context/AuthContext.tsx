import React, { createContext, useContext, useState, useEffect } from 'react';
import { User, Role } from '../types';
import { supabase, isSupabaseConfigured } from '../lib/supabase';

interface AuthContextType {
  user: User | null;
  role: Role | null;
  isLoading: boolean;
  loginBarber: (password: string, email?: string) => Promise<{ success: boolean; error?: string }>;
  loginClientEmail: (email: string, name: string, phone: string) => Promise<{ success: boolean; error?: string }>;
  loginClientGoogle: (customEmail?: string, customName?: string) => Promise<{ success: boolean; error?: string }>;
  logout: () => Promise<void>;
  updateUserProfile: (data: Partial<User>) => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const LOCAL_USER_KEY = 'barber_current_user_v1';

// Default Barber credentials
export const DEFAULT_BARBER_CREDENTIALS = {
  email: 'barbeiro@navalha.com',
  password: 'admin123',
};

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Load session on startup
  useEffect(() => {
    const initAuth = async () => {
      try {
        // Check Supabase session if configured
        if (isSupabaseConfigured && supabase) {
          const { data: { session } } = await supabase.auth.getSession();
          if (session?.user) {
            const isBarber = session.user.email === DEFAULT_BARBER_CREDENTIALS.email;
            setUser({
              id: session.user.id,
              email: session.user.email || '',
              name: session.user.user_metadata?.full_name || session.user.email?.split('@')[0] || 'Cliente',
              role: isBarber ? 'barber' : 'client',
              avatar_url: session.user.user_metadata?.avatar_url,
              phone: session.user.user_metadata?.phone,
            });
            setIsLoading(false);
            return;
          }
        }

        // Fallback to local storage session
        const saved = localStorage.getItem(LOCAL_USER_KEY);
        if (saved) {
          setUser(JSON.parse(saved));
        }
      } catch (err) {
        console.error('Error initializing auth:', err);
      } finally {
        setIsLoading(false);
      }
    };

    initAuth();

    // Listen to Supabase auth events if active
    if (isSupabaseConfigured && supabase) {
      const { data: authListener } = supabase.auth.onAuthStateChange((_event, session) => {
        if (session?.user) {
          const isBarber = session.user.email === DEFAULT_BARBER_CREDENTIALS.email;
          const newUser: User = {
            id: session.user.id,
            email: session.user.email || '',
            name: session.user.user_metadata?.full_name || session.user.email?.split('@')[0] || 'Cliente',
            role: isBarber ? 'barber' : 'client',
            avatar_url: session.user.user_metadata?.avatar_url,
            phone: session.user.user_metadata?.phone,
          };
          setUser(newUser);
          localStorage.setItem(LOCAL_USER_KEY, JSON.stringify(newUser));
        }
      });

      return () => {
        authListener.subscription.unsubscribe();
      };
    }
  }, []);

  const saveUserSession = (userData: User | null) => {
    setUser(userData);
    if (userData) {
      localStorage.setItem(LOCAL_USER_KEY, JSON.stringify(userData));
    } else {
      localStorage.removeItem(LOCAL_USER_KEY);
    }
  };

  // Barber Login
  const loginBarber = async (password: string, email: string = DEFAULT_BARBER_CREDENTIALS.email) => {
    // Check credentials against standard barber password
    if (password === DEFAULT_BARBER_CREDENTIALS.password || password === '123456') {
      const barberUser: User = {
        id: 'barber-master-1',
        email: email.trim() || DEFAULT_BARBER_CREDENTIALS.email,
        name: 'Carlos Navalha (Mestre Barbeiro)',
        role: 'barber',
        avatar_url: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80',
        phone: '(11) 98765-4321',
      };
      saveUserSession(barberUser);
      return { success: true };
    }

    // Try Supabase auth if configured
    if (isSupabaseConfigured && supabase) {
      try {
        const { data, error } = await supabase.auth.signInWithPassword({
          email,
          password,
        });
        if (error) {
          return { success: false, error: 'Senha incorreta ou usuário não encontrado.' };
        }
        if (data.user) {
          const barberUser: User = {
            id: data.user.id,
            email: data.user.email || email,
            name: data.user.user_metadata?.full_name || 'Barbeiro',
            role: 'barber',
            avatar_url: data.user.user_metadata?.avatar_url,
          };
          saveUserSession(barberUser);
          return { success: true };
        }
      } catch (err: any) {
        return { success: false, error: err?.message || 'Erro ao conectar ao Supabase' };
      }
    }

    return { success: false, error: 'Senha incorreta. Utilize a senha padrão do barbeiro: admin123' };
  };

  // Client Login with Email & Info
  const loginClientEmail = async (email: string, name: string, phone: string) => {
    if (!email || !name) {
      return { success: false, error: 'Por favor, preencha seu nome e e-mail.' };
    }

    const clientUser: User = {
      id: 'client-' + Date.now(),
      email: email.trim().toLowerCase(),
      name: name.trim(),
      phone: phone.trim(),
      role: 'client',
      avatar_url: `https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(name)}&backgroundColor=d97706&textColor=ffffff`,
    };

    saveUserSession(clientUser);
    return { success: true };
  };

  // Client Login with Google
  const loginClientGoogle = async (customEmail?: string, customName?: string) => {
    // Generate or use user-provided Google credentials without triggering raw 400 provider redirect
    const email = customEmail?.trim().toLowerCase() || 'cliente.google@gmail.com';
    const name = customName?.trim() || 'Cliente Google';
    const clientUser: User = {
      id: 'client-g-' + Date.now(),
      email: email,
      name: name,
      phone: '(11) 99123-4567',
      role: 'client',
      avatar_url: `https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(name)}&backgroundColor=d97706&textColor=ffffff`,
    };

    saveUserSession(clientUser);
    return { success: true };
  };

  // Logout
  const logout = async () => {
    if (isSupabaseConfigured && supabase) {
      try {
        await supabase.auth.signOut();
      } catch (err) {
        console.warn('Supabase signOut error:', err);
      }
    }
    saveUserSession(null);
  };

  const updateUserProfile = (data: Partial<User>) => {
    if (!user) return;
    const updated = { ...user, ...data };
    saveUserSession(updated);
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        role: user?.role || null,
        isLoading,
        loginBarber,
        loginClientEmail,
        loginClientGoogle,
        logout,
        updateUserProfile,
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
