'use client';

import {
  createContext,
  useContext,
  useEffect,
  useState,
  useCallback,
  type ReactNode,
} from 'react';
import {
  onAuthStateChanged,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signOut,
  sendPasswordResetEmail,
  GoogleAuthProvider,
  signInWithPopup,
  type User,
} from 'firebase/auth';
import { auth } from '@/src/infrastructure/config/firebase';

export type UserType = 'doctor' | 'patient' | 'superadmin' | null;

export interface UserProfile {
  id: string;
  name: string;
  email: string;
  profileImage?: string;
}

interface AuthState {
  user: User | null;
  userType: UserType;
  profile: UserProfile | null;
  loading: boolean;
}

interface AuthContextValue extends AuthState {
  login: (email: string, password: string) => Promise<void>;
  signup: (email: string, password: string) => Promise<User>;
  logout: () => Promise<void>;
  loginWithGoogle: () => Promise<User>;
  resetPassword: (email: string) => Promise<void>;
  refreshUserData: () => Promise<void>;
  getDashboardUrl: () => string;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}

const SUPERADMIN_EMAILS = (
  process.env.NEXT_PUBLIC_SUPERADMIN_EMAILS ?? 'juan@jhernandez.mx'
).split(',');

async function detectUserType(
  user: User,
): Promise<{ userType: UserType; profile: UserProfile | null }> {
  const email = user.email ?? '';

  if (SUPERADMIN_EMAILS.includes(email)) {
    return {
      userType: 'superadmin',
      profile: { id: user.uid, name: 'Super Admin', email, profileImage: user.photoURL ?? undefined },
    };
  }

  try {
    // Check doctor first, then patient via API
    const token = await user.getIdToken();
    const headers = { Authorization: `Bearer ${token}` };

    const doctorRes = await fetch('/api/doctors/me', { headers });
    if (doctorRes.ok) {
      const doctor = await doctorRes.json();
      return {
        userType: 'doctor',
        profile: {
          id: doctor.id,
          name: doctor.name,
          email: doctor.email,
          profileImage: doctor.profileImage,
        },
      };
    }

    const patientRes = await fetch('/api/patients/me', { headers });
    if (patientRes.ok) {
      const patient = await patientRes.json();
      return {
        userType: 'patient',
        profile: {
          id: patient.id,
          name: patient.name,
          email: patient.email,
          profileImage: patient.profileImage,
        },
      };
    }
  } catch {
    // API unreachable — fallback to null
  }

  return { userType: null, profile: null };
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<AuthState>({
    user: null,
    userType: null,
    profile: null,
    loading: true,
  });

  const loadUserData = useCallback(async (user: User) => {
    const { userType, profile } = await detectUserType(user);
    setState({ user, userType, profile, loading: false });
  }, []);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (user) {
        await loadUserData(user);
      } else {
        setState({ user: null, userType: null, profile: null, loading: false });
      }
    });
    return unsubscribe;
  }, [loadUserData]);

  const login = async (email: string, password: string) => {
    await signInWithEmailAndPassword(auth, email, password);
  };

  const signup = async (email: string, password: string) => {
    const cred = await createUserWithEmailAndPassword(auth, email, password);
    return cred.user;
  };

  const logout = async () => {
    await signOut(auth);
  };

  const loginWithGoogle = async () => {
    const provider = new GoogleAuthProvider();
    const cred = await signInWithPopup(auth, provider);
    return cred.user;
  };

  const resetPassword = async (email: string) => {
    await sendPasswordResetEmail(auth, email);
  };

  const refreshUserData = async () => {
    if (state.user) await loadUserData(state.user);
  };

  const getDashboardUrl = () => {
    switch (state.userType) {
      case 'doctor':
        return '/admin';
      case 'patient':
        return '/paciente/dashboard';
      case 'superadmin':
        return '/superadmin';
      default:
        return '/';
    }
  };

  return (
    <AuthContext.Provider
      value={{
        ...state,
        login,
        signup,
        logout,
        loginWithGoogle,
        resetPassword,
        refreshUserData,
        getDashboardUrl,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}
