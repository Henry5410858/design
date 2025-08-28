import React from 'react';

interface StoryTemplate2Props {
  title: string;
  subtitle?: string;
  description?: string;
  image?: string;
  logo?: string;
  ctaText?: string;
}

const StoryTemplate2: React.FC<StoryTemplate2Props> = ({
  title,
  subtitle,
  description,
  image,
  logo,
  ctaText = 'Swipe Up'
}) => {
  return (
    <div className="w-[1080px] h-[1920px] bg-gradient-to-b from-indigo-600 via-purple-600 to-pink-500 relative overflow-hidden">
      {/* Animated Background Elements */}
      <div className="absolute inset-0">
        <div className="absolute top-32 left-32 w-48 h-48 bg-white rounded-full opacity-10 animate-pulse"></div>
        <div className="absolute bottom-32 right-32 w-40 h-40 bg-yellow-300 rounded-full opacity-20 animate-bounce"></div>
        <div className="absolute top-1/2 left-16 w-32 h-32 bg-cyan-300 rounded-full opacity-15"></div>
        <div className="absolute bottom-1/3 left-1/2 w-24 h-24 bg-pink-300 rounded-full opacity-25 animate-ping"></div>
      </div>

      {/* Geometric Shapes */}
      <div className="absolute top-0 right-0 w-80 h-80 bg-gradient-to-bl from-white to-transparent opacity-20 transform rotate-45"></div>
      <div className="absolute bottom-0 left-0 w-64 h-64 bg-gradient-to-tr from-white to-transparent opacity-15 transform -rotate-12"></div>

      {/* Logo */}
      {logo && (
        <div className="absolute top-12 left-12 bg-white/20 backdrop-blur-sm rounded-3xl p-4">
          <img src={logo} alt="Logo" className="h-16 w-auto" />
        </div>
      )}

      {/* Main Content */}
      <div className="absolute inset-0 flex flex-col justify-center items-center px-20 text-center text-white">
        {/* Image with Creative Frame */}
        {image && (
          <div className="mb-12 relative">
            <div className="w-[500px] h-[500px] rounded-3xl overflow-hidden shadow-2xl transform rotate-2 hover:rotate-0 transition-transform duration-500">
              <img 
                src={image} 
                alt="Main" 
                className="w-full h-full object-cover"
              />
            </div>
            {/* Decorative Frame */}
            <div className="absolute inset-0 border-4 border-white/30 rounded-3xl transform -rotate-2"></div>
          </div>
        )}

        {/* Title with Creative Typography */}
        <div className="mb-8">
          <h1 className="text-8xl font-black mb-3 leading-tight drop-shadow-2xl">
            {title}
          </h1>
          <div className="w-40 h-1 bg-white mx-auto rounded-full"></div>
        </div>

        {/* Subtitle */}
        {subtitle && (
          <h2 className="text-4xl font-bold mb-6 text-yellow-200 drop-shadow-lg">
            {subtitle}
          </h2>
        )}

        {/* Description */}
        {description && (
          <p className="text-2xl text-white/90 mb-12 max-w-3xl leading-relaxed font-medium">
            {description}
          </p>
        )}

        {/* CTA Button with Hover Effects */}
        <button className="group relative bg-white text-indigo-600 px-14 py-7 rounded-full text-3xl font-bold hover:scale-110 transition-all duration-300 shadow-2xl overflow-hidden">
          <span className="relative z-10">{ctaText}</span>
          <div className="absolute inset-0 bg-gradient-to-r from-yellow-400 to-orange-400 transform scale-x-0 group-hover:scale-x-100 transition-transform duration-300 origin-left"></div>
        </button>
      </div>

      {/* Floating Elements */}
      <div className="absolute top-1/4 right-12 w-8 h-8 bg-yellow-300 rounded-full animate-ping"></div>
      <div className="absolute bottom-1/4 left-16 w-6 h-6 bg-cyan-300 rounded-full animate-pulse"></div>
      <div className="absolute top-2/3 right-1/4 w-4 h-4 bg-pink-300 rounded-full animate-bounce"></div>
    </div>
  );
};

export default StoryTemplate2;
