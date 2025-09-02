'use client';
import TemplateGallery from '../../components/templates/TemplateGallery';
import AppLayout from '../../components/layout/AppLayout';

// Force dynamic rendering for this page
export const dynamic = 'auto';

export default function TemplateGalleryPage() {
  const handleDownloadTemplate = (templateId: string) => {
    // Handle template download
    console.log('Download template:', templateId);
  };

  return (
    <AppLayout>
      <div className="max-w-7xl mx-auto px-4 py-8">
        <TemplateGallery 
          onDownloadTemplate={handleDownloadTemplate}
        />
      </div>
    </AppLayout>
  );
}
