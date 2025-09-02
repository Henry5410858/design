import React from 'react';

interface SquarePostTemplate2Props {
  title: string;
  subtitle?: string;
  description?: string;
  image?: string;
  logo?: string;
  ctaText?: string;
}

const SquarePostTemplate2: React.FC<SquarePostTemplate2Props> = ({
  title,
  subtitle,
  description,
  image,
  logo,
  ctaText = 'Get Started'
}) => {
  return (
    <div className="w-[1080px] h-[1080px] bg-gradient-to-br from-purple-600 via-pink-500 to-orange-400 relative overflow-hidden">
      {/* Animated Background Elements */}
      <div className="absolute inset-0">
        <div className="absolute top-20 left-20 w-40 h-40 bg-white rounded-full opacity-10 animate-pulse"></div>
        <div className="absolute bottom-20 right-20 w-32 h-32 bg-yellow-300 rounded-full opacity-20 animate-bounce"></div>
        <div className="absolute top-1/2 left-10 w-24 h-24 bg-cyan-300 rounded-full opacity-15"></div>
      </div>

      {/* Geometric Shapes */}
      <div className="absolute top-0 right-0 w-64 h-64 bg-gradient-to-bl from-white to-transparent opacity-20 transform rotate-45"></div>
      <div className="absolute bottom-0 left-0 w-48 h-48 bg-gradient-to-tr from-white to-transparent opacity-15 transform -rotate-12"></div>

      {/* Logo */}
      {logo && (
        <div className="absolute top-8 left-8 bg-white/20 backdrop-blur-sm rounded-2xl p-3">
          <img src={logo} alt="Logo" className="h-12 w-auto" />
        </div>
      )}

      {/* Main Content */}
      <div className="absolute inset-0 flex flex-col justify-center items-center px-16 text-center text-white">
        {/* Image with Creative Frame */}
        {image && (
          <div className="mb-8 relative">
            <div className="w-72 h-72 rounded-3xl overflow-hidden shadow-2xl transform rotate-3 hover:rotate-0 transition-transform duration-500">
              <img 
                src={image} 
                alt="Main" 
                className="w-full h-full object-cover"
              />
            </div>
            {/* Decorative Frame */}
            <div className="absolute inset-0 border-4 border-white/30 rounded-3xl transform -rotate-3"></div>
          </div>
        )}

        {/* Title with Creative Typography */}
        <div className="mb-6">
          <h1 className="text-7xl font-black mb-2 leading-tight drop-shadow-2xl">
            {title}
          </h1>
          <div className="w-32 h-1 bg-white mx-auto rounded-full"></div>
        </div>

        {/* Subtitle */}
        {subtitle && (
          <h2 className="text-3xl font-bold mb-4 text-yellow-200 drop-shadow-lg">
            {subtitle}
          </h2>
        )}

        {/* Description */}
        {description && (
          <p className="text-xl text-white/90 mb-8 max-w-2xl leading-relaxed font-medium">
            {description}
          </p>
        )}

        {/* CTA Button with Hover Effects */}
        <button className="group relative bg-white text-purple-600 px-10 py-5 rounded-full text-2xl font-bold hover:scale-110 transition-all duration-300 shadow-2xl overflow-hidden">
          <span className="relative z-10">{ctaText}</span>
          <div className="absolute inset-0 bg-gradient-to-r from-yellow-400 to-orange-400 transform scale-x-0 group-hover:scale-x-100 transition-transform duration-300 origin-left"></div>
        </button>
      </div>

      {/* Floating Elements */}
      <div className="absolute top-1/4 right-8 w-6 h-6 bg-yellow-300 rounded-full animate-ping"></div>
      <div className="absolute bottom-1/3 left-12 w-4 h-4 bg-cyan-300 rounded-full animate-pulse"></div>
    </div>
  );
};

export default SquarePostTemplate2;
