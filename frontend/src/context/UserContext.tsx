'use client';
import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { useRouter, usePathname } from 'next/navigation';

import API_ENDPOINTS from '@/config/api';
type User = { id: string; plan: 'Free' | 'Premium' | 'Ultra-Premium' } | null;
const UserContext = createContext<{ user: User; setUser: (u: User) => void }>({ user: null, setUser: () => {} });

export function UserProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User>(null);
  const [isClient, setIsClient] = useState(false);
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    setIsClient(true);
  }, []);

  // Remove authentication logic - this should be handled by AuthContext only
  // UserContext should only manage user plan data, not authentication

  return <UserContext.Provider value={{ user, setUser }}>{children}</UserContext.Provider>;
}

export function useUser() {
  return useContext(UserContext);
}

export function getTokenFromStorage() {
  if (typeof window === 'undefined') return '';
  return localStorage.getItem('token') || '';
}
