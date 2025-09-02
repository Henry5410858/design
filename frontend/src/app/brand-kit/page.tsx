import React from 'react';
import BrandKit from '@/components/BrandKit';
import AppLayout from '@/components/layout/AppLayout';

export default function BrandKitPage() {
  return (
    <AppLayout>
      <div className="container mx-auto px-4 py-8">
        <BrandKit />
      </div>
    </AppLayout>
  );
}
