'use client';

import React, { useState, useCallback } from 'react';
import { Template } from '@/types';

interface CanvaTemplateDownloaderProps {
  template: Template;
  onDownload: (template: Template, format: 'png' | 'pdf') => void;
  onClose: () => void;
}

const CanvaTemplateDownloader: React.FC<CanvaTemplateDownloaderProps> = React.memo(({
  template,
  onDownload,
  onClose
}) => {
  const [isDownloading, setIsDownloading] = useState(false);
  const [downloadFormat, setDownloadFormat] = useState<'png' | 'pdf'>('png');
  const [error, setError] = useState<string | null>(null);

  const downloadFromCanva = useCallback(async () => {
    setIsDownloading(true);
    setError(null);

    try {
      // Method 1: Open real Canva template for editing and downloading
      if (template.link && template.link.includes('canva.com')) {
        // Open the actual Canva template in a new tab
        window.open(template.link, '_blank');
        
        // Show detailed instructions for downloading
        alert(`🎨 Plantilla "${template.name}" abierta en Canva.com

📥 Para descargar la plantilla real:

1. En la nueva pestaña de Canva, espera a que cargue la plantilla
2. Haz clic en "Descargar" (botón azul en la esquina superior derecha)
3. Selecciona el formato: ${downloadFormat.toUpperCase()}
4. Elige la calidad (recomendado: Alta)
5. Haz clic en "Descargar" para obtener el archivo real

💡 Consejo: Esta es la plantilla REAL de Canva con todos los elementos profesionales, fuentes y gráficos originales.

Si tienes problemas, usa el botón "Editar en Canva" para acceder directamente.`);
        
        onClose();
        return;
      }

      // Method 2: Fallback to placeholder generation
      onDownload(template, downloadFormat);
      onClose();

    } catch (err) {
      console.error('Error downloading from Canva:', err);
      setError('Error al descargar desde Canva. Usando vista previa generada.');
      
      // Fallback to placeholder after a delay
      setTimeout(() => {
        onDownload(template, downloadFormat);
        onClose();
      }, 2000);
    } finally {
      setIsDownloading(false);
    }
  }, [template, downloadFormat, onDownload, onClose]);

  const openInCanva = useCallback(() => {
    if (template.link) {
      window.open(template.link, '_blank');
    }
  }, [template.link]);

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-6">
        <div className="text-center mb-6">
          <div className="text-4xl mb-3">🎨</div>
          <h3 className="text-xl font-black text-gray-900 mb-2">
            Descargar Plantilla de Canva
          </h3>
          <p className="text-gray-600 text-sm">
            {template.name}
          </p>
        </div>

        {/* Format Selection */}
        <div className="mb-6">
          <label className="block text-sm font-bold text-gray-700 mb-3">
            Formato de Descarga:
          </label>
          <div className="grid grid-cols-2 gap-3">
            <button
              onClick={() => setDownloadFormat('png')}
              className={`p-3 rounded-xl border-2 font-bold transition-all duration-300 ${
                downloadFormat === 'png'
                  ? 'border-blue-500 bg-blue-50 text-blue-700'
                  : 'border-gray-200 bg-gray-50 text-gray-600 hover:border-gray-300'
              }`}
            >
              <div className="text-lg mb-1">🖼️</div>
              <div className="text-xs">PNG</div>
              <div className="text-xs text-gray-500">Imagen</div>
            </button>
            
            <button
              onClick={() => setDownloadFormat('pdf')}
              className={`p-3 rounded-xl border-2 font-bold transition-all duration-300 ${
                downloadFormat === 'pdf'
                  ? 'border-purple-500 bg-purple-50 text-purple-700'
                  : 'border-gray-200 bg-gray-50 text-gray-600 hover:border-gray-300'
              }`}
            >
              <div className="text-lg mb-1">📄</div>
              <div className="text-xs">PDF</div>
              <div className="text-xs text-gray-500">Documento</div>
            </button>
          </div>
        </div>

        {/* Download Options */}
        <div className="space-y-3 mb-6">
          <button
            onClick={downloadFromCanva}
            disabled={isDownloading}
            className={`w-full py-3 px-4 rounded-xl font-bold transition-all duration-300 ${
              isDownloading
                ? 'bg-gray-400 text-gray-200 cursor-not-allowed'
                : 'bg-gradient-to-r from-blue-600 to-purple-600 text-white hover:from-blue-700 hover:to-purple-700 hover:scale-105 shadow-lg'
            }`}
          >
            {isDownloading ? (
              <span className="flex items-center justify-center space-x-2">
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                <span>Abriendo Canva...</span>
              </span>
            ) : (
              <span className="flex items-center justify-center space-x-2">
                <span>🎨</span>
                <span>Abrir en Canva para Descargar</span>
              </span>
            )}
          </button>

          <button
            onClick={openInCanva}
            className="w-full py-3 px-4 bg-gray-100 text-gray-700 rounded-xl font-bold hover:bg-gray-200 transition-all duration-300"
          >
            <span className="flex items-center justify-center space-x-2">
              <span>✏️</span>
              <span>Editar en Canva</span>
            </span>
          </button>
        </div>

        {/* Error Display */}
        {error && (
          <div className="mb-4 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
            <p className="text-sm text-yellow-800">{error}</p>
          </div>
        )}

        {/* Info */}
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 mb-6">
          <p className="text-xs text-blue-800 text-center">
            <strong>🎯 ¡Importante!</strong> Al hacer clic en "Abrir en Canva para Descargar", se abrirá la plantilla REAL 
            en Canva.com donde podrás descargar el archivo profesional con todos los elementos, fuentes y gráficos originales.
          </p>
        </div>

        {/* Close Button */}
        <button
          onClick={onClose}
          className="w-full py-2 px-4 bg-gray-200 text-gray-700 rounded-lg font-bold hover:bg-gray-300 transition-all duration-300"
        >
          Cerrar
        </button>
      </div>
    </div>
  );
});

CanvaTemplateDownloader.displayName = 'CanvaTemplateDownloader';

export default CanvaTemplateDownloader;
