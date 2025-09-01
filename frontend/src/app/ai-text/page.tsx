'use client';

import { useState } from 'react';

// Force dynamic rendering for this page
export const dynamic = 'auto';
import DashboardLayout from '../../components/layout/DashboardLayout';
import { FiZap, FiCopy, FiRefreshCw, FiStar } from 'react-icons/fi';

export default function AITextPage() {
  const [flyerType, setFlyerType] = useState('');
  const [headlines, setHeadlines] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);

  const generateHeadlines = async () => {
    if (!flyerType.trim()) return;
    
    setLoading(true);
    try {
      const response = await fetch('http://localhost:4000/api/ai-text', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ flyerType }),
      });
      
      const data = await response.json();
      if (data.headlines) {
        setHeadlines(data.headlines);
      }
    } catch (error) {
      console.error('Error generating headlines:', error);
    } finally {
      setLoading(false);
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
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
            Generador de Texto con IA
          </h1>
          <p className="text-xl text-gray-600 max-w-2xl mx-auto">
            Genera títulos creativos y contenido para tus volantes con asistencia de IA
          </p>
        </div>
        
        {/* Main Form */}
        <div className="bg-white rounded-2xl p-8 border border-gray-200 shadow-soft mb-8">
          <div className="mb-6">
            <label htmlFor="flyerType" className="block text-lg font-medium text-gray-700 mb-3">
              ¿Qué tipo de volante estás creando?
            </label>
            <input
              id="flyerType"
              type="text"
              value={flyerType}
              onChange={(e) => setFlyerType(e.target.value)}
              placeholder="ej., Venta de Verano, Gran Apertura, Oferta Especial, Lanzamiento de Producto"
              className="w-full px-6 py-4 bg-gray-50 border border-gray-200 rounded-xl text-lg placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-brand-primary focus:border-transparent transition-all duration-200"
            />
          </div>
          
          <button
            onClick={generateHeadlines}
            disabled={loading || !flyerType.trim()}
            className="w-full bg-gradient-to-r from-brand-primary to-brand-secondary text-white font-semibold py-4 px-8 rounded-xl text-lg hover:from-brand-primary-dark hover:to-brand-secondary-dark transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-3 shadow-soft hover:shadow-elevated transform hover:scale-[1.02]"
          >
            {loading ? (
              <>
                <FiRefreshCw className="w-5 h-5 animate-spin" />
                Generando...
              </>
            ) : (
              <>
                <FiStar className="w-5 h-5" />
                Generar Títulos
              </>
            )}
          </button>
        </div>
        
        {/* Results */}
        {headlines.length > 0 && (
          <div className="bg-white rounded-2xl border border-gray-200 shadow-soft overflow-hidden">
            <div className="bg-gradient-to-r from-brand-primary/5 to-brand-secondary/5 px-6 py-4 border-b border-gray-200">
              <h3 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
                <FiStar className="w-5 h-5 text-brand-primary" />
                Títulos Generados
              </h3>
            </div>
            
            <div className="p-6">
              <div className="space-y-4">
                {headlines.map((headline, index) => (
                  <div
                    key={index}
                    className="bg-gray-50 rounded-xl p-4 border border-gray-200 hover:border-brand-primary/30 transition-colors duration-200 group hover:-translate-y-1"
                  >
                    <div className="flex items-start justify-between">
                      <p className="text-lg text-gray-900 font-medium leading-relaxed">
                        {headline}
                      </p>
                      <button
                        onClick={() => copyToClipboard(headline)}
                        className="ml-4 p-2 text-gray-400 hover:text-brand-primary hover:bg-brand-primary/10 rounded-lg transition-all duration-200 opacity-0 group-hover:opacity-100"
                        title="Copiar al portapapeles"
                      >
                        <FiCopy className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
              
              <div className="mt-6 pt-6 border-t border-gray-200">
                <div className="flex flex-col sm:flex-row gap-3">
                  <button
                    onClick={() => setHeadlines([])}
                    className="flex-1 px-4 py-2 border border-gray-200 text-gray-700 rounded-xl font-medium hover:bg-gray-50 transition-colors duration-200"
                  >
                    Limpiar Resultados
                  </button>
                  <button
                    onClick={generateHeadlines}
                    className="flex-1 px-4 py-2 bg-brand-primary text-white rounded-xl font-medium hover:bg-brand-primary-dark transition-colors duration-200 shadow-soft hover:shadow-elevated transform hover:-translate-y-1"
                  >
                    Generar Más
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Tips Section */}
        <div className="mt-12 bg-gradient-to-r from-brand-primary/5 to-brand-secondary/5 rounded-2xl p-8 border border-brand-primary/20">
          <h3 className="text-xl font-semibold text-gray-900 mb-4 flex items-center gap-2">
            <FiZap className="w-5 h-5 text-brand-primary" />
            Consejos Profesionales
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm text-gray-700">
            <div className="flex items-start gap-2">
              <div className="w-2 h-2 bg-brand-primary rounded-full mt-2 flex-shrink-0"></div>
              <p>Sé específico sobre tu oferta o evento para mejores resultados</p>
            </div>
            <div className="flex items-start gap-2">
              <div className="w-2 h-2 bg-brand-primary rounded-full mt-2 flex-shrink-0"></div>
              <p>Incluye tu público objetivo para contenido más relevante</p>
            </div>
            <div className="flex items-start gap-2">
              <div className="w-2 h-2 bg-brand-primary rounded-full mt-2 flex-shrink-0"></div>
              <p>Usa palabras de acción para crear urgencia y emoción</p>
            </div>
            <div className="flex items-start gap-2">
              <div className="w-2 h-2 bg-brand-primary rounded-full mt-2 flex-shrink-0"></div>
              <p>Combina múltiples títulos para variedad en tus diseños</p>
            </div>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}