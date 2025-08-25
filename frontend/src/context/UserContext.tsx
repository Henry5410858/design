'use client';
import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { useRouter, usePathname } from 'next/navigation';

type User = { id: string; plan: string; role: string } | null;
const UserContext = createContext<{ user: User; setUser: (u: User) => void }>({ user: null, setUser: () => {} });

export function UserProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User>(null);
  const [isClient, setIsClient] = useState(false);
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    setIsClient(true);
  }, []);

  useEffect(() => {
    if (!isClient) return;
    
    const fetchUser = async () => {
      const token = getTokenFromStorage();
      console.log('UserContext: token from localStorage =', token); // Debug log
      if (!token) {
        if (pathname !== '/login' && pathname !== '/signup') {
          router.replace('/login');
        }
        return;
      }
      const res = await fetch('http://localhost:4000/api/auth/validate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token }),
      });
      if (res.ok) {
        setUser(await res.json());
      } else {
        setUser(null);
        if (pathname !== '/login' && pathname !== '/signup') {
          router.replace('/login');
        }
      }
    };
    fetchUser();
  }, [isClient, router, pathname]);

  return <UserContext.Provider value={{ user, setUser }}>{children}</UserContext.Provider>;
}

export function useUser() {
  return useContext(UserContext);
}

export function getTokenFromStorage() {
  if (typeof window === 'undefined') return '';
  return localStorage.getItem('token') || '';
}
