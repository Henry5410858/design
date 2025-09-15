'use client';

import React from 'react';

const ImageTest: React.FC = () => {
  const testImages = [
    '/assets/templatebackgrounds/flyer 1.png',
    '/assets/templatebackgrounds/flyer 2.png',
    '/assets/templatebackgrounds/post 1.png',
    '/assets/templatebackgrounds/post 2.png',
    '/assets/templatebackgrounds/story 1.png',
    '/assets/templatebackgrounds/story 2.png',
    '/assets/templatebackgrounds/banner 1.png',
    '/assets/templatebackgrounds/banner 2.png',
    '/assets/templatebackgrounds/document 1.png',
    '/assets/templatebackgrounds/document 2.png',
    '/assets/templatebackgrounds/badge 1.png',
    '/assets/templatebackgrounds/badge2.png'
  ];

  return (
    <div className="p-8">
      <h1 className="text-2xl font-bold mb-4">Template Background Images Test</h1>
      <div className="grid grid-cols-3 gap-4">
        {testImages.map((src, index) => (
          <div key={index} className="border border-gray-300 p-2">
            <div className="text-sm text-gray-600 mb-2">{src.split('/').pop()}</div>
            <img
              src={src}
              alt={`Test ${index + 1}`}
              className="w-full h-32 object-cover"
              onLoad={() => console.log('✅ Loaded:', src)}
              onError={() => console.error('❌ Failed:', src)}
            />
          </div>
        ))}
      </div>
    </div>
  );
};

export default ImageTest;
