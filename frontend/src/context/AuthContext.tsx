'use client';

import React, { createContext, useContext, useState, useEffect, ReactNode, useCallback } from 'react';
import { User, AuthToken, LoginResponse } from '@/types';

interface AuthContextType {
  user: User | null;
  isLoading: boolean;
  login: (token: string) => Promise<void>;
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

  // Memoize checkAuth to prevent recreation on every render
  const checkAuth = useCallback(async (): Promise<boolean> => {
    try {
      console.log('🔐 checkAuth: Starting...');
      const token = localStorage.getItem('authToken');
      console.log('🔐 checkAuth: Token from localStorage:', token ? 'exists' : 'none');
      
      if (!token) {
        // No token exists - create a demo session automatically
        console.log('🔐 checkAuth: No token found, creating demo session...');
        
        try {
          const response = await fetch('/api/auth/login', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json'
            },
            body: JSON.stringify({ token: 'demo_token' })
          });

          console.log('🔐 checkAuth: Demo login response status:', response.status);

          if (response.ok) {
            const loginData: LoginResponse = await response.json();
            console.log('🔐 checkAuth: Demo login successful, user:', loginData.user.name);
            
            // Store token and user data
            localStorage.setItem('authToken', loginData.token);
            localStorage.setItem('tokenExpiry', loginData.expiresAt.toString());
            setUser(loginData.user);
            setIsLoading(false);
            return true;
          }
        } catch (demoError) {
          console.log('🔐 checkAuth: Demo login failed:', demoError);
        }
        
        // If demo login fails, just set loading to false
        console.log('🔐 checkAuth: Setting loading to false, no user');
        
        // Create a fallback demo user if API fails
        const fallbackUser: User = {
          id: 'demo_user',
          name: 'Usuario Demo',
          email: 'demo@example.com',
          plan: 'Premium'
        };
        
        console.log('🔐 checkAuth: Creating fallback demo user');
        setUser(fallbackUser);
        setIsLoading(false);
        return true;
      }

      // Check if token is expired
      const expiry = localStorage.getItem('tokenExpiry');
      if (expiry && Date.now() > parseInt(expiry)) {
        console.log('🔐 checkAuth: Token expired, clearing...');
        localStorage.removeItem('authToken');
        localStorage.removeItem('tokenExpiry');
        setUser(null);
        setIsLoading(false);
        return false;
      }

      // Validate token with backend
      console.log('🔐 checkAuth: Validating existing token...');
      const response = await fetch('/api/auth/validate', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      console.log('🔐 checkAuth: Token validation response status:', response.status);

      if (response.ok) {
        const userData: User = await response.json();
        console.log('🔐 checkAuth: Token valid, user:', userData.name);
        setUser(userData);
        setIsLoading(false);
        return true;
      } else {
        // Token invalid, clear storage
        console.log('🔐 checkAuth: Token invalid, clearing...');
        localStorage.removeItem('authToken');
        localStorage.removeItem('tokenExpiry');
        setUser(null);
        setIsLoading(false);
        return false;
      }
    } catch (error) {
      console.error('🔐 checkAuth: Error:', error);
      localStorage.removeItem('authToken');
      localStorage.removeItem('tokenExpiry');
      setUser(null);
      setIsLoading(false);
      return false;
    }
  }, []); // Empty dependency array since this function doesn't depend on any state

  // Check if user is authenticated on mount - only run once
  useEffect(() => {
    let mounted = true;
    
    const initAuth = async () => {
      if (mounted) {
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
  }, [checkAuth, isLoading]);

  // Login with token from main platform
  const login = useCallback(async (token: string): Promise<void> => {
    try {
      setIsLoading(true);
      
      // Validate token and get user data
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ token })
      });

      if (response.ok) {
        const loginData: LoginResponse = await response.json();
        
        // Store token and user data
        localStorage.setItem('authToken', loginData.token);
        localStorage.setItem('tokenExpiry', loginData.expiresAt.toString());
        setUser(loginData.user);
      } else {
        throw new Error('Invalid token');
      }
    } catch (error) {
      console.error('Login error:', error);
      throw error;
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Logout user
  const logout = useCallback(() => {
    localStorage.removeItem('authToken');
    localStorage.removeItem('tokenExpiry');
    setUser(null);
    
    // Redirect to main platform
    window.location.href = process.env.NEXT_PUBLIC_MAIN_PLATFORM_URL || '/';
  }, []);

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
