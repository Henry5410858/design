import React from 'react';

interface BadgeTemplate1Props {
  title: string;
  subtitle?: string;
  description?: string;
  image?: string;
  logo?: string;
  ctaText?: string;
}

const BadgeTemplate1: React.FC<BadgeTemplate1Props> = ({
  title,
  subtitle,
  description,
  image,
  logo,
  ctaText = 'View Details'
}) => {
  return (
    <div className="w-[800px] h-[800px] bg-gradient-to-br from-slate-50 to-slate-100 relative overflow-hidden rounded-3xl shadow-2xl">
      {/* Background Pattern */}
      <div className="absolute inset-0 opacity-5">
        <div className="absolute top-0 left-0 w-32 h-32 border-l-2 border-t-2 border-slate-300"></div>
        <div className="absolute top-0 right-0 w-32 h-32 border-r-2 border-t-2 border-slate-300"></div>
        <div className="absolute bottom-0 left-0 w-32 h-32 border-l-2 border-b-2 border-slate-300"></div>
        <div className="absolute bottom-0 right-0 w-32 h-32 border-r-2 border-b-2 border-slate-300"></div>
      </div>

      {/* Logo */}
      {logo && (
        <div className="absolute top-8 left-8">
          <img src={logo} alt="Logo" className="h-12 w-auto" />
        </div>
      )}

      {/* Main Content */}
      <div className="absolute inset-0 flex flex-col justify-center items-center px-16 text-center">
        {/* Image */}
        {image && (
          <div className="mb-8">
            <img 
              src={image} 
              alt="Main" 
              className="w-64 h-64 object-cover rounded-2xl shadow-xl"
            />
          </div>
        )}

        {/* Title */}
        <h1 className="text-4xl font-bold text-slate-800 mb-4 leading-tight">
          {title}
        </h1>

        {/* Subtitle */}
        {subtitle && (
          <h2 className="text-xl font-medium text-slate-600 mb-3">
            {subtitle}
          </h2>
        )}

        {/* Description */}
        {description && (
          <p className="text-base text-slate-500 mb-6 max-w-lg leading-relaxed">
            {description}
          </p>
        )}

        {/* CTA Button */}
        <button className="bg-slate-800 text-white px-6 py-3 rounded-full text-lg font-semibold hover:bg-slate-700 transition-colors duration-300 shadow-lg">
          {ctaText}
        </button>
      </div>

      {/* Decorative Elements */}
      <div className="absolute bottom-8 right-8 w-16 h-16 bg-slate-200 rounded-full opacity-20"></div>
      <div className="absolute top-1/4 right-12 w-12 h-12 bg-slate-300 rounded-full opacity-30"></div>
      <div className="absolute bottom-1/3 left-12 w-10 h-10 bg-slate-400 rounded-full opacity-25"></div>
    </div>
  );
};

export default BadgeTemplate1;
