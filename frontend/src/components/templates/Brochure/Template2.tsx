import React from 'react';

interface BrochureTemplate2Props {
  title: string;
  subtitle?: string;
  description?: string;
  image?: string;
  logo?: string;
  ctaText?: string;
}

const BrochureTemplate2: React.FC<BrochureTemplate2Props> = ({
  title,
  subtitle,
  description,
  image,
  logo,
  ctaText = 'Get Started'
}) => {
  return (
    <div className="w-[1200px] h-[1500px] bg-gradient-to-br from-rose-500 via-pink-500 to-purple-600 relative overflow-hidden">
      {/* Animated Background Elements */}
      <div className="absolute inset-0">
        <div className="absolute top-20 left-20 w-64 h-64 bg-white rounded-full opacity-10 animate-pulse"></div>
        <div className="absolute bottom-20 right-20 w-48 h-48 bg-yellow-300 rounded-full opacity-20 animate-bounce"></div>
        <div className="absolute top-1/2 left-10 w-32 h-32 bg-cyan-300 rounded-full opacity-15"></div>
        <div className="absolute bottom-1/3 left-1/2 w-24 h-24 bg-pink-300 rounded-full opacity-25 animate-ping"></div>
      </div>

      {/* Geometric Shapes */}
      <div className="absolute top-0 right-0 w-96 h-96 bg-gradient-to-bl from-white to-transparent opacity-20 transform rotate-45"></div>
      <div className="absolute bottom-0 left-0 w-80 h-80 bg-gradient-to-tr from-white to-transparent opacity-15 transform -rotate-12"></div>

      {/* Header Section */}
      <div className="relative z-10 p-12 text-white">
        {/* Logo */}
        {logo && (
          <div className="mb-8 bg-white/20 backdrop-blur-sm rounded-2xl p-4 inline-block">
            <img src={logo} alt="Logo" className="h-16 w-auto" />
          </div>
        )}
        
        {/* Title */}
        <h1 className="text-7xl font-black mb-4 leading-tight drop-shadow-2xl">
          {title}
        </h1>
        
        {/* Subtitle */}
        {subtitle && (
          <h2 className="text-3xl font-bold text-yellow-200 drop-shadow-lg">
            {subtitle}
          </h2>
        )}
      </div>

      {/* Main Content */}
      <div className="relative z-10 p-12">
        <div className="grid grid-cols-2 gap-12 items-start">
          {/* Left Column - Content */}
          <div className="space-y-8 text-white">
            {/* Description */}
            {description && (
              <div className="bg-white/20 backdrop-blur-sm p-6 rounded-2xl">
                <h3 className="text-2xl font-bold mb-4">✨ Overview</h3>
                <p className="text-lg text-white/90 leading-relaxed">
                  {description}
                </p>
              </div>
            )}

            {/* Features */}
            <div className="bg-white/20 backdrop-blur-sm p-6 rounded-2xl">
              <h3 className="text-xl font-bold mb-4">🚀 Key Features</h3>
              <ul className="text-white/90 space-y-3">
                <li className="flex items-center">
                  <span className="w-3 h-3 bg-yellow-300 rounded-full mr-3"></span>
                  Eye-catching design
                </li>
                <li className="flex items-center">
                  <span className="w-3 h-3 bg-yellow-300 rounded-full mr-3"></span>
                  Modern aesthetics
                </li>
                <li className="flex items-center">
                  <span className="w-3 h-3 bg-yellow-300 rounded-full mr-3"></span>
                  Professional quality
                </li>
                <li className="flex items-center">
                  <span className="w-3 h-3 bg-yellow-300 rounded-full mr-3"></span>
                  Creative layouts
                </li>
              </ul>
            </div>

            {/* CTA Button */}
            <button className="group relative w-full bg-white text-rose-600 py-5 px-8 rounded-2xl text-2xl font-bold hover:scale-105 transition-all duration-300 shadow-2xl overflow-hidden">
              <span className="relative z-10">{ctaText}</span>
              <div className="absolute inset-0 bg-gradient-to-r from-yellow-400 to-orange-400 transform scale-x-0 group-hover:scale-x-100 transition-transform duration-300 origin-left"></div>
            </button>
          </div>

          {/* Right Column - Image and Additional Info */}
          <div className="space-y-6">
            {/* Main Image */}
            {image && (
              <div className="relative">
                <img 
                  src={image} 
                  alt="Main" 
                  className="w-full h-80 object-cover rounded-3xl shadow-2xl transform rotate-1 hover:rotate-0 transition-transform duration-500"
                />
                <div className="absolute inset-0 border-4 border-white/30 rounded-3xl transform -rotate-1"></div>
              </div>
            )}

            {/* Contact Information */}
            <div className="bg-white/20 backdrop-blur-sm p-6 rounded-2xl text-white">
              <h3 className="text-xl font-bold mb-4">📞 Contact Us</h3>
              <div className="space-y-3 text-white/90">
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
            <div className="bg-white/20 backdrop-blur-sm p-6 rounded-2xl text-white">
              <h3 className="text-xl font-bold mb-4">💎 Premium Features</h3>
              <div className="text-white/90 space-y-2">
                <p>• Professional consultation available</p>
                <p>• 24/7 customer support</p>
                <p>• Flexible payment options</p>
                <p>• Custom design services</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Footer */}
      <div className="absolute bottom-0 left-0 right-0 bg-white/20 backdrop-blur-sm p-8 text-center text-white">
        <p className="text-white/90">
          © 2024 Company Name. All rights reserved.
        </p>
      </div>

      {/* Floating Elements */}
      <div className="absolute top-1/4 right-16 w-8 h-8 bg-yellow-300 rounded-full animate-ping"></div>
      <div className="absolute bottom-1/3 left-20 w-6 h-6 bg-cyan-300 rounded-full animate-pulse"></div>
      <div className="absolute top-2/3 right-1/4 w-4 h-4 bg-pink-300 rounded-full animate-bounce"></div>
    </div>
  );
};

export default BrochureTemplate2;
