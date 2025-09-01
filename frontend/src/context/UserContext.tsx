'use client';
import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { useRouter, usePathname } from 'next/navigation';

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

  
  useEffect(() => {
    if (!isClient) return;
    
    const fetchUser = async () => {
      try {
        const token = getTokenFromStorage();
        console.log('UserContext: token from localStorage =', token); // Debug log
        
        if (!token) {
          if (pathname !== '/login' && pathname !== '/signup') {
            router.replace('/login');
          }
          return;
        }
        
        // Preserve context by capturing current values
        const currentPathname = pathname;
        const currentRouter = router;
        
        const res = await fetch('http://localhost:4000/api/auth/validate', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ token }),
        });
        
        if (res.ok) {
          const userData = await res.json();
          setUser(userData);
        } else {
          setUser(null);
          // Use captured context values to avoid stale closure
          if (currentPathname !== '/login' && currentPathname !== '/signup') {
            currentRouter.replace('/login');
          }
        }
      } catch (error) {
        console.error('Error fetching user:', error);
        setUser(null);
        // Handle error case with proper context
        if (pathname !== '/login' && pathname !== '/signup') {
          router.replace('/login');
        }
      }
    };
    
    // Execute with proper error handling
    fetchUser().catch(error => {
      console.error('Unhandled error in fetchUser:', error);
    });
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
