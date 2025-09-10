'use client';

import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { BrandKit as BrandKitType } from '@/types';

import API_ENDPOINTS from '@/config/api';
const BrandKit: React.FC = React.memo(() => {
  // Predefined color palette based on the image
  const predefinedColors = [
    '#000000', // Black (represents no color/transparent)
    '#00525b', // Dark teal/blue-green
    '#01aac7', // Bright turquoise/aqua blue
    '#32e0c5', // Light turquoise/mint green
    '#ffffff', // Pure white
    '#3f005f', // Rich deep purple
    '#230038'  // Very dark purple/indigo
  ];

  const [brandKit, setBrandKit] = useState<BrandKitType>({
    primaryColor: '#000000',
    secondaryColor: '#000000',
    accentColor: '#000000'
  });
  const [logoPreview, setLogoPreview] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const loadBrandKit = async () => {
      try {
        const token = localStorage.getItem('token');
        console.log('🔍 BrandKit: Checking for auth token:', token ? 'found' : 'not found');
        if (!token) {
          console.log('ℹ️ BrandKit: No auth token found, using default brand kit');
          return;
        }

        console.log('🔍 BrandKit: Making request to', API_ENDPOINTS.BRAND_KIT, 'with token:', token.substring(0, 20) + '...');
        
        const response = await fetch(API_ENDPOINTS.BRAND_KIT, {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        });

        console.log('🔍 BrandKit: Response status:', response.status);
        
        if (response.ok) {
          const data = await response.json();
          console.log('🔍 BrandKit: Response data:', data);
          if (data.success && data.brandKit) {
            const brandKitData = data.brandKit;
              setBrandKit({
                primaryColor: brandKitData.primaryColor || '#000000',
                secondaryColor: brandKitData.secondaryColor || '#000000',
                accentColor: brandKitData.accentColor || '#000000'
              });
            
            if (brandKitData.logo && brandKitData.logo.data) {
              setLogoPreview(brandKitData.logo.data);
            }
          }
        } else {
          const errorText = await response.text();
          console.error('❌ BrandKit: Failed to load brand kit:', response.status, errorText);
        }
      } catch (error) {
        console.error('Error loading brand kit:', error);
      }
    };

    loadBrandKit();
  }, []);

  useEffect(() => {
    const saveBrandKit = async () => {
      try {
        const token = localStorage.getItem('token');
        if (!token) {
          console.log('No auth token found, skipping save');
          return;
        }

        // Only send fields that have valid values
        const saveData = {
          primaryColor: brandKit.primaryColor,
          secondaryColor: brandKit.secondaryColor,
          accentColor: brandKit.accentColor || '#000000'
        };
        
        console.log('🔍 BrandKit: Saving brand kit data:', saveData);
        
        const response = await fetch(API_ENDPOINTS.BRAND_KIT, {
          method: 'PATCH',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify(saveData)
        });

        if (!response.ok) {
          const errorText = await response.text();
          console.error('Failed to save brand kit:', response.status, response.statusText, errorText);
        } else {
          console.log('✅ BrandKit: Successfully saved brand kit');
        }
      } catch (error) {
        console.error('Error saving brand kit:', error);
      }
    };

    const timeoutId = setTimeout(saveBrandKit, 500); // Debounced save
    return () => clearTimeout(timeoutId);
  }, [brandKit]);

  const hasLogo = useMemo(() => !!logoPreview, [logoPreview]);
  const accentColorValue = useMemo(() => brandKit.accentColor || '#000000', [brandKit.accentColor]);
  const gradientStyle = useMemo(() => {
    if (brandKit.primaryColor === '#000000' || brandKit.secondaryColor === '#000000') {
      return { background: 'transparent' }; // Transparent background when no colors
    }
    return {
      background: `linear-gradient(135deg, ${brandKit.primaryColor}, ${brandKit.secondaryColor})`
    };
  }, [brandKit.primaryColor, brandKit.secondaryColor]);

  const handleLogoUpload = useCallback(async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = async (e) => {
        const result = e.target?.result as string;
        setLogoPreview(result);
        
        try {
          const token = localStorage.getItem('token');
          console.log('🔍 BrandKit: Logo upload - checking for auth token:', token ? 'found' : 'not found');
          if (!token) {
            console.error('❌ BrandKit: No auth token found for logo upload');
            return;
          }

          const logoData = {
            data: result,
            filename: file.name,
            mimetype: file.type,
            size: file.size
          };

          const response = await fetch(API_ENDPOINTS.BRAND_KIT, {
            method: 'PATCH',
            headers: {
              'Authorization': `Bearer ${token}`,
              'Content-Type': 'application/json'
            },
            body: JSON.stringify({ logo: logoData })
          });

          if (!response.ok) {
            console.error('Failed to save logo:', response.statusText);
          } else {
            console.log('Logo saved successfully');
          }
        } catch (error) {
          console.error('Error saving logo:', error);
        }
      };
      reader.readAsDataURL(file);
    }
  }, []);

  const removeLogo = useCallback(async () => {
    setLogoPreview(null);
    
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        console.error('No auth token found');
        return;
      }

      const response = await fetch(API_ENDPOINTS.BRAND_KIT, {
        method: 'PATCH',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ logo: null })
      });

      if (!response.ok) {
        console.error('Failed to remove logo:', response.statusText);
      } else {
        console.log('Logo removed successfully');
      }
    } catch (error) {
      console.error('Error removing logo:', error);
    }
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

  const handleColorSelection = useCallback((type: keyof BrandKitType, color: string) => {
    updateColor(type, color);
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
                  <div className="grid grid-cols-6 gap-3">
                    {predefinedColors.map((color) => (
                      <button
                        key={`primary-${color}`}
                        onClick={() => handleColorSelection('primaryColor', color)}
                        className={`w-12 h-12 rounded-xl border-2 transition-all duration-200 hover:scale-110 ${
                          brandKit.primaryColor === color
                            ? 'border-gray-800 shadow-lg'
                            : 'border-gray-200 hover:border-gray-400'
                        }`}
                        style={{ 
                          backgroundColor: color,
                          backgroundImage: color === '#000000' ? 'linear-gradient(45deg, #ccc 25%, transparent 25%), linear-gradient(-45deg, #ccc 25%, transparent 25%), linear-gradient(45deg, transparent 75%, #ccc 75%), linear-gradient(-45deg, transparent 75%, #ccc 75%)' : 'none',
                          backgroundSize: color === '#000000' ? '8px 8px' : 'auto',
                          backgroundPosition: color === '#000000' ? '0 0, 0 4px, 4px -4px, -4px 0px' : 'auto'
                        }}
                        title={color === '#000000' ? 'Transparent (No Color)' : color}
                      />
                    ))}
                  </div>
                  <p className="text-sm text-gray-500 mt-2">Seleccionado: {brandKit.primaryColor}</p>
                </div>

                {/* Secondary Color */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-3">
                    Color Secundario
                  </label>
                  <div className="grid grid-cols-6 gap-3">
                    {predefinedColors.map((color) => (
                      <button
                        key={`secondary-${color}`}
                        onClick={() => handleColorSelection('secondaryColor', color)}
                        className={`w-12 h-12 rounded-xl border-2 transition-all duration-200 hover:scale-110 ${
                          brandKit.secondaryColor === color
                            ? 'border-gray-800 shadow-lg'
                            : 'border-gray-200 hover:border-gray-400'
                        }`}
                        style={{ 
                          backgroundColor: color,
                          backgroundImage: color === '#000000' ? 'linear-gradient(45deg, #ccc 25%, transparent 25%), linear-gradient(-45deg, #ccc 25%, transparent 25%), linear-gradient(45deg, transparent 75%, #ccc 75%), linear-gradient(-45deg, transparent 75%, #ccc 75%)' : 'none',
                          backgroundSize: color === '#000000' ? '8px 8px' : 'auto',
                          backgroundPosition: color === '#000000' ? '0 0, 0 4px, 4px -4px, -4px 0px' : 'auto'
                        }}
                        title={color === '#000000' ? 'Transparent (No Color)' : color}
                      />
                    ))}
                  </div>
                  <p className="text-sm text-gray-500 mt-2">Seleccionado: {brandKit.secondaryColor}</p>
                </div>

                {/* Accent Color */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-3">
                    Color de Acento (Opcional)
                  </label>
                  <div className="grid grid-cols-6 gap-3">
                    {predefinedColors.map((color) => (
                      <button
                        key={`accent-${color}`}
                        onClick={() => handleColorSelection('accentColor', color)}
                        className={`w-12 h-12 rounded-xl border-2 transition-all duration-200 hover:scale-110 ${
                          accentColorValue === color
                            ? 'border-gray-800 shadow-lg'
                            : 'border-gray-200 hover:border-gray-400'
                        }`}
                        style={{ 
                          backgroundColor: color,
                          backgroundImage: color === '#000000' ? 'linear-gradient(45deg, #ccc 25%, transparent 25%), linear-gradient(-45deg, #ccc 25%, transparent 25%), linear-gradient(45deg, transparent 75%, #ccc 75%), linear-gradient(-45deg, transparent 75%, #ccc 75%)' : 'none',
                          backgroundSize: color === '#000000' ? '8px 8px' : 'auto',
                          backgroundPosition: color === '#000000' ? '0 0, 0 4px, 4px -4px, -4px 0px' : 'auto'
                        }}
                        title={color === '#000000' ? 'Transparent (No Color)' : color}
                      />
                    ))}
                  </div>
                  <p className="text-sm text-gray-500 mt-2">Seleccionado: {accentColorValue}</p>
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
                    style={{ 
                      backgroundColor: brandKit.primaryColor,
                      backgroundImage: brandKit.primaryColor === '#000000' ? 'linear-gradient(45deg, #ccc 25%, transparent 25%), linear-gradient(-45deg, #ccc 25%, transparent 25%), linear-gradient(45deg, transparent 75%, #ccc 75%), linear-gradient(-45deg, transparent 75%, #ccc 75%)' : 'none',
                      backgroundSize: brandKit.primaryColor === '#000000' ? '8px 8px' : 'auto',
                      backgroundPosition: brandKit.primaryColor === '#000000' ? '0 0, 0 4px, 4px -4px, -4px 0px' : 'auto'
                    }}
                      ></div>
                      <p className="text-xs text-gray-600">Primario</p>
                    </div>
                    <div className="text-center">
                      <div 
                        className="w-16 h-16 rounded-xl shadow-md mx-auto mb-2"
                    style={{ 
                      backgroundColor: brandKit.secondaryColor,
                      backgroundImage: brandKit.secondaryColor === '#000000' ? 'linear-gradient(45deg, #ccc 25%, transparent 25%), linear-gradient(-45deg, #ccc 25%, transparent 25%), linear-gradient(45deg, transparent 75%, #ccc 75%), linear-gradient(-45deg, transparent 75%, #ccc 75%)' : 'none',
                      backgroundSize: brandKit.secondaryColor === '#000000' ? '8px 8px' : 'auto',
                      backgroundPosition: brandKit.secondaryColor === '#000000' ? '0 0, 0 4px, 4px -4px, -4px 0px' : 'auto'
                    }}
                      ></div>
                      <p className="text-xs text-gray-600">Secundario</p>
                    </div>
                    <div className="text-center">
                      <div 
                        className="w-16 h-16 rounded-xl shadow-md mx-auto mb-2"
                    style={{ 
                      backgroundColor: accentColorValue,
                      backgroundImage: accentColorValue === '#000000' ? 'linear-gradient(45deg, #ccc 25%, transparent 25%), linear-gradient(-45deg, #ccc 25%, transparent 25%), linear-gradient(45deg, transparent 75%, #ccc 75%), linear-gradient(-45deg, transparent 75%, #ccc 75%)' : 'none',
                      backgroundSize: accentColorValue === '#000000' ? '8px 8px' : 'auto',
                      backgroundPosition: accentColorValue === '#000000' ? '0 0, 0 4px, 4px -4px, -4px 0px' : 'auto'
                    }}
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
