'use client';
import { useState } from 'react';
import DashboardLayout from '../../components/layout/DashboardLayout';
import { FiUpload, FiImage, FiZap, FiDownload, FiRefreshCw } from 'react-icons/fi';

export default function AIEnhancePage() {
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [enhancing, setEnhancing] = useState(false);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0] || null;
    setFile(f);
    if (f) {
      const reader = new FileReader();
      reader.onload = () => setPreview(reader.result as string);
      reader.readAsDataURL(f);
    } else {
      setPreview(null);
    }
  };

  const handleEnhance = async () => {
    if (!file) return;
    
    setEnhancing(true);
    // Simulate AI enhancement process
    setTimeout(() => {
      setEnhancing(false);
    }, 3000);
  };

  return (
    <DashboardLayout>
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="mb-8 text-center">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-r from-brand-primary to-brand-secondary rounded-2xl mb-6 shadow-lg">
            <FiZap className="w-8 h-8 text-white" />
          </div>
          <h1 className="text-3xl font-bold text-gray-900 mb-4">
            Mejora de Imágenes con IA
          </h1>
          <p className="text-xl text-gray-600 max-w-2xl mx-auto">
            Mejora la calidad de tus imágenes usando inteligencia artificial
          </p>
        </div>

        {/* Upload Section */}
        <div className="bg-white rounded-2xl p-8 border border-gray-200 shadow-soft mb-8">
          <div className="text-center">
            <div className="w-20 h-20 bg-brand-primary/10 rounded-2xl flex items-center justify-center mx-auto mb-4">
              <FiUpload className="w-10 h-10 text-brand-primary" />
            </div>
            <h2 className="text-xl font-semibold text-gray-900 mb-2">Subir Imagen</h2>
            <p className="text-gray-600 mb-6">Selecciona una imagen para mejorar con IA</p>
            
            <div className="relative">
              <input
                type="file"
                accept="image/*"
                onChange={handleFileChange}
                className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                id="image-upload"
              />
              <label
                htmlFor="image-upload"
                className="inline-flex items-center gap-2 px-6 py-3 bg-brand-primary text-white rounded-xl font-medium hover:bg-brand-primary-dark transition-colors duration-200 cursor-pointer shadow-soft hover:shadow-elevated transform hover:-translate-y-1"
              >
                <FiImage className="w-5 h-5" />
                Seleccionar Imagen
              </label>
            </div>
            
            {file && (
              <p className="text-sm text-gray-500 mt-3">
                Archivo seleccionado: {file.name}
              </p>
            )}
          </div>
        </div>

        {/* Preview and Enhancement */}
        {preview && (
          <div className="bg-white rounded-2xl border border-gray-200 shadow-soft overflow-hidden">
            <div className="bg-gradient-to-r from-brand-primary/5 to-brand-secondary/5 px-6 py-4 border-b border-gray-200">
              <h3 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
                <FiImage className="w-5 h-5 text-brand-primary" />
                Vista Previa y Mejora
              </h3>
            </div>
            
            <div className="p-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                {/* Original Image */}
                <div className="text-center">
                  <h4 className="font-semibold text-gray-900 mb-4">Imagen Original</h4>
                  <div className="relative">
                    <img 
                      src={preview} 
                      alt="Original" 
                      className="w-full h-64 object-cover rounded-xl border border-gray-200"
                    />
                    <div className="absolute top-2 left-2 bg-white/90 backdrop-blur-sm px-2 py-1 rounded-lg text-xs font-medium text-gray-700">
                      Original
                    </div>
                  </div>
                  <p className="text-sm text-gray-500 mt-2">
                    Resolución: {file?.name ? '1920x1080' : 'N/A'}
                  </p>
                </div>

                {/* Enhanced Image */}
                <div className="text-center">
                  <h4 className="font-semibold text-gray-900 mb-4">Imagen Mejorada</h4>
                  <div className="relative">
                    {enhancing ? (
                      <div className="w-full h-64 bg-gray-100 rounded-xl border border-gray-200 flex items-center justify-center">
                        <div className="text-center">
                          <FiRefreshCw className="w-8 h-8 text-brand-primary animate-spin mx-auto mb-2" />
                          <p className="text-gray-600">Mejorando imagen...</p>
                        </div>
                      </div>
                    ) : (
                      <div className="w-full h-64 bg-gray-100 rounded-xl border border-gray-200 flex items-center justify-center">
                        <div className="text-center">
                          <FiZap className="w-8 h-8 text-gray-400 mx-auto mb-2" />
                          <p className="text-gray-500">Resultado de IA aquí</p>
                        </div>
                      </div>
                    )}
                    <div className="absolute top-2 left-2 bg-brand-primary/90 backdrop-blur-sm px-2 py-1 rounded-lg text-xs font-medium text-white">
                      IA
                    </div>
                  </div>
                  <p className="text-sm text-gray-500 mt-2">
                    Resolución: {enhancing ? 'Procesando...' : '4K (3840x2160)'}
                  </p>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="mt-8 pt-6 border-t border-gray-200">
                <div className="flex flex-col sm:flex-row gap-3 justify-center">
                  <button
                    onClick={handleEnhance}
                    disabled={enhancing}
                    className="px-6 py-3 bg-gradient-to-r from-brand-primary to-brand-secondary text-white rounded-xl font-medium hover:from-brand-primary-dark hover:to-brand-secondary-dark transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 shadow-soft hover:shadow-elevated transform hover:-translate-y-1"
                  >
                    {enhancing ? (
                      <>
                        <FiRefreshCw className="w-4 h-4 animate-spin" />
                        Mejorando...
                      </>
                    ) : (
                      <>
                        <FiZap className="w-4 h-4" />
                        Mejorar con IA
                      </>
                    )}
                  </button>
                  
                  {!enhancing && (
                    <button className="px-6 py-3 border border-gray-200 text-gray-700 rounded-xl font-medium hover:bg-gray-50 transition-colors duration-200 flex items-center justify-center gap-2">
                      <FiDownload className="w-4 h-4" />
                      Descargar
                    </button>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Features Section */}
        <div className="mt-12 bg-gradient-to-r from-brand-primary/5 to-brand-secondary/5 rounded-2xl p-8 border border-brand-primary/20">
          <h3 className="text-xl font-semibold text-gray-900 mb-6 text-center">
            Características de la Mejora con IA
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="text-center">
              <div className="w-12 h-12 bg-brand-primary/10 rounded-xl flex items-center justify-center mx-auto mb-3">
                <FiImage className="w-6 h-6 text-brand-primary" />
              </div>
              <h4 className="font-medium text-gray-900 mb-2">Mejora de Resolución</h4>
              <p className="text-sm text-gray-600">Aumenta la resolución de tus imágenes hasta 4K</p>
            </div>
            <div className="text-center">
              <div className="w-12 h-12 bg-brand-secondary/10 rounded-xl flex items-center justify-center mx-auto mb-3">
                <FiZap className="w-6 h-6 text-brand-secondary" />
              </div>
              <h4 className="font-medium text-gray-900 mb-2">Reducción de Ruido</h4>
              <p className="text-sm text-gray-600">Elimina el ruido y mejora la claridad de la imagen</p>
            </div>
            <div className="text-center">
              <div className="w-12 h-12 bg-success/10 rounded-xl flex items-center justify-center mx-auto mb-3">
                <FiDownload className="w-6 h-6 text-success" />
              </div>
              <h4 className="font-medium text-gray-900 mb-2">Descarga Inmediata</h4>
              <p className="text-sm text-gray-600">Descarga tu imagen mejorada en alta calidad</p>
            </div>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}
