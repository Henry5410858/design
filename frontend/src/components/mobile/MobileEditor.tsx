'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { mobileOptimization, TouchGesture } from '@/utils/mobileOptimization';
import { 
  ZoomIn, 
  ZoomOut, 
  RotateCw, 
  Move, 
  Hand, 
  Smartphone, 
  Tablet,
  Wifi,
  WifiOff,
  Battery,
  Volume2,
  VolumeX
} from 'lucide-react';

interface MobileEditorProps {
  canvas: any;
  onClose?: () => void;
  onSave?: () => void;
  onExport?: () => void;
}

export default function MobileEditor({ canvas, onClose, onSave, onExport }: MobileEditorProps) {
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [zoomLevel, setZoomLevel] = useState(1);
  const [showToolbar, setShowToolbar] = useState(true);
  const [deviceInfo, setDeviceInfo] = useState(mobileOptimization.getAnalytics().deviceInfo);
  const [isOnline, setIsOnline] = useState(mobileOptimization.isOnlineStatus());

  useEffect(() => {
    // Setup mobile gestures
    const swipeLeft: TouchGesture = {
      type: 'swipe',
      direction: 'left',
      threshold: 50,
      callback: () => {
        mobileOptimization.triggerHaptic('light');
        setShowToolbar(false);
      }
    };

    const swipeRight: TouchGesture = {
      type: 'swipe',
      direction: 'right',
      threshold: 50,
      callback: () => {
        mobileOptimization.triggerHaptic('light');
        setShowToolbar(true);
      }
    };

    const doubleTap: TouchGesture = {
      type: 'tap',
      threshold: 10,
      callback: () => {
        mobileOptimization.triggerHaptic('medium');
        setIsFullscreen(!isFullscreen);
      }
    };

    mobileOptimization.addGesture(swipeLeft);
    mobileOptimization.addGesture(swipeRight);
    mobileOptimization.addGesture(doubleTap);

    // Update online status
    const updateOnlineStatus = () => {
      setIsOnline(mobileOptimization.isOnlineStatus());
    };

    window.addEventListener('online', updateOnlineStatus);
    window.addEventListener('offline', updateOnlineStatus);

    return () => {
      window.removeEventListener('online', updateOnlineStatus);
      window.removeEventListener('offline', updateOnlineStatus);
    };
  }, [isFullscreen]);

  const handleZoomIn = useCallback(() => {
    mobileOptimization.triggerHaptic('light');
    setZoomLevel(prev => Math.min(prev + 0.1, 3));
  }, []);

  const handleZoomOut = useCallback(() => {
    mobileOptimization.triggerHaptic('light');
    setZoomLevel(prev => Math.max(prev - 0.1, 0.5));
  }, []);

  const handleRotate = useCallback(() => {
    mobileOptimization.triggerHaptic('medium');
    // Rotate canvas logic
  }, []);

  const toggleFullscreen = useCallback(() => {
    mobileOptimization.triggerHaptic('medium');
    setIsFullscreen(!isFullscreen);
  }, [isFullscreen]);

  const toggleToolbar = useCallback(() => {
    mobileOptimization.triggerHaptic('light');
    setShowToolbar(!showToolbar);
  }, [showToolbar]);

  return (
    <div className={`mobile-editor ${isFullscreen ? 'fullscreen' : ''}`}>
      {/* Status Bar */}
      <div className="mobile-status-bar">
        <div className="status-left">
          <span className="device-type">
            {deviceInfo.type === 'mobile' ? <Smartphone className="w-4 h-4" /> : <Tablet className="w-4 h-4" />}
            {deviceInfo.type}
          </span>
          <span className="orientation">{deviceInfo.orientation}</span>
        </div>
        
        <div className="status-right">
          {isOnline ? <Wifi className="w-4 h-4 text-green-500" /> : <WifiOff className="w-4 h-4 text-red-500" />}
          <Battery className="w-4 h-4" />
          <Volume2 className="w-4 h-4" />
        </div>
      </div>

      {/* Main Editor Area */}
      <div className="mobile-editor-content" style={{ transform: `scale(${zoomLevel})` }}>
        <div className="canvas-container">
          {/* Canvas will be rendered here */}
        </div>
      </div>

      {/* Touch Controls */}
      {showToolbar && (
        <div className="mobile-toolbar">
          <div className="toolbar-section">
            <button onClick={handleZoomOut} className="tool-btn">
              <ZoomOut className="w-5 h-5" />
            </button>
            <span className="zoom-level">{Math.round(zoomLevel * 100)}%</span>
            <button onClick={handleZoomIn} className="tool-btn">
              <ZoomIn className="w-5 h-5" />
            </button>
          </div>

          <div className="toolbar-section">
            <button onClick={handleRotate} className="tool-btn">
              <RotateCw className="w-5 h-5" />
            </button>
            <button onClick={toggleFullscreen} className="tool-btn">
              <Hand className="w-5 h-5" />
            </button>
          </div>

          <div className="toolbar-section">
            <button onClick={onSave} className="tool-btn primary">
              Guardar
            </button>
            <button onClick={onExport} className="tool-btn primary">
              Exportar
            </button>
          </div>
        </div>
      )}

      {/* Floating Action Button */}
      <button 
        onClick={toggleToolbar}
        className="fab"
      >
        {showToolbar ? '✕' : '☰'}
      </button>

      <style jsx>{`
        .mobile-editor {
          position: fixed;
          top: 0;
          left: 0;
          width: 100vw;
          height: 100vh;
          background: #000;
          display: flex;
          flex-direction: column;
          z-index: 9999;
        }

        .mobile-editor.fullscreen {
          background: #000;
        }

        .mobile-status-bar {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 8px 16px;
          background: rgba(0, 0, 0, 0.8);
          color: white;
          font-size: 12px;
          z-index: 10000;
        }

        .status-left, .status-right {
          display: flex;
          align-items: center;
          gap: 8px;
        }

        .mobile-editor-content {
          flex: 1;
          display: flex;
          align-items: center;
          justify-content: center;
          overflow: hidden;
          transform-origin: center;
          transition: transform 0.3s ease;
        }

        .canvas-container {
          width: 100%;
          height: 100%;
          display: flex;
          align-items: center;
          justify-content: center;
        }

        .mobile-toolbar {
          position: fixed;
          bottom: 0;
          left: 0;
          right: 0;
          background: rgba(0, 0, 0, 0.9);
          padding: 16px;
          display: flex;
          justify-content: space-between;
          align-items: center;
          z-index: 10000;
          backdrop-filter: blur(10px);
        }

        .toolbar-section {
          display: flex;
          align-items: center;
          gap: 12px;
        }

        .tool-btn {
          display: flex;
          align-items: center;
          justify-content: center;
          width: 44px;
          height: 44px;
          background: rgba(255, 255, 255, 0.1);
          border: 1px solid rgba(255, 255, 255, 0.2);
          border-radius: 8px;
          color: white;
          font-size: 14px;
          cursor: pointer;
          transition: all 0.2s ease;
        }

        .tool-btn:hover {
          background: rgba(255, 255, 255, 0.2);
          transform: scale(1.05);
        }

        .tool-btn.primary {
          background: #3B82F6;
          border-color: #3B82F6;
          min-width: 80px;
          font-weight: 500;
        }

        .tool-btn.primary:hover {
          background: #2563EB;
        }

        .zoom-level {
          color: white;
          font-size: 12px;
          font-weight: 500;
          min-width: 40px;
          text-align: center;
        }

        .fab {
          position: fixed;
          top: 60px;
          right: 20px;
          width: 56px;
          height: 56px;
          background: #3B82F6;
          border: none;
          border-radius: 50%;
          color: white;
          font-size: 20px;
          cursor: pointer;
          box-shadow: 0 4px 12px rgba(59, 130, 246, 0.3);
          z-index: 10001;
          transition: all 0.2s ease;
        }

        .fab:hover {
          transform: scale(1.1);
          box-shadow: 0 6px 16px rgba(59, 130, 246, 0.4);
        }

        @media (max-width: 768px) {
          .mobile-toolbar {
            padding: 12px;
          }
          
          .toolbar-section {
            gap: 8px;
          }
          
          .tool-btn {
            width: 40px;
            height: 40px;
          }
          
          .tool-btn.primary {
            min-width: 70px;
            font-size: 12px;
          }
        }
      `}</style>
    </div>
  );
}
