import React from 'react';

interface BrochureTemplate1Props {
  title: string;
  subtitle?: string;
  description?: string;
  image?: string;
  logo?: string;
  ctaText?: string;
}

const BrochureTemplate1: React.FC<BrochureTemplate1Props> = ({
  title,
  subtitle,
  description,
  image,
  logo,
  ctaText = 'Learn More'
}) => {
  return (
    <div className="w-[1200px] h-[1500px] bg-white relative overflow-hidden border border-gray-200">
      {/* Header Section */}
      <div className="bg-gradient-to-r from-slate-800 to-slate-700 text-white p-12">
        {/* Logo */}
        {logo && (
          <div className="mb-8">
            <img src={logo} alt="Logo" className="h-20 w-auto" />
          </div>
        )}
        
        {/* Title */}
        <h1 className="text-6xl font-bold mb-4 leading-tight">
          {title}
        </h1>
        
        {/* Subtitle */}
        {subtitle && (
          <h2 className="text-2xl font-medium text-slate-200">
            {subtitle}
          </h2>
        )}
      </div>

      {/* Main Content */}
      <div className="p-12">
        <div className="grid grid-cols-2 gap-12 items-start">
          {/* Left Column - Content */}
          <div className="space-y-8">
            {/* Description */}
            {description && (
              <div>
                <h3 className="text-2xl font-semibold text-slate-800 mb-4">Overview</h3>
                <p className="text-lg text-slate-600 leading-relaxed">
                  {description}
                </p>
              </div>
            )}

            {/* Features */}
            <div className="bg-slate-50 p-6 rounded-xl">
              <h3 className="text-xl font-semibold text-slate-800 mb-4">Key Features</h3>
              <ul className="text-slate-600 space-y-3">
                <li className="flex items-center">
                  <span className="w-2 h-2 bg-slate-400 rounded-full mr-3"></span>
                  Professional design quality
                </li>
                <li className="flex items-center">
                  <span className="w-2 h-2 bg-slate-400 rounded-full mr-3"></span>
                  Easy customization options
                </li>
                <li className="flex items-center">
                  <span className="w-2 h-2 bg-slate-400 rounded-full mr-3"></span>
                  Print-ready format
                </li>
                <li className="flex items-center">
                  <span className="w-2 h-2 bg-slate-400 rounded-full mr-3"></span>
                  Responsive layout
                </li>
              </ul>
            </div>

            {/* CTA Button */}
            <button className="w-full bg-slate-800 text-white py-4 px-8 rounded-xl text-xl font-semibold hover:bg-slate-700 transition-colors duration-300 shadow-lg">
              {ctaText}
            </button>
          </div>

          {/* Right Column - Image and Additional Info */}
          <div className="space-y-6">
            {/* Main Image */}
            {image && (
              <div>
                <img 
                  src={image} 
                  alt="Main" 
                  className="w-full h-80 object-cover rounded-2xl shadow-xl"
                />
              </div>
            )}

            {/* Contact Information */}
            <div className="bg-slate-50 p-6 rounded-xl">
              <h3 className="text-xl font-semibold text-slate-800 mb-4">Contact Information</h3>
              <div className="space-y-3 text-slate-600">
                <p className="flex items-center">
                  <span className="mr-3">📧</span>
                  info@company.com
                </p>
                <p className="flex items-center">
                  <span className="mr-3">📱</span>
                  +1 (555) 123-4567
                </p>
                <p className="flex items-center">
                  <span className="mr-3">📍</span>
                  123 Business St, City, State
                </p>
                <p className="flex items-center">
                  <span className="mr-3">🌐</span>
                  www.company.com
                </p>
              </div>
            </div>

            {/* Additional Details */}
            <div className="bg-slate-50 p-6 rounded-xl">
              <h3 className="text-xl font-semibold text-slate-800 mb-4">Additional Details</h3>
              <div className="text-slate-600 space-y-2">
                <p>• Professional consultation available</p>
                <p>• 24/7 customer support</p>
                <p>• Flexible payment options</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Footer */}
      <div className="absolute bottom-0 left-0 right-0 bg-slate-100 p-8 text-center">
        <p className="text-slate-600">
          © 2024 Company Name. All rights reserved.
        </p>
      </div>
    </div>
  );
};

export default BrochureTemplate1;
