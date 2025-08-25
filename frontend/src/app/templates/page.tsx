'use client';
import { useState } from 'react';
import TemplateGallery from '../../components/templates/TemplateGallery';
import DashboardLayout from '../../components/layout/DashboardLayout';

export default function TemplateGalleryPage() {
  const [showUpgradeModal, setShowUpgradeModal] = useState(false);

  const handleEditTemplate = (templateId: string) => {
    // Navigate to editor or open edit modal
    console.log('Edit template:', templateId);
  };

  const handleDownloadTemplate = (templateId: string) => {
    // Handle template download
    console.log('Download template:', templateId);
  };

  const handleUpgradeRequired = () => {
    setShowUpgradeModal(true);
  };

  return (
    <DashboardLayout>
      <TemplateGallery 
        onEditTemplate={handleEditTemplate}
        onDownloadTemplate={handleDownloadTemplate}
        onUpgradeRequired={handleUpgradeRequired}
      />
    </DashboardLayout>
  );
}
