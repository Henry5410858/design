'use client';
import TemplateGallery from '../../components/templates/TemplateGallery';

// Force dynamic rendering for this page
export const dynamic = 'auto';
import DashboardLayout from '../../components/layout/DashboardLayout';

export default function TemplateGalleryPage() {
  const handleDownloadTemplate = (templateId: string) => {
    // Handle template download
    console.log('Download template:', templateId);
  };

  return (
    <DashboardLayout>
      <TemplateGallery 
        onDownloadTemplate={handleDownloadTemplate}
      />
    </DashboardLayout>
  );
}
