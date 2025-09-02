import React from 'react';

interface BadgeTemplate2Props {
  title: string;
  subtitle?: string;
  description?: string;
  image?: string;
  logo?: string;
  ctaText?: string;
}

const BadgeTemplate2: React.FC<BadgeTemplate2Props> = ({
  title,
  subtitle,
  description,
  image,
  logo,
  ctaText = 'View Details'
}) => {
  return (
    <div className="w-[800px] h-[800px] bg-gradient-to-br from-emerald-500 via-teal-500 to-cyan-500 relative overflow-hidden rounded-3xl shadow-2xl">
      {/* Animated Background Elements */}
      <div className="absolute inset-0">
        <div className="absolute top-16 left-16 w-32 h-32 bg-white rounded-full opacity-10 animate-pulse"></div>
        <div className="absolute bottom-16 right-16 w-24 h-24 bg-yellow-300 rounded-full opacity-20 animate-bounce"></div>
        <div className="absolute top-1/2 left-10 w-20 h-20 bg-cyan-300 rounded-full opacity-15"></div>
      </div>

      {/* Geometric Shapes */}
      <div className="absolute top-0 right-0 w-48 h-48 bg-gradient-to-bl from-white to-transparent opacity-20 transform rotate-45"></div>
      <div className="absolute bottom-0 left-0 w-40 h-40 bg-gradient-to-tr from-white to-transparent opacity-15 transform -rotate-12"></div>

      {/* Logo */}
      {logo && (
        <div className="absolute top-6 left-6 bg-white/20 backdrop-blur-sm rounded-2xl p-2">
          <img src={logo} alt="Logo" className="h-10 w-auto" />
        </div>
      )}

      {/* Main Content */}
      <div className="absolute inset-0 flex flex-col justify-center items-center px-12 text-center text-white">
        {/* Image with Creative Frame */}
        {image && (
          <div className="mb-6 relative">
            <div className="w-56 h-56 rounded-2xl overflow-hidden shadow-2xl transform rotate-1 hover:rotate-0 transition-transform duration-500">
              <img 
                src={image} 
                alt="Main" 
                className="w-full h-full object-cover"
              />
            </div>
            {/* Decorative Frame */}
            <div className="absolute inset-0 border-3 border-white/30 rounded-2xl transform -rotate-1"></div>
          </div>
        )}

        {/* Title with Creative Typography */}
        <div className="mb-4">
          <h1 className="text-5xl font-black mb-2 leading-tight drop-shadow-2xl">
            {title}
          </h1>
          <div className="w-20 h-1 bg-white mx-auto rounded-full"></div>
        </div>

        {/* Subtitle */}
        {subtitle && (
          <h2 className="text-xl font-bold mb-3 text-yellow-200 drop-shadow-lg">
            {subtitle}
          </h2>
        )}

        {/* Description */}
        {description && (
          <p className="text-sm text-white/90 mb-6 max-w-sm leading-relaxed font-medium">
            {description}
          </p>
        )}

        {/* CTA Button with Hover Effects */}
        <button className="group relative bg-white text-emerald-600 px-6 py-3 rounded-full text-lg font-bold hover:scale-110 transition-all duration-300 shadow-2xl overflow-hidden">
          <span className="relative z-10">{ctaText}</span>
          <div className="absolute inset-0 bg-gradient-to-r from-yellow-400 to-orange-400 transform scale-x-0 group-hover:scale-x-100 transition-transform duration-300 origin-left"></div>
        </button>
      </div>

      {/* Floating Elements */}
      <div className="absolute top-1/4 right-8 w-4 h-4 bg-yellow-300 rounded-full animate-ping"></div>
      <div className="absolute bottom-1/3 left-8 w-3 h-3 bg-cyan-300 rounded-full animate-pulse"></div>
      <div className="absolute top-2/3 right-1/4 w-2 h-2 bg-white rounded-full animate-bounce"></div>
    </div>
  );
};

export default BadgeTemplate2;
