'use client';

import React, { useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import Notification, { NotificationProps } from './Notification';

export interface NotificationItem extends Omit<NotificationProps, 'onClose'> {
  id: string;
}

const NotificationManager: React.FC = () => {
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);

  const addNotification = useCallback((notification: Omit<NotificationItem, 'id'>) => {
    const id = `notification-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    const newNotification: NotificationItem = {
      ...notification,
      id
    };
    
    setNotifications(prev => [...prev, newNotification]);
  }, []);

  const removeNotification = useCallback((id: string) => {
    setNotifications(prev => prev.filter(notification => notification.id !== id));
  }, []);

  // Expose addNotification globally
  React.useEffect(() => {
    (window as any).showNotification = addNotification;
    return () => {
      delete (window as any).showNotification;
    };
  }, [addNotification]);

  return (
    <div className="fixed top-4 right-4 z-[9999] space-y-3">
      <AnimatePresence>
        {notifications.map((notification) => (
          <motion.div
            key={notification.id}
            initial={{ opacity: 0, x: 300 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 300 }}
            transition={{ duration: 0.3, ease: 'easeOut' }}
          >
            <Notification
              {...notification}
              onClose={removeNotification}
            />
          </motion.div>
        ))}
      </AnimatePresence>
    </div>
  );
};

export default NotificationManager;
