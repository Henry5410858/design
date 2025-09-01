'use client';

import React from 'react';
import TemplateGallery from '@/components/TemplateGallery';
import templatesData from '@/data/templates';
import DashboardLayout from '../../components/layout/DashboardLayout';

// Force dynamic rendering for this page
export const dynamic = 'auto';

export default function TemplatesPage() {
  const handleDownloadTemplate = (templateId: string) => {
    // Handle template download
    console.log('Download template:', templateId);
  };

  return (
    <DashboardLayout>
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
          
          <TemplateGallery 
            templates={templatesData}
          />
        </div>
      </div>
    </DashboardLayout>
  );
}
