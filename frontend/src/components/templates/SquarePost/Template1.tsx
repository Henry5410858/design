import React from 'react';

interface SquarePostTemplate1Props {
  title: string;
  subtitle?: string;
  description?: string;
  image?: string;
  logo?: string;
  ctaText?: string;
}

const SquarePostTemplate1: React.FC<SquarePostTemplate1Props> = ({
  title,
  subtitle,
  description,
  image,
  logo,
  ctaText = 'Learn More'
}) => {
  return (
    <div className="w-[1080px] h-[1080px] bg-gradient-to-br from-slate-50 to-slate-100 relative overflow-hidden">
      {/* Background Pattern */}
      <div className="absolute inset-0 opacity-5">
        <div className="absolute top-0 left-0 w-32 h-32 border-l-2 border-t-2 border-slate-300"></div>
        <div className="absolute top-0 right-0 w-32 h-32 border-r-2 border-t-2 border-slate-300"></div>
        <div className="absolute bottom-0 left-0 w-32 h-32 border-l-2 border-b-2 border-slate-300"></div>
        <div className="absolute bottom-0 right-0 w-32 h-32 border-r-2 border-b-2 border-slate-300"></div>
      </div>

      {/* Logo */}
      {logo && (
        <div className="absolute top-12 left-12">
          <img src={logo} alt="Logo" className="h-16 w-auto" />
        </div>
      )}

      {/* Main Content */}
      <div className="absolute inset-0 flex flex-col justify-center items-center px-20 text-center">
        {/* Image */}
        {image && (
          <div className="mb-8">
            <img 
              src={image} 
              alt="Main" 
              className="w-80 h-80 object-cover rounded-2xl shadow-2xl"
            />
          </div>
        )}

        {/* Title */}
        <h1 className="text-6xl font-bold text-slate-800 mb-4 leading-tight">
          {title}
        </h1>

        {/* Subtitle */}
        {subtitle && (
          <h2 className="text-2xl font-medium text-slate-600 mb-3">
            {subtitle}
          </h2>
        )}

        {/* Description */}
        {description && (
          <p className="text-lg text-slate-500 mb-8 max-w-2xl leading-relaxed">
            {description}
          </p>
        )}

        {/* CTA Button */}
        <button className="bg-slate-800 text-white px-8 py-4 rounded-full text-xl font-semibold hover:bg-slate-700 transition-colors duration-300 shadow-lg">
          {ctaText}
        </button>
      </div>

      {/* Decorative Elements */}
      <div className="absolute bottom-8 right-8 w-24 h-24 bg-slate-200 rounded-full opacity-20"></div>
      <div className="absolute top-1/4 right-16 w-16 h-16 bg-slate-300 rounded-full opacity-30"></div>
    </div>
  );
};

export default SquarePostTemplate1;
