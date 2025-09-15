'use client';
import { useState, useRef, useEffect } from 'react';
import TemplateGallery from '../../components/templates/TemplateGallery';
import DashboardLayout from '../../components/layout/DashboardLayout';
import CreateTemplateModal from '../../components/modals/CreateTemplateModal';
import { useNotification } from '../../context/NotificationContext';
import { Upload, X, Check, Download } from 'phosphor-react';
import { exportTemplateAsImage, getTemplateData, getDesignData } from '../../utils/canvasExport';
import { saveTemplateBackground, getTemplateBackground, deleteTemplateBackground, getImageTypeFromDataUrl } from '../../utils/templateBackgrounds';
import { useAuth } from '../../context/AuthContext';

import API_ENDPOINTS from '@/config/api';
export default function TemplateGalleryPage() {
  const { showSuccess, showError, showInfo, showWarning } = useNotification();
  const { user } = useAuth();
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

  // Note: Background checking is now handled by individual template editors
  // when they load templates from the backend
  useEffect(() => {
    // This effect is no longer needed since backgrounds are loaded
    // individually by each template editor from the backend
    console.log('Template gallery mounted - backgrounds will be loaded individually by editors');
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
      // Check user plan - Free plan users cannot delete templates
      if (user?.plan === 'Gratis') {
        showError('Eliminar plantillas requiere plan Premium o Ultra-Premium. ¡Upgrade tu plan para eliminar plantillas!');
        setShowDeleteConfirm(false);
        return;
      }

      // Get authentication token
      const token = localStorage.getItem('token');
      if (!token) {
        showError('No se encontró token de autenticación. Por favor, inicia sesión nuevamente.');
        setShowDeleteConfirm(false);
        return;
      }

      // Delete selected templates from database
      const deletePromises = Array.from(selectedTemplates).map(async (templateId) => {
        const response = await fetch(API_ENDPOINTS.DELETE_TEMPLATE(templateId), {
          method: 'DELETE',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
        });

        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.error || `Failed to delete template ${templateId}: ${response.status}`);
        }

        return response.json();
      });
      
      await Promise.all(deletePromises);
      
      // Clear selection and exit selection mode
      setSelectedTemplates(new Set());
      setIsSelectionMode(false);
      setShowDeleteConfirm(false);
      
      // Show success message
      showSuccess(`Se eliminaron ${selectedTemplates.size} plantilla(s) exitosamente`);
      
      // Refresh the template gallery (you might want to add a refresh function)
      console.log('Templates deleted successfully');
    } catch (error) {
      console.error('Error deleting templates:', error);
      showError(`Error al eliminar plantillas: ${error instanceof Error ? error.message : 'Error desconocido'}`);
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
      if (!user?.id) {
        showError('You must be logged in to apply backgrounds');
        return;
      }

      // Save background to backend for each selected template
      const savePromises = Array.from(selectedTemplates).map(async (templateId) => {
        try {
          const result = await saveTemplateBackground({
            templateId: templateId,
            userId: user.id,
            imageData: uploadedImage,
            imageType: getImageTypeFromDataUrl(uploadedImage),
            fileName: `bulk_background_${Date.now()}.png`
          });
          
          if (result.success) {
            console.log(`✅ Background saved to backend for template ${templateId}`);
            return { templateId, success: true, backgroundId: result.backgroundId };
          } else {
            console.warn(`⚠️ Failed to save background for template ${templateId}:`, result.message);
            return { templateId, success: false, error: result.message };
          }
        } catch (error) {
          console.error(`❌ Error saving background for template ${templateId}:`, error);
          return { templateId, success: false, error: error instanceof Error ? error.message : 'Unknown error' };
        }
      });

      // Wait for all background saves to complete
      const results = await Promise.all(savePromises);
      const successfulSaves = results.filter(r => r.success);
      const failedSaves = results.filter(r => !r.success);

      if (failedSaves.length > 0) {
        console.warn('Some backgrounds failed to save:', failedSaves);
        showWarning(`Background applied to ${successfulSaves.length} template(s), but ${failedSaves.length} failed. Please try again for the failed templates.`);
      }

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

      if (successfulSaves.length > 0) {
        showSuccess(`Background applied to ${successfulSaves.length} template(s)! The background will be visible when you open these templates in the editor.`);
        setHasAppliedBackgrounds(true);
        setIsSelectionMode(false);
        setSelectedTemplates(new Set());
      }
    } catch (error) {
      console.error('Error applying background:', error);
      showError('Failed to apply background. Please try again.');
    }
  };

  const handleApplyCancel = async () => {
    if (!user?.id) {
      showError('You must be logged in to cancel backgrounds');
      return;
    }

    try {
      // Delete backgrounds from backend for all templates with custom backgrounds
      const deletePromises = Array.from(templatesWithCustomBackground).map(async (templateId) => {
        try {
          const result = await deleteTemplateBackground(templateId, user.id);
          if (result.success) {
            console.log(`✅ Background deleted from backend for template ${templateId}`);
            return { templateId, success: true };
          } else {
            console.warn(`⚠️ Failed to delete background for template ${templateId}:`, result.message);
            return { templateId, success: false, error: result.message };
          }
        } catch (error) {
          console.error(`❌ Error deleting background for template ${templateId}:`, error);
          return { templateId, success: false, error: error instanceof Error ? error.message : 'Unknown error' };
        }
      });

      // Wait for all deletions to complete
      const results = await Promise.all(deletePromises);
      const successfulDeletes = results.filter(r => r.success);
      const failedDeletes = results.filter(r => !r.success);

      if (failedDeletes.length > 0) {
        console.warn('Some backgrounds failed to delete:', failedDeletes);
        showWarning(`Backgrounds deleted for ${successfulDeletes.length} template(s), but ${failedDeletes.length} failed.`);
      }

      // Clear localStorage data (for thumbnails and other data)
      localStorage.removeItem('customTemplateBackgrounds');
      localStorage.removeItem('templateThumbnails'); // Also clear custom thumbnails
      
      // Reset all custom backgrounds
      setTemplatesWithCustomBackground(new Set());
      setOriginalBackgrounds(new Map());
      setUploadedImage(null);
      setUploadedImageFile(null);
      setShowImagePreview(false);
      setHasAppliedBackgrounds(false);
      setIsSelectionMode(false);
      setSelectedTemplates(new Set());
      
      // Dispatch event to notify components of the reset
      window.dispatchEvent(new CustomEvent('templateThumbnailUpdated'));
      window.dispatchEvent(new CustomEvent('templateThumbnailsReset'));
      
      showSuccess('All template backgrounds have been reset to their original state!');
    } catch (error) {
      console.error('Error canceling backgrounds:', error);
      showError('Failed to cancel backgrounds. Please try again.');
    }
  };

  const handleCancelBackground = () => {
    // Clear localStorage data (for thumbnails and other data)
    localStorage.removeItem('customTemplateBackgrounds');
    localStorage.removeItem('templateThumbnails'); // Also clear custom thumbnails
    
    // Reset all custom backgrounds
    setTemplatesWithCustomBackground(new Set());
    setOriginalBackgrounds(new Map());
    setUploadedImage(null);
    setUploadedImageFile(null);
    setShowImagePreview(false);
    setHasAppliedBackgrounds(false);
    setIsSelectionMode(false);
    setSelectedTemplates(new Set());
    
    // Dispatch event to notify components of the reset
    window.dispatchEvent(new CustomEvent('templateThumbnailUpdated'));
    window.dispatchEvent(new CustomEvent('templateThumbnailsReset'));
    
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
      showWarning('Por favor selecciona al menos una plantilla para exportar');
      return;
    }

    setIsExporting(true);
    showInfo('Iniciando proceso de exportación... Esto puede tomar unos momentos.');

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
          showWarning(`Error al exportar la plantilla ${templateId}`);
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

      showSuccess(`¡${selectedTemplates.size} plantilla(s) exportada(s) exitosamente al archivo zip!`);
      setIsExportMode(false);
      setSelectedTemplates(new Set());
    } catch (error) {
      console.error('Error creating zip file:', error);
      showError('Error al crear el archivo zip. Por favor intenta de nuevo.');
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
                {isExporting ? 'Exportando...' : isExportMode ? 'Salir de Exportar' : 'Exportar a Zip'}
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
                  Subir Imagen
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
                {isSelectionMode ? 'Salir de Seleccionar' : 'Seleccionar'}
              </button>
              
              <button
                onClick={handleCreateTemplate}
                disabled={user?.plan === 'Gratis'}
                className={`px-4 py-2 rounded-lg font-medium transition-all duration-200 shadow-md hover:shadow-lg ${
                  user?.plan === 'Gratis' 
                    ? 'bg-gray-400 text-gray-200 cursor-not-allowed' 
                    : 'bg-green-600 text-white hover:bg-green-700'
                }`}
                title={user?.plan === 'Gratis' ? 'Crear plantillas requiere plan Premium o Ultra-Premium' : 'Crear nueva plantilla'}
              >
                {user?.plan === 'Gratis' ? 'Crear (Premium)' : 'Crear'}
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
                        Aplicar Fondo ({selectedTemplates.size})
                      </button>
                      <button
                        onClick={handleCancelBackground}
                        className="px-4 py-2 bg-orange-600 text-white rounded-lg font-medium hover:bg-orange-700 transition-all duration-200 shadow-md hover:shadow-lg"
                      >
                        Cancelar
                      </button>
                    </>
                  ) : (
                    <button
                      onClick={handleDeleteClick}
                      className="px-4 py-2 bg-red-600 text-white rounded-lg font-medium hover:bg-red-700 transition-all duration-200 shadow-md hover:shadow-lg"
                    >
                      Eliminar ({selectedTemplates.size})
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
                  {isExporting ? 'Exportando...' : `Exportar ${selectedTemplates.size} Plantilla(s)`}
                </button>
              )}

              {/* Apply Cancel Button - shows when backgrounds have been applied */}
              {hasAppliedBackgrounds && !isSelectionMode && !isExportMode && (
                <button
                  onClick={handleApplyCancel}
                  className="px-4 py-2 bg-red-600 text-white rounded-lg font-medium hover:bg-red-700 transition-all duration-200 shadow-md hover:shadow-lg flex items-center gap-2"
                >
                  <X size={16} />
                  Aplicar Cancelación
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
                Confirmar Eliminación
              </h3>
              
              <p className="text-gray-600 mb-6">
                ¿Estás seguro de que quieres eliminar {selectedTemplates.size} plantilla{selectedTemplates.size !== 1 ? 's' : ''}? 
                Esta acción no se puede deshacer.
              </p>
              
              <div className="flex gap-3">
                <button
                  onClick={handleDeleteCancel}
                  className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg font-medium hover:bg-gray-50 transition-colors duration-200"
                >
                  Cancelar
                </button>
                
                <button
                  onClick={handleDeleteConfirmed}
                  className="flex-1 px-4 py-2 bg-red-600 text-white rounded-lg font-medium hover:bg-red-700 transition-colors duration-200"
                >
                  Sí, Eliminar
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </DashboardLayout>
  );
}
