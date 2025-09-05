'use client';

import React, { createContext, useContext, useState, useEffect, ReactNode, useCallback } from 'react';
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

  // Memoize checkAuth to prevent recreation on every render
  const checkAuth = useCallback(async (): Promise<boolean> => {
    try {
      console.log('🔐 checkAuth: Starting...');
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

      // Validate token with backend
      console.log('🔐 checkAuth: Validating existing token...');
      const response = await fetch(API_ENDPOINTS.VALIDATE, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ token })
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
        localStorage.removeItem('token');
        localStorage.removeItem('tokenExpiry');
        setUser(null);
        setIsLoading(false);
        return false;
      }
    } catch (error) {
      console.error('🔐 checkAuth: Error:', error);
      localStorage.removeItem('token');
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
        
        // Construct user object with name field
        const userData = {
          ...loginData.user,
          name: `${loginData.user.firstName || ''} ${loginData.user.lastName || ''}`.trim() || loginData.user.email
        };
        
        // Calculate expiry time (7 days from now, matching backend JWT expiry)
        const expiresAt = Date.now() + (7 * 24 * 60 * 60 * 1000);
        
        // Store token and user data
        localStorage.setItem('token', loginData.token);
        localStorage.setItem('tokenExpiry', expiresAt.toString());
        setUser(userData);
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
  const logout = useCallback(() => {
    console.log('🔐 Logout: Starting logout process...');
    
    // Clear localStorage
    localStorage.removeItem('token');
    localStorage.removeItem('tokenExpiry');
    // Clear custom template background data on logout
    localStorage.removeItem('customTemplateBackgrounds');
    localStorage.removeItem('templateBackgrounds');
    
    // Clear any potential cookies (in case they exist)
    document.cookie = 'token=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;';
    
    console.log('🔐 Logout: Cleared all storage and cookies');
    
    // Clear user state
    setUser(null);
    
    console.log('🔐 Logout: Cleared user state, redirecting to login...');
    
    // Force redirect to login page
    window.location.href = '/login';
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
