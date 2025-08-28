'use client';

export default function CanvaPage() {
  const openCanvaTemplate = (templateType: string) => {
    // Use Canva's official template categories instead of fake IDs
    const canvaUrls = {
      'real-estate': 'https://www.canva.com/templates/search/real-estate/',
      'social-media': 'https://www.canva.com/templates/search/social-media/',
      'business': 'https://www.canva.com/templates/search/business/',
      'marketing': 'https://www.canva.com/templates/search/marketing/',
      'flyers': 'https://www.canva.com/templates/search/flyers/',
      'presentations': 'https://www.canva.com/templates/search/presentations/',
    };
    
    const url = canvaUrls[templateType as keyof typeof canvaUrls] || 'https://www.canva.com/';
    window.open(url, '_blank');
  };

  const openCanvaEditor = () => {
    // Open Canva's main editor
    window.open('https://www.canva.com/', '_blank');
  };

  const templates = [
    { 
      id: 'real-estate', 
      name: 'Real Estate Templates', 
      category: 'Property & Housing', 
      color: 'from-blue-400 to-blue-600',
      description: 'Property listings, open house flyers, agent cards'
    },
    { 
      id: 'social-media', 
      name: 'Social Media Templates', 
      category: 'Digital Marketing', 
      color: 'from-purple-400 to-purple-600',
      description: 'Instagram posts, Facebook covers, Twitter graphics'
    },
    { 
      id: 'business', 
      name: 'Business Templates', 
      category: 'Professional', 
      color: 'from-green-400 to-green-600',
      description: 'Business cards, letterheads, presentations'
    },
    { 
      id: 'marketing', 
      name: 'Marketing Templates', 
      category: 'Advertising', 
      color: 'from-orange-400 to-orange-600',
      description: 'Email headers, ads, brochures'
    },
    { 
      id: 'flyers', 
      name: 'Flyer Templates', 
      category: 'Print & Digital', 
      color: 'from-pink-400 to-pink-600',
      description: 'Event flyers, announcements, promotions'
    },
    { 
      id: 'presentations', 
      name: 'Presentation Templates', 
      category: 'Business', 
      color: 'from-indigo-400 to-indigo-600',
      description: 'Slides, reports, proposals'
    },
  ];

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold text-gray-900 mb-4">
            🎨 Canva Design Integration
          </h1>
          <p className="text-xl text-gray-600 max-w-2xl mx-auto">
            Access professional Canva templates and start designing with the world's leading design platform.
          </p>
          
          {/* Quick Access Button */}
          <div className="mt-6">
            <button
              onClick={openCanvaEditor}
              className="bg-gradient-to-r from-blue-600 to-purple-600 text-white px-8 py-3 rounded-lg text-lg font-semibold hover:from-blue-700 hover:to-purple-700 transition-all duration-300 transform hover:scale-105 shadow-lg"
            >
              🚀 Start Designing Now
            </button>
          </div>
        </div>

        {/* Templates Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-12">
          {templates.map((template) => (
            <div
              key={template.id}
              className="bg-white rounded-lg shadow-md hover:shadow-lg transition-all duration-300 overflow-hidden cursor-pointer transform hover:scale-105 border border-gray-100"
              onClick={() => openCanvaTemplate(template.id)}
            >
              <div className={`h-48 bg-gradient-to-br ${template.color} flex items-center justify-center relative overflow-hidden`}>
                <div className="absolute inset-0 bg-black bg-opacity-20"></div>
                <span className="text-white text-lg font-semibold text-center px-4 relative z-10">
                  {template.name}
                </span>
              </div>
              <div className="p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-2">
                  {template.name}
                </h3>
                <p className="text-sm text-gray-600 mb-3">
                  Category: {template.category}
                </p>
                <p className="text-sm text-gray-500 mb-4">
                  {template.description}
                </p>
                <button className="w-full bg-gradient-to-r from-blue-600 to-blue-700 text-white py-2 px-4 rounded-md hover:from-blue-700 hover:to-blue-800 transition-all duration-200 font-medium">
                  🎯 Browse Templates
                </button>
              </div>
            </div>
          ))}
        </div>

        {/* How it Works */}
        <div className="bg-white rounded-lg shadow-md p-8 max-w-4xl mx-auto mb-12">
          <h2 className="text-2xl font-bold text-gray-900 mb-6 text-center">
            How to Use Canva with LupaProp
          </h2>
          <div className="grid md:grid-cols-2 gap-8">
            <div className="space-y-4">
              <div className="flex items-start space-x-3">
                <span className="flex-shrink-0 w-8 h-8 bg-blue-600 text-white rounded-full flex items-center justify-center text-sm font-bold">1</span>
                <div>
                  <h3 className="font-semibold text-gray-900">Choose Your Category</h3>
                  <p className="text-gray-600 text-sm">Browse templates by category or start with a blank canvas</p>
                </div>
              </div>
              <div className="flex items-start space-x-3">
                <span className="flex-shrink-0 w-8 h-8 bg-blue-600 text-white rounded-full flex items-center justify-center text-sm font-bold">2</span>
                <div>
                  <h3 className="font-semibold text-gray-900">Open Canva Editor</h3>
                  <p className="text-gray-600 text-sm">Click any template or use "Start Designing Now" button</p>
                </div>
              </div>
            </div>
            <div className="space-y-4">
              <div className="flex items-start space-x-3">
                <span className="flex-shrink-0 w-8 h-8 bg-blue-600 text-white rounded-full flex items-center justify-center text-sm font-bold">3</span>
                <div>
                  <h3 className="font-semibold text-gray-900">Design & Customize</h3>
                  <p className="text-gray-600 text-sm">Use Canva's powerful tools to create your design</p>
                </div>
              </div>
              <div className="flex items-start space-x-3">
                <span className="flex-shrink-0 w-8 h-8 bg-blue-600 text-white rounded-full flex items-center justify-center text-sm font-bold">4</span>
                <div>
                  <h3 className="font-semibold text-gray-900">Export & Use</h3>
                  <p className="text-gray-600 text-sm">Download your design and use it in your projects</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Features */}
        <div className="grid md:grid-cols-3 gap-6 mb-12">
          <div className="bg-white rounded-lg shadow-md p-6 text-center border border-gray-100">
            <div className="text-4xl mb-4">🎯</div>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">Professional Templates</h3>
            <p className="text-gray-600 text-sm">Access thousands of high-quality, industry-specific designs</p>
          </div>
          <div className="bg-white rounded-lg shadow-md p-6 text-center border border-gray-100">
            <div className="text-4xl mb-4">⚡</div>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">Instant Access</h3>
            <p className="text-gray-600 text-sm">No account creation needed - start designing immediately</p>
          </div>
          <div className="bg-white rounded-lg shadow-md p-6 text-center border border-gray-100">
            <div className="text-4xl mb-4">🚀</div>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">Full Canva Power</h3>
            <p className="text-gray-600 text-sm">Access to all Canva features, tools, and resources</p>
          </div>
        </div>

        {/* Troubleshooting */}
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-6 max-w-4xl mx-auto">
          <h3 className="text-lg font-semibold text-yellow-800 mb-3">
            💡 Having Issues with Canva?
          </h3>
          <div className="text-yellow-700 text-sm space-y-2">
            <p>• <strong>Canva Server Issues:</strong> If you see error messages from Canva, they may be experiencing temporary server problems</p>
            <p>• <strong>Try Again Later:</strong> Wait a few minutes and try accessing the templates again</p>
            <p>• <strong>Alternative Access:</strong> Use the "Start Designing Now" button to go directly to Canva's main editor</p>
            <p>• <strong>Check Status:</strong> Visit <a href="https://status.canva.com" target="_blank" rel="noopener noreferrer" className="underline hover:text-yellow-900">Canva's Status Page</a> for server updates</p>
          </div>
        </div>
      </div>
    </div>
  );
}
