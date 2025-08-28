import React from 'react';

interface BannerTemplate2Props {
  title: string;
  subtitle?: string;
  description?: string;
  image?: string;
  logo?: string;
  ctaText?: string;
}

const BannerTemplate2: React.FC<BannerTemplate2Props> = ({
  title,
  subtitle,
  description,
  image,
  logo,
  ctaText = 'Get Started'
}) => {
  return (
    <div className="w-[1200px] h-[628px] bg-gradient-to-r from-blue-600 via-purple-600 to-pink-500 relative overflow-hidden">
      {/* Animated Background Elements */}
      <div className="absolute inset-0">
        <div className="absolute top-16 left-16 w-48 h-48 bg-white rounded-full opacity-10 animate-pulse"></div>
        <div className="absolute bottom-16 right-16 w-40 h-40 bg-yellow-300 rounded-full opacity-20 animate-bounce"></div>
        <div className="absolute top-1/2 left-10 w-32 h-32 bg-cyan-300 rounded-full opacity-15"></div>
      </div>

      {/* Geometric Shapes */}
      <div className="absolute top-0 right-0 w-80 h-80 bg-gradient-to-bl from-white to-transparent opacity-20 transform rotate-45"></div>
      <div className="absolute bottom-0 left-0 w-64 h-64 bg-gradient-to-tr from-white to-transparent opacity-15 transform -rotate-12"></div>

      {/* Logo */}
      {logo && (
        <div className="absolute top-8 left-8 bg-white/20 backdrop-blur-sm rounded-2xl p-3">
          <img src={logo} alt="Logo" className="h-14 w-auto" />
        </div>
      )}

      {/* Main Content */}
      <div className="absolute inset-0 flex items-center px-16">
        <div className="grid grid-cols-2 gap-16 items-center w-full">
          {/* Left Column - Content */}
          <div className="space-y-6 text-white">
            {/* Title */}
            <div>
              <h1 className="text-6xl font-black leading-tight drop-shadow-2xl mb-2">
                {title}
              </h1>
              <div className="w-24 h-1 bg-white rounded-full"></div>
            </div>

            {/* Subtitle */}
            {subtitle && (
              <h2 className="text-2xl font-bold text-yellow-200 drop-shadow-lg">
                {subtitle}
              </h2>
            )}

            {/* Description */}
            {description && (
              <p className="text-lg text-white/90 leading-relaxed">
                {description}
              </p>
            )}

            {/* CTA Button */}
            <button className="group relative bg-white text-blue-600 px-10 py-5 rounded-full text-xl font-bold hover:scale-110 transition-all duration-300 shadow-2xl overflow-hidden">
              <span className="relative z-10">{ctaText}</span>
              <div className="absolute inset-0 bg-gradient-to-r from-yellow-400 to-orange-400 transform scale-x-0 group-hover:scale-x-100 transition-transform duration-300 origin-left"></div>
            </button>
          </div>

          {/* Right Column - Image */}
          {image && (
            <div className="flex justify-center">
              <div className="relative">
                <img 
                  src={image} 
                  alt="Main" 
                  className="w-80 h-80 object-cover rounded-3xl shadow-2xl transform rotate-2 hover:rotate-0 transition-transform duration-500"
                />
                <div className="absolute inset-0 border-4 border-white/30 rounded-3xl transform -rotate-2"></div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Floating Elements */}
      <div className="absolute top-1/4 right-20 w-6 h-6 bg-yellow-300 rounded-full animate-ping"></div>
      <div className="absolute bottom-1/3 left-20 w-4 h-4 bg-cyan-300 rounded-full animate-pulse"></div>
      <div className="absolute top-2/3 right-1/4 w-3 h-3 bg-pink-300 rounded-full animate-bounce"></div>
    </div>
  );
};

export default BannerTemplate2;
