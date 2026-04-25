import { createContext, useCallback, useContext, useMemo, useState, type ReactNode } from 'react';
import { appUsers } from '../data/demoData';
import type { AppUser, UserRole } from '../types';

const SIGN_IN_URL =
  'https://gfmapi-fpgth4e8aqa8auae.northeurope-01.azurewebsites.net/api/SignIn?code=eImUYC7SFcPbIzEAWlmltgMPArf1FN90YvHW1Po4AydxAzFuNAG77g==';

interface SignInApiResponse {
  message: string;
  user?: {
    id: string;
    fullName: string;
    email: string;
    role: UserRole;
    department: string;
  };
}

interface AuthContextValue {
  user: AppUser | null;
  adminUsers: AppUser[];
  viewerUsers: AppUser[];
  login: (role: UserRole, userId: string, password: string) => Promise<{ ok: boolean; message: string }>;
  logout: () => void;
  changePassword: (currentPassword: string, nextPassword: string) => { ok: boolean; message: string };
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

const USER_KEY = 'momentum_incident_user';
const PASSWORDS_KEY = 'momentum_incident_passwords';

function readPasswordStore(): Record<string, string> {
  const raw = localStorage.getItem(PASSWORDS_KEY);
  if (raw) {
    try {
      return JSON.parse(raw) as Record<string, string>;
    } catch {
      localStorage.removeItem(PASSWORDS_KEY);
    }
  }
  const seeded = Object.fromEntries(appUsers.map((u) => [u.id, u.initialPassword]));
  localStorage.setItem(PASSWORDS_KEY, JSON.stringify(seeded));
  return seeded;
}

function savePasswordStore(store: Record<string, string>) {
  localStorage.setItem(PASSWORDS_KEY, JSON.stringify(store));
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AppUser | null>(() => {
    const raw = localStorage.getItem(USER_KEY);
    return raw ? (JSON.parse(raw) as AppUser) : null;
  });

  const adminUsers = useMemo(() => appUsers.filter((item) => item.role === 'admin'), []);
  const viewerUsers = useMemo(() => appUsers.filter((item) => item.role === 'viewer' || item.role === 'admin'), []);

  const login = useCallback(async (role: UserRole, userId: string, password: string) => {
    const selected = appUsers.find((item) => item.id === userId);
    if (!selected) {
      return { ok: false, message: 'Please select your name.' };
    }
    if (selected.role !== role && !(role === 'viewer' && selected.role === 'admin')) {
      return { ok: false, message: 'This user is not allowed in the selected login area.' };
    }

    try {
      const response = await fetch(SIGN_IN_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: selected.email, password }),
      });

      const data = (await response.json()) as SignInApiResponse;

      if (!response.ok || !data.user) {
        return { ok: false, message: data.message ?? 'Sign in failed.' };
      }

      const loggedInUser: AppUser = {
        id: data.user.id,
        fullName: data.user.fullName,
        email: data.user.email,
        role,
        department: data.user.department,
      };
      localStorage.setItem(USER_KEY, JSON.stringify(loggedInUser));
      setUser(loggedInUser);
      return { ok: true, message: data.message };
    } catch {
      return { ok: false, message: 'Could not reach the sign-in service. Please try again.' };
    }
  }, []);

  const logout = useCallback(() => {
    localStorage.removeItem(USER_KEY);
    setUser(null);
  }, []);

  const changePassword = useCallback(
    (currentPassword: string, nextPassword: string) => {
      if (!user) {
        return { ok: false, message: 'No user is currently logged in.' };
      }
      const passwords = readPasswordStore();
      if (passwords[user.id] !== currentPassword) {
        return { ok: false, message: 'Current password is incorrect.' };
      }
      if (nextPassword.trim().length < 8) {
        return { ok: false, message: 'The new password must be at least 8 characters.' };
      }
      passwords[user.id] = nextPassword.trim();
      savePasswordStore(passwords);
      return { ok: true, message: 'Password changed successfully.' };
    },
    [user],
  );

  const value = useMemo<AuthContextValue>(
    () => ({ user, adminUsers, viewerUsers, login, logout, changePassword }),
    [adminUsers, changePassword, login, logout, user, viewerUsers],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthContextValue {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used inside AuthProvider');
  }
  return context;
}
