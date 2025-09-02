'use client';

import React from 'react';
import Link from 'next/link';
import AppLayout from '@/components/layout/AppLayout';

export default function HomePage() {
  return (
    <AppLayout>
      <div className="flex items-center justify-center min-h-[calc(100vh-8rem)]">
        <div className="text-center max-w-4xl mx-auto">
          <div className="mb-8">
            <h1 className="text-6xl font-black text-gray-900 mb-4">
              🎨 RedDragon
            </h1>
            <p className="text-xl text-gray-600 mb-8 max-w-2xl mx-auto">
              Professional design templates and tools for creators
            </p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
            <div className="bg-white/80 backdrop-blur-sm rounded-2xl p-6 shadow-lg border border-white/30">
              <div className="text-4xl mb-4">🎨</div>
              <h3 className="text-lg font-bold text-gray-900 mb-2">Templates</h3>
              <p className="text-gray-600 text-sm">Professional design templates for all your needs</p>
            </div>
            <div className="bg-white/80 backdrop-blur-sm rounded-2xl p-6 shadow-lg border border-white/30">
              <div className="text-4xl mb-4">✏️</div>
              <h3 className="text-lg font-bold text-gray-900 mb-2">Editor</h3>
              <p className="text-gray-600 text-sm">Powerful online editor with advanced features</p>
            </div>
            <div className="bg-white/80 backdrop-blur-sm rounded-2xl p-6 shadow-lg border border-white/30">
              <div className="text-4xl mb-4">🏷️</div>
              <h3 className="text-lg font-bold text-gray-900 mb-2">Brand Kit</h3>
              <p className="text-gray-600 text-sm">Manage your brand assets and guidelines</p>
            </div>
          </div>
          
          <Link 
            href="/templates" 
            className="inline-block bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white font-bold py-4 px-8 rounded-xl text-lg transition-all duration-300 transform hover:scale-105 hover:shadow-lg"
          >
            Browse Templates
          </Link>
        </div>
      </div>
    </AppLayout>
  );
}
export const dynamic = "force-dynamic"; 
