'use client';
import TemplateGallery from '../../components/templates/TemplateGallery';
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
