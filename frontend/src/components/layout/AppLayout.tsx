'use client';

import React, { useState, useEffect } from 'react';
import Sidebar from './Sidebar';
import { ThemeProvider } from '@/context/ThemeContext';
import { AuthProvider } from '@/context/AuthContext';
import NotificationManager from '@/components/ui/NotificationManager';

interface AppLayoutProps {
  children: React.ReactNode;
}

const AppLayout: React.FC<AppLayoutProps> = ({ children }) => {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [isMobile, setIsMobile] = useState(false);



  // Handle responsive behavior
  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 1024);
      if (window.innerWidth >= 1024) {
        setSidebarOpen(false);
      }
    };

    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  return (
    <ThemeProvider>
      <AuthProvider>
        <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100 relative overflow-hidden">
          {/* Background Decorations */}
          <div className="absolute inset-0 overflow-hidden pointer-events-none">
            <div className="absolute -top-40 -right-40 w-80 h-80 bg-gradient-to-br from-blue-400/20 to-purple-500/20 rounded-full blur-3xl"></div>
            <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-gradient-to-tr from-indigo-400/20 to-cyan-500/20 rounded-full blur-3xl"></div>
            <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-gradient-to-r from-pink-400/10 to-blue-400/10 rounded-full blur-3xl"></div>
          </div>

          {/* Sidebar */}
          <div className={`fixed inset-y-0 left-0 z-50 w-64 bg-white/95 backdrop-blur-xl shadow-2xl border-r border-white/30 transform transition-transform duration-300 ease-in-out lg:translate-x-0 ${
            sidebarOpen ? 'translate-x-0' : '-translate-x-full'
          }`}>
            {/* Sidebar Header */}
            <div className="flex-shrink-0 flex items-center justify-between p-4 border-b border-gray-200/30">
              <div className="flex items-center space-x-3">
                <div className="w-8 h-8 bg-gradient-to-br from-blue-600 to-purple-600 rounded-lg flex items-center justify-center">
                  <span className="text-white text-lg font-black">🎨</span>
                </div>
                <span className="text-lg font-black text-gray-900">DesignCenter</span>
              </div>
              <button
                onClick={() => setSidebarOpen(false)}
                className="lg:hidden p-2 rounded-lg hover:bg-gray-100 transition-colors duration-200"
              >
                <svg className="w-5 h-5 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            {/* Navigation */}
            <nav className="flex-1 p-4 space-y-2">
              <a href="/" className="flex items-center space-x-3 p-3 rounded-lg hover:bg-gray-100 transition-colors duration-200 group">
                <span className="text-xl">🏠</span>
                <span className="font-medium text-gray-700 group-hover:text-gray-900">Dashboard</span>
              </a>
              <a href="/templates" className="flex items-center space-x-3 p-3 rounded-lg hover:bg-gray-100 transition-colors duration-200 group">
                <span className="text-xl">🎨</span>
                <span className="font-medium text-gray-700 group-hover:text-gray-900">Templates</span>
              </a>
              <a href="/brand-kit" className="flex items-center space-x-3 p-3 rounded-lg hover:bg-gray-100 transition-colors duration-200 group">
                <span className="text-xl">🏷️</span>
                <span className="font-medium text-gray-700 group-hover:text-gray-900">Brand Kit</span>
              </a>
              <a href="/my-designs" className="flex items-center space-x-3 p-3 rounded-lg hover:bg-gray-100 transition-colors duration-200 group">
                <span className="text-xl">📁</span>
                <span className="font-medium text-gray-700 group-hover:text-gray-900">My Designs</span>
              </a>
            </nav>
          </div>

          {/* Mobile Overlay */}
          {sidebarOpen && (
            <div 
              className="fixed inset-0 bg-black/50 backdrop-blur-sm z-40 lg:hidden"
              onClick={() => setSidebarOpen(false)}
            />
          )}

          {/* Main Content */}
          <div className="flex-1 min-h-screen flex flex-col lg:ml-64">
            {/* Top Bar */}
            <div className="fixed top-0 right-0 left-0 lg:left-64 z-40 bg-white/80 backdrop-blur-xl shadow-lg border-b border-white/30 h-20">
              <div className="flex items-center justify-between px-6 py-4 h-full">
                <div className="flex items-center space-x-4">
                  <button
                    onClick={() => setSidebarOpen(true)}
                    className="lg:hidden p-2 rounded-lg hover:bg-gray-100 transition-colors duration-200"
                  >
                    <svg className="w-5 h-5 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                    </svg>
                  </button>
                  
                  <div className="hidden lg:block">
                    <h1 className="text-lg font-black text-gray-900">DesignCenter</h1>
                    <p className="text-xs text-gray-600">Professional Design Platform</p>
                  </div>
                </div>

                <div className="flex items-center space-x-4">
                  <div className="hidden sm:flex items-center space-x-3 text-sm">
                    <span className="text-gray-600 font-medium">Welcome to</span>
                    <span className="font-bold text-purple-600">DesignCenter</span>
                  </div>
                  
                  {/* User Avatar */}
                  <div className="flex items-center space-x-3">
                    <div className="w-8 h-8 bg-gradient-to-br from-blue-600 to-purple-600 rounded-full flex items-center justify-center text-white font-semibold text-sm">
                      👤
                    </div>
                    <div className="hidden sm:block">
                      <div className="text-sm font-medium text-gray-900">User</div>
                      <div className="text-xs text-gray-500">Designer</div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Page Content */}
            <main className="flex-1 pt-24 px-6">
              {children}
            </main>
          </div>
        </div>
        
        {/* Notifications */}
        <NotificationManager />
      </AuthProvider>
    </ThemeProvider>
  );
};

export default AppLayout;
