import React from 'react';

interface BannerTemplate1Props {
  title: string;
  subtitle?: string;
  description?: string;
  image?: string;
  logo?: string;
  ctaText?: string;
}

const BannerTemplate1: React.FC<BannerTemplate1Props> = ({
  title,
  subtitle,
  description,
  image,
  logo,
  ctaText = 'Learn More'
}) => {
  return (
    <div className="w-[1200px] h-[628px] bg-gradient-to-r from-slate-50 to-slate-100 relative overflow-hidden">
      {/* Background Pattern */}
      <div className="absolute inset-0 opacity-5">
        <div className="absolute top-0 left-0 w-48 h-48 border-l-2 border-t-2 border-slate-300"></div>
        <div className="absolute top-0 right-0 w-48 h-48 border-r-2 border-t-2 border-slate-300"></div>
        <div className="absolute bottom-0 left-0 w-48 h-48 border-l-2 border-b-2 border-slate-300"></div>
        <div className="absolute bottom-0 right-0 w-48 h-48 border-r-2 border-b-2 border-slate-300"></div>
      </div>

      {/* Logo */}
      {logo && (
        <div className="absolute top-8 left-8">
          <img src={logo} alt="Logo" className="h-16 w-auto" />
        </div>
      )}

      {/* Main Content */}
      <div className="absolute inset-0 flex items-center px-16">
        <div className="grid grid-cols-2 gap-16 items-center w-full">
          {/* Left Column - Content */}
          <div className="space-y-6">
            {/* Title */}
            <h1 className="text-5xl font-bold text-slate-800 leading-tight">
              {title}
            </h1>

            {/* Subtitle */}
            {subtitle && (
              <h2 className="text-2xl font-medium text-slate-600">
                {subtitle}
              </h2>
            )}

            {/* Description */}
            {description && (
              <p className="text-lg text-slate-500 leading-relaxed">
                {description}
              </p>
            )}

            {/* CTA Button */}
            <button className="bg-slate-800 text-white px-8 py-4 rounded-full text-xl font-semibold hover:bg-slate-700 transition-colors duration-300 shadow-lg">
              {ctaText}
            </button>
          </div>

          {/* Right Column - Image */}
          {image && (
            <div className="flex justify-center">
              <img 
                src={image} 
                alt="Main" 
                className="w-80 h-80 object-cover rounded-2xl shadow-2xl"
              />
            </div>
          )}
        </div>
      </div>

      {/* Decorative Elements */}
      <div className="absolute bottom-8 right-8 w-20 h-20 bg-slate-200 rounded-full opacity-20"></div>
      <div className="absolute top-1/4 right-16 w-16 h-16 bg-slate-300 rounded-full opacity-30"></div>
      <div className="absolute bottom-1/3 left-16 w-12 h-12 bg-slate-400 rounded-full opacity-25"></div>
    </div>
  );
};

export default BannerTemplate1;
