import React from 'react';
import {
  SquarePostTemplate1,
  SquarePostTemplate2,
  StoryTemplate1,
  StoryTemplate2,
  FlyerTemplate1,
  FlyerTemplate2,
  BannerTemplate1,
  BannerTemplate2,
  BadgeTemplate1,
  BadgeTemplate2,
  BrochureTemplate1,
  BrochureTemplate2,
  TemplateProps
} from './index';

const ExampleUsage: React.FC = () => {
  // Sample data for templates
  const sampleData: TemplateProps = {
    title: "Amazing Product Launch",
    subtitle: "Revolutionary Innovation",
    description: "Discover our latest breakthrough product that will transform your business. Built with cutting-edge technology and designed for maximum efficiency.",
    image: "/assets/sample-product.jpg",
    logo: "/assets/company-logo.png",
    ctaText: "Get Started Today"
  };

  return (
    <div className="p-8 bg-gray-50 min-h-screen">
      <div className="max-w-7xl mx-auto">
        <h1 className="text-4xl font-bold text-gray-900 mb-8 text-center">
          🎨 Template System Examples
        </h1>
        
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          
          {/* SquarePost Templates */}
          <div className="space-y-6">
            <h2 className="text-2xl font-semibold text-gray-800 border-b pb-2">
              📱 SquarePost Templates (1080×1080)
            </h2>
            
            <div className="bg-white p-4 rounded-lg shadow-md">
              <h3 className="text-lg font-medium text-gray-700 mb-3">Template 1 - Minimal</h3>
              <div className="scale-50 origin-top-left transform">
                <SquarePostTemplate1 {...sampleData} />
              </div>
            </div>
            
            <div className="bg-white p-4 rounded-lg shadow-md">
              <h3 className="text-lg font-medium text-gray-700 mb-3">Template 2 - Vibrant</h3>
              <div className="scale-50 origin-top-left transform">
                <SquarePostTemplate2 {...sampleData} />
              </div>
            </div>
          </div>

          {/* Story Templates */}
          <div className="space-y-6">
            <h2 className="text-2xl font-semibold text-gray-800 border-b pb-2">
              📱 Story Templates (1080×1920)
            </h2>
            
            <div className="bg-white p-4 rounded-lg shadow-md">
              <h3 className="text-lg font-medium text-gray-700 mb-3">Template 1 - Minimal</h3>
              <div className="scale-40 origin-top-left transform">
                <StoryTemplate1 {...sampleData} />
              </div>
            </div>
            
            <div className="bg-white p-4 rounded-lg shadow-md">
              <h3 className="text-lg font-medium text-gray-700 mb-3">Template 2 - Vibrant</h3>
              <div className="scale-40 origin-top-left transform">
                <StoryTemplate2 {...sampleData} />
              </div>
            </div>
          </div>

          {/* Flyer Templates */}
          <div className="space-y-6">
            <h2 className="text-2xl font-semibold text-gray-800 border-b pb-2">
              📄 Flyer Templates (A4/1200×1500)
            </h2>
            
            <div className="bg-white p-4 rounded-lg shadow-md">
              <h3 className="text-lg font-medium text-gray-700 mb-3">Template 1 - Minimal</h3>
              <div className="scale-40 origin-top-left transform">
                <FlyerTemplate1 {...sampleData} />
              </div>
            </div>
            
            <div className="bg-white p-4 rounded-lg shadow-md">
              <h3 className="text-lg font-medium text-gray-700 mb-3">Template 2 - Vibrant</h3>
              <div className="scale-40 origin-top-left transform">
                <FlyerTemplate2 {...sampleData} />
              </div>
            </div>
          </div>

          {/* Banner Templates */}
          <div className="space-y-6">
            <h2 className="text-2xl font-semibold text-gray-800 border-b pb-2">
              🎯 Banner Templates (1200×628)
            </h2>
            
            <div className="bg-white p-4 rounded-lg shadow-md">
              <h3 className="text-lg font-medium text-gray-700 mb-3">Template 1 - Minimal</h3>
              <div className="scale-50 origin-top-left transform">
                <BannerTemplate1 {...sampleData} />
              </div>
            </div>
            
            <div className="bg-white p-4 rounded-lg shadow-md">
              <h3 className="text-lg font-medium text-gray-700 mb-3">Template 2 - Vibrant</h3>
              <div className="scale-50 origin-top-left transform">
                <BannerTemplate2 {...sampleData} />
              </div>
            </div>
          </div>

          {/* Badge Templates */}
          <div className="space-y-6">
            <h2 className="text-2xl font-semibold text-gray-800 border-b pb-2">
              🏷️ Badge Templates (800×800)
            </h2>
            
            <div className="bg-white p-4 rounded-lg shadow-md">
              <h3 className="text-lg font-medium text-gray-700 mb-3">Template 1 - Minimal</h3>
              <div className="scale-60 origin-top-left transform">
                <BadgeTemplate1 {...sampleData} />
              </div>
            </div>
            
            <div className="bg-white p-4 rounded-lg shadow-md">
              <h3 className="text-lg font-medium text-gray-700 mb-3">Template 2 - Vibrant</h3>
              <div className="scale-60 origin-top-left transform">
                <BadgeTemplate2 {...sampleData} />
              </div>
            </div>
          </div>

          {/* Brochure Templates */}
          <div className="space-y-6">
            <h2 className="text-2xl font-semibold text-gray-800 border-b pb-2">
              📋 Brochure Templates (A4/1200×1500)
            </h2>
            
            <div className="bg-white p-4 rounded-lg shadow-md">
              <h3 className="text-lg font-medium text-gray-700 mb-3">Template 1 - Minimal</h3>
              <div className="scale-40 origin-top-left transform">
                <BrochureTemplate1 {...sampleData} />
              </div>
            </div>
            
            <div className="bg-white p-4 rounded-lg shadow-md">
              <h3 className="text-lg font-medium text-gray-700 mb-3">Template 2 - Vibrant</h3>
              <div className="scale-40 origin-top-left transform">
                <BrochureTemplate2 {...sampleData} />
              </div>
            </div>
          </div>

        </div>

        {/* Usage Instructions */}
        <div className="mt-12 bg-white p-8 rounded-lg shadow-lg">
          <h2 className="text-2xl font-bold text-gray-900 mb-6">🚀 How to Use These Templates</h2>
          
          <div className="grid md:grid-cols-2 gap-8">
            <div>
              <h3 className="text-lg font-semibold text-gray-800 mb-4">Basic Usage</h3>
              <pre className="bg-gray-100 p-4 rounded-lg text-sm overflow-x-auto">
{`import { SquarePostTemplate1 } from '@/components/templates';

<SquarePostTemplate1 
  title="Your Title"
  subtitle="Your Subtitle"
  description="Your description here"
  image="/path/to/image.jpg"
  logo="/path/to/logo.png"
  ctaText="Custom CTA"
/>`}
              </pre>
            </div>
            
            <div>
              <h3 className="text-lg font-semibold text-gray-800 mb-4">All Available Templates</h3>
              <ul className="space-y-2 text-gray-600">
                <li>• <strong>SquarePost:</strong> Template1, Template2</li>
                <li>• <strong>Story:</strong> Template1, Template2</li>
                <li>• <strong>Flyer:</strong> Template1, Template2</li>
                <li>• <strong>Banner:</strong> Template1, Template2</li>
                <li>• <strong>Badge:</strong> Template1, Template2</li>
                <li>• <strong>Brochure:</strong> Template1, Template2</li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ExampleUsage;
