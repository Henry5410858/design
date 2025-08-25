'use client';

import { useState } from 'react';
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
      const response = await fetch('/api/ai-text', {
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
          <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-r from-purple-500 to-pink-500 rounded-2xl mb-6">
            <FiZap className="w-8 h-8 text-white" />
          </div>
          <h1 className="text-3xl font-bold text-gray-900 mb-4">
            AI Text Generator
          </h1>
          <p className="text-xl text-gray-600 max-w-2xl mx-auto">
            Generate creative headlines and content for your flyers with AI assistance
          </p>
        </div>
        
        {/* Main Form */}
        <div className="bg-white rounded-2xl p-8 border border-gray-200 shadow-sm mb-8">
          <div className="mb-6">
            <label htmlFor="flyerType" className="block text-lg font-medium text-gray-700 mb-3">
              What type of flyer are you creating?
            </label>
            <input
              id="flyerType"
              type="text"
              value={flyerType}
              onChange={(e) => setFlyerType(e.target.value)}
              placeholder="e.g., Summer Sale, Grand Opening, Special Offer, Product Launch"
              className="w-full px-6 py-4 bg-gray-50 border border-gray-200 rounded-xl text-lg placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all duration-200"
            />
          </div>
          
          <button
            onClick={generateHeadlines}
            disabled={loading || !flyerType.trim()}
            className="w-full bg-gradient-to-r from-purple-600 to-pink-600 text-white font-semibold py-4 px-8 rounded-xl text-lg hover:from-purple-700 hover:to-pink-700 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-3 shadow-lg hover:shadow-xl transform hover:scale-[1.02]"
          >
            {loading ? (
              <>
                <FiRefreshCw className="w-5 h-5 animate-spin" />
                Generating...
              </>
            ) : (
              <>
                <FiStar className="w-5 h-5" />
                Generate Headlines
              </>
            )}
          </button>
        </div>
        
        {/* Results */}
        {headlines.length > 0 && (
          <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
            <div className="bg-gradient-to-r from-purple-50 to-pink-50 px-6 py-4 border-b border-gray-200">
              <h3 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
                                 <FiStar className="w-5 h-5 text-purple-600" />
                Generated Headlines
              </h3>
            </div>
            
            <div className="p-6">
              <div className="space-y-4">
                {headlines.map((headline, index) => (
                  <div
                    key={index}
                    className="bg-gray-50 rounded-xl p-4 border border-gray-200 hover:border-purple-300 transition-colors group"
                  >
                    <div className="flex items-start justify-between">
                      <p className="text-lg text-gray-900 font-medium leading-relaxed">
                        {headline}
                      </p>
                      <button
                        onClick={() => copyToClipboard(headline)}
                        className="ml-4 p-2 text-gray-400 hover:text-purple-600 hover:bg-purple-50 rounded-lg transition-all duration-200 opacity-0 group-hover:opacity-100"
                        title="Copy to clipboard"
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
                    className="flex-1 px-4 py-2 border border-gray-200 text-gray-700 rounded-lg font-medium hover:bg-gray-50 transition-colors"
                  >
                    Clear Results
                  </button>
                  <button
                    onClick={generateHeadlines}
                    className="flex-1 px-4 py-2 bg-purple-600 text-white rounded-lg font-medium hover:bg-purple-700 transition-colors"
                  >
                    Generate More
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Tips Section */}
        <div className="mt-12 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-2xl p-8 border border-blue-200">
          <h3 className="text-xl font-semibold text-gray-900 mb-4 flex items-center gap-2">
            <FiZap className="w-5 h-5 text-blue-600" />
            Pro Tips
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm text-gray-700">
            <div className="flex items-start gap-2">
              <div className="w-2 h-2 bg-blue-500 rounded-full mt-2 flex-shrink-0"></div>
              <p>Be specific about your offer or event for better results</p>
            </div>
            <div className="flex items-start gap-2">
              <div className="w-2 h-2 bg-blue-500 rounded-full mt-2 flex-shrink-0"></div>
              <p>Include your target audience for more relevant content</p>
            </div>
            <div className="flex items-start gap-2">
              <div className="w-2 h-2 bg-blue-500 rounded-full mt-2 flex-shrink-0"></div>
              <p>Use action words to create urgency and excitement</p>
            </div>
            <div className="flex items-start gap-2">
              <div className="w-2 h-2 bg-blue-500 rounded-full mt-2 flex-shrink-0"></div>
              <p>Combine multiple headlines for variety in your designs</p>
            </div>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}