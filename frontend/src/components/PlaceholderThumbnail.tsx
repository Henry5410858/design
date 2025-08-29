'use client';

import React, { useMemo } from 'react';

interface PlaceholderThumbnailProps {
  category: string;
  dimensions: string;
  className?: string;
}

const PlaceholderThumbnail: React.FC<PlaceholderThumbnailProps> = React.memo(({ category, dimensions, className = '' }) => {
  const getCategoryColor = (cat: string) => {
    const colors = {
      'IG/FB Square Post': 'from-pink-400 to-rose-500',
      'IG/FB/WSP Story': 'from-purple-400 to-indigo-500',
      'Marketplace Flyer': 'from-blue-400 to-cyan-500',
      'FB Feed Banner': 'from-green-400 to-emerald-500',
      'Digital Badge / Visual Card': 'from-yellow-400 to-orange-500',
      'Brochure / Simple 1-page Document': 'from-teal-400 to-blue-500'
    };
    return colors[cat as keyof typeof colors] || 'from-gray-400 to-gray-600';
  };

  const getCategoryIcon = (cat: string) => {
    const icons = {
      'IG/FB Square Post': '📱',
      'IG/FB/WSP Story': '📖',
      'Marketplace Flyer': '📄',
      'FB Feed Banner': '🖼️',
      'Digital Badge / Visual Card': '🏷️',
      'Brochure / Simple 1-page Document': '📋'
    };
    return icons[cat as keyof typeof icons] || '🎨';
  };

  const categoryColor = useMemo(() => getCategoryColor(category), [category]);
  const categoryIcon = useMemo(() => getCategoryIcon(category), [category]);

  return (
    <div className={`w-full h-56 bg-gradient-to-br ${categoryColor} rounded-2xl flex items-center justify-center relative overflow-hidden ${className}`}>
      {/* Background Pattern */}
      <div className="absolute inset-0 opacity-20">
        <div className="absolute inset-0" style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23ffffff' fill-opacity='0.3'%3E%3Ccircle cx='30' cy='30' r='2'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`,
        }}></div>
      </div>

      {/* Floating Elements */}
      <div className="absolute top-4 left-4 w-8 h-8 bg-white/20 rounded-full blur-sm"></div>
      <div className="absolute bottom-4 right-4 w-6 h-6 bg-white/20 rounded-full blur-sm"></div>
      <div className="absolute top-1/2 left-1/4 w-4 h-4 bg-white/30 rounded-full blur-sm"></div>

      {/* Content */}
      <div className="text-center text-white relative z-10">
        <div className="text-5xl mb-4 filter drop-shadow-2xl animate-pulse">{categoryIcon}</div>
        <div className="text-sm font-black mb-2 drop-shadow-lg">{category}</div>
        <div className="text-xs opacity-90 font-mono bg-white/20 px-3 py-2 rounded-full backdrop-blur-sm border border-white/30 shadow-lg">
          {dimensions}
        </div>
      </div>

      {/* Shine Effect */}
      <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent transform -skew-x-12 -translate-x-full animate-pulse"></div>
      
      {/* Glow Effect */}
      <div className="absolute inset-0 bg-gradient-to-br from-white/10 to-transparent rounded-2xl"></div>
    </div>
  );
});

PlaceholderThumbnail.displayName = 'PlaceholderThumbnail';
export default PlaceholderThumbnail;
