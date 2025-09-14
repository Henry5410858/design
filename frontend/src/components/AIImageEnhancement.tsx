'use client';

import React, { useState, useCallback } from 'react';
import { AIImageEnhancementManager, EnhancementOptions, EnhancementResult } from '@/utils/aiImageEnhancement';
import { AI_SERVICES_CONFIG, AI_FEATURES, ENHANCEMENT_PRESETS, SERVICE_INFO } from '@/config/aiServices';
import { Wand2, Sun, Zap, Palette, Upload, Download, RefreshCw, CheckCircle, AlertCircle } from 'lucide-react';

interface AIImageEnhancementProps {
  onImageEnhanced?: (originalUrl: string, enhancedUrl: string) => void;
  onClose?: () => void;
}

export default function AIImageEnhancement({ onImageEnhanced, onClose }: AIImageEnhancementProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [enhancementResult, setEnhancementResult] = useState<EnhancementResult | null>(null);
  const [selectedImage, setSelectedImage] = useState<string>('');
  const [enhancementOptions, setEnhancementOptions] = useState<EnhancementOptions>({
    lighting: 'enhance',
    sharpness: 'enhance',
    colorCorrection: 'enhance',
    upscale: false,
    service: 'cloudinary'
  });

  // Initialize AI enhancement manager with configuration
  const enhancementManager = new AIImageEnhancementManager({
    cloudinary: AI_SERVICES_CONFIG.cloudinary,
    clipdrop: AI_SERVICES_CONFIG.clipdrop,
    letsenhance: AI_SERVICES_CONFIG.letsenhance,
    defaultService: AI_FEATURES.defaultImageEnhancementService
  });

  const handleImageUpload = useCallback((event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      const imageUrl = URL.createObjectURL(file);
      setSelectedImage(imageUrl);
      setEnhancementResult(null);
    }
  }, []);

  const handleEnhanceImage = useCallback(async () => {
    if (!selectedImage) return;

    setIsLoading(true);
    setEnhancementResult(null);

    try {
      const result = await enhancementManager.enhanceImage(selectedImage, enhancementOptions);
      setEnhancementResult(result);
      
      if (result.success && result.enhancedImageUrl && onImageEnhanced) {
        onImageEnhanced(selectedImage, result.enhancedImageUrl);
      }
    } catch (error) {
      setEnhancementResult({
        success: false,
        error: `Enhancement failed: ${error}`
      });
    } finally {
      setIsLoading(false);
    }
  }, [selectedImage, enhancementOptions, enhancementManager, onImageEnhanced]);

  const handleQuickEnhancement = useCallback(async (type: 'lighting' | 'sharpness' | 'color' | 'full') => {
    if (!selectedImage) return;

    setIsLoading(true);
    setEnhancementResult(null);

    try {
      let result: EnhancementResult;
      
      switch (type) {
        case 'lighting':
          result = await enhancementManager.quickLightingFix(selectedImage);
          break;
        case 'sharpness':
          result = await enhancementManager.quickSharpnessFix(selectedImage);
          break;
        case 'color':
          result = await enhancementManager.quickColorFix(selectedImage);
          break;
        case 'full':
          result = await enhancementManager.fullEnhancement(selectedImage);
          break;
        default:
          result = { success: false, error: 'Unknown enhancement type' };
      }
      
      setEnhancementResult(result);
      
      if (result.success && result.enhancedImageUrl && onImageEnhanced) {
        onImageEnhanced(selectedImage, result.enhancedImageUrl);
      }
    } catch (error) {
      setEnhancementResult({
        success: false,
        error: `Quick enhancement failed: ${error}`
      });
    } finally {
      setIsLoading(false);
    }
  }, [selectedImage, enhancementManager, onImageEnhanced]);

  const handleDownloadEnhanced = useCallback(() => {
    if (enhancementResult?.enhancedImageUrl) {
      const link = document.createElement('a');
      link.href = enhancementResult.enhancedImageUrl;
      link.download = 'enhanced-image.png';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    }
  }, [enhancementResult]);

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 max-w-4xl w-full mx-4 max-h-[90vh] overflow-y-auto">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-bold text-gray-800 flex items-center gap-2">
            <Wand2 className="w-6 h-6 text-purple-600" />
            AI Image Enhancement
          </h2>
          {onClose && (
            <button
              onClick={onClose}
              className="text-gray-500 hover:text-gray-700 text-2xl"
            >
              ×
            </button>
          )}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Image Upload and Preview */}
          <div className="space-y-4">
            <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center">
              <Upload className="w-12 h-12 text-gray-400 mx-auto mb-4" />
              <input
                type="file"
                accept="image/*"
                onChange={handleImageUpload}
                className="hidden"
                id="image-upload"
              />
              <label
                htmlFor="image-upload"
                className="cursor-pointer bg-purple-600 text-white px-4 py-2 rounded-lg hover:bg-purple-700 transition-colors"
              >
                Seleccionar Imagen
              </label>
              <p className="text-sm text-gray-500 mt-2">
                JPG, PNG, GIF hasta 10MB
              </p>
            </div>

            {selectedImage && (
              <div className="space-y-2">
                <h3 className="font-semibold text-gray-700">Imagen Original</h3>
                <img
                  src={selectedImage}
                  alt="Original"
                  className="w-full h-48 object-cover rounded-lg border"
                />
              </div>
            )}

            {enhancementResult?.enhancedImageUrl && (
              <div className="space-y-2">
                <h3 className="font-semibold text-gray-700">Imagen Mejorada</h3>
                <img
                  src={enhancementResult.enhancedImageUrl}
                  alt="Enhanced"
                  className="w-full h-48 object-cover rounded-lg border"
                />
                <button
                  onClick={handleDownloadEnhanced}
                  className="w-full bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition-colors flex items-center justify-center gap-2"
                >
                  <Download className="w-4 h-4" />
                  Descargar Mejorada
                </button>
              </div>
            )}
          </div>

          {/* Enhancement Options */}
          <div className="space-y-6">
            {/* Quick Enhancement Buttons */}
            <div>
              <h3 className="font-semibold text-gray-700 mb-3">Mejoras Rápidas</h3>
              <div className="grid grid-cols-2 gap-3">
                <button
                  onClick={() => handleQuickEnhancement('lighting')}
                  disabled={!selectedImage || isLoading}
                  className="p-3 bg-yellow-100 hover:bg-yellow-200 disabled:opacity-50 disabled:cursor-not-allowed rounded-lg transition-colors flex items-center gap-2"
                >
                  <Sun className="w-5 h-5 text-yellow-600" />
                  <span className="text-sm font-medium">{ENHANCEMENT_PRESETS.lighting.name}</span>
                </button>
                
                <button
                  onClick={() => handleQuickEnhancement('sharpness')}
                  disabled={!selectedImage || isLoading}
                  className="p-3 bg-blue-100 hover:bg-blue-200 disabled:opacity-50 disabled:cursor-not-allowed rounded-lg transition-colors flex items-center gap-2"
                >
                  <Zap className="w-5 h-5 text-blue-600" />
                  <span className="text-sm font-medium">{ENHANCEMENT_PRESETS.sharpness.name}</span>
                </button>
                
                <button
                  onClick={() => handleQuickEnhancement('color')}
                  disabled={!selectedImage || isLoading}
                  className="p-3 bg-pink-100 hover:bg-pink-200 disabled:opacity-50 disabled:cursor-not-allowed rounded-lg transition-colors flex items-center gap-2"
                >
                  <Palette className="w-5 h-5 text-pink-600" />
                  <span className="text-sm font-medium">{ENHANCEMENT_PRESETS.color.name}</span>
                </button>
                
                <button
                  onClick={() => handleQuickEnhancement('full')}
                  disabled={!selectedImage || isLoading}
                  className="p-3 bg-purple-100 hover:bg-purple-200 disabled:opacity-50 disabled:cursor-not-allowed rounded-lg transition-colors flex items-center gap-2"
                >
                  <Wand2 className="w-5 h-5 text-purple-600" />
                  <span className="text-sm font-medium">{ENHANCEMENT_PRESETS.full.name}</span>
                </button>
              </div>
            </div>

            {/* Advanced Options */}
            <div>
              <h3 className="font-semibold text-gray-700 mb-3">Opciones Avanzadas</h3>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-600 mb-2">
                    Iluminación
                  </label>
                  <select
                    value={enhancementOptions.lighting}
                    onChange={(e) => setEnhancementOptions(prev => ({
                      ...prev,
                      lighting: e.target.value as EnhancementOptions['lighting']
                    }))}
                    className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                  >
                    <option value="enhance">Mejorar Automáticamente</option>
                    <option value="brighten">Aclarar</option>
                    <option value="dim">Oscurecer</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-600 mb-2">
                    Nitidez
                  </label>
                  <select
                    value={enhancementOptions.sharpness}
                    onChange={(e) => setEnhancementOptions(prev => ({
                      ...prev,
                      sharpness: e.target.value as EnhancementOptions['sharpness']
                    }))}
                    className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                  >
                    <option value="enhance">Mejorar</option>
                    <option value="soften">Suavizar</option>
                    <option value="none">Sin Cambios</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-600 mb-2">
                    Corrección de Color
                  </label>
                  <select
                    value={enhancementOptions.colorCorrection}
                    onChange={(e) => setEnhancementOptions(prev => ({
                      ...prev,
                      colorCorrection: e.target.value as EnhancementOptions['colorCorrection']
                    }))}
                    className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                  >
                    <option value="enhance">Mejorar Automáticamente</option>
                    <option value="vibrant">Más Vibrante</option>
                    <option value="natural">Natural</option>
                  </select>
                </div>

                <div className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    id="upscale"
                    checked={enhancementOptions.upscale}
                    onChange={(e) => setEnhancementOptions(prev => ({
                      ...prev,
                      upscale: e.target.checked
                    }))}
                    className="w-4 h-4 text-purple-600 focus:ring-purple-500 border-gray-300 rounded"
                  />
                  <label htmlFor="upscale" className="text-sm font-medium text-gray-600">
                    Aumentar Resolución (2x)
                  </label>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-600 mb-2">
                    Servicio AI
                  </label>
                  <select
                    value={enhancementOptions.service}
                    onChange={(e) => setEnhancementOptions(prev => ({
                      ...prev,
                      service: e.target.value as EnhancementOptions['service']
                    }))}
                    className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                  >
                    <option value="cloudinary">Cloudinary AI</option>
                    <option value="clipdrop">Clipdrop</option>
                    <option value="letsenhance">Let's Enhance</option>
                  </select>
                </div>
              </div>
            </div>

            {/* Enhancement Button */}
            <button
              onClick={handleEnhanceImage}
              disabled={!selectedImage || isLoading}
              className="w-full bg-purple-600 text-white px-6 py-3 rounded-lg hover:bg-purple-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center justify-center gap-2"
            >
              {isLoading ? (
                <>
                  <RefreshCw className="w-5 h-5 animate-spin" />
                  Procesando...
                </>
              ) : (
                <>
                  <Wand2 className="w-5 h-5" />
                  Mejorar Imagen
                </>
              )}
            </button>

            {/* Result Status */}
            {enhancementResult && (
              <div className={`p-4 rounded-lg flex items-center gap-2 ${
                enhancementResult.success 
                  ? 'bg-green-100 text-green-800' 
                  : 'bg-red-100 text-red-800'
              }`}>
                {enhancementResult.success ? (
                  <>
                    <CheckCircle className="w-5 h-5" />
                    <div>
                      <p className="font-medium">¡Mejora Exitosa!</p>
                      <p className="text-sm">
                        Servicio: {enhancementResult.service}
                        {enhancementResult.processingTime && 
                          ` • Tiempo: ${enhancementResult.processingTime}ms`
                        }
                      </p>
                    </div>
                  </>
                ) : (
                  <>
                    <AlertCircle className="w-5 h-5" />
                    <div>
                      <p className="font-medium">Error en la Mejora</p>
                      <p className="text-sm">{enhancementResult.error}</p>
                    </div>
                  </>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
