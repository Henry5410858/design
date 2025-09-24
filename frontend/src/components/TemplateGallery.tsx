'use client';

import React, { useState, useMemo, useCallback, useEffect } from 'react';
import { Template } from '@/types';
import API_ENDPOINTS from '@/config/api';
import { exportTemplateAsImage } from '@/utils/canvasExport';
import { templateDesignManager, useTemplateDesignManager } from '@/utils/templateDesignManager';
import { useNotification } from '@/context/NotificationContext';

interface TemplateGalleryProps {
  templates: Template[];
}

const TemplateGallery: React.FC<TemplateGalleryProps> = React.memo(({ templates }) => {
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedTemplates, setSelectedTemplates] = useState<Set<string>>(new Set());
  const [showInstructions, setShowInstructions] = useState(false);
  const [instructionData, setInstructionData] = useState<{template: Template, format: 'png' | 'pdf'} | null>(null);
  const designManager = useTemplateDesignManager();
  // Notifications
  const { showInfo, showError, showSuccess, showWarning } = useNotification();

  // Cleanup function for modal state
  const closeModal = useCallback(() => {
    try {
      setShowInstructions(false);
      // Delay clearing data to prevent DOM manipulation conflicts
      setTimeout(() => {
        setInstructionData(null);
      }, 100);
    } catch (error) {
      console.error('Error closing modal:', error);
      // Force cleanup
      setShowInstructions(false);
      setInstructionData(null);
    }
  }, []);

  // Handle keyboard events for modal
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape' && showInstructions) {
        closeModal();
      }
    };

    if (showInstructions) {
      document.addEventListener('keydown', handleKeyDown);
    }

    return () => {
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [showInstructions, closeModal]);

  // Preload design images for better performance
  useEffect(() => {
    if (templates.length > 0) {
      console.log(`🚀 Preloading design images for ${templates.length} templates...`);
      designManager.preloadDesignImages(templates).catch(error => {
        console.error('❌ Error preloading design images:', error);
      });
    }
  }, [templates, designManager]);

  // Safe modal open function
  const openModal = useCallback((data: {template: Template, format: 'png' | 'pdf'} | null) => {
    try {
      if (data && data.template) {
        setInstructionData(data);
        setShowInstructions(true);
      }
    } catch (error) {
      console.error('Error opening modal:', error);
      // Fallback: just open Canva directly
      if (data?.template?.link) {
        const editUrl = data.template.link.includes('/edit') 
          ? data.template.link 
          : data.template.link.replace('/view', '/edit');
        window.open(editUrl, '_blank');
      }
    }
  }, []);

  // Cleanup effect to prevent memory leaks
  useEffect(() => {
    return () => {
      // Cleanup on component unmount
      setShowInstructions(false);
      setInstructionData(null);
    };
  }, []);

  // Safety check for modal data
  const isModalDataValid = useMemo(() => {
    return showInstructions && 
           instructionData && 
           instructionData.template && 
           instructionData.format &&
           instructionData.template.name &&
           instructionData.template.link;
  }, [showInstructions, instructionData]);

  // Get category icon and color
  const getCategoryInfo = useCallback((category: string) => {
    const categoryInfo = {
      'post': { icon: '📱', color: 'bg-blue-100 text-blue-800 border-blue-300' },
      'story': { icon: '📖', color: 'bg-purple-100 text-purple-800 border-purple-300' },
      'flyer': { icon: '📄', color: 'bg-green-100 text-green-800 border-green-300' },
      'banner': { icon: '🖼️', color: 'bg-orange-100 text-orange-800 border-orange-300' },
      'badge': { icon: '🏆', color: 'bg-yellow-100 text-yellow-800 border-yellow-300' },
      'brochure': { icon: '📋', color: 'bg-red-100 text-red-800 border-red-300' }
    };
    
    return categoryInfo[category as keyof typeof categoryInfo] || { icon: '📁', color: 'bg-gray-100 text-gray-800 border-gray-300' };
  }, []);

  const categories = useMemo(() => {
    const categoryMap = {
      'all': 'Todas las Categorías',
      'post': 'Posts para Redes Sociales',
      'story': 'Stories & Historias',
      'flyer': 'Flyers & Folletos',
      'banner': 'Banners Web',
      'badge': 'Insignias Digitales',
      'brochure': 'Brochures & Documentos'
    };
    
    return ['all', ...Array.from(new Set(templates.map(t => t.category)))].map(category => ({
      value: category,
      label: categoryMap[category as keyof typeof categoryMap] || category
    }));
  }, [templates]);

  const filteredTemplates = useMemo(() =>
    templates.filter(template => {
      const matchesCategory = selectedCategory === 'all' || template.category === selectedCategory;
      const matchesSearch = template.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                           template.description.toLowerCase().includes(searchQuery.toLowerCase());
      return matchesCategory && matchesSearch;
    }),
    [templates, selectedCategory, searchQuery]
  );

  const toggleTemplateSelection = useCallback((templateId: string) => {
    setSelectedTemplates(prev => {
      const newSet = new Set(prev);
      if (newSet.has(templateId)) {
        newSet.delete(templateId);
      } else {
        newSet.add(templateId);
      }
      return newSet;
    });
  }, []);

  const openInCanva = useCallback((template: Template) => {
    if (template.link) {
      window.open(template.link, '_blank');
    }
  }, []);

  const downloadTemplate = useCallback(async (template: Template, format: 'png' | 'pdf') => {
    try {
      // Use top-level hooks only; context already available
      // Info toast when starting
      showInfo(`Creando ${format.toUpperCase()} de "${template.name}"...`, 3000);

      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      
      if (!ctx) {
        console.error('Could not get canvas context');
        showError('No se pudo generar la plantilla. Por favor intenta de nuevo.', 5000);
        return;
      }

      // Set canvas size based on template dimensions
      const [width, height] = template.dimensions.split('×').map(d => parseInt(d));
      canvas.width = width;
      canvas.height = height;

      // Create gradient background
      const gradient = ctx.createLinearGradient(0, 0, width, height);
      gradient.addColorStop(0, '#3B82F6');
      gradient.addColorStop(1, '#8B5CF6');
      ctx.fillStyle = gradient;
      ctx.fillRect(0, 0, width, height);

      // Add template info
      ctx.fillStyle = '#FFFFFF';
      ctx.font = 'bold 48px Arial';
      ctx.textAlign = 'center';
      ctx.fillText(template.name, width / 2, height / 2 - 50);
      
      ctx.font = '24px Arial';
      ctx.fillText(template.description, width / 2, height / 2);
      
      ctx.font = '20px Arial';
      ctx.fillText(template.dimensions, width / 2, height / 2 + 50);

      if (format === 'png') {
        // Download as PNG
        canvas.toBlob((blob) => {
          if (blob) {
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `${template.name.replace(/\s+/g, '_')}.png`;
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            URL.revokeObjectURL(url);

            // Success notification
            showSuccess(`¡PNG Descargado! La plantilla "${template.name}" se descargó exitosamente.`, 4000);
          }
        });
      } else if (format === 'pdf') {
        // Download as PDF
        const jsPDF = (await import('jspdf')).default;
        const pdf = new jsPDF({
          orientation: width > height ? 'landscape' : 'portrait',
          unit: 'px',
          format: [width, height]
        });
        
        const imgData = canvas.toDataURL('image/png');
        pdf.addImage(imgData, 'PNG', 0, 0, width, height);
        pdf.save(`${template.name.replace(/\s+/g, '_')}.pdf`);

        // Success notification
        showSuccess(`¡PDF Descargado! La plantilla "${template.name}" se descargó exitosamente.`, 4000);
      }
    } catch (error) {
      console.error('Error downloading template:', error);
      
      showError('Hubo un problema al descargar la plantilla. Por favor intenta de nuevo.', 5000);
    }
  }, []);

  const handleCategorySelect = useCallback((category: string) => {
    setSelectedCategory(category);
    
    if (category !== 'all') {
      showInfo(`Categoría seleccionada: Mostrando plantillas de ${category}`, 2000);
    }
  }, []);

  const handleSearchChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const query = e.target.value;
    setSearchQuery(query);
    
    if (query && filteredTemplates.length === 0) {
      showInfo('Búsqueda sin resultados: No se encontraron plantillas que coincidan con tu búsqueda.', 3000);
    }
  }, [filteredTemplates.length]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 p-6">
      {/* Information Banner */}
      <div className="bg-gradient-to-r from-blue-600 to-purple-600 rounded-2xl shadow-2xl mb-6 p-6 text-white">
        <div className="flex items-start space-x-4">
          <div className="text-2xl">ℹ️</div>
          <div className="flex-1">
            <h2 className="text-xl font-black mb-2">¿Qué estás descargando?</h2>
            <div className="grid md:grid-cols-2 gap-4 text-sm">
              <div className="bg-white/20 rounded-lg p-3 backdrop-blur-sm">
                <h4 className="font-bold mb-2 text-blue-100">✅ Lo que SÍ obtienes:</h4>
                <ul className="space-y-1 text-blue-50">
                  <li>• Plantillas reales de Canva.com</li>
                  <li>• Formato PNG o PDF según tu elección</li>
                  <li>• Descarga masiva en archivo ZIP</li>
                  <li>• Plantillas organizadas por categoría</li>
                </ul>
              </div>
              <div className="bg-white/20 rounded-lg p-3 backdrop-blur-sm">
                <h4 className="font-bold mb-2 text-yellow-100">⚠️ Lo que NO obtienes:</h4>
                <ul className="space-y-1 text-yellow-50">
                  <li>• Vistas previas generadas</li>
                  <li>• Elementos básicos de placeholder</li>
                  <li>• Calidad reducida</li>
                  <li>• Diseños simplificados</li>
                </ul>
              </div>
            </div>
            <div className="mt-4 p-3 bg-white/20 rounded-lg backdrop-blur-sm">
              <p className="text-sm font-medium">
                <span className="text-blue-100">🎯 ¡Descarga Inteligente!</span> Los botones PNG y PDF abren Canva.com 
                directamente en modo edición para descarga más rápida. ¡Obtén plantillas REALES en 30 segundos!
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Search and Filter Bar */}
      <div className="bg-gray-800/50 backdrop-blur-xl rounded-2xl p-6 border border-gray-700/50 dark-bg-secondary dark-border">
        <div className="flex flex-col lg:flex-row gap-4 items-center">
          {/* Search Input */}
          <div className="flex-1 w-full lg:w-auto">
            <div className="relative">
              <input
                type="text"
                placeholder="Buscar plantillas..."
                value={searchQuery}
                onChange={handleSearchChange}
                className="w-full px-4 py-3 pl-12 bg-gray-700/50 border border-gray-600/50 rounded-xl text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-300"
              />
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <span className="text-gray-400">🔍</span>
              </div>
            </div>
          </div>

          {/* Category Filter */}
          <div className="w-full lg:w-auto">
            <select
              value={selectedCategory}
              onChange={(e) => handleCategorySelect(e.target.value)}
              className="px-4 py-3 bg-gray-700/50 border border-gray-600/50 rounded-xl text-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-300"
            >
              {categories.map(category => (
                <option key={category.value} value={category.value}>
                  {category.label}
                </option>
              ))}
            </select>
          </div>

          {/* Download Selected Button */}
          {selectedTemplates.size > 0 && (
            <button
              onClick={() => {
                if (selectedTemplates.size === 1) {
                  const template = filteredTemplates.find(t => t.id === Array.from(selectedTemplates)[0]);
                  if (template) {
                    openModal({ template, format: 'png' });
                  }
                } else {
                  openModal({ template: filteredTemplates[0], format: 'png' }); // Fallback to first template if multiple selected
                }
              }}
              disabled={selectedTemplates.size === 0}
              className="px-6 py-3 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white font-semibold rounded-xl transition-all duration-300 transform hover:scale-105 hover:shadow-lg"
            >
              📥 Descargar {selectedTemplates.size} Seleccionados
            </button>
          )}
        </div>
      </div>

      {/* Clear Filters Button */}
      {(selectedCategory !== 'all' || searchQuery) && (
        <div className="mt-4 flex justify-center">
          <button
            onClick={() => {
              setSelectedCategory('all');
              setSearchQuery('');
            }}
            className="inline-flex items-center space-x-2 px-4 py-2 bg-gray-700 hover:bg-gray-600 text-gray-200 rounded-lg font-bold transition-all duration-300 text-sm"
          >
            <span className="text-2xl">🔄</span>
            <span>Limpiar Filtros</span>
          </button>
        </div>
      )}

      {/* Templates Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
        {filteredTemplates.map(template => (
          <TemplateCard
            key={template.id}
            template={template}
            onEdit={openInCanva}
            onSelect={toggleTemplateSelection}
            isSelected={selectedTemplates.has(template.id)}
            getCategoryInfo={getCategoryInfo}
          />
        ))}
      </div>

      {/* No Results */}
      {filteredTemplates.length === 0 && (
        <div className="text-center py-12">
          <div className="text-6xl mb-4">🔍</div>
          <h3 className="text-xl font-black text-white mb-2">No se encontraron plantillas</h3>
          <p className="text-gray-300">Intenta ajustar los filtros o la búsqueda</p>
        </div>
      )}

      {/* Download Instructions Modal */}
      {isModalDataValid && instructionData && (
        <div 
          className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4"
          onClick={(e) => {
            try {
              if (e.target === e.currentTarget) {
                closeModal();
              }
            } catch (error) {
              console.error('Error handling modal click:', error);
              // Force close on error
              setShowInstructions(false);
              setInstructionData(null);
            }
          }}
          onKeyDown={(e) => {
            if (e.key === 'Escape') {
              closeModal();
            }
          }}
          role="dialog"
          aria-modal="true"
          tabIndex={-1}
        >
          <div className="bg-gray-800 border border-gray-700 rounded-2xl shadow-2xl max-w-md w-full p-6">
            <div className="text-center mb-6">
              <div className="w-16 h-16 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center mx-auto mb-4">
                <span className="text-2xl">🎨</span>
              </div>
              <h3 className="text-xl font-bold text-white mb-2">
                ¡Plantilla Abierta en Canva!
              </h3>
              <p className="text-gray-300">
                {instructionData.template.name}
              </p>
            </div>

            <div className="space-y-4 mb-6">
              <div className="bg-blue-900/30 border border-blue-700/50 rounded-lg p-4">
                <h4 className="font-semibold text-blue-200 mb-2">
                  📥 Descarga {instructionData.format.toUpperCase()}
                </h4>
                <ol className="text-sm text-blue-100 space-y-1">
                  <li>1. En Canva, haz clic en "Descargar" (botón azul arriba)</li>
                  <li>2. Selecciona: {instructionData.format.toUpperCase()}</li>
                  <li>3. Calidad: Alta</li>
                  <li>4. Haz clic en "Descargar"</li>
                </ol>
              </div>

              <div className="bg-yellow-900/30 border border-yellow-700/50 rounded-lg p-4">
                <h4 className="font-semibold text-yellow-200 mb-2">
                  💡 Pro Tip
                </h4>
                <p className="text-sm text-yellow-100">
                  Si no ves el botón de descarga, haz clic en "Compartir" → "Descargar"
                </p>
              </div>
            </div>

            <div className="flex gap-3">
              <button
                onClick={closeModal}
                className="flex-1 px-4 py-2 bg-gray-700 hover:bg-gray-600 text-white rounded-lg transition-colors duration-200"
              >
                Cerrar
              </button>
              <button
                onClick={() => {
                  window.open(instructionData.template.link, '_blank');
                  closeModal();
                }}
                className="flex-1 px-4 py-2 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white rounded-lg transition-all duration-200 transform hover:scale-105"
              >
                Abrir en Canva
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
});

// Function to get template thumbnail image from backend uploads
const getTemplateThumbnailImage = (template: Template): string => {
  const templateType = template.category?.toLowerCase() || 'default';
  
  // Map template types to backend thumbnail images
  const thumbnailMap: { [key: string]: string[] } = {
    'badge': ['badge 1.png', 'badge2.png'],
    'badges': ['badge 1.png', 'badge2.png'],
    'banner': ['banner 1.png', 'banner 2.png'],
    'banners': ['banner 1.png', 'banner 2.png'],
    'document': ['document 1.png', 'document 2.png'],
    'documents': ['document 1.png', 'document 2.png'],
    'flyer': ['flyer 1.png', 'flyer 2.png'],
    'flyers': ['flyer 1.png', 'flyer 2.png'],
    'post': ['post 1.png', 'post 2.png'],
    'posts': ['post 1.png', 'post 2.png'],
    'social': ['post 1.png', 'post 2.png'],
    'story': ['story 1.png', 'story 2.png'],
    'stories': ['story 1.png', 'story 2.png'],
    'square-post': ['post 2.png', 'post 1.png'],
    'marketplace-flyer': ['flyer 2.png', 'flyer 1.png'],
    'fb-feed-banner': ['banner 2.png', 'banner 1.png'],
    'digital-badge': ['badge2.png', 'badge 1.png']
  };

  // Try to find matching thumbnail images
  for (const [key, imageFilenames] of Object.entries(thumbnailMap)) {
    if (templateType.includes(key)) {
      // Use template ID to consistently select the same image for the same template
      const templateId = template.id || template.name || 'default';
      const hash = templateId.split('').reduce((a, b) => {
        a = ((a << 5) - a) + b.charCodeAt(0);
        return a & a;
      }, 0);
      const imageIndex = Math.abs(hash) % imageFilenames.length;
      const filename = imageFilenames[imageIndex];
      return API_ENDPOINTS.GET_THUMBNAIL(filename);
    }
  }

  // Default fallback
  return API_ENDPOINTS.GET_THUMBNAIL('flyer 1.png');
};

// Component for displaying template thumbnail images from backend
const TemplateDesignImage = React.memo<{ template: Template }>(({ template }) => {
  const [designImage, setDesignImage] = useState<string | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [hasError, setHasError] = useState(false);
  const designManager = useTemplateDesignManager();

  useEffect(() => {
    // Get the appropriate thumbnail image for this template from backend
    const thumbnailImage = getTemplateThumbnailImage(template);
    setDesignImage(thumbnailImage);
    console.log(`🎨 Using thumbnail image for template ${template.id}: ${thumbnailImage}`);
  }, [template.id, template.category]);

  // Show template background image
  if (designImage) {
    return (
      <div className="relative w-full h-48 group">
        <img
          src={designImage}
          alt={`${template.name} plantilla`}
          className="w-full h-48 object-cover transition-transform duration-300 group-hover:scale-110"
          loading="lazy"
          onError={() => {
            console.warn(`⚠️ Failed to load thumbnail image: ${designImage}`);
            setHasError(true);
          }}
        />
        <div className="absolute inset-0 bg-black bg-opacity-20 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-300">
          <div className="text-white text-xs bg-green-600 bg-opacity-80 px-2 py-1 rounded flex items-center">
            <span className="w-2 h-2 bg-green-400 rounded-full mr-2"></span>
            {template.category || 'Plantilla'} - Miniatura
          </div>
        </div>
      </div>
    );
  }

  // Fallback to original thumbnail if no background image
  return (
    <div className="relative w-full h-48 bg-gray-100 group">
      <img
        src={template.thumbnailFilename ? API_ENDPOINTS.GET_THUMBNAIL(template.thumbnailFilename) : template.thumbnail}
        alt={template.name}
        className="w-full h-48 object-cover transition-transform duration-300 group-hover:scale-110"
        loading="lazy"
      />
      <div className="absolute inset-0 bg-black bg-opacity-20 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-300">
        <div className="text-white text-xs bg-black bg-opacity-50 px-2 py-1 rounded">
          Imagen de plantilla
        </div>
      </div>
    </div>
  );
});

TemplateDesignImage.displayName = 'TemplateDesignImage';

const TemplateCard = React.memo<{
  template: Template;
  onEdit: (template: Template) => void;
  onSelect: (templateId: string) => void;
  isSelected: boolean;
  getCategoryInfo: (category: string) => { icon: string; color: string };
}>(({ template, onEdit, onSelect, isSelected, getCategoryInfo }) => {
  const handleCardClick = useCallback(() => {
    // Open the Canva template in a new tab
    window.open(template.link, '_blank');
  }, [template.link]);

  const handleSelect = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    e.stopPropagation(); // Prevent card click when selecting
    onSelect(template.id);
  }, [template.id, onSelect]);

  const categoryInfo = getCategoryInfo(template.category);

  return (
    <div 
      className={`relative group cursor-pointer transition-all duration-300 hover:scale-105 hover:shadow-2xl ${
        isSelected ? 'ring-4 ring-blue-500 ring-opacity-50' : ''
      }`}
      onClick={handleCardClick}
    >
      {/* Template Image */}
      <div className="relative overflow-hidden rounded-t-xl bg-gray-700">
        <TemplateDesignImage template={template} />
        
        {/* Category Badge */}
        <div className={`absolute top-3 left-3 px-2 py-1 rounded-full text-xs font-medium border ${categoryInfo.color}`}>
          {categoryInfo.icon} {template.category}
        </div>
        
        {/* Plan Badge */}
        <div className={`absolute top-3 right-3 px-2 py-1 rounded-full text-xs font-medium ${
          template.plan === 'Gratis' ? 'bg-green-900/80 text-green-200 border border-green-600' :
          template.plan === 'Premium' ? 'bg-blue-900/80 text-blue-200 border border-blue-600' :
          'bg-purple-900/80 text-purple-200 border border-purple-600'
        }`}>
          {template.plan}
        </div>
        
        {/* Select Checkbox */}
        <div className="absolute top-3 left-1/2 transform -translate-x-1/2">
          <input
            type="checkbox"
            checked={isSelected}
            onChange={handleSelect}
            className="w-5 h-5 text-blue-600 bg-gray-800 border-2 border-gray-600 rounded-full focus:ring-blue-500 focus:ring-2 cursor-pointer"
          />
        </div>
      </div>

      {/* Template Info */}
      <div className="p-4 bg-gray-800 border-t border-gray-700 rounded-b-xl">
        <h3 className="font-bold text-lg text-white mb-2 group-hover:text-blue-400 transition-colors">
          {template.name}
        </h3>
        <p className="text-gray-300 text-sm mb-3 line-clamp-2">
          {template.description}
        </p>
        
        <div className="flex items-center justify-between text-sm text-gray-400">
          <span className="flex items-center gap-1">
            📐 {template.dimensions}
          </span>
          <span className="text-xs bg-gray-700 px-2 py-1 rounded text-gray-300">
            Click para abrir en Canva
          </span>
        </div>
      </div>

      {/* Hover Overlay */}
      <div className="absolute inset-0 bg-blue-600 bg-opacity-0 group-hover:bg-opacity-10 transition-all duration-300 rounded-xl pointer-events-none" />
    </div>
  );
});

TemplateCard.displayName = 'TemplateCard';
TemplateGallery.displayName = 'TemplateGallery';

export default TemplateGallery;
