import React from 'react';

interface StoryTemplate1Props {
  title: string;
  subtitle?: string;
  description?: string;
  image?: string;
  logo?: string;
  ctaText?: string;
}

const StoryTemplate1: React.FC<StoryTemplate1Props> = ({
  title,
  subtitle,
  description,
  image,
  logo,
  ctaText = 'Swipe Up'
}) => {
  return (
    <div className="w-[1080px] h-[1920px] bg-gradient-to-b from-slate-50 to-slate-100 relative overflow-hidden">
      {/* Background Pattern */}
      <div className="absolute inset-0 opacity-5">
        <div className="absolute top-0 left-0 w-64 h-64 border-l-2 border-t-2 border-slate-300"></div>
        <div className="absolute top-0 right-0 w-64 h-64 border-r-2 border-t-2 border-slate-300"></div>
        <div className="absolute bottom-0 left-0 w-64 h-64 border-l-2 border-b-2 border-slate-300"></div>
        <div className="absolute bottom-0 right-0 w-64 h-64 border-r-2 border-b-2 border-slate-300"></div>
      </div>

      {/* Logo */}
      {logo && (
        <div className="absolute top-16 left-16">
          <img src={logo} alt="Logo" className="h-20 w-auto" />
        </div>
      )}

      {/* Main Content */}
      <div className="absolute inset-0 flex flex-col justify-center items-center px-20 text-center">
        {/* Image */}
        {image && (
          <div className="mb-12">
            <img 
              src={image} 
              alt="Main" 
              className="w-96 h-96 object-cover rounded-3xl shadow-2xl"
            />
          </div>
        )}

        {/* Title */}
        <h1 className="text-7xl font-bold text-slate-800 mb-6 leading-tight">
          {title}
        </h1>

        {/* Subtitle */}
        {subtitle && (
          <h2 className="text-3xl font-medium text-slate-600 mb-4">
            {subtitle}
          </h2>
        )}

        {/* Description */}
        {description && (
          <p className="text-2xl text-slate-500 mb-12 max-w-3xl leading-relaxed">
            {description}
          </p>
        )}

        {/* CTA Button */}
        <button className="bg-slate-800 text-white px-12 py-6 rounded-full text-2xl font-semibold hover:bg-slate-700 transition-colors duration-300 shadow-lg">
          {ctaText}
        </button>
      </div>

      {/* Decorative Elements */}
      <div className="absolute bottom-16 right-16 w-32 h-32 bg-slate-200 rounded-full opacity-20"></div>
      <div className="absolute top-1/3 right-20 w-20 h-20 bg-slate-300 rounded-full opacity-30"></div>
      <div className="absolute bottom-1/3 left-20 w-16 h-16 bg-slate-400 rounded-full opacity-25"></div>
    </div>
  );
};

export default StoryTemplate1;
