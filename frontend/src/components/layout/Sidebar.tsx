'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { ThemeToggle } from '@/components/ui/ThemeToggle';
import { useTheme } from '@/context/ThemeContext';

interface SidebarProps {
  isOpen: boolean;
  onToggle: () => void;
}

const Sidebar: React.FC<SidebarProps> = ({ isOpen, onToggle }) => {
  const pathname = usePathname();
  const { theme } = useTheme();

  const navigationItems = [
    {
      name: 'Dashboard',
      href: '/',
      icon: '🏠',
      description: 'Overview & Quick Actions'
    },
    {
      name: 'Templates',
      href: '/templates',
      icon: '🎨',
      description: 'Browse Design Templates'
    },
    {
      name: 'My Designs',
      href: '/my-designs',
      icon: '📁',
      description: 'Your Created Designs'
    },
    {
      name: 'Brand Kit',
      href: '/brand-kit',
      icon: '🏷️',
      description: 'Logo & Brand Colors'
    },
    {
      name: 'Downloads',
      href: '/downloads',
      icon: '📥',
      description: 'Download History'
    },
    {
      name: 'Calendar',
      href: '/calendar',
      icon: '📅',
      description: 'Design Schedule'
    },
    {
      name: 'AI Enhance',
      href: '/ai-enhance',
      icon: '🤖',
      description: 'AI-Powered Tools'
    },
    {
      name: 'AI Text',
      href: '/ai-text',
      icon: '✍️',
      description: 'AI Text Generation'
    }
  ];

  const isActive = (href: string) => {
    if (href === '/') {
      return pathname === '/';
    }
    return pathname.startsWith(href);
  };

  return (
    <>
      {/* Mobile Overlay */}
      {isOpen && (
        <div 
          className="fixed inset-0 bg-black/50 backdrop-blur-sm z-40 lg:hidden"
          onClick={onToggle}
        />
      )}

      {/* Sidebar */}
      <div className={`
        fixed top-0 left-0 h-full z-50
        ${theme === 'dark' ? 'bg-gray-900 border-gray-700' : 'bg-white border-gray-200'} 
        border-r
        transform transition-transform duration-300 ease-in-out
        ${isOpen ? 'translate-x-0' : '-translate-x-full'}
        lg:translate-x-0 lg:static lg:z-auto
        w-64 flex-shrink-0
      `}>
        {/* Header */}
        <div className={`flex items-center justify-between p-6 border-b ${theme === 'dark' ? 'border-gray-700' : 'border-gray-200'}`}>
          <div className="flex items-center space-x-3">
            <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-purple-600 rounded-lg flex items-center justify-center">
              <span className="text-white text-lg font-bold">🎨</span>
            </div>
            <h1 className={`text-xl font-black ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>RedDragon</h1>
          </div>
          
          {/* Mobile Close Button */}
          <button
            onClick={onToggle}
            className={`lg:hidden p-2 rounded-lg transition-colors ${theme === 'dark' ? 'hover:bg-gray-800' : 'hover:bg-gray-100'}`}
          >
            <span className={`${theme === 'dark' ? 'text-gray-400' : 'text-gray-600'} text-xl`}>✕</span>
          </button>
        </div>

        {/* Navigation */}
        <nav className="flex-1 p-4 space-y-2">
          {navigationItems.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className={`
                group flex items-center space-x-3 px-4 py-3 rounded-xl transition-all duration-200
                ${isActive(item.href) 
                  ? 'bg-blue-600/20 border border-blue-500/30 text-blue-600' 
                  : theme === 'dark' 
                    ? 'text-gray-300 hover:bg-gray-800 hover:text-white'
                    : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900'
                }
              `}
            >
              <span className="text-xl">{item.icon}</span>
              <div className="flex-1 min-w-0">
                <div className="font-semibold text-sm">{item.name}</div>
                <div className={`text-xs truncate ${theme === 'dark' ? 'text-gray-500 group-hover:text-gray-400' : 'text-gray-500 group-hover:text-gray-600'}`}>
                  {item.description}
                </div>
              </div>
            </Link>
          ))}
        </nav>

        {/* Footer */}
        <div className={`p-4 border-t ${theme === 'dark' ? 'border-gray-700' : 'border-gray-200'}`}>
          {/* Theme Toggle */}
          <div className="flex items-center justify-between mb-4">
            <span className={`text-sm ${theme === 'dark' ? 'text-gray-400' : 'text-gray-600'}`}>Theme</span>
            <ThemeToggle />
          </div>
          
          {/* User Info */}
          <div className={`${theme === 'dark' ? 'bg-gray-800' : 'bg-gray-100'} rounded-lg p-3`}>
            <div className="flex items-center space-x-3">
              <div className="w-8 h-8 bg-gradient-to-br from-green-500 to-blue-500 rounded-full flex items-center justify-center">
                <span className="text-white text-sm font-bold">U</span>
              </div>
              <div className="flex-1 min-w-0">
                <div className={`text-sm font-medium truncate ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>Usuario Demo</div>
                <div className={`text-xs ${theme === 'dark' ? 'text-gray-400' : 'text-gray-600'}`}>Premium Plan</div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

export default Sidebar;
