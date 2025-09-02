'use client';
import TemplateGallery from '../../components/templates/TemplateGallery';
import AppLayout from '../../components/layout/AppLayout';

export default function TemplateGalleryPage() {
  const handleDownloadTemplate = (templateId: string) => {
    // Handle template download
    console.log('Download template:', templateId);
  };

  return (
    <AppLayout>
      <div className="max-w-7xl mx-auto py-6">
        <div className="mb-6">
          <h1 className="text-3xl font-bold text-gray-900">
            Template Gallery
          </h1>
          <p className="mt-2 text-gray-600">
            Choose from our collection of professional design templates
          </p>
        </div>
        
        <div className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-lg border border-white/30 overflow-hidden">
          <TemplateGallery 
            onDownloadTemplate={handleDownloadTemplate}
          />
        </div>
      </div>
    </AppLayout>
  );
}
