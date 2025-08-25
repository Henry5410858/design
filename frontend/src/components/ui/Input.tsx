import React, { useState } from 'react';
import { motion } from 'framer-motion';

export interface InputProps {
  label?: string;
  error?: string;
  helperText?: string;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
  fullWidth?: boolean;
  className?: string;
  placeholder?: string;
  type?: string;
  value?: string;
  onChange?: (value: string) => void;
  disabled?: boolean;
  required?: boolean;
}

const Input: React.FC<InputProps> = ({
  label,
  error,
  helperText,
  leftIcon,
  rightIcon,
  fullWidth = false,
  className = '',
  placeholder,
  type = 'text',
  value = '',
  onChange,
  disabled = false,
  required = false
}) => {
  const [isFocused, setIsFocused] = useState(false);
  const [inputValue, setInputValue] = useState(value);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = e.target.value;
    setInputValue(newValue);
    onChange?.(newValue);
  };

  const handleFocus = () => setIsFocused(true);
  const handleBlur = () => setIsFocused(false);

  const baseClasses = 'w-full px-4 py-3 bg-white border border-gray-300 rounded-2xl text-gray-900 text-sm transition-all duration-200 ease-out placeholder-gray-400 focus:outline-none focus:border-brand-primary focus:shadow-soft disabled:bg-gray-100 disabled:text-gray-500 disabled:cursor-not-allowed';
  
  const errorClasses = error ? 'border-error focus:border-error' : '';
  const widthClasses = fullWidth ? 'w-full' : '';
  const leftIconClasses = leftIcon ? 'pl-12' : '';
  const rightIconClasses = rightIcon ? 'pr-12' : '';
  
  const allClasses = `${baseClasses} ${errorClasses} ${widthClasses} ${leftIconClasses} ${rightIconClasses} ${className}`.trim();

  const id = `input-${Math.random().toString(36).substr(2, 9)}`;

  return (
    <motion.div
      className={`${fullWidth ? 'w-full' : ''} space-y-2`}
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.2, ease: 'easeOut' }}
    >
      {label && (
        <motion.label
          htmlFor={id}
          className="block text-sm font-medium text-gray-700"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.1 }}
        >
          {label}
          {required && <span className="text-error ml-1">*</span>}
        </motion.label>
      )}
      
      <motion.div className="relative">
        {leftIcon && (
          <motion.div
            className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400"
            initial={{ opacity: 0, x: -10 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.2 }}
          >
            {leftIcon}
          </motion.div>
        )}
        
        <motion.input
          id={id}
          type={type}
          className={allClasses}
          placeholder={placeholder}
          value={inputValue}
          onChange={handleChange}
          onFocus={handleFocus}
          onBlur={handleBlur}
          disabled={disabled}
          required={required}
          whileFocus={{ scale: 1.01 }}
          transition={{ duration: 0.2, ease: 'easeOut' }}
        />
        
        {rightIcon && (
          <motion.div
            className="absolute right-4 top-1/2 transform -translate-y-1/2 text-gray-400"
            initial={{ opacity: 0, x: 10 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.2 }}
          >
            {rightIcon}
          </motion.div>
        )}
        
        {/* Focus indicator */}
        {isFocused && !error && (
          <motion.div
            className="absolute inset-0 border-2 border-brand-primary rounded-2xl pointer-events-none"
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            transition={{ duration: 0.2, ease: 'easeOut' }}
          />
        )}
      </motion.div>
      
      {(error || helperText) && (
        <motion.div
          className="text-sm"
          initial={{ opacity: 0, y: 5 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
        >
          {error && (
            <p className="text-error font-medium">
              {error}
            </p>
          )}
          {helperText && !error && (
            <p className="text-gray-500">
              {helperText}
            </p>
          )}
        </motion.div>
      )}
    </motion.div>
  );
};

export default Input;
