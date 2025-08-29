'use client';

import React from 'react';
import TemplateGallery from '@/components/TemplateGallery';
import templatesData from '@/data/templates';
import AppLayout from '@/components/layout/AppLayout';

export default function TemplatesPage() {
  return (
    <AppLayout>
      <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900">
        <div className="container mx-auto px-4 py-8">
          {/* Header */}
          <div className="text-center mb-12">
            <h1 className="text-4xl font-black text-white mb-4">
              🎨 Biblioteca de Plantillas
            </h1>
            <p className="text-xl text-gray-300 max-w-3xl mx-auto">
              Descubre nuestra colección de plantillas profesionales diseñadas en Canva. 
              Desde posts para redes sociales hasta documentos corporativos, 
              tenemos todo lo que necesitas para crear diseños impactantes.
            </p>
          </div>
          
          <TemplateGallery templates={templatesData} />
        </div>
      </div>
    </AppLayout>
  );
}
