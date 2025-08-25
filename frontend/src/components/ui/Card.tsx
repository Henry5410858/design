import React from 'react';
import { motion } from 'framer-motion';

export interface CardProps {
  children: React.ReactNode;
  variant?: 'base' | 'interactive' | 'elevated' | 'outlined';
  className?: string;
  onClick?: () => void;
  padding?: 'none' | 'sm' | 'md' | 'lg';
  shadow?: 'none' | 'soft' | 'elevated' | 'lg' | 'sm' | '2xl';
  border?: 'none' | 'light' | 'medium' | 'brand';
}

const Card: React.FC<CardProps> = ({
  children,
  variant = 'base',
  className = '',
  onClick,
  padding = 'md',
  shadow = 'soft',
  border = 'light'
}) => {
  const baseClasses = 'bg-white border transition-all duration-200 ease-out';
  
  const variantClasses = {
    base: 'border-gray-200 hover:shadow-elevated hover:-translate-y-1',
    interactive: 'border-gray-200 hover:border-brand-primary hover:shadow-elevated hover:-translate-y-2 cursor-pointer',
    elevated: 'border-gray-200 shadow-elevated hover:shadow-2xl hover:-translate-y-3',
    outlined: 'border-gray-200 bg-transparent hover:bg-white hover:shadow-soft'
  };
  
  const paddingClasses = {
    none: '',
    sm: 'p-4',
    md: 'p-6',
    lg: 'p-8'
  };
  
  const shadowClasses = {
    none: 'shadow-none',
    soft: 'shadow-soft',
    elevated: 'shadow-elevated',
    lg: 'shadow-lg',
    sm: 'shadow-sm',
    '2xl': 'shadow-2xl'
  };
  
  const borderClasses = {
    none: 'border-0',
    light: 'border-gray-200',
    medium: 'border-gray-300',
    brand: 'border-brand-primary/20'
  };
  
  const radiusClasses = 'rounded-2xl'; // 2xl as specified
  
  const allClasses = `${baseClasses} ${variantClasses[variant]} ${paddingClasses[padding]} ${shadowClasses[shadow]} ${borderClasses[border]} ${radiusClasses} ${className}`.trim();

  const handleKeyDown = (event: React.KeyboardEvent) => {
    if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault();
      onClick?.();
    }
  };

  if (onClick) {
    return (
      <motion.div
        className={allClasses}
        onClick={onClick}
        onKeyDown={handleKeyDown}
        tabIndex={0}
        role="button"
        aria-label="Clickable card"
        whileHover={{ y: variant === 'elevated' ? -12 : variant === 'interactive' ? -8 : -4 }}
        whileTap={{ y: 0 }}
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.2, ease: 'easeOut' }}
      >
        {children}
      </motion.div>
    );
  }

  return (
    <motion.div
      className={allClasses}
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.2, ease: 'easeOut' }}
    >
      {children}
    </motion.div>
  );
};

export default Card;
