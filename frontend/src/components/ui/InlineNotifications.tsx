"use client";
import React from "react";
import { useNotifications } from "@/context/NotificationsContext";

// Inline notifications without portals or direct DOM mutations
export const InlineNotifications: React.FC = () => {
  const { notices, remove } = useNotifications();

  // Client-only guard
  if (typeof window === 'undefined') return null;

  return (
    <div className="fixed top-4 right-4 z-[100] flex flex-col gap-2 pointer-events-auto">
      {notices.map(n => (
        <div
          key={n.id}
          className={`rounded-lg px-4 py-2 shadow-lg border text-sm font-medium transition-all bg-white ${
            n.type === 'success' ? 'border-green-300 text-green-700' :
            n.type === 'error' ? 'border-red-300 text-red-700' :
            n.type === 'warning' ? 'border-yellow-300 text-yellow-700' :
            'border-blue-300 text-blue-700'
          }`}
        >
          <div className="flex items-start gap-3">
            <div>
              {n.type === 'success' ? '✅' : n.type === 'error' ? '⛔' : n.type === 'warning' ? '⚠️' : 'ℹ️'}
            </div>
            <div className="flex-1">
              {n.message}
            </div>
            <button
              className="opacity-70 hover:opacity-100"
              onClick={() => remove(n.id)}
              aria-label="Cerrar notificación"
              title="Cerrar"
            >
              ✕
            </button>
          </div>
        </div>
      ))}
    </div>
  );
};

export default InlineNotifications;