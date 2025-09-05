'use client';
import { useState, useRef, useEffect } from 'react';
import TemplateGallery from '../../components/templates/TemplateGallery';
import DashboardLayout from '../../components/layout/DashboardLayout';
import CreateTemplateModal from '../../components/modals/CreateTemplateModal';
import { useNotification } from '../../context/NotificationContext';
import { Upload, X, Check, Download } from 'phosphor-react';
import { exportTemplateAsImage, getTemplateData, getDesignData } from '../../utils/canvasExport';

export default function TemplateGalleryPage() {
  const { showSuccess, showError, showInfo, showWarning } = useNotification();
  const [selectedTemplates, setSelectedTemplates] = useState<Set<string>>(new Set());
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [isSelectionMode, setIsSelectionMode] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  
  // Image upload states
  const [uploadedImage, setUploadedImage] = useState<string | null>(null);
  const [uploadedImageFile, setUploadedImageFile] = useState<File | null>(null);
  const [showImagePreview, setShowImagePreview] = useState(false);
  const [templatesWithCustomBackground, setTemplatesWithCustomBackground] = useState<Set<string>>(new Set());
  const [originalBackgrounds, setOriginalBackgrounds] = useState<Map<string, string>>(new Map());
  const [hasAppliedBackgrounds, setHasAppliedBackgrounds] = useState(false);
  const [isExportMode, setIsExportMode] = useState(false);
  const [isExporting, setIsExporting] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Check for existing applied backgrounds on component mount
  useEffect(() => {
    try {
      const templateBackgrounds = JSON.parse(localStorage.getItem('templateBackgrounds') || '{}');
      const hasBackgrounds = Object.keys(templateBackgrounds).length > 0;
      setHasAppliedBackgrounds(hasBackgrounds);
      
      if (hasBackgrounds) {
        // Update the templates with custom background set
        const templateIds = Object.keys(templateBackgrounds);
        setTemplatesWithCustomBackground(new Set(templateIds));
        console.log('Found existing applied backgrounds for templates:', templateIds);
      }
    } catch (error) {
      console.warn('Error checking for existing backgrounds:', error);
    }
  }, []);

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

  // Image upload handlers
  const handleImageUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      // Validate file type
      if (!file.type.startsWith('image/')) {
        showError('Please select a valid image file');
        return;
      }

      // Validate file size (max 10MB)
      if (file.size > 10 * 1024 * 1024) {
        showError('Image file size must be less than 10MB');
        return;
      }

      const reader = new FileReader();
      reader.onload = (e) => {
        const result = e.target?.result as string;
        setUploadedImage(result);
        setUploadedImageFile(file);
        setShowImagePreview(true);
        showSuccess('Image uploaded successfully! Click on the preview to select templates.');
      };
      reader.readAsDataURL(file);
    }
  };

  const handleImagePreviewClick = () => {
    if (uploadedImage) {
      setIsSelectionMode(true);
      setSelectedTemplates(new Set());
      showInfo('Select templates to apply the background image to');
    }
  };

  const handleApplyBackground = async () => {
    if (selectedTemplates.size === 0) {
      showWarning('Please select at least one template');
      return;
    }

    if (!uploadedImage) {
      showError('No image uploaded');
      return;
    }

    try {
      // Store the custom background image data for each selected template
      const customBackgroundData = {
        imageData: uploadedImage,
        appliedAt: new Date().toISOString(),
        templateIds: Array.from(selectedTemplates)
      };

      // Store in localStorage for the editor to access
      localStorage.setItem('customTemplateBackgrounds', JSON.stringify(customBackgroundData));

      // Also store individual template mappings
      const templateBackgrounds = JSON.parse(localStorage.getItem('templateBackgrounds') || '{}');
      selectedTemplates.forEach(templateId => {
        templateBackgrounds[templateId] = {
          imageData: uploadedImage,
          appliedAt: new Date().toISOString()
        };
      });
      localStorage.setItem('templateBackgrounds', JSON.stringify(templateBackgrounds));

      // Store original backgrounds for selected templates
      const newOriginalBackgrounds = new Map(originalBackgrounds);
      selectedTemplates.forEach(templateId => {
        if (!newOriginalBackgrounds.has(templateId)) {
          // Store original background (you might want to get this from the template data)
          newOriginalBackgrounds.set(templateId, '/api/placeholder/400/300');
        }
      });
      setOriginalBackgrounds(newOriginalBackgrounds);

      // Mark templates as having custom background
      setTemplatesWithCustomBackground(prev => {
        const newSet = new Set(prev);
        selectedTemplates.forEach(templateId => newSet.add(templateId));
        return newSet;
      });

      showSuccess(`Background applied to ${selectedTemplates.size} template(s)! The background will be visible when you open these templates in the editor.`);
      setHasAppliedBackgrounds(true);
      setIsSelectionMode(false);
      setSelectedTemplates(new Set());
    } catch (error) {
      console.error('Error applying background:', error);
      showError('Failed to apply background. Please try again.');
    }
  };

  const handleApplyCancel = () => {
    // Clear localStorage data
    localStorage.removeItem('customTemplateBackgrounds');
    localStorage.removeItem('templateBackgrounds');
    
    // Reset all custom backgrounds
    setTemplatesWithCustomBackground(new Set());
    setOriginalBackgrounds(new Map());
    setUploadedImage(null);
    setUploadedImageFile(null);
    setShowImagePreview(false);
    setHasAppliedBackgrounds(false);
    setIsSelectionMode(false);
    setSelectedTemplates(new Set());
    
    showSuccess('All template backgrounds have been reset to their original state!');
  };

  const handleCancelBackground = () => {
    // Clear localStorage data
    localStorage.removeItem('customTemplateBackgrounds');
    localStorage.removeItem('templateBackgrounds');
    
    // Reset all custom backgrounds
    setTemplatesWithCustomBackground(new Set());
    setOriginalBackgrounds(new Map());
    setUploadedImage(null);
    setUploadedImageFile(null);
    setShowImagePreview(false);
    setHasAppliedBackgrounds(false);
    setIsSelectionMode(false);
    setSelectedTemplates(new Set());
    showInfo('Background changes cancelled. All templates restored to original backgrounds.');
  };

  const handleRemoveImage = () => {
    setUploadedImage(null);
    setUploadedImageFile(null);
    setShowImagePreview(false);
    setIsSelectionMode(false);
    setSelectedTemplates(new Set());
  };

  // Export functionality
  const handleExportMode = () => {
    setIsExportMode(!isExportMode);
    if (!isExportMode) {
      setSelectedTemplates(new Set()); // Clear selection when entering export mode
    }
  };

  const handleExportToZip = async () => {
    if (selectedTemplates.size === 0) {
      showWarning('Please select at least one template to export');
      return;
    }

    setIsExporting(true);
    showInfo('Starting export process... This may take a few moments.');

    try {
      // Create a zip file with exported templates
      const JSZip = (await import('jszip')).default;
      const zip = new JSZip();

      // Process each selected template
      for (const templateId of selectedTemplates) {
        try {
          // Get template data
          const template = await getTemplateData(templateId);
          if (!template) {
            throw new Error(`Template ${templateId} not found`);
          }

          console.log(`Processing template ${templateId}:`, template);

          // Export template as image
          const canvasImage = await exportTemplateAsImage(templateId, {
            format: 'png',
            quality: 1,
            multiplier: 1
          });
          
          if (canvasImage) {
            // Add PNG to zip
            zip.file(`${templateId}_${template.name || 'design'}.png`, canvasImage, { base64: true });
            
            // Generate PDF from the canvas image
            const pdfData = await generatePDFFromImage(canvasImage, template);
            if (pdfData) {
              zip.file(`${templateId}_${template.name || 'design'}.pdf`, pdfData, { base64: true });
            }
            
            console.log(`Successfully processed template ${templateId}`);
          } else {
            console.warn(`Failed to generate image for template ${templateId}`);
          }
        } catch (error) {
          console.error(`Error exporting template ${templateId}:`, error);
          showWarning(`Failed to export template ${templateId}`);
        }
      }

      // Generate and download zip file
      const zipBlob = await zip.generateAsync({ type: 'blob' });
      const url = URL.createObjectURL(zipBlob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `templates_export_${new Date().toISOString().split('T')[0]}.zip`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);

      showSuccess(`Successfully exported ${selectedTemplates.size} template(s) to zip file!`);
      setIsExportMode(false);
      setSelectedTemplates(new Set());
    } catch (error) {
      console.error('Error creating zip file:', error);
      showError('Failed to create zip file. Please try again.');
    } finally {
      setIsExporting(false);
    }
  };

  // Generate PDF from image data using jsPDF
  const generatePDFFromImage = async (imageData: string, template: any): Promise<string | null> => {
    try {
      // Dynamically import jsPDF
      const { jsPDF } = await import('jspdf');
      
      // Get canvas dimensions - prioritize design data canvas size
      let width, height;
      
      // Try to get design data to get accurate canvas size
      try {
        const designData = await getDesignData(`${template._id}.json`);
        if (designData?.designData?.canvasSize) {
          [width, height] = designData.designData.canvasSize.split('x').map(Number);
          console.log(`📏 PDF using design data canvas size: ${width}x${height}`);
        } else if (template.canvasSize) {
          [width, height] = template.canvasSize.split('x').map(Number);
          console.log(`📏 PDF using template canvas size: ${width}x${height}`);
        } else {
          width = template.dimensions?.width || 1200;
          height = template.dimensions?.height || 1800;
          console.log(`📏 PDF using template dimensions: ${width}x${height}`);
        }
      } catch (error) {
        // Fallback to template data if design data fetch fails
        if (template.canvasSize) {
          [width, height] = template.canvasSize.split('x').map(Number);
        } else {
          width = template.dimensions?.width || 1200;
          height = template.dimensions?.height || 1800;
        }
        console.log(`📏 PDF fallback to template data: ${width}x${height}`);
      }
      
      // Convert pixels to mm (1 inch = 25.4mm, 1 inch = 96px)
      const widthMM = (width / 96) * 25.4;
      const heightMM = (height / 96) * 25.4;
      
      // Create PDF document with proper dimensions
      const pdf = new jsPDF({
        orientation: width > height ? 'landscape' : 'portrait',
        unit: 'mm',
        format: [widthMM, heightMM]
      });
      
      // Add image to PDF with proper scaling
      const imageDataUrl = `data:image/png;base64,${imageData}`;
      pdf.addImage(imageDataUrl, 'PNG', 0, 0, widthMM, heightMM, undefined, 'FAST');
      
      // Get PDF as base64 string
      const pdfOutput = pdf.output('datauristring');
      const base64Data = pdfOutput.split(',')[1]; // Remove data:application/pdf;filename=generated.pdf;base64, prefix
      
      return base64Data;
    } catch (error) {
      console.error('Error generating PDF:', error);
      return null;
    }
  };

  return (
    <DashboardLayout>
      <div className="max-w-7xl mx-auto py-6">
        <div className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-lg border border-white/30 overflow-hidden p-6">
          {/* Image Preview (Top Left) */}
          {showImagePreview && uploadedImage && (
            <div className="absolute top-4 left-4 z-10">
              <div className="bg-white rounded-lg shadow-lg border border-gray-200 p-3 max-w-xs">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-medium text-gray-700">Uploaded Image</span>
                  <button
                    onClick={handleRemoveImage}
                    className="text-gray-400 hover:text-red-500 transition-colors"
                  >
                    <X size={16} />
                  </button>
                </div>
                <div 
                  className="cursor-pointer rounded-lg overflow-hidden border-2 border-dashed border-blue-300 hover:border-blue-500 transition-colors"
                  onClick={handleImagePreviewClick}
                >
                  <img 
                    src={uploadedImage} 
                    alt="Uploaded preview" 
                    className="w-full h-32 object-cover"
                  />
                </div>
                <p className="text-xs text-gray-500 mt-2 text-center">
                  Click to select templates
                </p>
              </div>
            </div>
          )}

          {/* Action Buttons */}
          <div className="flex justify-between items-center mb-6">
            <div className="flex-1"></div>
            <div className="flex gap-3">
              {/* Export to Zip Button */}
              <button
                onClick={handleExportMode}
                disabled={isExporting}
                className={`px-4 py-2 rounded-lg font-medium transition-all duration-200 shadow-md hover:shadow-lg flex items-center gap-2 ${
                  isExportMode 
                    ? 'bg-blue-600 text-white' 
                    : 'bg-indigo-600 text-white hover:bg-indigo-700'
                } ${isExporting ? 'opacity-50 cursor-not-allowed' : ''}`}
              >
                <Download size={16} />
                {isExporting ? 'Exporting...' : isExportMode ? 'Exit Export' : 'Export to Zip'}
              </button>

              {/* Upload Image Button */}
              <div className="relative">
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  onChange={handleImageUpload}
                  className="hidden"
                />
                <button
                  onClick={() => fileInputRef.current?.click()}
                  className="px-4 py-2 bg-purple-600 text-white rounded-lg font-medium hover:bg-purple-700 transition-all duration-200 shadow-md hover:shadow-lg flex items-center gap-2"
                >
                  <Upload size={16} />
                  Upload Image
                </button>
              </div>

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
                <>
                  {uploadedImage ? (
                    <>
                      <button
                        onClick={handleApplyBackground}
                        className="px-4 py-2 bg-green-600 text-white rounded-lg font-medium hover:bg-green-700 transition-all duration-200 shadow-md hover:shadow-lg flex items-center gap-2"
                      >
                        <Check size={16} />
                        Apply Background ({selectedTemplates.size})
                      </button>
                      <button
                        onClick={handleCancelBackground}
                        className="px-4 py-2 bg-orange-600 text-white rounded-lg font-medium hover:bg-orange-700 transition-all duration-200 shadow-md hover:shadow-lg"
                      >
                        Cancel
                      </button>
                    </>
                  ) : (
                    <button
                      onClick={handleDeleteClick}
                      className="px-4 py-2 bg-red-600 text-white rounded-lg font-medium hover:bg-red-700 transition-all duration-200 shadow-md hover:shadow-lg"
                    >
                      Delete ({selectedTemplates.size})
                    </button>
                  )}
                </>
              )}

              {/* Export Selected Templates Button - shows when in export mode with selections */}
              {isExportMode && selectedTemplates.size > 0 && (
                <button
                  onClick={handleExportToZip}
                  disabled={isExporting}
                  className="px-4 py-2 bg-green-600 text-white rounded-lg font-medium hover:bg-green-700 transition-all duration-200 shadow-md hover:shadow-lg flex items-center gap-2 disabled:opacity-50"
                >
                  <Download size={16} />
                  {isExporting ? 'Exporting...' : `Export ${selectedTemplates.size} Template(s)`}
                </button>
              )}

              {/* Apply Cancel Button - shows when backgrounds have been applied */}
              {hasAppliedBackgrounds && !isSelectionMode && !isExportMode && (
                <button
                  onClick={handleApplyCancel}
                  className="px-4 py-2 bg-red-600 text-white rounded-lg font-medium hover:bg-red-700 transition-all duration-200 shadow-md hover:shadow-lg flex items-center gap-2"
                >
                  <X size={16} />
                  Apply Cancel
                </button>
              )}
            </div>
        </div>
        
          <TemplateGallery 
            onDownloadTemplate={handleDownloadTemplate}
            isSelectionMode={isSelectionMode || isExportMode}
            selectedTemplates={selectedTemplates}
            onTemplateSelection={handleTemplateSelection}
            customBackgroundImage={uploadedImage}
            templatesWithCustomBackground={templatesWithCustomBackground}
            isExportMode={isExportMode}
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
    </DashboardLayout>
  );
}
