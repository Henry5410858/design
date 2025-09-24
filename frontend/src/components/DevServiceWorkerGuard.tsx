"use client";

// In dev, ensure no stale SW/caches cause hydration or DOM mutation errors.
// If a SW was controlling the page, unregister, clear caches, then reload once.
import { useEffect } from "react";

export default function DevServiceWorkerGuard() {
  useEffect(() => {
    if (process.env.NODE_ENV !== "production") {
      const run = async () => {
        let hadController = false;
        let hadRegs = false;

        // Detect existing controller
        if (typeof navigator !== "undefined" && "serviceWorker" in navigator) {
          hadController = !!navigator.serviceWorker.controller;
        }

        // Unregister all service workers
        if (typeof navigator !== "undefined" && "serviceWorker" in navigator) {
          try {
            const regs = await navigator.serviceWorker.getRegistrations?.();
            hadRegs = !!(regs && regs.length);
            regs?.forEach((reg) => {
              try { reg.unregister(); } catch (_) {}
            });
          } catch (_) {}
        }

        // Clear all caches created by sw.js
        if (typeof caches !== "undefined" && caches.keys) {
          try {
            const keys = await caches.keys();
            await Promise.all(keys.map((k) => {
              try { return caches.delete(k); } catch (_) { return Promise.resolve(false); }
            }));
          } catch (_) {}
        }

        // If there was a controller or registrations, force a one-time reload
        const needsReload = hadController || hadRegs;
        const alreadyReloaded = typeof sessionStorage !== "undefined" && sessionStorage.getItem("sw_cleared_once") === "1";
        if (needsReload && !alreadyReloaded && typeof window !== "undefined") {
          try { sessionStorage.setItem("sw_cleared_once", "1"); } catch (_) {}
          // Use replace to avoid back/forward issues
          window.location.replace(window.location.href);
        }
      };

      run();
    }
  }, []);

  return null;
}