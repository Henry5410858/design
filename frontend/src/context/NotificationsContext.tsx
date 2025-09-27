"use client";
import React, { createContext, useCallback, useContext, useMemo, useRef, useState } from "react";

export type NoticeType = "success" | "error" | "info" | "warning";

export interface Notice {
  id: string;
  message: string;
  type: NoticeType;
}

interface NotificationsContextValue {
  notices: Notice[];
  add: (message: string, type?: NoticeType) => void;
  remove: (id: string) => void;
  safeAdd: (message: string, type?: NoticeType) => void;
}

const NotificationsContext = createContext<NotificationsContextValue | null>(null);

export const NotificationsProvider: React.FC<{ children: React.ReactNode }>
= ({ children }) => {
  const [notices, setNotices] = useState<Notice[]>([]);
  const timers = useRef<Map<string, number>>(new Map());

  const remove = useCallback((id: string) => {
    setNotices(prev => prev.filter(n => n.id !== id));
    const t = timers.current.get(id);
    if (t) {
      window.clearTimeout(t);
      timers.current.delete(id);
    }
  }, []);

  const add = useCallback((message: string, type: NoticeType = "info") => {
    const id = `${Date.now()}-${Math.random().toString(36).slice(2)}`;
    setNotices(prev => [...prev, { id, message, type }]);
    // Auto-dismiss after 4s
    const handle = window.setTimeout(() => remove(id), 4000);
    timers.current.set(id, handle);
  }, [remove]);

  const safeAdd = useCallback((message: string, type: NoticeType = "info") => {
    if (typeof window === "undefined" || typeof window.requestAnimationFrame !== "function") {
      add(message, type);
      return;
    }
    requestAnimationFrame(() => {
      requestAnimationFrame(() => add(message, type));
    });
  }, [add]);

  const value = useMemo(() => ({ notices, add, remove, safeAdd }), [notices, add, remove, safeAdd]);

  return (
    <NotificationsContext.Provider value={value}>
      {children}
    </NotificationsContext.Provider>
  );
};

export const useNotifications = (): NotificationsContextValue => {
  const ctx = useContext(NotificationsContext);
  if (!ctx) throw new Error("useNotifications must be used within NotificationsProvider");
  return ctx;
};