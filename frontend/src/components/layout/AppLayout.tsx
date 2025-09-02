'use client';

import React, { useState } from 'react';
import Sidebar from './Sidebar';
import { ThemeProvider } from '@/context/ThemeContext';
import { AuthProvider } from '@/context/AuthContext';
import NotificationManager from '@/components/ui/NotificationManager';

interface AppLayoutProps {
  children: React.ReactNode;
}

const AppLayout: React.FC<AppLayoutProps> = ({ children }) => {
  const [sidebarOpen, setSidebarOpen] = useState(false);

  return (
    <ThemeProvider>
      <AuthProvider>
        <div className="flex h-screen bg-gray-900">
          {/* Sidebar */}
          <Sidebar 
            isOpen={sidebarOpen} 
            onToggle={() => setSidebarOpen(!sidebarOpen)} 
          />
          
          {/* Main Content */}
          <div className="flex-1 flex flex-col overflow-hidden">
            {/* Top Bar */}
            <header className="bg-gray-800 border-b border-gray-700 px-6 py-4 lg:hidden">
              <div className="flex items-center justify-between">
                <button
                  onClick={() => setSidebarOpen(true)}
                  className="p-2 rounded-lg hover:bg-gray-700 transition-colors"
                >
                  <span className="text-gray-300 text-xl">☰</span>
                </button>
                
                <div className="flex items-center space-x-3">
                  <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-purple-600 rounded-lg flex items-center justify-center">
                    <span className="text-white text-lg font-bold">🎨</span>
                  </div>
                  <h1 className="text-lg font-black text-white">RedDragon</h1>
                </div>
                
                <div className="w-8"></div> {/* Spacer for centering */}
              </div>
            </header>
            
            {/* Page Content */}
            <main className="flex-1 overflow-auto">
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
