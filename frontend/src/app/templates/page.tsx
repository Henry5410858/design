'use client';
import { useState } from 'react';
import TemplateGallery from '../../components/templates/TemplateGallery';
import AppLayout from '../../components/layout/AppLayout';
import CreateTemplateModal from '../../components/modals/CreateTemplateModal';

export default function TemplateGalleryPage() {
  const [selectedTemplates, setSelectedTemplates] = useState<Set<string>>(new Set());
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [isSelectionMode, setIsSelectionMode] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  const handleDownloadTemplate = (templateId: string) => {
    // Handle template download
    console.log('Download template:', templateId);
  };

  const handleCreateTemplate = () => {
    setShowCreateModal(true);
  };

  const handleSelectMode = () => {
    setIsSelectionMode(!isSelectionMode);
    if (!isSelectionMode) {
      setSelectedTemplates(new Set()); // Clear selection when entering select mode
    }
  };

  const handleDeleteClick = () => {
    if (selectedTemplates.size > 0) {
      setShowDeleteConfirm(true);
    }
  };

  const handleDeleteConfirmed = async () => {
    try {
      // Delete selected templates from database
      const deletePromises = Array.from(selectedTemplates).map(templateId =>
        fetch(`http://localhost:4000/api/templates/${templateId}`, {
          method: 'DELETE',
        })
      );
      
      await Promise.all(deletePromises);
      
      // Clear selection and exit selection mode
      setSelectedTemplates(new Set());
      setIsSelectionMode(false);
      setShowDeleteConfirm(false);
      
      // Refresh the template gallery (you might want to add a refresh function)
      console.log('Templates deleted successfully');
    } catch (error) {
      console.error('Error deleting templates:', error);
    }
  };

  const handleDeleteCancel = () => {
    setShowDeleteConfirm(false);
  };

  const handleTemplateSelection = (templateId: string, isSelected: boolean) => {
    setSelectedTemplates(prev => {
      const newSelection = new Set(prev);
      if (isSelected) {
        newSelection.add(templateId);
      } else {
        newSelection.delete(templateId);
      }
      return newSelection;
    });
  };

  return (
    <AppLayout>
      <div className="max-w-7xl mx-auto py-6">
        <div className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-lg border border-white/30 overflow-hidden p-6">
          {/* Action Buttons */}
          <div className="flex justify-between items-center mb-6">
            <div className="flex-1"></div>
            <div className="flex gap-3">
              <button
                onClick={handleSelectMode}
                className={`px-4 py-2 rounded-lg font-medium transition-all duration-200 ${
                  isSelectionMode 
                    ? 'bg-blue-600 text-white shadow-md' 
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                {isSelectionMode ? 'Exit Select' : 'Select'}
              </button>
              
              <button
                onClick={handleCreateTemplate}
                className="px-4 py-2 bg-green-600 text-white rounded-lg font-medium hover:bg-green-700 transition-all duration-200 shadow-md hover:shadow-lg"
              >
                Create
              </button>
              
              {isSelectionMode && selectedTemplates.size > 0 && (
                <button
                  onClick={handleDeleteClick}
                  className="px-4 py-2 bg-red-600 text-white rounded-lg font-medium hover:bg-red-700 transition-all duration-200 shadow-md hover:shadow-lg"
                >
                  Delete ({selectedTemplates.size})
                </button>
              )}
            </div>
          </div>

          <TemplateGallery 
            onDownloadTemplate={handleDownloadTemplate}
            isSelectionMode={isSelectionMode}
            selectedTemplates={selectedTemplates}
            onTemplateSelection={handleTemplateSelection}
          />
        </div>
      </div>

      {/* Create Template Modal */}
      <CreateTemplateModal
        isOpen={showCreateModal}
        onClose={() => setShowCreateModal(false)}
      />

      {/* Delete Confirmation Modal */}
      {showDeleteConfirm && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-2xl p-6 max-w-md w-full mx-4 shadow-2xl">
            <div className="text-center">
              <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <svg className="w-8 h-8 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
                </svg>
              </div>
              
              <h3 className="text-lg font-semibold text-gray-900 mb-2">
                Confirm Deletion
              </h3>
              
              <p className="text-gray-600 mb-6">
                Are you sure you want to delete {selectedTemplates.size} template{selectedTemplates.size !== 1 ? 's' : ''}? 
                This action cannot be undone.
              </p>
              
              <div className="flex gap-3">
                <button
                  onClick={handleDeleteCancel}
                  className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg font-medium hover:bg-gray-50 transition-colors duration-200"
                >
                  Cancel
                </button>
                
                <button
                  onClick={handleDeleteConfirmed}
                  className="flex-1 px-4 py-2 bg-red-600 text-white rounded-lg font-medium hover:bg-red-700 transition-colors duration-200"
                >
                  Yes, Delete
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </AppLayout>
  );
}
