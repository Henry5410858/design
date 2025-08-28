import React from 'react';

interface FlyerTemplate1Props {
  title: string;
  subtitle?: string;
  description?: string;
  image?: string;
  logo?: string;
  ctaText?: string;
}

const FlyerTemplate1: React.FC<FlyerTemplate1Props> = ({
  title,
  subtitle,
  description,
  image,
  logo,
  ctaText = 'Contact Us'
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
        <div className="grid grid-cols-2 gap-12 items-center">
          {/* Left Column - Image */}
          {image && (
            <div className="space-y-6">
              <img 
                src={image} 
                alt="Main" 
                className="w-full h-96 object-cover rounded-2xl shadow-xl"
              />
              <div className="bg-slate-50 p-6 rounded-xl">
                <h3 className="text-xl font-semibold text-slate-800 mb-2">Key Features</h3>
                <ul className="text-slate-600 space-y-2">
                  <li>• Professional quality design</li>
                  <li>• Easy to customize</li>
                  <li>• Print-ready format</li>
                </ul>
              </div>
            </div>
          )}

          {/* Right Column - Content */}
          <div className="space-y-8">
            {/* Description */}
            {description && (
              <div>
                <h3 className="text-2xl font-semibold text-slate-800 mb-4">About</h3>
                <p className="text-lg text-slate-600 leading-relaxed">
                  {description}
                </p>
              </div>
            )}

            {/* Contact Information */}
            <div className="bg-slate-50 p-6 rounded-xl">
              <h3 className="text-xl font-semibold text-slate-800 mb-4">Contact Information</h3>
              <div className="space-y-3 text-slate-600">
                <p>📧 info@company.com</p>
                <p>📱 +1 (555) 123-4567</p>
                <p>📍 123 Business St, City, State</p>
              </div>
            </div>

            {/* CTA Button */}
            <button className="w-full bg-slate-800 text-white py-4 px-8 rounded-xl text-xl font-semibold hover:bg-slate-700 transition-colors duration-300 shadow-lg">
              {ctaText}
            </button>
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

export default FlyerTemplate1;
