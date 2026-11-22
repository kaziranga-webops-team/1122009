'use client';

import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { UserProfile, UserRole } from '@/types/portal';
import { normalizeDisplayName } from '@/lib/portal/utils/nameNormalization';
import { isMockMode, auth, googleProvider, db } from '@/lib/firebase';
import { signInWithPopup, signOut as firebaseSignOut, onAuthStateChanged, User as FirebaseUser } from 'firebase/auth';
import { doc, getDoc, setDoc, updateDoc, onSnapshot, Unsubscribe } from 'firebase/firestore';
import { mockStore } from '@/lib/portal/firebase/mockStore';
import { INITIAL_SUPER_ADMIN_EMAILS } from '@/lib/portal/firebase/mockData';
import { useToast } from '@/components/portal/ui/Toast';
import { canViewAs, effectiveScope } from '@/lib/portal/roles';
import { readViewAs, writeViewAs, type ViewAs } from '@/lib/portal/viewAs';

interface AuthContextType {
  /**
   * The signed-in person as the portal should treat them right now: their own
   * profile, with the role (and communities) they are viewing the portal as.
   */
  user: UserProfile | null;
  /** The role on their actual profile, whatever they are viewing as. */
  realRole: UserRole | null;
  /** The role they have switched to, or null when viewing as themselves. */
  viewAs: ViewAs | null;
  /** Switch the portal to a lower role (or back to your own). */
  setViewAs: (role: UserRole, community?: string | null) => Promise<void>;
  deniedEmail: string | null;
  loading: boolean;
  isAccessDenied: boolean;
  loginWithGoogle: () => Promise<void>;
  logout: () => Promise<void>;
  updateProfile: (data: Partial<UserProfile>) => Promise<void>;
  switchDemoRole: (role: UserRole) => void;
  refreshUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  // Safe: <ToastProvider> wraps <AuthProvider> in the root layout.
  const toast = useToast();
  const [account, setAccount] = useState<UserProfile | null>(null);
  const [viewAs, setViewAsState] = useState<ViewAs | null>(null);
  const [deniedEmail, setDeniedEmail] = useState<string | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [isAccessDenied, setIsAccessDenied] = useState<boolean>(false);
  const router = useRouter();

  const handleDemotionCheck = (newRole: UserRole) => {
    if (typeof window === 'undefined') return;
    const currentPath = window.location.pathname;

    if (currentPath.startsWith('/super-admin') && newRole !== 'SUPER_ADMIN') {
      console.warn('[AuthContext] Super Admin role demoted. Redirecting away from privileged route:', currentPath);
      router.replace('/dashboard');
    } else if (currentPath.startsWith('/admin') && newRole === 'USER') {
      console.warn('[AuthContext] Admin role demoted to User. Redirecting away from privileged route:', currentPath);
      router.replace('/dashboard');
    }
  };

  const handleFirebaseUserLogin = async (fbUser: FirebaseUser): Promise<boolean> => {
    const email = fbUser.email!.trim().toLowerCase();
    const isInitialSuperAdmin = INITIAL_SUPER_ADMIN_EMAILS.some((e) => e.toLowerCase() === email);

    // Check allowed users collection, bypass if initial super admin
    const allowedDocRef = doc(db, 'allowedUsers', email);
    const allowedSnap = await getDoc(allowedDocRef);

    if (!allowedSnap.exists() && !isInitialSuperAdmin) {
      setIsAccessDenied(true);
      setDeniedEmail(email);
      setAccount(null);
      router.push('/access-denied');
      return false;
    }

    setIsAccessDenied(false);
    setDeniedEmail(null);

    // Ensure initial profile doc exists in Firestore if first login
    const userDocRef = doc(db, 'users', fbUser.uid);
    const userSnap = await getDoc(userDocRef);

    if (userSnap.exists()) {
      await updateDoc(userDocRef, { lastLoginAt: new Date().toISOString() });
    } else {
      const normalizedName = normalizeDisplayName(fbUser.displayName || 'Kaziranga Student');
      const defaultRole: UserRole = isInitialSuperAdmin ? 'SUPER_ADMIN' : 'USER';

      const newProfile: UserProfile = {
        uid: fbUser.uid,
        email: fbUser.email!,
        name: normalizedName,
        phone: '',
        region: '',
        level: '',
        programme: '',
        role: defaultRole,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        lastLoginAt: new Date().toISOString(),
        avatarUrl: fbUser.photoURL || undefined,
      };

      await setDoc(userDocRef, newProfile);
    }
    return true;
  };

  useEffect(() => {
    if (isMockMode) {
      const active = mockStore.getActiveUser();
      setAccount(active);
      setLoading(false);

      const unsubscribe = mockStore.subscribe(() => {
        const activeUser = mockStore.getActiveUser();
        if (activeUser) {
          const isSuperAdminEmail = INITIAL_SUPER_ADMIN_EMAILS.some(
            (e) => e.toLowerCase() === activeUser.email.toLowerCase()
          );
          if (!mockStore.isEmailAllowed(activeUser.email) && !isSuperAdminEmail) {
            console.warn('[AuthContext] User access revoked in latest allowed list:', activeUser.email);
            setAccount(null);
            setIsAccessDenied(true);
            setDeniedEmail(activeUser.email);
            router.push('/access-denied');
            return;
          }
          setAccount(activeUser);
          handleDemotionCheck(activeUser.role);
        } else {
          setAccount(null);
        }
      });
      return () => unsubscribe();
    } else {
      if (typeof window !== 'undefined') {
        try {
          localStorage.removeItem('kazi_active_user');
        } catch {
          // ignore localStorage access errors
        }
      }
      let unsubscribeProfileDoc: Unsubscribe | null = null;

      // Real Firebase Auth Listener with real-time Firestore profile subscription
      const unsubscribeAuth = onAuthStateChanged(auth, async (fbUser) => {
        setLoading(true);

        if (unsubscribeProfileDoc) {
          unsubscribeProfileDoc();
          unsubscribeProfileDoc = null;
        }

        if (fbUser && fbUser.email) {
          try {
            const isAllowed = await handleFirebaseUserLogin(fbUser);
            if (!isAllowed) {
              setLoading(false);
              return;
            }

            // Real-time Firestore Listener for logged-in user profile / role changes
            const userDocRef = doc(db, 'users', fbUser.uid);
            unsubscribeProfileDoc = onSnapshot(
              userDocRef,
              (snapshot) => {
                if (snapshot.exists()) {
                  const liveProfile = { uid: snapshot.id, ...snapshot.data() } as UserProfile;
                  console.log('[AuthContext] Real-time profile/role update received:', liveProfile.role);
                  setAccount(liveProfile);
                  handleDemotionCheck(liveProfile.role);
                }
                setLoading(false);
              },
              (err) => {
                console.error('[AuthContext] Profile snapshot listener error:', err);
                setLoading(false);
              }
            );
          } catch (err) {
            console.error('Login error:', err);
            setIsAccessDenied(true);
            setAccount(null);
            router.push('/access-denied');
            setLoading(false);
          }
        } else {
          setAccount(null);
          setLoading(false);
        }
      });

      return () => {
        if (unsubscribeProfileDoc) unsubscribeProfileDoc();
        unsubscribeAuth();
      };
    }
  }, []);

  const loginWithGoogle = async () => {
    setLoading(true);
    setIsAccessDenied(false);

    if (isMockMode) {
      const currentMock = mockStore.getActiveUser() || mockStore.getUsers()[0];
      mockStore.setActiveUser(currentMock);
      setAccount(currentMock);
      setLoading(false);
      router.push('/dashboard');
      return;
    }

    try {
      const result = await signInWithPopup(auth, googleProvider);
      if (result.user) {
        const isAllowed = await handleFirebaseUserLogin(result.user);
        if (isAllowed) {
          router.push('/dashboard');
        }
      }
    } catch (error: any) {
      console.error('Google Sign In Error:', error);
      if (error?.code !== 'auth/popup-closed-by-user') {
        toast.error('Sign-in failed', error.message || 'An unexpected error occurred.');
      }
    } finally {
      setLoading(false);
    }
  };

  const logout = async () => {
    writeViewAs(null);
    setViewAsState(null);

    if (isMockMode) {
      mockStore.setActiveUser(null);
      setAccount(null);
      router.push('/login');
      return;
    }

    await firebaseSignOut(auth);
    setAccount(null);
    router.push('/login');
  };

  const updateProfile = async (data: Partial<UserProfile>) => {
    if (!account) return;

    if (isMockMode) {
      const updated = mockStore.updateUserProfile(account.uid, data);
      setAccount(updated);
      return;
    }

    const docRef = doc(db, 'users', account.uid);
    const updates = {
      ...data,
      updatedAt: new Date().toISOString(),
    };
    delete (updates as any).role;
    delete (updates as any).email;

    await updateDoc(docRef, updates);
    setAccount((prev) => (prev ? { ...prev, ...updates } : null));
  };

  const switchDemoRole = (role: UserRole) => {
    if (!isMockMode) return;
    writeViewAs(null);
    setViewAsState(null);
    const targetUser = mockStore.getUsers().find((u) => u.role === role) || mockStore.getUsers()[0];
    mockStore.setActiveUser(targetUser);
    setAccount(targetUser);
  };

  const refreshUser = async () => {
    if (isMockMode) {
      setAccount(mockStore.getActiveUser());
      return;
    }

    const fbUser = auth?.currentUser;
    if (!fbUser) {
      setAccount(null);
      return;
    }

    const userSnap = await getDoc(doc(db, 'users', fbUser.uid));
    if (userSnap.exists()) {
      setAccount({ uid: userSnap.id, ...userSnap.data() } as UserProfile);
    }
  };

  // The chosen view survives a reload within this tab.
  useEffect(() => {
    setViewAsState(readViewAs());
  }, []);

  // A view the account may no longer take (after a demotion, say) is dropped.
  useEffect(() => {
    if (account && viewAs && !canViewAs(account.role, viewAs.role)) {
      writeViewAs(null);
      setViewAsState(null);
    }
  }, [account, viewAs]);

  const user = useMemo<UserProfile | null>(() => {
    if (!account) return null;
    const scope = effectiveScope(
      { role: account.role, communitySlugs: account.communitySlugs ?? [] },
      viewAs?.role,
      viewAs?.community
    );
    return { ...account, role: scope.role, communitySlugs: scope.communitySlugs };
  }, [account, viewAs]);

  const setViewAs = useCallback(
    async (role: UserRole, community?: string | null) => {
      if (!account || !canViewAs(account.role, role)) return;
      const next: ViewAs | null =
        role === account.role ? null : { role, community: role === 'COMMUNITY_HEAD' ? community ?? null : null };
      writeViewAs(next);
      setViewAsState(next);

      if (isMockMode) return;
      try {
        const token = await auth?.currentUser?.getIdToken();
        if (!token) return;
        await fetch('/api/portal/view-as', {
          method: 'POST',
          headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
          body: JSON.stringify({ role, community: next?.community ?? null }),
        });
      } catch {
        // The switch already applies; only the audit entry was missed.
      }
    },
    [account]
  );

  return (
    <AuthContext.Provider
      value={{
        user,
        realRole: account?.role ?? null,
        viewAs,
        setViewAs,
        deniedEmail,
        loading,
        isAccessDenied,
        loginWithGoogle,
        logout,
        updateProfile,
        switchDemoRole,
        refreshUser,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used within an AuthProvider');
  return context;
};
