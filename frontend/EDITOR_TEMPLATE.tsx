// COMPREHENSIVE EDITOR TEMPLATE
// This template includes all the advanced functionality that should be applied to all editors

'use client';
import { useState, useRef, useEffect, useCallback } from 'react';
import { FiImage, FiType, FiSquare, FiDownload, FiSave, FiRotateCcw, FiRotateCw } from 'react-icons/fi';

interface EditorProps {
  id: string;
  editorType: 'social' | 'stories' | 'badges' | 'banners' | 'documents' | 'flyers';
}

interface EditorObject {
  id: string;
  type: 'text' | 'image' | 'shape' | 'placeholder';
  x: number;
  y: number;
  width?: number;
  height?: number;
  content?: string;
  fontSize?: number;
  color?: string;
  fontFamily?: string;
  src?: string;
  shape?: string;
}

interface HistoryState {
  objects: EditorObject[];
  backgroundColor: string;
}

export default function AdvancedEditor({ id, editorType }: EditorProps) {
  // State variables
  const [canvasSize, setCanvasSize] = useState('1080x1080');
  const [backgroundColor, setBackgroundColor] = useState('#ffffff');
  const [backgroundImage, setBackgroundImage] = useState<string | null>(null);
  const [objects, setObjects] = useState<EditorObject[]>([]);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [contentColor, setContentColor] = useState('#000000');
  const [fontSize, setFontSize] = useState(48);
  const [userPlan, setUserPlan] = useState<'Free' | 'Pro' | 'Enterprise'>('Free');
  const [history, setHistory] = useState<HistoryState[]>([]);
  const [historyIndex, setHistoryIndex] = useState(-1);
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  const [resizeStart, setResizeStart] = useState({ x: 0, y: 0, width: 0, height: 0 });
  const [isResizing, setIsResizing] = useState(false);
  const [resizeTarget, setResizeTarget] = useState<string | null>(null);
  
  const canvasRef = useRef<HTMLDivElement>(null);

  // Canvas sizes for different editor types
  const getCanvasSizes = () => {
    switch (editorType) {
      case 'social':
        return [
          { value: '1080x1080', label: 'Instagram Post (1080×1080)', width: 1080, height: 1080 },
          { value: '1200x630', label: 'Facebook Post (1200×630)', width: 1200, height: 630 },
          { value: '1200x1200', label: 'Twitter Post (1200×1200)', width: 1200, height: 1200 }
        ];
      case 'stories':
        return [
          { value: '1080x1920', label: 'Instagram Story (1080×1920)', width: 1080, height: 1920 },
          { value: '1080x1350', label: 'Facebook Story (1080×1350)', width: 1080, height: 1350 },
          { value: '1080x1920', label: 'WhatsApp Story (1080×1920)', width: 1080, height: 1920 }
        ];
      case 'badges':
        return [
          { value: '600x600', label: 'Badge Cuadrado (600×600)', width: 600, height: 600 },
          { value: '800x800', label: 'Badge Grande (800×800)', width: 800, height: 800 },
          { value: '400x400', label: 'Badge Pequeño (400×400)', width: 400, height: 400 }
        ];
      case 'banners':
        return [
          { value: '1200x400', label: 'Facebook Feed (1200×400)', width: 1200, height: 400 },
          { value: '1200x300', label: 'Web Banner (1200×300)', width: 1200, height: 300 },
          { value: '1200x600', label: 'Banner Alto (1200×600)', width: 1200, height: 600 }
        ];
      case 'documents':
        return [
          { value: '1200x1600', label: 'Documento A4 (1200×1600)', width: 1200, height: 1600 },
          { value: '1200x1800', label: 'Brochure (1200×1800)', width: 1200, height: 1800 },
          { value: '800x1200', label: 'Documento Pequeño (800×1200)', width: 800, height: 1200 }
        ];
      case 'flyers':
        return [
          { value: '1200x1800', label: 'Flyer A4 (1200×1800)', width: 1200, height: 1800 },
          { value: '1200x1600', label: 'Flyer Cuadrado (1200×1600)', width: 1200, height: 1600 },
          { value: '800x1200', label: 'Flyer Pequeño (800×1200)', width: 800, height: 1200 }
        ];
      default:
        return [{ value: '1080x1080', label: 'Default (1080×1080)', width: 1080, height: 1080 }];
    }
  };

  const canvasSizes = getCanvasSizes();

  const getCurrentCanvasSize = () => {
    const size = canvasSizes.find(s => s.value === canvasSize);
    return size || { width: 1080, height: 1080 };
  };

  // History management
  const saveToHistory = useCallback((newObjects: EditorObject[], newBackgroundColor: string) => {
    const newHistory = history.slice(0, historyIndex + 1);
    newHistory.push({ objects: newObjects, backgroundColor: newBackgroundColor });
    setHistory(newHistory);
    setHistoryIndex(newHistory.length - 1);
  }, [history, historyIndex]);

  const undo = useCallback(() => {
    if (historyIndex > 0) {
      const newIndex = historyIndex - 1;
      const state = history[newIndex];
      setObjects(state.objects);
      setBackgroundColor(state.backgroundColor);
      setHistoryIndex(newIndex);
    }
  }, [history, historyIndex]);

  const redo = useCallback(() => {
    if (historyIndex < history.length - 1) {
      const newIndex = historyIndex + 1;
      const state = history[newIndex];
      setObjects(state.objects);
      setBackgroundColor(state.backgroundColor);
      setHistoryIndex(newIndex);
    }
  }, [history, historyIndex]);

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.ctrlKey || e.metaKey) {
        if (e.key === 'z') {
          e.preventDefault();
          undo();
        } else if (e.key === 'y') {
          e.preventDefault();
          redo();
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [undo, redo]);

  // Initialize history
  useEffect(() => {
    if (history.length === 0) {
      saveToHistory(objects, backgroundColor);
    }
  }, []);

  // Add element functions
  const addText = () => {
    const newText: EditorObject = {
      id: `text-${Date.now()}`,
      type: 'text',
      content: 'Tu texto aquí',
      x: 100,
      y: 100,
      fontSize: fontSize,
      color: contentColor,
      fontFamily: 'Arial'
    };
    const newObjects = [...objects, newText];
    setObjects(newObjects);
    saveToHistory(newObjects, backgroundColor);
  };

  const addImage = () => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = 'image/*';
    input.onchange = (e) => {
      const file = (e.target as HTMLInputElement).files?.[0];
      if (file) {
        const reader = new FileReader();
        reader.onload = (e) => {
          const newImage: EditorObject = {
            id: `image-${Date.now()}`,
            type: 'image',
            src: e.target?.result as string,
            x: 100,
            y: 100,
            width: 200,
            height: 200
          };
          const newObjects = [...objects, newImage];
          setObjects(newObjects);
          saveToHistory(newObjects, backgroundColor);
        };
        reader.readAsDataURL(file);
      }
    };
    input.click();
  };

  const addShape = () => {
    const newShape: EditorObject = {
      id: `shape-${Date.now()}`,
      type: 'shape',
      shape: 'rectangle',
      x: 100,
      y: 100,
      width: 200,
      height: 100,
      color: contentColor
    };
    const newObjects = [...objects, newShape];
    setObjects(newObjects);
    saveToHistory(newObjects, backgroundColor);
  };

  const addImagePlaceholder = () => {
    const newPlaceholder: EditorObject = {
      id: `placeholder-${Date.now()}`,
      type: 'placeholder',
      x: 100,
      y: 100,
      width: 200,
      height: 200,
      color: '#e5e7eb'
    };
    const newObjects = [...objects, newPlaceholder];
    setObjects(newObjects);
    saveToHistory(newObjects, backgroundColor);
  };

  const importBackgroundImage = () => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = 'image/*';
    input.onchange = (e) => {
      const file = (e.target as HTMLInputElement).files?.[0];
      if (file) {
        const reader = new FileReader();
        reader.onload = (e) => {
          setBackgroundImage(e.target?.result as string);
        };
        reader.readAsDataURL(file);
      }
    };
    input.click();
  };

  // Mouse event handlers
  const handleMouseDown = (e: React.MouseEvent, obj: EditorObject) => {
    e.stopPropagation();
    // Only change selection if clicking on a different object
    if (selectedId !== obj.id) {
      setSelectedId(obj.id);
    }
    
    if (obj.type === 'placeholder') {
      const rect = (e.target as HTMLElement).getBoundingClientRect();
      const canvasRect = canvasRef.current?.getBoundingClientRect();
      if (canvasRect) {
        setResizeStart({
          x: e.clientX - canvasRect.left,
          y: e.clientY - canvasRect.top,
          width: obj.width || 0,
          height: obj.height || 0
        });
        setIsResizing(true);
        setResizeTarget(obj.id);
      }
    } else {
      setDragStart({ x: e.clientX, y: e.clientY });
      setIsDragging(true);
    }
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (isDragging && selectedId) {
      const obj = objects.find(o => o.id === selectedId);
      if (obj) {
        const deltaX = e.clientX - dragStart.x;
        const deltaY = e.clientY - dragStart.y;
        
        const newObjects = objects.map(o => 
          o.id === selectedId 
            ? { ...o, x: o.x + deltaX, y: o.y + deltaY }
            : o
        );
        setObjects(newObjects);
        setDragStart({ x: e.clientX, y: e.clientY });
      }
    } else if (isResizing && resizeTarget) {
      const obj = objects.find(o => o.id === resizeTarget);
      if (obj && obj.type === 'placeholder') {
        const deltaX = e.clientX - resizeStart.x;
        const deltaY = e.clientY - resizeStart.y;
        
        const newObjects = objects.map(o => 
          o.id === resizeTarget 
            ? { 
                ...o, 
                width: Math.max(50, (o.width || 0) + deltaX),
                height: Math.max(50, (o.height || 0) + deltaY)
              }
            : o
        );
        setObjects(newObjects);
        setResizeStart({ 
          x: e.clientX, 
          y: e.clientY, 
          width: obj.width || 0, 
          height: obj.height || 0 
        });
      }
    }
  };

  const handleMouseUp = () => {
    if (isDragging || isResizing) {
      setIsDragging(false);
      setIsResizing(false);
      setResizeTarget(null);
      saveToHistory(objects, backgroundColor);
    }
  };

  const handleCanvasClick = (e: React.MouseEvent) => {
    // Only clear selection if clicking directly on the canvas (not on content)
    // Check if the click target is the canvas itself or an empty area
    if (e.target === e.currentTarget) {
      setSelectedId(null);
    }
  };

  const updateSelectedObject = (updates: Partial<EditorObject>) => {
    if (selectedId) {
      const newObjects = objects.map(obj => 
        obj.id === selectedId ? { ...obj, ...updates } : obj
      );
      setObjects(newObjects);
      saveToHistory(newObjects, backgroundColor);
    }
  };

  // Save and export functions
  const handleSave = () => {
    if (userPlan === 'Free') {
      alert('Free plan users cannot save template designs. Please upgrade to Pro or Enterprise.');
      return;
    }
    
    const templateData = {
      id,
      objects,
      backgroundColor,
      backgroundImage,
      canvasSize: getCurrentCanvasSize()
    };
    
    const blob = new Blob([JSON.stringify(templateData, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `template-${id}.json`;
    a.click();
    URL.revokeObjectURL(url);
    
    alert('Template saved successfully!');
  };

  const handleExport = () => {
    alert('Export functionality would generate PNG/PDF here. File name and location would be set in Save dialog.');
  };

  // Render object function
  const renderObject = (obj: EditorObject) => {
    const isSelected = selectedId === obj.id;
    const baseClasses = `absolute cursor-move transition-all duration-200 ${isSelected ? 'ring-2 ring-blue-500 ring-offset-2 ring-offset-white shadow-lg' : 'hover:ring-1 hover:ring-gray-300'}`;
    
    switch (obj.type) {
      case 'text':
        return (
          <div
            key={obj.id}
            className={`${baseClasses} ${isSelected ? 'bg-blue-50 bg-opacity-30 rounded-sm' : ''}`}
            style={{
              left: obj.x,
              top: obj.y,
              fontSize: obj.fontSize,
              color: obj.color,
              fontFamily: obj.fontFamily
            }}
            onMouseDown={(e) => handleMouseDown(e, obj)}
            contentEditable={isSelected}
            onBlur={(e) => updateSelectedObject({ content: e.currentTarget.textContent || '' })}
            suppressContentEditableWarning
          >
            {obj.content}
            {isSelected && (
              <>
                {/* Selection handles */}
                <div className="absolute -top-1 -left-1 w-3 h-3 bg-blue-500 rounded-full border-2 border-white shadow-sm" />
                <div className="absolute -top-1 -right-1 w-3 h-3 bg-blue-500 rounded-full border-2 border-white shadow-sm" />
                <div className="absolute -bottom-1 -left-1 w-3 h-3 bg-blue-500 rounded-full border-2 border-white shadow-sm" />
                <div className="absolute -bottom-1 -right-1 w-3 h-3 bg-blue-500 rounded-full border-2 border-white shadow-sm" />
                
                {/* Delete button */}
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    const newObjects = objects.filter(o => o.id !== obj.id);
                    setObjects(newObjects);
                    // Don't clear selectedId - maintain selection
                    saveToHistory(newObjects, backgroundColor);
                  }}
                  className="absolute -top-2 -right-2 z-10 w-6 h-6 bg-red-500 hover:bg-red-600 text-white rounded-full flex items-center justify-center transition-colors shadow-lg text-sm font-bold"
                  title="Delete element"
                >
                  ×
                </button>
              </>
            )}
          </div>
        );
      case 'image':
        return (
          <div
            key={obj.id}
            className="relative"
            style={{
              left: obj.x,
              top: obj.y,
              width: obj.width,
              height: obj.height
            }}
          >
            <img
              src={obj.src}
              alt=""
              className={baseClasses}
              style={{
                width: '100%',
                height: '100%'
              }}
              onMouseDown={(e) => handleMouseDown(e, obj)}
            />
            {isSelected && (
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  const newObjects = objects.filter(o => o.id !== obj.id);
                  setObjects(newObjects);
                  // Don't clear selectedId - maintain selection
                  saveToHistory(newObjects, backgroundColor);
                }}
                className="absolute -top-2 -right-2 z-10 w-6 h-6 bg-red-500 hover:bg-red-600 text-white rounded-full flex items-center justify-center transition-colors shadow-lg text-sm font-bold"
                title="Delete element"
              >
                ×
              </button>
            )}
          </div>
        );
      case 'shape':
        return (
          <div
            key={obj.id}
            className={baseClasses}
            style={{
              left: obj.x,
              top: obj.y,
              width: obj.width,
              height: obj.height,
              backgroundColor: obj.color
            }}
            onMouseDown={(e) => handleMouseDown(e, obj)}
          >
            {isSelected && (
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  const newObjects = objects.filter(o => o.id !== obj.id);
                  setObjects(newObjects);
                  // Don't clear selectedId - maintain selection
                  saveToHistory(newObjects, backgroundColor);
                }}
                className="absolute -top-2 -right-2 z-10 w-6 h-6 bg-red-500 hover:bg-red-600 text-white rounded-full flex items-center justify-center transition-colors shadow-lg text-sm font-bold"
                title="Delete element"
              >
                ×
              </button>
            )}
          </div>
        );
      case 'placeholder':
        return (
          <div
            key={obj.id}
            className={`${baseClasses} border-2 border-dashed border-gray-400 flex items-center justify-center`}
            style={{
              left: obj.x,
              top: obj.y,
              width: obj.width,
              height: obj.height,
              backgroundColor: obj.color
            }}
            onMouseDown={(e) => handleMouseDown(e, obj)}
          >
            <span className="text-gray-500 text-sm">Image Placeholder</span>
            {isSelected && (
              <div className="absolute -bottom-2 -right-2 w-4 h-4 bg-blue-500 rounded-full cursor-se-resize resize-handle" />
            )}
            {isSelected && (
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  const newObjects = objects.filter(o => o.id !== obj.id);
                  setObjects(newObjects);
                  // Don't clear selectedId - maintain selection
                  saveToHistory(newObjects, backgroundColor);
                }}
                className="absolute -top-2 -right-2 z-10 w-6 h-6 bg-red-500 hover:bg-red-600 text-white rounded-full flex items-center justify-center transition-colors shadow-lg text-sm font-bold"
                title="Delete element"
              >
                ×
              </button>
            )}
          </div>
        );
      default:
        return null;
    }
  };

  // Get editor title and icon
  const getEditorInfo = () => {
    switch (editorType) {
      case 'social':
        return { title: 'Editor de Posts para Redes Sociales', icon: '📱' };
      case 'stories':
        return { title: 'Editor de Stories', icon: '📱' };
      case 'badges':
        return { title: 'Editor de Badges', icon: '🏆' };
      case 'banners':
        return { title: 'Editor de Banners', icon: '🖼️' };
      case 'documents':
        return { title: 'Editor de Documentos', icon: '📄' };
      case 'flyers':
        return { title: 'Editor de Flyers', icon: '📢' };
      default:
        return { title: 'Editor', icon: '📝' };
    }
  };

  const editorInfo = getEditorInfo();

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="bg-white rounded-2xl shadow-lg p-6 mb-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">{editorInfo.title}</h1>
              <p className="text-gray-600">Template ID: {id}</p>
              <p className="text-sm text-gray-500">Plan: {userPlan}</p>
            </div>
            <div className="flex items-center gap-3">
              <button 
                className={`px-4 py-2 rounded-lg transition-colors ${
                  historyIndex > 0 
                    ? 'bg-gray-100 text-gray-700 hover:bg-gray-200' 
                    : 'bg-gray-50 text-gray-400 cursor-not-allowed'
                }`}
                onClick={undo}
                disabled={historyIndex <= 0}
                title="Ctrl+Z"
              >
                <FiRotateCcw className="w-4 h-4 inline mr-2" />
                Deshacer
              </button>
              <button 
                className={`px-4 py-2 rounded-lg transition-colors ${
                  historyIndex < history.length - 1 
                    ? 'bg-gray-100 text-gray-700 hover:bg-gray-200' 
                    : 'bg-gray-50 text-gray-400 cursor-not-allowed'
                }`}
                onClick={redo}
                disabled={historyIndex >= history.length - 1}
                title="Ctrl+Y"
              >
                <FiRotateCw className="w-4 h-4 inline mr-2" />
                Rehacer
              </button>
              <button 
                className={`px-4 py-2 rounded-lg transition-colors ${
                  userPlan !== 'Free'
                    ? 'bg-blue-600 text-white hover:bg-blue-700' 
                    : 'bg-gray-400 text-gray-200 cursor-not-allowed'
                }`}
                onClick={handleSave}
                disabled={userPlan === 'Free'}
                title={userPlan === 'Free' ? 'Free plan users cannot save' : 'Save template'}
              >
                <FiSave className="w-4 h-4 inline mr-2" />
                Guardar
              </button>
              <button 
                className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
                onClick={handleExport}
              >
                <FiDownload className="w-4 h-4 inline mr-2" />
                Exportar
              </button>
            </div>
          </div>
        </div>

        {/* Tools Row */}
        <div className="bg-white rounded-2xl shadow-lg p-6 mb-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Herramientas</h3>
          
          <div className="grid grid-cols-2 lg:grid-cols-8 gap-4">
            {/* Canvas Size */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Tamaño</label>
              <select
                value={canvasSize}
                onChange={(e) => setCanvasSize(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
              >
                {canvasSizes.map(size => (
                  <option key={size.value} value={size.value}>{size.label}</option>
                ))}
              </select>
            </div>

            {/* Background Color */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Fondo</label>
              <div className="space-y-2">
                <input
                  type="color"
                  value={backgroundColor}
                  onChange={(e) => {
                    setBackgroundColor(e.target.value);
                    setBackgroundImage(null);
                    saveToHistory(objects, e.target.value);
                  }}
                  className="w-full h-10 border border-gray-300 rounded-lg cursor-pointer"
                />
                <button
                  onClick={importBackgroundImage}
                  className="w-full px-2 py-1 text-xs bg-blue-50 text-blue-700 rounded hover:bg-blue-100"
                >
                  Importar Imagen
                </button>
              </div>
            </div>

            {/* Content Color */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Color Contenido</label>
              <input
                type="color"
                value={contentColor}
                onChange={(e) => setContentColor(e.target.value)}
                className="w-full h-10 border border-gray-300 rounded-lg cursor-pointer"
              />
            </div>

            {/* Font Size */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Tamaño Fuente</label>
              <input
                type="range"
                min="12"
                max="120"
                value={fontSize}
                onChange={(e) => setFontSize(Number(e.target.value))}
                className="w-full"
              />
              <span className="text-xs text-gray-500">{fontSize}px</span>
            </div>

            {/* Font Family */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Fuente</label>
              <select
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                onChange={(e) => updateSelectedObject({ fontFamily: e.target.value })}
                value={objects.find(o => o.id === selectedId)?.fontFamily || 'Arial'}
              >
                <option value="Arial">Arial</option>
                <option value="Helvetica">Helvetica</option>
                <option value="Times New Roman">Times New Roman</option>
                <option value="Georgia">Georgia</option>
                <option value="Verdana">Verdana</option>
                <option value="Courier New">Courier New</option>
                <option value="Impact">Impact</option>
                <option value="Comic Sans MS">Comic Sans MS</option>
                <option value="Trebuchet MS">Trebuchet MS</option>
                <option value="Lucida Console">Lucida Console</option>
              </select>
            </div>

            {/* Add Text */}
            <div>
              <button
                onClick={addText}
                className="w-full flex items-center gap-2 px-4 py-3 bg-blue-50 text-blue-700 rounded-lg hover:bg-blue-100 transition-colors text-sm"
              >
                <FiType className="w-4 h-4" />
                Texto
              </button>
            </div>

            {/* Add Image */}
            <div>
              <button
                onClick={addImage}
                className="w-full flex items-center gap-2 px-4 py-3 bg-green-50 text-green-700 rounded-lg hover:bg-green-100 transition-colors text-sm"
              >
                <FiImage className="w-4 h-4" />
                Imagen
              </button>
            </div>

            {/* Add Shape */}
            <div>
              <button
                onClick={addShape}
                className="w-full flex items-center gap-2 px-4 py-3 bg-purple-50 text-purple-700 rounded-lg hover:bg-purple-100 transition-colors text-sm"
              >
                <FiSquare className="w-4 h-4" />
                Forma
              </button>
            </div>

            {/* Add Image Placeholder */}
            <div>
              <button
                onClick={addImagePlaceholder}
                className="w-full flex items-center gap-2 px-4 py-3 bg-gray-50 text-gray-700 rounded-lg hover:bg-gray-100 transition-colors text-sm"
              >
                <FiImage className="w-4 h-4" />
                Placeholder
              </button>
            </div>
          </div>


        </div>

        {/* Canvas */}
        <div className="bg-white rounded-2xl shadow-lg p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Canvas</h3>
          
          <div className="flex justify-center">
            <div
              ref={canvasRef}
              className="relative border-2 border-gray-300 rounded-lg overflow-hidden shadow-lg w-full"
              style={{
                aspectRatio: `${getCurrentCanvasSize().width} / ${getCurrentCanvasSize().height}`,
                backgroundColor: backgroundColor,
                backgroundImage: backgroundImage ? `url(${backgroundImage})` : 'none',
                backgroundSize: 'cover',
                backgroundPosition: 'center'
              }}
              onMouseMove={handleMouseMove}
              onMouseUp={handleMouseUp}
              onClick={handleCanvasClick}
            >
              {objects.map(renderObject)}
              
              {objects.length === 0 && (
                <div className="absolute inset-0 flex items-center justify-center text-gray-400">
                  <div className="text-center">
                    <div className="text-6xl mb-4">{editorInfo.icon}</div>
                    <p className="text-lg font-medium">¡Comienza a crear tu diseño!</p>
                    <p className="text-sm">Usa las herramientas para agregar elementos</p>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
