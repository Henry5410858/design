import React from 'react';
import { motion } from 'framer-motion';

export interface ButtonProps {
  children: React.ReactNode;
  variant?: 'primary' | 'secondary' | 'ghost' | 'outline' | 'gradient';
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl';
  fullWidth?: boolean;
  loading?: boolean;
  disabled?: boolean;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
  onClick?: (e: React.MouseEvent<HTMLButtonElement>) => void;
  type?: 'button' | 'submit' | 'reset';
  className?: string;
}

const Button: React.FC<ButtonProps> = ({
  children,
  variant = 'primary',
  size = 'md',
  fullWidth = false,
  loading = false,
  disabled = false,
  leftIcon,
  rightIcon,
  onClick,
  type = 'button',
  className = '',
}) => {
  const baseClasses = 'inline-flex items-center justify-center gap-2 font-medium text-sm transition-all duration-200 ease-out focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-primary disabled:opacity-50 disabled:cursor-not-allowed';
  
  const variantClasses = {
    primary: 'bg-brand-primary text-white hover:bg-brand-primary-dark hover:-translate-y-0.5 shadow-soft hover:shadow-elevated active:translate-y-0',
    secondary: 'bg-transparent text-brand-primary border border-brand-primary hover:bg-brand-primary/5 hover:-translate-y-0.5 shadow-soft hover:shadow-elevated active:translate-y-0',
    ghost: 'bg-transparent text-gray-600 hover:bg-gray-100 hover:text-gray-900',
    outline: 'bg-transparent text-gray-700 border border-gray-300 hover:bg-gray-50 hover:border-gray-400 hover:-translate-y-0.5',
    gradient: 'bg-gradient-to-r from-brand-primary to-brand-secondary text-white hover:from-brand-primary-dark hover:to-brand-secondary-dark hover:-translate-y-0.5 shadow-soft hover:shadow-elevated active:translate-y-0'
  };
  
  const sizeClasses = {
    xs: 'px-3 py-1.5 text-xs rounded-full',
    sm: 'px-4 py-2 text-sm rounded-full',
    md: 'px-5 py-2.5 text-sm rounded-full',
    lg: 'px-6 py-3 text-base rounded-full',
    xl: 'px-8 py-4 text-lg rounded-full'
  };
  
  const widthClasses = fullWidth ? 'w-full' : '';
  
  const disabledClasses = disabled || loading ? 'opacity-50 cursor-not-allowed' : '';
  
  const allClasses = `${baseClasses} ${variantClasses[variant]} ${sizeClasses[size]} ${widthClasses} ${disabledClasses} ${className}`.trim();

  return (
    <motion.button
      type={type}
      className={allClasses}
      onClick={onClick}
      disabled={disabled || loading}
      whileHover={!disabled && !loading ? { y: -2 } : {}}
      whileTap={!disabled && !loading ? { y: 0 } : {}}
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.2, ease: 'easeOut' }}
    >
      {loading && (
        <motion.div
          className="w-4 h-4 border-2 border-current border-t-transparent rounded-full"
          animate={{ rotate: 360 }}
          transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
        />
      )}
      
      {!loading && leftIcon && (
        <span className="flex-shrink-0">
          {leftIcon}
        </span>
      )}
      
      <span className={loading ? 'opacity-0' : ''}>
        {children}
      </span>
      
      {!loading && rightIcon && (
        <span className="flex-shrink-0">
          {rightIcon}
        </span>
      )}
    </motion.button>
  );
};

export default Button;
