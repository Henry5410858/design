/**
 * Template Preview Component
 * Demonstrates how to get canvas design data without opening the editor
 */

import React, { useState, useEffect } from 'react';
import { exportTemplateAsImage, getTemplateData } from '../utils/canvasExport';

interface TemplatePreviewProps {
  templateId: string;
  className?: string;
}

const TemplatePreview: React.FC<TemplatePreviewProps> = ({ templateId, className = '' }) => {
  const [previewImage, setPreviewImage] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    generatePreview();
  }, [templateId]);

  const generatePreview = async () => {
    setLoading(true);
    setError(null);
    
    try {
      // Get template data
      const template = await getTemplateData(templateId);
      if (!template) {
        throw new Error('Template not found');
      }

      // Export template as image
      const imageData = await exportTemplateAsImage(templateId, {
        format: 'png',
        quality: 0.8,
        multiplier: 1 // Lower resolution for preview
      });

      if (imageData) {
        setPreviewImage(`data:image/png;base64,${imageData}`);
      } else {
        throw new Error('Failed to generate preview');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className={`flex items-center justify-center bg-gray-100 rounded-lg ${className}`}>
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-2"></div>
          <p className="text-sm text-gray-600">Generating preview...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className={`flex items-center justify-center bg-red-50 border border-red-200 rounded-lg ${className}`}>
        <div className="text-center">
          <p className="text-sm text-red-600">Error: {error}</p>
          <button 
            onClick={generatePreview}
            className="mt-2 px-3 py-1 text-xs bg-red-100 text-red-700 rounded hover:bg-red-200 transition-colors"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  if (!previewImage) {
    return (
      <div className={`flex items-center justify-center bg-gray-100 rounded-lg ${className}`}>
        <p className="text-sm text-gray-600">No preview available</p>
      </div>
    );
  }

  return (
    <div className={`relative ${className}`}>
      <img 
        src={previewImage} 
        alt="Template preview" 
        className="w-full h-full object-cover rounded-lg"
      />
      <button 
        onClick={generatePreview}
        className="absolute top-2 right-2 p-1 bg-white/80 hover:bg-white rounded-full shadow-sm transition-colors"
        title="Refresh preview"
      >
        <svg className="w-4 h-4 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
        </svg>
      </button>
    </div>
  );
};

export default TemplatePreview;
