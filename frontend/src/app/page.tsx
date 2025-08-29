'use client';

import React from 'react';
import Link from 'next/link';
import AppLayout from '@/components/layout/AppLayout';

export default function HomePage() {
  return (
    <AppLayout>
      <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-6xl font-black text-white mb-8">
            🎨 RedDragon
          </h1>
          <p className="text-xl text-gray-300 mb-8 max-w-2xl mx-auto">
            Professional design templates and tools for creators
          </p>
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
