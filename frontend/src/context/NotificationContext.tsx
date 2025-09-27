'use client';

import React, { createContext, useContext, useCallback, useMemo } from 'react';
import { NotificationsProvider, useNotifications, NoticeType } from './NotificationsContext';

interface NotificationContextType {
  showNotification: (message: string, type: NoticeType, duration?: number) => void;
  showSuccess: (message: string, duration?: number) => void;
  showError: (message: string, duration?: number) => void;
  showInfo: (message: string, duration?: number) => void;
  showWarning: (message: string, duration?: number) => void;
}

const NotificationContext = createContext<NotificationContextType | undefined>(undefined);

const NotificationBridge: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { safeAdd } = useNotifications();

  const showNotification = useCallback((message: string, type: NoticeType = 'info', _duration?: number) => {
    safeAdd(message, type);
  }, [safeAdd]);

  const value = useMemo<NotificationContextType>(() => ({
    showNotification,
    showSuccess: (message: string, duration?: number) => showNotification(message, 'success', duration),
    showError: (message: string, duration?: number) => showNotification(message, 'error', duration),
    showInfo: (message: string, duration?: number) => showNotification(message, 'info', duration),
    showWarning: (message: string, duration?: number) => showNotification(message, 'warning', duration),
  }), [showNotification]);

  return (
    <NotificationContext.Provider value={value}>
      {children}
    </NotificationContext.Provider>
  );
};

export const NotificationProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <NotificationsProvider>
    <NotificationBridge>{children}</NotificationBridge>
  </NotificationsProvider>
);

export const useNotification = (): NotificationContextType => {
  const context = useContext(NotificationContext);
  if (!context) {
    throw new Error('useNotification must be used within a NotificationProvider');
  }
  return context;
};