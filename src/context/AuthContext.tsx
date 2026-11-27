import React, { createContext, useContext, useEffect, useState } from 'react';
import {
  User,
  createUserWithEmailAndPassword,
  onAuthStateChanged,
  sendEmailVerification,
  sendPasswordResetEmail,
  signInWithEmailAndPassword,
  signInWithPopup,
  signOut,
  updateProfile,
} from 'firebase/auth';
import { doc, getDoc, serverTimestamp, setDoc } from 'firebase/firestore';
import { auth, db, googleProvider } from '../lib/firebase';
import { fetchAuthIdentity } from '../services/api';
import { createNotification, ensureStudioSeededByAdmin } from '../services/studioService';
import { UserProfile } from '../types/studio';

interface AuthContextValue {
  user: User | null;
  profile: UserProfile | null;
  isAdmin: boolean;
  isAuthReady: boolean;
  emailVerified: boolean;
  loginWithGoogle: () => Promise<void>;
  loginWithEmail: (email: string, password: string) => Promise<void>;
  registerWithEmail: (name: string, email: string, password: string) => Promise<void>;
  requestPasswordReset: (email: string) => Promise<void>;
  resendVerification: () => Promise<void>;
  refreshUserSession: () => Promise<void>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | null>(null);

async function syncUserFirestoreProfile(firebaseUser: User): Promise<UserProfile | null> {
  if (!firebaseUser.emailVerified) return null;
  const userRef = doc(db, 'users', firebaseUser.uid);
  const privateRef = doc(db, 'users', firebaseUser.uid, 'private', 'info');

  try {
    const snap = await getDoc(userRef);
    if (!snap.exists()) {
      const displayName = (firebaseUser.displayName || firebaseUser.email?.split('@')[0] || 'Client').slice(0, 100);
      const newProfile: UserProfile = {
        uid: firebaseUser.uid,
        displayName,
        photoURL: (firebaseUser.photoURL || '').slice(0, 500),
        role: 'customer',
        accountStatus: 'active',
      };
      await setDoc(userRef, {
        ...newProfile,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      });
      await setDoc(privateRef, {
        uid: firebaseUser.uid,
        email: (firebaseUser.email || '').slice(0, 160),
        phone: '',
        preferredStyle: '',
        bio: '',
        updatedAt: serverTimestamp(),
      });
      await createNotification({
        recipientId: 'admin',
        type: 'customer_registered',
        title: 'New Customer Registered',
        message: `${displayName} created a studio account.`,
      });
      return newProfile;
    }
    return snap.data() as UserProfile;
  } catch (err) {
    console.warn('Could not sync user profile:', err);
    return null;
  }
}

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [isAuthReady, setIsAuthReady] = useState(false);

  const hydrateIdentity = async (firebaseUser: User | null) => {
    setUser(firebaseUser);
    if (!firebaseUser) {
      setProfile(null);
      setIsAdmin(false);
      setIsAuthReady(true);
      return;
    }

    try {
      const identity = await fetchAuthIdentity();
      setIsAdmin(identity.isAdmin);
      if (identity.isAdmin) {
        await ensureStudioSeededByAdmin();
      }
    } catch {
      setIsAdmin(false);
    }

    const synced = await syncUserFirestoreProfile(firebaseUser);
    setProfile(synced);
    setIsAuthReady(true);
  };

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, (firebaseUser) => {
      void hydrateIdentity(firebaseUser);
    });
    return () => unsub();
  }, []);

  const loginWithGoogle = async () => {
    await signInWithPopup(auth, googleProvider);
  };

  const loginWithEmail = async (email: string, password: string) => {
    await signInWithEmailAndPassword(auth, email.trim(), password);
  };

  const registerWithEmail = async (name: string, email: string, password: string) => {
    const cred = await createUserWithEmailAndPassword(auth, email.trim(), password);
    await updateProfile(cred.user, { displayName: name.trim().slice(0, 100) });
    await sendEmailVerification(cred.user);
  };

  const requestPasswordReset = async (email: string) => {
    await sendPasswordResetEmail(auth, email.trim());
  };

  const resendVerification = async () => {
    if (!auth.currentUser) return;
    await sendEmailVerification(auth.currentUser);
  };

  const refreshUserSession = async () => {
    if (!auth.currentUser) return;
    await auth.currentUser.reload();
    await auth.currentUser.getIdToken(true);
    await hydrateIdentity(auth.currentUser);
  };

  const logout = async () => {
    await signOut(auth);
    setUser(null);
    setProfile(null);
    setIsAdmin(false);
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        profile,
        isAdmin,
        isAuthReady,
        emailVerified: Boolean(user?.emailVerified),
        loginWithGoogle,
        loginWithEmail,
        registerWithEmail,
        requestPasswordReset,
        resendVerification,
        refreshUserSession,
        logout,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) {
    throw new Error('useAuth must be used inside AuthProvider');
  }
  return ctx;
}
