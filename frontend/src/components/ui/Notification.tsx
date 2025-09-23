'use client';

import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';

export interface NotificationProps {
  id: string;
  type: 'success' | 'error' | 'info' | 'warning';
  title: string;
  message: string;
  duration?: number;
  onClose: (id: string) => void;
}

const Notification: React.FC<NotificationProps> = ({
  id,
  type,
  title,
  message,
  duration = 5000,
  onClose
}) => {
  const [isVisible, setIsVisible] = useState(true);

  useEffect(() => {
    const timer = setTimeout(() => {
      setIsVisible(false);
      setTimeout(() => onClose(id), 300); // Wait for exit animation
    }, duration);

    return () => clearTimeout(timer);
  }, [duration, id, onClose]);

  const handleClose = () => {
    setIsVisible(false);
    setTimeout(() => onClose(id), 300);
  };

  const getIcon = () => {
    switch (type) {
      case 'success':
        return '✅';
      case 'error':
        return '❌';
      case 'warning':
        return '⚠️';
      case 'info':
        return 'ℹ️';
      default:
        return 'ℹ️';
    }
  };

  const getColors = () => {
    switch (type) {
      case 'success':
        return 'bg-green-50 border-green-200 text-green-800';
      case 'error':
        return 'bg-red-50 border-red-200 text-red-800';
      case 'warning':
        return 'bg-yellow-50 border-yellow-200 text-yellow-800';
      case 'info':
        return 'bg-blue-50 border-blue-200 text-blue-800';
      default:
        return 'bg-blue-50 border-blue-200 text-blue-800';
    }
  };

  return (
    isVisible ? (
      <motion.div
        initial={{ opacity: 0, y: -50, scale: 0.9 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        exit={{ opacity: 0, y: -50, scale: 0.9 }}
        transition={{ duration: 0.3, ease: 'easeOut' }}
        className={`relative max-w-sm w-full bg-white rounded-xl shadow-2xl border-2 ${getColors()} overflow-hidden`}
      >
        {/* Progress Bar */}
        <div className="absolute top-0 left-0 h-1 bg-current opacity-30">
          <motion.div
            className="h-full bg-current"
            initial={{ width: '100%' }}
            animate={{ width: '0%' }}
            transition={{ duration: duration / 1000, ease: 'linear' }}
          />
        </div>

        <div className="p-4">
          <div className="flex items-start gap-3">
            <div className="flex-shrink-0 text-2xl">
              {getIcon()}
            </div>
            
            <div className="flex-1 min-w-0">
              <h4 className="font-bold text-sm mb-1">
                {title}
              </h4>
              <p className="text-sm opacity-90 leading-relaxed">
                {message}
              </p>
            </div>

            <button
              onClick={handleClose}
              className="flex-shrink-0 text-current opacity-60 hover:opacity-100 transition-opacity p-1"
              aria-label="Close notification"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>
      </motion.div>
    ) : null
  );
};

export default Notification;
