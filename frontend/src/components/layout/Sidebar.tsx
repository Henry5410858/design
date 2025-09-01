'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { ThemeToggle } from '@/components/ui/ThemeToggle';

interface SidebarProps {
  isOpen: boolean;
  onToggle: () => void;
}

const Sidebar: React.FC<SidebarProps> = ({ isOpen, onToggle }) => {
  const pathname = usePathname();

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
        fixed top-0 left-0 h-full bg-gray-900 border-r border-gray-700 z-50
        transform transition-transform duration-300 ease-in-out
        ${isOpen ? 'translate-x-0' : '-translate-x-full'}
        lg:translate-x-0 lg:static lg:z-auto
        w-64 flex-shrink-0
      `}>
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-700">
          <div className="flex items-center space-x-3">
            <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-purple-600 rounded-lg flex items-center justify-center">
              <span className="text-white text-lg font-bold">🎨</span>
            </div>
            <h1 className="text-xl font-black text-white">RedDragon</h1>
          </div>
          
          {/* Mobile Close Button */}
          <button
            onClick={onToggle}
            className="lg:hidden p-2 rounded-lg hover:bg-gray-800 transition-colors"
          >
            <span className="text-gray-400 text-xl">✕</span>
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
                  ? 'bg-blue-600/20 border border-blue-500/30 text-blue-300' 
                  : 'text-gray-300 hover:bg-gray-800 hover:text-white'
                }
              `}
            >
              <span className="text-xl">{item.icon}</span>
              <div className="flex-1 min-w-0">
                <div className="font-semibold text-sm">{item.name}</div>
                <div className="text-xs text-gray-500 group-hover:text-gray-400 truncate">
                  {item.description}
                </div>
              </div>
            </Link>
          ))}
        </nav>

        {/* Footer */}
        <div className="p-4 border-t border-gray-700">
          {/* Theme Toggle */}
          <div className="flex items-center justify-between mb-4">
            <span className="text-sm text-gray-400">Theme</span>
            <ThemeToggle />
          </div>
          
          {/* User Info */}
          <div className="bg-gray-800 rounded-lg p-3">
            <div className="flex items-center space-x-3">
              <div className="w-8 h-8 bg-gradient-to-br from-green-500 to-blue-500 rounded-full flex items-center justify-center">
                <span className="text-white text-sm font-bold">U</span>
              </div>
              <div className="flex-1 min-w-0">
                <div className="text-sm font-medium text-white truncate">Usuario Demo</div>
                <div className="text-xs text-gray-400">Premium Plan</div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

export default Sidebar;
