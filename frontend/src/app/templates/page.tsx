'use client';
import { useRouter } from 'next/navigation';
import TemplateGallery from '../../components/templates/TemplateGallery';
import DashboardLayout from '../../components/layout/DashboardLayout';

export default function TemplateGalleryPage() {
  const router = useRouter();

  const handleEditTemplate = (templateId: string) => {
    // Navigate to the template editor
    router.push(`/editor/${templateId}`);
  };

  const handleDownloadTemplate = (templateId: string) => {
    // Handle template download
    console.log('Download template:', templateId);
  };

  return (
    <DashboardLayout>
      <TemplateGallery 
        onEditTemplate={handleEditTemplate}
        onDownloadTemplate={handleDownloadTemplate}
      />
    </DashboardLayout>
  );
}
