import React, { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { User as FirebaseUser } from 'firebase/auth';
import {
  registerUser,
  loginUser,
  logoutUser,
  onAuthChange,
  getUserProfile,
} from '../firebase/authService.ts';
import { UserProfile } from '../types.ts';

interface AuthContextType {
  currentUser: FirebaseUser | null;
  userProfile: UserProfile | null;
  loading: boolean;
  login: (email: string, pass: string) => Promise<void>;
  register: (name: string, email: string, pass: string) => Promise<void>;
  logout: () => Promise<void>;
  refreshProfile: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [currentUser, setCurrentUser] = useState<FirebaseUser | null>(null);
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState<boolean>(true);

  const fetchProfile = async (uid: string, fallbackName?: string, fallbackEmail?: string) => {
    try {
      const profile = await getUserProfile(uid);
      if (profile) {
        setUserProfile(profile);
      } else {
        setUserProfile({
          user_id: uid,
          name: fallbackName || 'Friend',
          email: fallbackEmail || '',
          created_at: new Date().toISOString(),
        });
      }
    } catch (err) {
      console.error('Error fetching user profile in AuthContext:', err);
    }
  };

  useEffect(() => {
    const unsubscribe = onAuthChange(async (user) => {
      setCurrentUser(user);
      if (user) {
        await fetchProfile(user.uid, user.displayName || undefined, user.email || undefined);
      } else {
        setUserProfile(null);
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const login = async (email: string, pass: string) => {
    const user = await loginUser(email, pass);
    setCurrentUser(user);
    await fetchProfile(user.uid, user.displayName || undefined, user.email || undefined);
  };

  const register = async (name: string, email: string, pass: string) => {
    const { user, profile } = await registerUser(name, email, pass);
    setCurrentUser(user);
    setUserProfile(profile);
  };

  const logout = async () => {
    await logoutUser();
    setCurrentUser(null);
    setUserProfile(null);
  };

  const refreshProfile = async () => {
    if (currentUser) {
      await fetchProfile(currentUser.uid, currentUser.displayName || undefined, currentUser.email || undefined);
    }
  };

  return (
    <AuthContext.Provider
      value={{
        currentUser,
        userProfile,
        loading,
        login,
        register,
        logout,
        refreshProfile,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth(): AuthContextType {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
