'use client';

import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { BrandKit as BrandKitType } from '@/types';

const BrandKit: React.FC = React.memo(() => {
  const [brandKit, setBrandKit] = useState<BrandKitType>({
    primaryColor: '#00525b',
    secondaryColor: '#01aac7'
  });
  const [logoPreview, setLogoPreview] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const saved = localStorage.getItem('brandKit');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        setBrandKit(parsed);
        if (parsed.logo) {
          setLogoPreview(parsed.logo);
        }
      } catch (error) {
        console.error('Error parsing saved brand kit:', error);
      }
    }
  }, []);

  useEffect(() => {
    const timeoutId = setTimeout(() => {
      localStorage.setItem('brandKit', JSON.stringify(brandKit));
    }, 500); // Debounced save
    return () => clearTimeout(timeoutId);
  }, [brandKit]);

  const hasLogo = useMemo(() => !!logoPreview, [logoPreview]);
  const accentColorValue = useMemo(() => brandKit.accentColor || '#32e0c5', [brandKit.accentColor]);
  const gradientStyle = useMemo(() => ({
    background: `linear-gradient(135deg, ${brandKit.primaryColor}, ${brandKit.secondaryColor})`
  }), [brandKit.primaryColor, brandKit.secondaryColor]);

  const handleLogoUpload = useCallback((event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (e) => {
        const result = e.target?.result as string;
        setLogoPreview(result);
        setBrandKit(prev => ({ ...prev, logo: result }));
      };
      reader.readAsDataURL(file);
    }
  }, []);

  const removeLogo = useCallback(() => {
    setLogoPreview(null);
    setBrandKit(prev => ({ ...prev, logo: undefined }));
  }, []);

  const updateColor = useCallback((type: keyof BrandKitType, value: string) => {
    setBrandKit(prev => {
      if (prev[type] === value) return prev; // Only update if value changed
      return { ...prev, [type]: value };
    });
  }, []);

  const handleLogoClick = useCallback(() => {
    fileInputRef.current?.click();
  }, []);

  const handlePrimaryColorChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    updateColor('primaryColor', e.target.value);
  }, [updateColor]);

  const handleSecondaryColorChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    updateColor('secondaryColor', e.target.value);
  }, [updateColor]);

  const handleAccentColorChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    updateColor('accentColor', e.target.value);
  }, [updateColor]);

  const handlePrimaryTextChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    updateColor('primaryColor', e.target.value);
  }, [updateColor]);

  const handleSecondaryTextChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    updateColor('secondaryColor', e.target.value);
  }, [updateColor]);

  const handleAccentTextChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    updateColor('accentColor', e.target.value);
  }, [updateColor]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-blue-50 py-8">
      <div className="max-w-6xl mx-auto px-6">
        {/* Header */}
        <div className="text-center mb-12">
          <div className="inline-flex items-center space-x-2 px-4 py-2 bg-purple-50 text-purple-700 rounded-full text-sm font-medium mb-4 border border-purple-200">
            <span>🏷️</span>
            <span>Configuración de Marca</span>
          </div>
          <h1 className="text-4xl font-bold text-gray-900 mb-4">
            Mi Identidad de Marca
          </h1>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto">
            Personaliza tu marca con logos, colores y estilos que reflejen tu identidad profesional
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Left Column - Configuration */}
          <div className="space-y-8">
            {/* Logo Upload */}
            <div className="bg-white rounded-2xl shadow-lg border border-gray-100 p-8">
              <div className="flex items-center space-x-3 mb-6">
                <div className="w-10 h-10 bg-purple-100 rounded-xl flex items-center justify-center">
                  <span className="text-2xl">🖼️</span>
                </div>
                <div>
                  <h2 className="text-xl font-bold text-gray-900">Logo de Marca</h2>
                  <p className="text-gray-600">Sube tu logo en formato PNG o SVG</p>
                </div>
              </div>

              <div className="space-y-4">
                {hasLogo ? (
                  <div className="text-center">
                    <div className="relative inline-block group">
                      <img
                        src={logoPreview!}
                        alt="Logo de marca"
                        className="w-32 h-32 object-contain border-2 border-gray-200 rounded-xl shadow-md group-hover:shadow-lg transition-all duration-200"
                      />
                      <button
                        onClick={removeLogo}
                        className="absolute -top-2 -right-2 w-8 h-8 bg-red-500 text-white rounded-full flex items-center justify-center hover:bg-red-600 transition-colors duration-200 shadow-lg"
                      >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                      </button>
                    </div>
                    <p className="text-sm text-gray-500 mt-2">Logo actual</p>
                  </div>
                ) : (
                  <div
                    onClick={handleLogoClick}
                    className="border-2 border-dashed border-gray-300 rounded-xl p-8 text-center cursor-pointer hover:border-purple-400 hover:bg-purple-50 transition-all duration-200 group"
                  >
                    <div className="w-16 h-16 bg-gray-100 rounded-xl flex items-center justify-center mx-auto mb-4 group-hover:bg-purple-100 transition-colors duration-200">
                      <span className="text-3xl">📁</span>
                    </div>
                    <p className="text-lg font-medium text-gray-900 mb-2">Subir Logo</p>
                    <p className="text-gray-500">Haz clic para seleccionar un archivo</p>
                    <p className="text-sm text-gray-400 mt-2">PNG, SVG hasta 5MB</p>
                  </div>
                )}

                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/png,image/svg+xml"
                  onChange={handleLogoUpload}
                  className="hidden"
                />

                {!hasLogo && (
                  <button
                    onClick={handleLogoClick}
                    className="w-full bg-gradient-to-r from-purple-600 to-blue-600 text-white py-3 px-6 rounded-xl font-semibold hover:from-purple-700 hover:to-blue-700 transition-all duration-200 shadow-md hover:shadow-lg transform hover:scale-105"
                  >
                    <span className="flex items-center justify-center space-x-2">
                      <span>📤</span>
                      <span>Seleccionar Logo</span>
                    </span>
                  </button>
                )}
              </div>
            </div>

            {/* Color Palette */}
            <div className="bg-white rounded-2xl shadow-lg border border-gray-100 p-8">
              <div className="flex items-center space-x-3 mb-6">
                <div className="w-10 h-10 bg-blue-100 rounded-xl flex items-center justify-center">
                  <span className="text-2xl">🎨</span>
                </div>
                <div>
                  <h2 className="text-xl font-bold text-gray-900">Paleta de Colores</h2>
                  <p className="text-gray-600">Define los colores principales de tu marca</p>
                </div>
              </div>

              <div className="space-y-6">
                {/* Primary Color */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-3">
                    Color Primario
                  </label>
                  <div className="flex items-center space-x-4">
                    <input
                      type="color"
                      value={brandKit.primaryColor}
                      onChange={handlePrimaryColorChange}
                      className="w-16 h-16 rounded-xl border-2 border-gray-200 cursor-pointer hover:border-gray-300 transition-colors duration-200"
                    />
                    <input
                      type="text"
                      value={brandKit.primaryColor}
                      onChange={handlePrimaryTextChange}
                      className="flex-1 px-4 py-3 border border-gray-200 rounded-xl text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
                      placeholder="#00525b"
                    />
                  </div>
                </div>

                {/* Secondary Color */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-3">
                    Color Secundario
                  </label>
                  <div className="flex items-center space-x-4">
                    <input
                      type="color"
                      value={brandKit.secondaryColor}
                      onChange={handleSecondaryColorChange}
                      className="w-16 h-16 rounded-xl border-2 border-gray-200 cursor-pointer hover:border-gray-300 transition-colors duration-200"
                    />
                    <input
                      type="text"
                      value={brandKit.secondaryColor}
                      onChange={handleSecondaryTextChange}
                      className="flex-1 px-4 py-3 border border-gray-200 rounded-xl text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
                      placeholder="#01aac7"
                    />
                  </div>
                </div>

                {/* Accent Color */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-3">
                    Color de Acento (Opcional)
                  </label>
                  <div className="flex items-center space-x-4">
                    <input
                      type="color"
                      value={accentColorValue}
                      onChange={handleAccentColorChange}
                      className="w-16 h-16 rounded-xl border-2 border-gray-200 cursor-pointer hover:border-gray-300 transition-colors duration-200"
                    />
                    <input
                      type="text"
                      value={accentColorValue}
                      onChange={handleAccentTextChange}
                      className="flex-1 px-4 py-3 border border-gray-200 rounded-xl text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
                      placeholder="#32e0c5"
                    />
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Right Column - Preview */}
          <div className="space-y-8">
            {/* Brand Preview */}
            <div className="bg-white rounded-2xl shadow-lg border border-gray-100 p-8">
              <div className="flex items-center space-x-3 mb-6">
                <div className="w-10 h-10 bg-green-100 rounded-xl flex items-center justify-center">
                  <span className="text-2xl">👁️</span>
                </div>
                <div>
                  <h2 className="text-xl font-bold text-gray-900">Vista Previa</h2>
                  <p className="text-gray-600">Cómo se verá tu marca en las plantillas</p>
                </div>
              </div>

              <div className="space-y-6">
                {/* Logo Preview */}
                {hasLogo && (
                  <div className="text-center p-6 bg-gray-50 rounded-xl">
                    <h3 className="text-sm font-medium text-gray-700 mb-3">Logo</h3>
                    <img
                      src={logoPreview!}
                      alt="Logo preview"
                      className="w-24 h-24 object-contain mx-auto"
                    />
                  </div>
                )}

                {/* Color Preview */}
                <div className="space-y-4">
                  <h3 className="text-sm font-medium text-gray-700">Colores de Marca</h3>
                  
                  <div className="grid grid-cols-3 gap-3">
                    <div className="text-center">
                      <div 
                        className="w-16 h-16 rounded-xl shadow-md mx-auto mb-2"
                        style={{ backgroundColor: brandKit.primaryColor }}
                      ></div>
                      <p className="text-xs text-gray-600">Primario</p>
                    </div>
                    <div className="text-center">
                      <div 
                        className="w-16 h-16 rounded-xl shadow-md mx-auto mb-2"
                        style={{ backgroundColor: brandKit.secondaryColor }}
                      ></div>
                      <p className="text-xs text-gray-600">Secundario</p>
                    </div>
                    <div className="text-center">
                      <div 
                        className="w-16 h-16 rounded-xl shadow-md mx-auto mb-2"
                        style={{ backgroundColor: accentColorValue }}
                      ></div>
                      <p className="text-xs text-gray-600">Acento</p>
                    </div>
                  </div>

                  {/* Gradient Preview */}
                  <div className="mt-6">
                    <h3 className="text-sm font-medium text-gray-700 mb-3">Gradiente</h3>
                    <div 
                      className="w-full h-16 rounded-xl shadow-md"
                      style={gradientStyle}
                    ></div>
                  </div>
                </div>
              </div>
            </div>

            {/* Template Preview */}
            <div className="bg-white rounded-2xl shadow-lg border border-gray-100 p-8">
              <div className="flex items-center space-x-3 mb-6">
                <div className="w-10 h-10 bg-orange-100 rounded-xl flex items-center justify-center">
                  <span className="text-2xl">📱</span>
                </div>
                <div>
                  <h2 className="text-xl font-bold text-gray-900">Vista en Plantilla</h2>
                  <p className="text-gray-600">Ejemplo de cómo se aplicará tu marca</p>
                </div>
              </div>

              <div className="bg-gray-50 rounded-xl p-6 text-center">
                <div className="w-full h-32 rounded-lg mb-4 overflow-hidden" style={gradientStyle}>
                  {hasLogo && (
                    <div className="flex items-center justify-center h-full">
                      <img
                        src={logoPreview!}
                        alt="Logo en plantilla"
                        className="h-16 object-contain"
                      />
                    </div>
                  )}
                </div>
                <p className="text-sm text-gray-600">
                  {hasLogo ? 'Tu logo se mostrará en las plantillas' : 'Sube un logo para ver la vista previa'}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Save Status */}
        <div className="mt-12 text-center">
          <div className="inline-flex items-center space-x-2 px-4 py-2 bg-green-50 text-green-700 rounded-full text-sm font-medium border border-green-200">
            <span>💾</span>
            <span>Cambios guardados automáticamente</span>
          </div>
        </div>
      </div>
    </div>
  );
});

BrandKit.displayName = 'BrandKit';
export default BrandKit;
