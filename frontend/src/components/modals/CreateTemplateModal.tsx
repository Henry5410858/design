'use client';

import React, { useState, useEffect } from 'react';

interface CreateTemplateModalProps {
  isOpen: boolean;
  onClose: () => void;
}

interface TemplateType {
  value: string;
  label: string;
  icon: string;
  description: string;
}

const templateTypes: TemplateType[] = [
  {
    value: 'square-post',
    label: 'IG/FB Square Post',
    icon: '📱',
    description: 'Instagram and Facebook square posts'
  },
  {
    value: 'story',
    label: 'IG/FB/WSP Story',
    icon: '📖',
    description: 'Instagram, Facebook, and WhatsApp stories'
  },
  {
    value: 'marketplace-flyer',
    label: 'Marketplace Flyer',
    icon: '📄',
    description: 'Professional marketplace flyers and leaflets'
  },
  {
    value: 'fb-feed-banner',
    label: 'FB Feed Banner',
    icon: '🚩',
    description: 'Facebook feed banners and headers'
  },
  {
    value: 'digital-badge',
    label: 'Digital Badge / Visual Card',
    icon: '🏷️',
    description: 'Digital badges and visual cards'
  },
  {
    value: 'brochure',
    label: 'Brochure / Simple 1-page Document',
    icon: '📚',
    description: 'A4 format (300 DPI) - brochures and documents'
  }
];

const CreateTemplateModal: React.FC<CreateTemplateModalProps> = ({ isOpen, onClose }) => {
  const [selectedType, setSelectedType] = useState<string>('square-post');
  const [templateName, setTemplateName] = useState<string>('');
  const [isCreating, setIsCreating] = useState(false);

  // Set initial template name when modal opens
  useEffect(() => {
    if (isOpen) {
      setTemplateName(generateDefaultName(selectedType));
    } else {
      // Reset form when modal closes
      setTemplateName('');
      setSelectedType('square-post');
      setIsCreating(false);
    }
  }, [isOpen, selectedType]);

  if (!isOpen) return null;

  const handleCreate = async () => {
    if (!selectedType || !templateName.trim()) return;
    
    // Validate template name length
    if (templateName.trim().length < 3) {
      alert('Template name must be at least 3 characters long');
      return;
    }
    
    if (templateName.trim().length > 100) {
      alert('Template name must be less than 100 characters');
      return;
    }

    setIsCreating(true);
    
    try {
      // Create new template in backend
      const response = await fetch('http://localhost:4000/api/templates', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          type: selectedType,
          name: templateName || generateDefaultName(selectedType),
          canvasData: null, // Blank canvas
          dimensions: getDefaultDimensions(selectedType),
          userId: 'current-user', // This should come from auth context
          createdAt: new Date().toISOString()
        }),
      });

      if (response.ok) {
        const template = await response.json();
        
        // Open editor with the new template in a new tab
        const editorUrl = `/editor?type=${selectedType}&id=${template._id || template.id}&template=${template._id || template.id}`;
        window.open(editorUrl, '_blank');
        
        // Show success message
        alert(`✅ Template "${templateName}" created successfully!\n\nA new editor tab has been opened with your template.`);
        onClose();
      } else {
        console.error('Failed to create template');
        alert('❌ Failed to create template. Please try again.');
      }
    } catch (error) {
      console.error('Error creating template:', error);
      alert('❌ Error creating template. Please check your connection and try again.');
    } finally {
      setIsCreating(false);
    }
  };

  const getDefaultDimensions = (type: string) => {
    const dimensions = {
      'square-post': { width: 1080, height: 1080 },
      'story': { width: 1080, height: 1920 },
      'marketplace-flyer': { width: 1200, height: 1500 },
      'fb-feed-banner': { width: 1200, height: 628 },
      'digital-badge': { width: 1080, height: 1350 },
      'brochure': { width: 2480, height: 3508 }
    };
    return dimensions[type as keyof typeof dimensions] || dimensions['square-post'];
  };

  const handleBackdropClick = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget) {
      onClose();
    }
  };

  const generateDefaultName = (type: string) => {
    const typeLabel = templateTypes.find(t => t.value === type)?.label || 'Template';
    const timestamp = new Date().toLocaleDateString('en-US', { 
      month: 'short', 
      day: 'numeric', 
      year: 'numeric' 
    });
    return `${typeLabel} - ${timestamp}`;
  };

  const handleTypeChange = (type: string) => {
    setSelectedType(type);
    setTemplateName(generateDefaultName(type));
  };

  return (
    <div 
      className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4"
      onClick={handleBackdropClick}
    >
      <div className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className="bg-gradient-to-r from-blue-600 to-purple-600 text-white p-6">
          <div className="flex items-center justify-between">
                         <div>
               <h2 className="text-2xl font-bold">Create New Template</h2>
               <p className="text-blue-100 mt-1">Choose a template type with optimized dimensions for your platform</p>
               <p className="text-blue-200 text-sm mt-1">✨ Template will open in a new editor tab</p>
             </div>
            <button
              onClick={onClose}
              className="text-white/80 hover:text-white transition-colors duration-200"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="p-4">
          {/* Template Type Selector */}
          <div className="mb-4">
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              Template Type
            </label>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
              {templateTypes.map((type) => (
                <div
                  key={type.value}
                  onClick={() => handleTypeChange(type.value)}
                  className={`p-3 border-2 rounded-xl cursor-pointer transition-all duration-200 ${
                    selectedType === type.value
                      ? 'border-blue-500 bg-blue-50'
                      : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'
                  }`}
                >
                  <div className="flex items-center space-x-2">
                    <span className="text-xl">{type.icon}</span>
                    <div>
                      <div className="font-semibold text-gray-900 text-sm">{type.label}</div>
                      <div className="text-xs text-gray-600">{type.description}</div>
                      <div className="text-xs text-blue-600 mt-1 font-medium">
                        {getDefaultDimensions(type.value).width} × {getDefaultDimensions(type.value).height}px
                        {type.value === 'brochure' && (
                          <span className="block text-xs text-blue-600 mt-1">
                            A4 format optimized for print (300 DPI)
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Template Name Input */}
          <div className="mb-4">
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              Template Name
            </label>
            <input
              type="text"
              value={templateName}
              onChange={(e) => setTemplateName(e.target.value)}
              onKeyPress={(e) => {
                if (e.key === 'Enter' && templateName.trim() && !isCreating) {
                  handleCreate();
                }
              }}
              placeholder="Enter template name..."
              maxLength={100}
              className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 ${
                templateName.trim() === '' ? 'border-red-300 focus:ring-red-500' : 'border-gray-200 focus:ring-blue-500'
              }`}
            />
            <div className="flex justify-between items-center mt-1">
              <p className={`text-xs ${
                templateName.trim() === '' ? 'text-red-500' : 'text-gray-500'
              }`}>
                {templateName.trim() === '' ? 'Template name is required' : 'Give your template a descriptive name for easy identification'}
              </p>
              <span className="text-xs text-gray-400">
                {templateName.length}/100
              </span>
            </div>
          </div>

          {/* Selected Type Info with Action Buttons */}
          {selectedType && (
            <div className="bg-gradient-to-r from-blue-50 to-purple-50 rounded-xl p-4 mb-4 border border-blue-200">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <span className="text-2xl">
                    {templateTypes.find(t => t.value === selectedType)?.icon}
                  </span>
                  <div>
                    <div className="font-bold text-gray-900 text-base">
                      {templateTypes.find(t => t.value === selectedType)?.label}
                    </div>
                    <div className="text-sm text-gray-600">
                      {templateTypes.find(t => t.value === selectedType)?.description}
                    </div>
                    <div className="text-sm font-semibold text-blue-700 mt-1">
                      Size: {getDefaultDimensions(selectedType).width} × {getDefaultDimensions(selectedType).height}px
                      {selectedType === 'brochure' && (
                        <span className="block text-xs text-blue-600 mt-1">
                          A4 format optimized for print (300 DPI)
                        </span>
                      )}
                    </div>
                  </div>
                </div>
                
                {/* Action Buttons */}
                <div className="flex flex-col space-y-2">
                  <div className="text-xs text-blue-600 text-center mb-2">
                    💡 Clicking "Create Template" will open the editor in a new tab
                  </div>
                  <div className="flex space-x-2">
                    <button
                      onClick={onClose}
                      className="px-4 py-2 text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors duration-200 font-medium shadow-sm text-sm"
                    >
                      Cancel
                    </button>
                    <button
                      onClick={handleCreate}
                      disabled={isCreating || !selectedType || !templateName.trim()}
                      className="px-4 py-2 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-lg hover:from-blue-700 hover:to-purple-700 transition-all duration-200 font-medium disabled:opacity-50 disabled:cursor-not-allowed flex items-center space-x-2 shadow-lg text-sm"
                    >
                      {isCreating ? (
                        <>
                          <svg className="animate-spin h-3 w-3" fill="none" viewBox="0 0 24 24">
                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                          </svg>
                          <span>Creating Template...</span>
                        </>
                      ) : (
                        <span>Create Template</span>
                      )}
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default CreateTemplateModal;
