'use client';

import React from 'react';
import { useTheme } from '@/context/ThemeContext';

export const ThemeToggle: React.FC = () => {
  const { theme, toggleTheme } = useTheme();

  return (
    <button
      onClick={toggleTheme}
      className="relative w-12 h-6 bg-gray-200 dark:bg-gray-700 rounded-full p-1 transition-all duration-300 hover:scale-105 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 dark:focus:ring-offset-gray-800"
      aria-label={`Switch to ${theme === 'light' ? 'dark' : 'light'} mode`}
    >
      <div
        className={`absolute top-1 w-4 h-4 bg-white rounded-full shadow-md transition-all duration-300 transform ${
          theme === 'dark' ? 'translate-x-6' : 'translate-x-0'
        }`}
      >
        {/* Sun Icon */}
        <div
          className={`absolute inset-0 flex items-center justify-center transition-opacity duration-300 ${
            theme === 'light' ? 'opacity-100' : 'opacity-0'
          }`}
        >
          <span className="text-xs text-yellow-500">☀️</span>
        </div>
        
        {/* Moon Icon */}
        <div
          className={`absolute inset-0 flex items-center justify-center transition-opacity duration-300 ${
            theme === 'dark' ? 'opacity-100' : 'opacity-0'
          }`}
        >
          <span className="text-xs text-blue-400">🌙</span>
        </div>
      </div>
      
      {/* Background Icons */}
      <div className="flex justify-between items-center h-full px-1">
        <span className="text-xs text-yellow-500 opacity-60">☀️</span>
        <span className="text-xs text-blue-400 opacity-60">🌙</span>
      </div>
    </button>
  );
};
