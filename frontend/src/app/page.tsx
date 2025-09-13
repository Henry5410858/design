'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import DashboardLayout from '@/components/layout/DashboardLayout';
import CreateTemplateModal from '@/components/modals/CreateTemplateModal';

export default function HomePage() {
  const [showCreateTemplateModal, setShowCreateTemplateModal] = useState(false);

  return (
    <DashboardLayout>
      <div className="flex items-center justify-center min-h-[calc(100vh-8rem)]">
        <div className="text-center max-w-4xl mx-auto">
          <div className="mb-8">
            <h1 className="text-6xl font-black text-gray-900 mb-4">
              🎨 DesignCenter
            </h1>
            <p className="text-xl text-gray-600 mb-8 max-w-2xl mx-auto">
              Plantillas de diseño profesionales y herramientas para creadores
            </p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
            {/* Templates Card */}
            <Link 
              href="/templates"
              className="bg-white/80 backdrop-blur-sm rounded-2xl p-6 shadow-lg border border-white/30 hover:shadow-xl hover:scale-105 transition-all duration-300 cursor-pointer group"
            >
              <div className="text-4xl mb-4 group-hover:scale-110 transition-transform duration-300">🎨</div>
              <h3 className="text-lg font-bold text-gray-900 mb-2">Plantillas</h3>
              <p className="text-gray-600 text-sm">Plantillas de diseño profesionales para todas tus necesidades</p>
            </Link>

            {/* Create Template Card */}
            <div 
              onClick={() => setShowCreateTemplateModal(true)}
              className="bg-white/80 backdrop-blur-sm rounded-2xl p-6 shadow-lg border border-white/30 hover:shadow-xl hover:scale-105 transition-all duration-300 cursor-pointer group"
            >
              <div className="text-4xl mb-4 group-hover:scale-110 transition-transform duration-300">➕</div>
              <h3 className="text-lg font-bold text-gray-900 mb-2">Crear Nueva Plantilla</h3>
              <p className="text-gray-600 text-sm">Comienza a diseñar con una nueva plantilla</p>
            </div>

            {/* Brand Kit Card */}
            <Link 
              href="/brand-kit"
              className="bg-white/80 backdrop-blur-sm rounded-2xl p-6 shadow-lg border border-white/30 hover:shadow-xl hover:scale-105 transition-all duration-300 cursor-pointer group"
            >
              <div className="text-4xl mb-4 group-hover:scale-110 transition-transform duration-300">🏷️</div>
              <h3 className="text-lg font-bold text-gray-900 mb-2">Kit de Marca</h3>
              <p className="text-gray-600 text-sm">Gestiona tus activos de marca y directrices</p>
            </Link>
          </div>
        </div>
      </div>

      {/* Create Template Modal */}
      <CreateTemplateModal 
        isOpen={showCreateTemplateModal}
        onClose={() => setShowCreateTemplateModal(false)}
      />
    </DashboardLayout>
  );
}

export const dynamic = "force-dynamic"; 
