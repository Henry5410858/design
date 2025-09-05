import React, { useState, useEffect } from 'react';
import Card from '../ui/Card';
import { useTheme } from '@/context/ThemeContext';
import { api } from '../../utils/api';
import { 
  SquaresFour, 
  Download, 
  Image as ImageIcon, 
  Stack, 
  FilePdf 
} from 'phosphor-react';

interface TemplateItem {
  id: string;
  name: string;
  category: string;
  dimensions: string;
  description: string;
  thumbnail: string;
  type?: 'flyer' | 'social' | 'story' | 'badge' | 'banner' | 'document';
  editorType?: 'flyer' | 'social' | 'story' | 'badge' | 'banner' | 'document';
  templateKey?: string; // For real estate templates
}

interface TemplateGalleryProps {
  onDownloadTemplate?: (templateId: string) => void;
  isSelectionMode?: boolean;
  selectedTemplates?: Set<string>;
  onTemplateSelection?: (templateId: string, isSelected: boolean) => void;
  customBackgroundImage?: string | null;
  templatesWithCustomBackground?: Set<string>;
  isExportMode?: boolean;
}

const TemplateGallery: React.FC<TemplateGalleryProps> = ({
  onDownloadTemplate,
  isSelectionMode = false,
  selectedTemplates = new Set(),
  onTemplateSelection,
  customBackgroundImage,
  templatesWithCustomBackground = new Set(),
  isExportMode = false
}) => {
  const { theme } = useTheme();
  const [selectedCategory, setSelectedCategory] = useState<'all' | TemplateItem['category']>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [templates, setTemplates] = useState<TemplateItem[]>([]);
  const [loading, setLoading] = useState(true);

  // Fetch templates from API
  useEffect(() => {
    const fetchTemplates = async () => {
      try {
        setLoading(true);
        console.log('🔄 Fetching templates from API...');
        
        // Fetch all templates
        const response = await api.getTemplates();
        if (response.ok) {
          const apiTemplates = await response.json();
          console.log('✅ Templates fetched from API:', apiTemplates.length);
          
          // Convert API templates to TemplateItem format
          const convertedTemplates: TemplateItem[] = apiTemplates.map((template: any) => ({
            id: template._id || template.id,
            name: template.name,
            category: template.category,
            dimensions: template.canvasSize || '1200x1800',
            description: template.description || `Template ${template.name}`,
            thumbnail: template.thumbnail || '/api/placeholder/400/300',
            type: template.type as TemplateItem['type'],
            editorType: template.type as TemplateItem['editorType'],
            templateKey: template.templateKey
          }));
          
          setTemplates(convertedTemplates);
          console.log('✅ Templates converted and set:', convertedTemplates.length);
        } else {
          console.error('❌ Failed to fetch templates from API');
          // Fallback to sample templates
          setTemplates(sampleTemplates);
        }
      } catch (error) {
        console.error('❌ Error fetching templates:', error);
        // Fallback to sample templates
        setTemplates(sampleTemplates);
      } finally { 
        setLoading(false);
      }
    };

    fetchTemplates();
  }, []);

  const categories = [
    { id: 'all', name: 'Todos', icon: <SquaresFour size={24} />, color: 'from-gray-500 to-gray-700' },
    { id: 'flyers', name: 'Flyers', icon: <Download size={24} />, color: 'from-blue-500 to-blue-700' },
    { id: 'badges', name: 'Badges', icon: <ImageIcon size={24} />, color: 'from-green-500 to-green-700' },
    { id: 'stories', name: 'Stories', icon: <ImageIcon size={24} />, color: 'from-purple-500 to-purple-700' },
    { id: 'banners', name: 'Banners', icon: <Stack size={24} />, color: 'from-orange-500 to-orange-700' },
    { id: 'social-posts', name: 'Posts Redes', icon: <ImageIcon size={24} />, color: 'from-pink-500 to-pink-700' },
    { id: 'documents', name: 'Documentos', icon: <FilePdf size={24} />, color: 'from-red-500 to-red-700' }
  ];

  // Enhanced templates with editor types and template keys
  const sampleTemplates: TemplateItem[] = [
    // Social Posts
    {
      id: '1',
      name: 'IG/FB Square Post',
      category: 'social-posts',
      dimensions: '1080x1080',
      thumbnail: '/api/placeholder/400/300',
      description: 'Post cuadrado optimizado para Instagram y Facebook',
      editorType: 'social',
      templateKey: 'luxuryHouse'
    },
    {
      id: '2',
      name: 'Post Promocional',
      category: 'social-posts',
      dimensions: '1080x1080',
      thumbnail: '/api/placeholder/400/300',
      description: 'Diseño atractivo para promociones en redes sociales',
      editorType: 'social',
      templateKey: 'modernFamily'
    },
    // Story Templates
    {
      id: '3',
      name: 'IG/FB/WSP Story',
      category: 'stories',
      dimensions: '1080x1920',
      thumbnail: '/api/placeholder/400/700',
      description: 'Story vertical para Instagram, Facebook y WhatsApp',
      editorType: 'story',
      templateKey: 'dreamHome'
    },
    {
      id: '4',
      name: 'Story Promocional',
      category: 'stories',
      dimensions: '1080x1920',
      thumbnail: '/api/placeholder/400/700',
      description: 'Story con elementos promocionales atractivos',
      editorType: 'story',
      templateKey: 'cityRealEstate'
    },
    // Flyer Templates
    {
      id: '5',
      name: 'Marketplace Flyer',
      category: 'flyers',
      dimensions: '1200x1800',
      thumbnail: '/api/placeholder/400/300',
      description: 'Flyer optimizado para marketplace y ventas',
      editorType: 'flyer',
      templateKey: 'luxuryHouse'
    },
    {
      id: '6',
      name: 'Flyer Evento',
      category: 'flyers',
      dimensions: '1200x1800',
      thumbnail: '/api/placeholder/400/300',
      description: 'Flyer para eventos y conferencias',
      editorType: 'flyer',
      templateKey: 'modernFamily'
    },
    // Banner Templates
    {
      id: '7',
      name: 'FB Feed Banner',
      category: 'banners',
      dimensions: '1200x630',
      thumbnail: '/api/placeholder/400/200',
      description: 'Banner optimizado para Facebook Feed',
      editorType: 'banner',
      templateKey: 'cityRealEstate'
    },
    {
      id: '8',
      name: 'Banner Web',
      category: 'banners',
      dimensions: '1200x630',
      thumbnail: '/api/placeholder/400/200',
      description: 'Banner para sitios web y landing pages',
      editorType: 'banner',
      templateKey: 'modernFamily'
    },
    // Badge Templates
    {
      id: '9',
      name: 'Badge Vendido',
      category: 'badges',
      dimensions: '400x400',
      thumbnail: '/api/placeholder/400/400',
      description: 'Badge para propiedades vendidas',
      editorType: 'badge',
      templateKey: 'luxuryHouse'
    },
    {
      id: '10',
      name: 'Badge Reservado',
      category: 'badges',
      dimensions: '400x400',
      thumbnail: '/api/placeholder/400/400',
      description: 'Badge para propiedades reservadas',
      editorType: 'badge',
      templateKey: 'modernFamily'
    },
    // Brochure Templates
    {
      id: '11',
      name: 'Brochure Trifold',
      category: 'documents',
      dimensions: '1200x1800',
      thumbnail: '/api/placeholder/400/300',
      description: 'Brochure profesional trifold para villas',
      editorType: 'document',
      templateKey: 'trifoldBrochure'
    },
    {
      id: '12',
      name: 'Documento Propiedad',
      category: 'documents',
      dimensions: '1200x1800',
      thumbnail: '/api/placeholder/400/300',
      description: 'Documento detallado de propiedad',
      editorType: 'document',
      templateKey: 'dreamHome'
    }
  ];

  // Function to open Canva editor with specific template
  const openCanvaEditor = (templateId: string) => {
    // Direct link to Canva editor with template
    const canvaUrl = `https://www.canva.com/design/${templateId}`;
    window.open(canvaUrl, '_blank');
  };

  // Ensure templates is always an array and filter safely
  const safeTemplates = Array.isArray(templates) ? templates : [];
  
  const filteredTemplates = safeTemplates.filter(template => {
    const matchesCategory = selectedCategory === 'all' || template.category === selectedCategory;
    const matchesSearch = template.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         template.description.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  // Group templates by category
  const groupedTemplates = filteredTemplates.reduce((acc, template) => {
    const category = template.category;
    if (!acc[category]) {
      acc[category] = [];
    }
    acc[category].push(template);
    return acc;
  }, {} as Record<string, TemplateItem[]>);

  // Get category info for display
  const getCategoryInfo = (categoryId: string) => {
    return categories.find(cat => cat.id === categoryId) || categories[0];
  };

  const handleEditTemplate = (template: TemplateItem) => {
    console.log('🎯 Template clicked:', template);
    console.log('📝 Template key:', template.templateKey);
    console.log('🎨 Editor type:', template.editorType);
    
    let editorUrl: string;
    
    if (template.templateKey) {
      // Template has templateKey - use the new loading system
      console.log('✅ Opening editor with template key:', template.templateKey);
      editorUrl = `/editor?type=${template.editorType || template.type}&template=${template.templateKey}&id=${template.id}`;
    } else {
      // Template without templateKey - use fallback loading
      console.log('⚠️ No template key, using fallback navigation');
      const editorType = template.editorType || template.type || 
        (template.category === 'social-posts' ? 'social' : 
         template.category === 'documents' ? 'document' : 
         template.category.slice(0, -1));
      editorUrl = `/editor?type=${editorType}&id=${template.id}`;
    }
    
    // Open editor in new tab
    window.open(editorUrl, '_blank');
  };

  // Render template card
  const renderTemplateCard = (template: TemplateItem) => (
    <Card
      key={template.id}
      variant="interactive"
      padding="none"
      className={`group overflow-hidden relative ${
        isSelectionMode ? 'cursor-pointer' : ''
      }`}
      onClick={() => {
        if (isSelectionMode) {
          const isSelected = selectedTemplates.has(template.id);
          onTemplateSelection?.(template.id, !isSelected);
        } else {
          handleEditTemplate(template);
        }
      }}
    >
      {/* Selection Checkbox */}
      {isSelectionMode && (
        <div className="absolute top-3 left-3 z-10">
          <div className={`w-6 h-6 rounded-full border-2 flex items-center justify-center transition-all duration-200 ${
            selectedTemplates.has(template.id)
              ? 'bg-blue-600 border-blue-600'
              : 'bg-white border-gray-300'
          }`}>
            {selectedTemplates.has(template.id) && (
              <div className="w-3 h-3 bg-white rounded-full"></div>
            )}
          </div>
        </div>
      )}

      {/* Thumbnail */}
      <div className="relative aspect-[4/3] overflow-hidden bg-gray-100">
        {templatesWithCustomBackground.has(template.id) && customBackgroundImage ? (
          // Show custom background image
          <div className="relative w-full h-full">
            <img 
              src={customBackgroundImage} 
              alt={`Custom background for ${template.name}`}
              className="w-full h-full object-cover"
            />
            {/* Template info overlay */}
            <div className="absolute inset-0 bg-black/20 flex items-center justify-center">
              <div className="text-center text-white">
                <div className="w-8 h-8 rounded-full flex items-center justify-center mx-auto mb-1 bg-white/20 backdrop-blur-sm">
                  {template.category === 'stories' ? <ImageIcon size={16} className="text-white" /> :
                    template.category === 'documents' ? <FilePdf size={16} className="text-white" /> :
                    template.category === 'banners' ? <Stack size={16} className="text-white" /> :
                    template.category === 'badges' ? <ImageIcon size={16} className="text-white" /> :
                    <ImageIcon size={16} className="text-white" />}
                </div>
                <span className="text-xs font-medium">{template.name}</span>
              </div>
            </div>
          </div>
        ) : (
          // Show default template thumbnail
          <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-gray-50 to-gray-100">
            <div className="text-center">
              <div className="w-12 h-12 rounded-full flex items-center justify-center mx-auto mb-2 bg-gray-200">
                {template.category === 'stories' ? <ImageIcon size={24} className="text-gray-600" /> :
                  template.category === 'documents' ? <FilePdf size={24} className="text-gray-600" /> :
                  template.category === 'banners' ? <Stack size={24} className="text-gray-600" /> :
                  template.category === 'badges' ? <ImageIcon size={24} className="text-gray-600" /> :
                  <ImageIcon size={24} className="text-gray-600" />}
              </div>
              <span className="text-sm font-medium text-gray-700">{template.name}</span>
            </div>
          </div>
        )}
        
        {/* Hover Overlay */}
        <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-center justify-center bg-black/40">
          <div className="text-center text-white">
            <div className="w-12 h-12 bg-white/20 rounded-full flex items-center justify-center mx-auto mb-2">
              <ImageIcon size={24} />
            </div>
            <p className="font-medium">
              {isSelectionMode ? 'Click to select' : 'Editar en Editor'}
            </p>
            <p className="text-sm opacity-80">
              {isSelectionMode ? 'Select template' : 'Click para abrir'}
            </p>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="p-4">
        <div className="flex items-start justify-between mb-2">
          <h3 className="font-semibold text-sm line-clamp-2 text-gray-900">
            {template.name}
          </h3>
          {template.templateKey && (
            <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800 ml-2">
              🏠 Preset
            </span>
          )}
        </div>
        
        <p className="text-xs mb-3 line-clamp-2 text-gray-600">
          {template.description}
        </p>
        
        {/* Category Badge */}
        <div className="flex items-center justify-between">
          <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-gray-200 text-gray-700">
            {getCategoryInfo(template.category)?.name}
          </span>
          
          {/* Quick Actions */}
          {!isSelectionMode && (
            <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onDownloadTemplate?.(template.id);
                }}
                className="p-1 h-8 w-8 hover:bg-gray-100 rounded transition-colors duration-200"
              >
                <Download size={16} />
              </button>
            </div>
          )}
        </div>
      </div>
    </Card>
  );

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-8">
        <div>
          <h1 className="text-3xl font-bold mb-2 text-gray-900">
            Galería de Templates
          </h1>
          <p className="text-gray-600">
            Selecciona un template para comenzar a diseñar o crea uno desde cero
          </p>
        </div>
        

      </div>

      {/* Filters and Search */}
      <div className="flex flex-col lg:flex-row gap-4">
        {/* Category Filters */}
        <div className="flex flex-wrap gap-2">
          {categories.map(category => (
            <button
              key={category.id}
              onClick={() => setSelectedCategory(category.id as 'all' | TemplateItem['category'])}
              className={`flex items-center gap-2 px-4 py-2 rounded-xl font-medium transition-all duration-200 ${
                selectedCategory === category.id
                  ? 'bg-gradient-to-r from-blue-600 to-purple-600 text-white shadow-md'
                  : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
              }`}
            >
              {category.name}
              {category.icon}
            </button>
          ))}
        </div>

        {/* Search */}
        <div className="flex-1 max-w-md">
          <div className="relative">
            <input
              type="text"
              placeholder="Buscar templates..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2 rounded-xl focus:outline-none focus:border-blue-500 focus:shadow-sm transition-all duration-200 bg-white border border-gray-300 text-gray-900 placeholder-gray-500"
            />
            <SquaresFour size={16} className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
          </div>
        </div>
      </div>

      {/* Loading State */}
      {loading && (
        <div className="text-center py-16">
          <div className="w-16 h-16 bg-gray-200 rounded-full flex items-center justify-center mx-auto mb-4 animate-pulse">
            <ImageIcon size={32} className="text-gray-400" />
          </div>
          <h3 className="text-lg font-medium text-gray-900 mb-2">Cargando plantillas...</h3>
          <p className="text-gray-600">Obteniendo plantillas desde la base de datos</p>
        </div>
      )}

      {/* Templates Organized by Category */}
      {!loading && (
        <div className="space-y-12">
          {Object.entries(groupedTemplates).map(([categoryId, categoryTemplates]) => {
            const categoryInfo = getCategoryInfo(categoryId);
            return (
              <div key={categoryId} className="space-y-6">
                {/* Category Header */}
                <div className="flex items-center gap-4">
                  <div className={`w-12 h-12 rounded-xl bg-gradient-to-r ${categoryInfo.color} flex items-center justify-center text-white`}>
                    {categoryInfo.icon}
                  </div>
                  <div>
                    <h2 className="text-2xl font-bold text-gray-900">{categoryInfo.name}</h2>
                    <p className="text-gray-600">{categoryTemplates.length} template{categoryTemplates.length !== 1 ? 's' : ''}</p>
                  </div>
                </div>

                {/* Templates Grid for this Category */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                  {categoryTemplates.map(template => renderTemplateCard(template))}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Empty State */}
      {!loading && filteredTemplates.length === 0 && (
        <div className="text-center py-16">
          <div className="w-16 h-16 bg-gray-200 rounded-full flex items-center justify-center mx-auto mb-4">
            <ImageIcon size={32} className="text-gray-400" />
          </div>
          <h3 className="text-lg font-medium text-gray-900 mb-2">
            No se encontraron templates
          </h3>
          <p className="text-gray-600">
            Intenta ajustar los filtros o la búsqueda
          </p>
        </div>
      )}
    </div>
  );
};

export default TemplateGallery;
