// Centralized, DOM-free notification utilities
// - Uses Web Notifications API when available
// - Falls back to console logging (no DOM mutations)

export type NotifyType = 'success' | 'error' | 'info' | 'warning';

const titleForType = (type: NotifyType): string => {
  switch (type) {
    case 'success':
      return 'Éxito';
    case 'error':
      return 'Error';
    case 'warning':
      return 'Aviso';
    default:
      return 'Info';
  }
};

export const notify = (message: string, type: NotifyType = 'info', title = ''): void => {
  const finalTitle = title || titleForType(type);
  try {
    if (typeof window !== 'undefined' && 'Notification' in window) {
      if (Notification.permission === 'granted') {
        new Notification(finalTitle, { body: message });
      } else if (Notification.permission !== 'denied') {
        Notification.requestPermission().then((perm) => {
          if (perm === 'granted') new Notification(finalTitle, { body: message });
        });
      }
      return;
    }
  } catch {
    // Ignore Notification API errors and fall back
  }
  // Fallback: log to console to avoid DOM usage
  // Include the type in the log to keep context
  const prefix = `[${finalTitle}]`;
  if (type === 'error') {
    console.error(prefix, message);
  } else if (type === 'warning') {
    console.warn(prefix, message);
  } else {
    console.info(prefix, message);
  }
};

// Safe wrapper to avoid triggering any side-effects during React's commit phase.
// Defers two rAF frames to ensure the UI is committed before notifying.
export const safeNotify = (message: string, type: NotifyType = 'info', title = ''): void => {
  if (typeof window === 'undefined' || typeof window.requestAnimationFrame !== 'function') {
    // SSR or no rAF available: fall back immediately
    notify(message, type, title);
    return;
  }
  requestAnimationFrame(() => {
    requestAnimationFrame(() => notify(message, type, title));
  });
};