'use client';

import React, { createContext, useContext, useState, useEffect, ReactNode, useCallback, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { User, AuthToken, LoginResponse } from '@/types';
import API_ENDPOINTS from '@/config/api';

interface AuthContextType {
  user: User | null;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<void>;
  logout: () => void;
  checkAuth: () => Promise<boolean>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

interface AuthProviderProps {
  children: ReactNode;
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const authAttempted = useRef(false);

  // Memoize checkAuth to prevent recreation on every render
  const checkAuth = useCallback(async (retryCount = 0): Promise<boolean> => {
    try {
      console.log('🔐 checkAuth: Starting... (attempt', retryCount + 1, ')');
      const token = localStorage.getItem('token');
      console.log('🔐 checkAuth: Token from localStorage:', token ? 'exists' : 'none');
      
      if (!token) {
        // No token exists - user needs to login
        console.log('🔐 checkAuth: No token found, user needs to login');
        setUser(null);
        setIsLoading(false);
        return false;
      }

      // Check if token is expired
      const expiry = localStorage.getItem('tokenExpiry');
      if (expiry && Date.now() > parseInt(expiry)) {
        console.log('🔐 checkAuth: Token expired, clearing...');
        localStorage.removeItem('token');
        localStorage.removeItem('tokenExpiry');
        setUser(null);
        setIsLoading(false);
        return false;
      }

      // Restore user from localStorage without any API validation
      const storedUser = localStorage.getItem('user');
      if (storedUser) {
        try {
          const userData = JSON.parse(storedUser);
          console.log('🔐 checkAuth: Restored user from localStorage:', userData.name);
          setUser(userData);
          setIsLoading(false);
          return true;
        } catch (parseError) {
          console.error('🔐 checkAuth: Error parsing stored user:', parseError);
        }
      }

      // If no stored user, just set loading to false and return false
      console.log('🔐 checkAuth: No stored user found');
      setUser(null);
      setIsLoading(false);
      return false;
    } catch (error) {
      console.error('🔐 checkAuth: Error:', error);
      setUser(null);
      setIsLoading(false);
      return false;
    }
  }, []); // Empty dependency array since this function doesn't depend on any state

  // Check if user is authenticated on mount - only run once
  useEffect(() => {
    let mounted = true;
    
    const initAuth = async () => {
      if (mounted && !authAttempted.current) {
        authAttempted.current = true;
        console.log('🔐 AuthContext: Starting authentication check...');
        
        // Add timeout to prevent infinite loading
        const timeoutId = setTimeout(() => {
          if (mounted && isLoading) {
            console.log('🔐 AuthContext: Authentication timeout, setting loading to false');
            setIsLoading(false);
          }
        }, 10000); // 10 second timeout
        
        const result = await checkAuth();
        console.log('🔐 AuthContext: Authentication result:', result);
        
        // Clear timeout if authentication completed
        clearTimeout(timeoutId);
      }
    };

    initAuth();

    // Cleanup function to prevent state updates on unmounted component
    return () => {
      mounted = false;
    };
  }, []); // Empty dependency array to run only once on mount

  // Login with email and password
  const login = useCallback(async (email: string, password: string): Promise<void> => {
    try {
      setIsLoading(true);
      
      // Send email and password to backend for authentication
      const response = await fetch(API_ENDPOINTS.SIGNIN, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ email, password })
      });

      if (response.ok) {
        const loginData = await response.json();
        console.log('🔐 Login: Login successful, data:', loginData);
        
        // Construct user object with name field
        const userData: User = {
          ...loginData.user,
          name: loginData.user.username || loginData.user.email
        };
        
        console.log('🔐 Login: Constructed user data:', userData);
        
        // Calculate expiry time (7 days from now, matching backend JWT expiry)
        const expiresAt = Date.now() + (7 * 24 * 60 * 60 * 1000);
        
        // Store token, user data, and expiry
        localStorage.setItem('token', loginData.token);
        localStorage.setItem('tokenExpiry', expiresAt.toString());
        localStorage.setItem('user', JSON.stringify(userData));
        setUser(userData);
        
        console.log('🔐 Login: User state set, token stored');
      } else {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Invalid credentials');
      }
    } catch (error) {
      console.error('Login error:', error);
      throw error;
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Logout user
  const router = useRouter();

  const logout = useCallback(() => {
    // Capture callsite to track unexpected triggers
    try { throw new Error('Logout stacktrace'); } catch (e) { console.warn('🔐 Logout: Stacktrace (who called logout):', e); }
    console.log('🔐 Logout: Starting logout process...');
    
    // Clear localStorage
    localStorage.removeItem('token');
    localStorage.removeItem('tokenExpiry');
    localStorage.removeItem('user');
    // Clear custom template background data on logout
    localStorage.removeItem('customTemplateBackgrounds');
    // Note: templateBackgrounds are now stored in backend, no localStorage cleanup needed
    
    // Clear any potential cookies (in case they exist)
    document.cookie = 'token=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;';
    
    console.log('🔐 Logout: Cleared all storage and cookies');
    
    // Clear user state
    setUser(null);
    
    console.log('🔐 Logout: Cleared user state, redirecting to login...');
    
    // Use Next router to avoid full reloads
    router.replace('/login');
  }, [router]);

  const value: AuthContextType = {
    user,
    isLoading,
    login,
    logout,
    checkAuth
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};
