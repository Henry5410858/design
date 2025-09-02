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
      <TemplateGallery 
        onDownloadTemplate={handleDownloadTemplate}
      />
    </AppLayout>
  );
}
