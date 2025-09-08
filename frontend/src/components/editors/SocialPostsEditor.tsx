'use client';
import { useState, useRef, useEffect, useCallback } from 'react';
import { 
  ArrowsOutCardinal, 
  FloppyDisk, 
  Download, 
  TextT, 
  Image as ImageIcon, 
  Square 
} from 'phosphor-react';
import { useAuth } from '@/context/AuthContext';

interface SocialPostsEditorProps {
  id: string;
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

export default function SocialPostsEditor({ id }: SocialPostsEditorProps) {
  const [canvasSize, setCanvasSize] = useState('1080x1080');
  const [backgroundColor, setBackgroundColor] = useState('#ffffff');
  const [backgroundImage, setBackgroundImage] = useState<string | null>(null);
  const [objects, setObjects] = useState<EditorObject[]>([]);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [contentColor, setContentColor] = useState('#00525b');
  
  // Predefined color palette
  const colorPalette = [
    '#00525b', // Dark teal
    '#01aac7', // Blue
    '#32e0c5', // Light teal
    '#ffffff', // White
    '#3f005f', // Dark purple
    '#230038'  // Very dark purple
  ];
  const [fontSize, setFontSize] = useState(48);
  const { user } = useAuth();
  const userPlan = (user?.plan as 'Free' | 'Premium' | 'Ultra-Premium') || 'Free';
  const [history, setHistory] = useState<HistoryState[]>([]);
  const [historyIndex, setHistoryIndex] = useState(-1);
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  const [resizeStart, setResizeStart] = useState({ x: 0, y: 0, width: 0, height: 0 });
  const [isResizing, setIsResizing] = useState(false);
  const [resizeTarget, setResizeTarget] = useState<string | null>(null);
  const [canvasDisplayScale, setCanvasDisplayScale] = useState(1); // Controls canvas display size (zoom)
  const [showShapeSelector, setShowShapeSelector] = useState(false);
  
  const canvasRef = useRef<HTMLDivElement>(null);
  
  // Available shapes
  const shapeTypes = [
    { id: 'capsule', name: 'Capsule', icon: '◯' },
    { id: 'circle', name: 'Circle', icon: '●' },
    { id: 'square', name: 'Square', icon: '■' },
    { id: 'rounded-square', name: 'Rounded Square', icon: '▢' },
    { id: 'triangle', name: 'Triangle', icon: '▲' },
    { id: 'pentagon', name: 'Pentagon', icon: '⬟' },
    { id: 'hexagon', name: 'Hexagon', icon: '⬡' },
    { id: 'diamond', name: 'Diamond', icon: '◆' },
    { id: 'right-triangle', name: 'Right Triangle', icon: '▶' }
  ];

  const canvasSizes = [
    { value: '1080x1080', label: 'Instagram Post (1080×1080)', width: 1080, height: 1080 },
    { value: '1200x630', label: 'Facebook Post (1200×630)', width: 1200, height: 630 },
    { value: '1200x1200', label: 'Twitter Post (1200×1200)', width: 1200, height: 1200 }
  ];

  const getCurrentCanvasSize = () => {
    const size = canvasSizes.find(s => s.value === canvasSize);
    return size || { width: 1080, height: 1080 };
  };

  // Save current state to history
  const saveToHistory = useCallback((newObjects: EditorObject[], newBackgroundColor: string) => {
    const newHistory = history.slice(0, historyIndex + 1);
    newHistory.push({ objects: newObjects, backgroundColor: newBackgroundColor });
    setHistory(newHistory);
    setHistoryIndex(newHistory.length - 1);
  }, [history, historyIndex]);

  // Undo function
  const undo = useCallback(() => {
    if (historyIndex > 0) {
      const newIndex = historyIndex - 1;
      const state = history[newIndex];
      setObjects(state.objects);
      setBackgroundColor(state.backgroundColor);
      setHistoryIndex(newIndex);
    }
  }, [history, historyIndex]);

  // Redo function
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



  // Close shape selector when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (showShapeSelector && !(event.target as Element).closest('.shape-selector')) {
        setShowShapeSelector(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [showShapeSelector]);

  const addText = () => {
    const newText: EditorObject = {
      id: `text-${Date.now()}`,
      type: 'text',
      content: 'Tu texto aquí',
      x: 100,
      y: 100,
      width: 200,
      height: 100,
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
          console.log('Added new image:', newImage);
          const newObjects = [...objects, newImage];
          setObjects(newObjects);
          saveToHistory(newObjects, backgroundColor);
        };
        reader.readAsDataURL(file);
      }
    };
    input.click();
  };

  const addShape = (shapeType: string = 'square') => {
    const newShape: EditorObject = {
      id: `shape-${Date.now()}`,
      type: 'shape',
      shape: shapeType,
      x: 100,
      y: 100,
      width: 200,
      height: 200,
      color: contentColor
    };
    const newObjects = [...objects, newShape];
    setObjects(newObjects);
    saveToHistory(newObjects, backgroundColor);
    setShowShapeSelector(false);
  };

  const addImagePlaceholder = () => {
    const newPlaceholder: EditorObject = {
      id: `placeholder-${Date.now()}`,
      type: 'placeholder',
      x: 100,
      y: 100,
      width: 200,
      height: 200,
      color: contentColor
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

  const handleMouseDown = (e: React.MouseEvent, obj: EditorObject) => {
    e.stopPropagation();
    // Only change selection if clicking on a different object
    if (selectedId !== obj.id) {
      setSelectedId(obj.id);
    }
    
    // Check if clicking on resize handle
    const target = e.target as HTMLElement;
    if (target.classList.contains('resize-handle')) {
      setResizeStart({
        x: e.clientX,
        y: e.clientY,
        width: obj.width || 200,
        height: obj.height || 200
      });
      setIsResizing(true);
      setResizeTarget(obj.id);
      return; // Don't start dragging when resizing
    }
    
    // Start dragging for all content types
    setDragStart({ x: e.clientX, y: e.clientY });
    setIsDragging(true);
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (isDragging && selectedId) {
      const obj = objects.find(o => o.id === selectedId);
      if (obj) {
        // Pure 1:1 mouse tracking - no cumulative effects
        const deltaX = e.clientX - dragStart.x;
        const deltaY = e.clientY - dragStart.y;
        
        // Move content exactly as much as mouse moved
        const newObjects = objects.map(o => 
          o.id === selectedId 
            ? { ...o, x: o.x + deltaX, y: o.y + deltaY }
            : o
        );
        setObjects(newObjects);
        
        // Reset drag start to current position for next movement
        setDragStart({ x: e.clientX, y: e.clientY });
      } else {
        // Object was deleted, stop dragging
        setIsDragging(false);
        setSelectedId(null);
      }
    } else if (isResizing && resizeTarget) {
      const obj = objects.find(o => o.id === resizeTarget);
      if (obj) {
        // Pure 1:1 mouse tracking for resizing - no cumulative effects
        const deltaX = e.clientX - resizeStart.x;
        const deltaY = e.clientY - resizeStart.y;
        
        // Resize content exactly as much as mouse moved
        const newWidth = Math.max(50, (obj.width || 200) + deltaX);
        const newHeight = Math.max(50, (obj.height || 200) + deltaY);
        
        const newObjects = objects.map(o => 
          o.id === resizeTarget 
            ? { ...o, width: newWidth, height: newHeight }
            : o
        );
        setObjects(newObjects);
        
        // Reset resize start to current position for next movement
        setResizeStart({
          x: e.clientX,
          y: e.clientY,
          width: newWidth,
          height: newHeight
        });
      } else {
        // Object was deleted, stop resizing
        setIsResizing(false);
        setResizeTarget(null);
      }
    }
  };

  const handleMouseUp = () => {
    if (isDragging || isResizing) {
      setIsDragging(false);
      setIsResizing(false);
      setResizeTarget(null);
      
      // Only save history if we still have objects
      if (objects.length > 0) {
        saveToHistory(objects, backgroundColor);
      }
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

  // Apply formatting to selected text characters
  const applyTextFormatting = (property: 'color' | 'fontSize' | 'fontFamily', value: string | number) => {
    if (selectedId) {
      const selectedObj = objects.find(o => o.id === selectedId);
      if (selectedObj && selectedObj.type === 'text') {
        // Check if there's a text selection
        const selection = window.getSelection();
        if (selection && selection.rangeCount > 0) {
          const range = selection.getRangeAt(0);
          const selectedText = range.toString();
          
          if (selectedText.length > 0) {
            // Apply formatting to selected characters
            // For now, we'll apply to the entire text object
            // In a more advanced implementation, you could use document.execCommand or create spans
            updateSelectedObject({ [property]: value });
          } else {
            // No text selected, apply to entire object
            updateSelectedObject({ [property]: value });
          }
        } else {
          // No selection, apply to entire object
          updateSelectedObject({ [property]: value });
        }
      } else {
        // Not a text object, apply to entire object
        updateSelectedObject({ [property]: value });
      }
    }
  };

  const handleSave = () => {
    if (userPlan === 'Free') {
      alert('Free plan users cannot save template designs. Please upgrade to Pro or Enterprise.');
      return;
    }
    
    // Mock save functionality
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
    
    alert('Template saved successfully!\n📁 Datos guardados en un solo archivo');
  };

  const handleExport = () => {
    // Mock export functionality - in real implementation, use html2canvas or similar
    alert('Export functionality would generate PNG/PDF here. File name and location would be set in Save dialog.');
  };

  const renderObject = (obj: EditorObject) => {
    const isSelected = selectedId === obj.id;
    const baseClasses = `absolute cursor-move transition-all duration-200 ${isSelected ? 'ring-2 ring-blue-500 ring-offset-2 ring-offset-white shadow-lg' : 'hover:ring-1 hover:ring-gray-300'}`;
    
    switch (obj.type) {
      case 'text':
        return (
          <div
            key={obj.id}
            className={`absolute cursor-move ${isSelected ? 'ring-2 ring-blue-500 ring-offset-2 ring-offset-white shadow-lg bg-blue-50 bg-opacity-30 rounded-sm' : 'hover:ring-1 hover:ring-gray-300'}`}
            data-text-id={obj.id}
            style={{
              left: obj.x,
              top: obj.y,
              width: `${obj.width || 200}px`,
              height: `${obj.height || 100}px`,
              fontSize: obj.fontSize,
              color: obj.color,
              fontFamily: obj.fontFamily,
              minWidth: '100px',
              minHeight: '40px',
              direction: 'ltr',
              textAlign: 'center',
              writingMode: 'horizontal-tb',
              maxWidth: 'none',
              maxHeight: 'none',
              overflow: 'visible',
              whiteSpace: 'pre-wrap',
              wordWrap: 'break-word',
              padding: '12px 16px',
              margin: '8px'
            }}
                        onMouseDown={(e) => {
              // Prevent moving/resizing when text is being edited
              if (document.activeElement === e.currentTarget.querySelector('textarea')) {
                return; // Don't allow moving/resizing while editing
              }
              handleMouseDown(e, obj);
            }}
          >
            {isSelected ? (
              <textarea
                value={obj.content}
                onChange={(e) => {
                  updateSelectedObject({ content: e.target.value });
                }}
                onFocus={() => {
                  setSelectedId(obj.id);
                }}
                onBlur={() => {
                  // Keep selection but content is already updated
                }}
                className="w-full h-full bg-transparent border-none outline-none text-center resize-none"
                style={{
                  fontSize: obj.fontSize,
                  color: obj.color,
                  fontFamily: obj.fontFamily,
                  direction: 'ltr',
                  textAlign: 'center',
                  backgroundColor: 'transparent',
                  padding: '0',
                  margin: '0',
                  border: 'none',
                  outline: 'none',
                  resize: 'none',
                  overflow: 'hidden'
                }}
                rows={1}
                autoFocus
              />
            ) : (
              <div
                className="w-full h-full flex items-center justify-center"
                style={{
              fontSize: obj.fontSize,
              color: obj.color,
                  fontFamily: obj.fontFamily,
                  direction: 'ltr',
                  textAlign: 'center'
            }}
          >
            {obj.content}
              </div>
            )}
            {isSelected && (
              <>
                {/* Selection handles */}
                <div className="absolute -top-1 -left-1 w-3 h-3 bg-blue-500 rounded-full border-2 border-white shadow-sm" />
                <div className="absolute -top-1 -right-1 w-3 h-3 bg-blue-500 rounded-full border-2 border-white shadow-sm" />
                <div className="absolute -bottom-1 -left-1 w-3 h-3 bg-blue-500 rounded-full border-2 border-white shadow-sm" />
                <div className="absolute -bottom-1 -right-1 w-3 h-3 bg-blue-500 rounded-full border-2 border-white shadow-sm" />
                
                {/* Resize handle */}
                <div 
                  className="absolute -bottom-1 -right-1 w-4 h-4 bg-blue-500 rounded-full cursor-se-resize border-2 border-white shadow-sm resize-handle z-20" 
                  onMouseDown={(e) => {
                    e.stopPropagation();
                    const canvasRect = canvasRef.current?.getBoundingClientRect();
                    if (canvasRect) {
                      setResizeStart({
                        x: e.clientX,
                        y: e.clientY,
                        width: obj.width || 200,
                        height: obj.height || 100
                      });
                      setIsResizing(true);
                      setResizeTarget(obj.id);
                    }
                  }}
                />
                
                {/* Delete button - no text inside */}
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    const newObjects = objects.filter(o => o.id !== obj.id);
                    setObjects(newObjects);
                    
                    // Clear selection if the deleted object was selected
                    if (selectedId === obj.id) {
                      setSelectedId(null);
                    }
                    
                    // Stop any ongoing operations on the deleted object
                    if (resizeTarget === obj.id) {
                      setIsResizing(false);
                      setResizeTarget(null);
                    }
                    if (isDragging && selectedId === obj.id) {
                      setIsDragging(false);
                    }
                    
                    saveToHistory(newObjects, backgroundColor);
                  }}
                  className="delete-button w-6 h-6 bg-red-500 hover:bg-red-600 text-white rounded-full flex items-center justify-center transition-colors shadow-lg text-sm font-bold"
                  title="Delete element"
                >
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
              width: `${obj.width || 200}px`,
              height: `${obj.height || 200}px`,
              position: 'absolute'
            }}
            onMouseDown={(e) => handleMouseDown(e, obj)}
          >
            <img
            src={obj.src}
            alt=""
              className={baseClasses}
              style={{
                width: '100%',
                height: '100%'
              }}
              draggable={false}
            />
            {isSelected && (
              <>
                {/* Selection handles */}
                <div className="absolute -top-1 -left-1 w-3 h-3 bg-blue-500 rounded-full border-2 border-white shadow-sm" />
                <div className="absolute -top-1 -right-1 w-3 h-3 bg-blue-500 rounded-full border-2 border-white shadow-sm" />
                <div className="absolute -bottom-1 -left-1 w-3 h-3 bg-blue-500 rounded-full border-2 border-white shadow-sm" />
                <div className="absolute -bottom-1 -right-1 w-3 h-3 bg-blue-500 rounded-full border-2 border-white shadow-sm" />
                
                {/* Resize handle */}
                <div 
                  className="absolute -bottom-1 -right-1 w-4 h-4 bg-blue-500 rounded-full cursor-se-resize border-2 border-white shadow-sm resize-handle z-20" 
                  onMouseDown={(e) => {
                    e.stopPropagation();
                    const canvasRect = canvasRef.current?.getBoundingClientRect();
                    if (canvasRect) {
                      setResizeStart({
                        x: e.clientX,
                        y: e.clientY,
                        width: obj.width || 200,
                        height: obj.height || 200
                      });
                      setIsResizing(true);
                      setResizeTarget(obj.id);
                    }
                  }}
                />
                
                {/* Delete button */}
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    const newObjects = objects.filter(o => o.id !== obj.id);
                    setObjects(newObjects);
                    // Don't clear selectedId - maintain selection
                    saveToHistory(newObjects, backgroundColor);
                  }}
                  className="delete-button w-6 h-6 bg-red-500 hover:bg-red-600 text-white rounded-full flex items-center justify-center transition-colors shadow-lg text-sm font-bold"
                  title="Delete element"
                >
                  ×
                </button>
              </>
            )}
          </div>
        );
      case 'shape':
        const getShapeStyle = (shape: string) => {
          switch (shape) {
            case 'capsule':
              return { borderRadius: '50px' };
            case 'circle':
              return { borderRadius: '50%' };
            case 'rounded-square':
              return { borderRadius: '12px' };
            case 'triangle':
              return { 
                clipPath: 'polygon(50% 0%, 0% 100%, 100% 100%)',
                backgroundColor: 'transparent'
              };
            case 'pentagon':
              return { 
                clipPath: 'polygon(50% 0%, 100% 38%, 82% 100%, 18% 100%, 0% 38%)',
                backgroundColor: 'transparent'
              };
            case 'hexagon':
              return { 
                clipPath: 'polygon(25% 0%, 75% 0%, 100% 50%, 75% 100%, 25% 100%, 0% 50%)',
                backgroundColor: 'transparent'
              };
            case 'diamond':
              return { 
                clipPath: 'polygon(50% 0%, 100% 50%, 50% 100%, 0% 50%)',
                backgroundColor: 'transparent'
              };
            case 'right-triangle':
              return { 
                clipPath: 'polygon(0% 0%, 100% 0%, 0% 100%)',
                backgroundColor: 'transparent'
              };
            default:
              return {};
          }
        };

        return (
          <div
            key={obj.id}
            className={`absolute cursor-move ${isSelected ? 'ring-2 ring-blue-500 ring-offset-2 ring-offset-white shadow-lg' : 'hover:ring-1 hover:ring-gray-300'}`}
            style={{
              left: obj.x,
              top: obj.y,
              width: `${obj.width || 200}px`,
              height: `${obj.height || 200}px`,
              backgroundColor: obj.color,
              minWidth: '50px',
              minHeight: '50px',
              ...getShapeStyle(obj.shape || 'square')
            }}
            onMouseDown={(e) => handleMouseDown(e, obj)}
          >
            {isSelected && (
              <>
                {/* Selection handles */}
                <div className="absolute -top-1 -left-1 w-3 h-3 bg-blue-500 rounded-full border-2 border-white shadow-sm" />
                <div className="absolute -top-1 -right-1 w-3 h-3 bg-blue-500 rounded-full border-2 border-white shadow-sm" />
                <div className="absolute -bottom-1 -left-1 w-3 h-3 bg-blue-500 rounded-full border-2 border-white shadow-sm" />
                <div className="absolute -bottom-1 -right-1 w-3 h-3 bg-blue-500 rounded-full border-2 border-white shadow-sm" />
                
                {/* Resize handle */}
                <div 
                  className="absolute -bottom-1 -right-1 w-4 h-4 bg-blue-500 rounded-full cursor-se-resize border-2 border-white shadow-sm resize-handle z-20" 
                  onMouseDown={(e) => {
                    e.stopPropagation();
                    const canvasRect = canvasRef.current?.getBoundingClientRect();
                    if (canvasRect) {
                      setResizeStart({
                        x: e.clientX,
                        y: e.clientY,
                        width: obj.width || 200,
                        height: obj.height || 100
                      });
                      setIsResizing(true);
                      setResizeTarget(obj.id);
                    }
                  }}
                />
                
                {/* Delete button */}
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    const newObjects = objects.filter(o => o.id !== obj.id);
                    setObjects(newObjects);
                    
                    // Clear selection if the deleted object was selected
                    if (selectedId === obj.id) {
                      setSelectedId(null);
                    }
                    
                    // Stop any ongoing operations on the deleted object
                    if (resizeTarget === obj.id) {
                      setIsResizing(false);
                      setResizeTarget(null);
                    }
                    if (isDragging && selectedId === obj.id) {
                      setIsDragging(false);
                    }
                    
                    saveToHistory(newObjects, backgroundColor);
                  }}
                  className="delete-button w-6 h-6 bg-red-500 hover:bg-red-600 text-white rounded-full flex items-center justify-center transition-colors shadow-lg text-sm font-bold"
                  title="Delete element"
                >
                  ×
                </button>
              </>
            )}
          </div>
        );
      case 'placeholder':
        return (
          <div
            key={obj.id}
            className={`absolute cursor-move border-2 border-dashed border-gray-400 flex items-center justify-center ${isSelected ? 'ring-2 ring-blue-500 ring-offset-2 ring-offset-white shadow-lg' : 'hover:ring-1 hover:ring-gray-300'}`}
            style={{
              left: obj.x,
              top: obj.y,
              width: `${obj.width || 200}px`,
              height: `${obj.height || 200}px`,
              backgroundColor: obj.color,
              minWidth: '50px',
              minHeight: '50px'
            }}
            onMouseDown={(e) => handleMouseDown(e, obj)}
          >
            <span className="text-gray-500 text-sm">Image Placeholder</span>
            {isSelected && (
              <>
                {/* Selection handles */}
                <div className="absolute -top-1 -left-1 w-3 h-3 bg-blue-500 rounded-full border-2 border-white shadow-sm" />
                <div className="absolute -top-1 -right-1 w-3 h-3 bg-blue-500 rounded-full border-2 border-white shadow-sm" />
                <div className="absolute -bottom-1 -left-1 w-3 h-3 bg-blue-500 rounded-full border-2 border-white shadow-sm" />
                <div className="absolute -bottom-1 -right-1 w-3 h-3 bg-blue-500 rounded-full border-2 border-white shadow-sm" />
                
                {/* Resize handle */}
                <div 
                  className="absolute -bottom-1 -right-1 w-4 h-4 bg-blue-500 rounded-full cursor-se-resize border-2 border-white shadow-sm resize-handle z-20" 
                  onMouseDown={(e) => {
                    e.stopPropagation();
                    const canvasRect = canvasRef.current?.getBoundingClientRect();
                    if (canvasRect) {
                      setResizeStart({
                        x: e.clientX,
                        y: e.clientY,
                        width: obj.width || 200,
                        height: obj.height || 200
                      });
                      setIsResizing(true);
                      setResizeTarget(obj.id);
                    }
                  }}
                />
                
                {/* Delete button */}
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    const newObjects = objects.filter(o => o.id !== obj.id);
                    setObjects(newObjects);
                    
                    // Clear selection if the deleted object was selected
                    if (selectedId === obj.id) {
                      setSelectedId(null);
                    }
                    
                    // Stop any ongoing operations on the deleted object
                    if (resizeTarget === obj.id) {
                      setIsResizing(false);
                      setResizeTarget(null);
                    }
                    if (isDragging && selectedId === obj.id) {
                      setIsDragging(false);
                    }
                    
                    saveToHistory(newObjects, backgroundColor);
                  }}
                  className="delete-button w-6 h-6 bg-red-500 hover:bg-red-600 text-white rounded-full flex items-center justify-center transition-colors shadow-lg text-sm font-bold"
                  title="Delete element"
                >
                  ×
                </button>
              </>
            )}
          </div>
        );
      default:
        return null;
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="bg-white rounded-2xl shadow-lg p-6 mb-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Editor de Posts para Redes Sociales</h1>
              <p className="text-sm text-gray-500">
                Plan: {!user ? (
                  <span className="inline-flex items-center gap-1">
                    <div className="w-3 h-3 border-2 border-gray-300 border-t-blue-500 rounded-full animate-spin"></div>
                    Cargando...
                  </span>
                ) : (
                  <span className={`font-medium ${
                    userPlan === 'Premium' ? 'text-blue-600' : 
                    userPlan === 'Ultra-Premium' ? 'text-purple-600' : 
                    'text-gray-600'
                  }`}>
                    {userPlan}
                  </span>
                )}
              </p>
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
                <ArrowsOutCardinal size={4} className="w-4 h-4 inline mr-2" />
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
                <ArrowsOutCardinal size={4} className="w-4 h-4 inline mr-2" />
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
                <FloppyDisk size={4} className="w-4 h-4 inline mr-2" />
                Guardar
              </button>
              <button 
                className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
                onClick={handleExport}
              >
                <Download size={4} className="w-4 h-4 inline mr-2" />
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

            {/* Canvas Display Size (Zoom) */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Zoom</label>
              <input
                type="range"
                min="0.25"
                max="1"
                step="0.05"
                value={canvasDisplayScale}
                onChange={(e) => setCanvasDisplayScale(Number(e.target.value))}
                className="w-full"
              />
              <span className="text-xs text-gray-500">{Math.round(canvasDisplayScale * 100)}%</span>
            </div>

            {/* Background Color */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Fondo</label>
              <div className="space-y-2">
                <div className="grid grid-cols-3 gap-2">
                  {colorPalette.map((color) => (
                    <button
                      key={color}
                      onClick={() => {
                        setBackgroundColor(color);
                        setBackgroundImage(null);
                        saveToHistory(objects, color);
                      }}
                      className={`w-full h-10 rounded-lg border-2 transition-all ${
                        backgroundColor === color 
                          ? 'border-blue-500 scale-105 shadow-lg' 
                          : 'border-gray-300 hover:border-gray-400 hover:scale-102'
                      }`}
                      style={{ backgroundColor: color }}
                      title={color}
                    />
                  ))}
                </div>
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
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Color Contenido {!selectedId && <span className="text-gray-400 text-xs">(Selecciona contenido)</span>}
              </label>
              <div className={`grid grid-cols-3 gap-2 ${
                !selectedId ? 'opacity-50 pointer-events-none' : ''
              }`}>
                {colorPalette.map((color) => {
                  const isSelected = selectedId ? (objects.find(o => o.id === selectedId)?.color || contentColor) === color : contentColor === color;
                  return (
                    <button
                      key={color}
                      onClick={() => {
                        const newColor = color;
                        setContentColor(newColor);
                        if (selectedId) {
                          applyTextFormatting('color', newColor);
                        }
                      }}
                      className={`w-full h-10 rounded-lg border-2 transition-all ${
                        isSelected 
                          ? 'border-blue-500 scale-105 shadow-lg' 
                          : 'border-gray-400 hover:scale-102'
                      }`}
                      style={{ backgroundColor: color }}
                      title={color}
                      disabled={!selectedId}
                    />
                  );
                })}
              </div>
            </div>

            {/* Font Size */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Tamaño Fuente {!selectedId && <span className="text-xs text-gray-400">(Selecciona contenido)</span>}
              </label>
              <input
                type="range"
                min="12"
                max="120"
                value={selectedId ? (objects.find(o => o.id === selectedId)?.fontSize || fontSize) : fontSize}
                onChange={(e) => {
                  const newSize = Number(e.target.value);
                  setFontSize(newSize);
                  if (selectedId) {
                    applyTextFormatting('fontSize', newSize);
                  }
                }}
                className={`w-full ${
                  selectedId 
                    ? 'cursor-pointer' 
                    : 'cursor-not-allowed opacity-50'
                }`}
                disabled={!selectedId}
              />
              <span className="text-xs text-gray-500">
                {selectedId ? (objects.find(o => o.id === selectedId)?.fontSize || fontSize) : fontSize}px
              </span>
            </div>

            {/* Font Family */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Fuente {!selectedId && <span className="text-xs text-gray-400">(Selecciona contenido)</span>}
              </label>
              <select
                className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm ${
                  selectedId 
                    ? 'border-gray-300 cursor-pointer' 
                    : 'border-gray-200 cursor-not-allowed opacity-50'
                }`}
                onChange={(e) => applyTextFormatting('fontFamily', e.target.value)}
                value={objects.find(o => o.id === selectedId)?.fontFamily || 'Arial'}
                disabled={!selectedId}
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
                <TextT size={4} className="w-4 h-4" />
                Texto
              </button>
            </div>

            {/* Add Image */}
            <div>
              <button
                onClick={addImage}
                className="w-full flex items-center gap-2 px-4 py-3 bg-green-50 text-green-700 rounded-lg hover:bg-green-100 transition-colors text-sm"
              >
                <ImageIcon size={4} className="w-4 h-4" />
                Imagen
              </button>
            </div>

            {/* Add Shape */}
            <div className="relative">
              <button
                onClick={() => setShowShapeSelector(!showShapeSelector)}
                className="w-full flex items-center gap-2 px-4 py-3 bg-purple-50 text-purple-700 rounded-lg hover:bg-purple-100 transition-colors text-sm"
              >
                <Square size={4} className="w-4 h-4" />
                Forma
              </button>
              
              {/* Shape Selector Dropdown */}
              {showShapeSelector && (
                <div className="absolute top-full left-0 mt-1 w-48 bg-white border border-gray-200 rounded-lg shadow-lg z-50 shape-selector">
                  <div className="p-2">
                    <div className="grid grid-cols-3 gap-2">
                      {shapeTypes.map((shape) => (
                        <button
                          key={shape.id}
                          onClick={() => addShape(shape.id)}
                          className="flex flex-col items-center gap-1 p-2 rounded-lg hover:bg-gray-50 transition-colors"
                          title={shape.name}
                        >
                          <div 
                            className="w-8 h-8 bg-purple-500 rounded flex items-center justify-center text-white text-lg"
                            style={{
                              ...(shape.id === 'capsule' && { borderRadius: '20px' }),
                              ...(shape.id === 'circle' && { borderRadius: '50%' }),
                              ...(shape.id === 'rounded-square' && { borderRadius: '6px' }),
                              ...(shape.id === 'triangle' && { 
                                clipPath: 'polygon(50% 0%, 0% 100%, 100% 100%)',
                                backgroundColor: 'transparent'
                              }),
                              ...(shape.id === 'pentagon' && { 
                                clipPath: 'polygon(50% 0%, 100% 38%, 82% 100%, 18% 100%, 0% 38%)',
                                backgroundColor: 'transparent'
                              }),
                              ...(shape.id === 'hexagon' && { 
                                clipPath: 'polygon(25% 0%, 75% 0%, 100% 50%, 75% 100%, 25% 100%, 0% 50%)',
                                backgroundColor: 'transparent'
                              }),
                              ...(shape.id === 'diamond' && { 
                                clipPath: 'polygon(50% 0%, 100% 50%, 50% 100%, 0% 50%)',
                                backgroundColor: 'transparent'
                              }),
                              ...(shape.id === 'right-triangle' && { 
                                clipPath: 'polygon(0% 0%, 100% 0%, 0% 100%)',
                                backgroundColor: 'transparent'
                              })
                            }}
                          />
                          <span className="text-xs text-gray-600">{shape.name}</span>
              </button>
                      ))}
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Add Image Placeholder */}
            <div>
              <button
                onClick={addImagePlaceholder}
                className="w-full flex items-center gap-2 px-4 py-3 bg-gray-50 text-gray-700 rounded-lg hover:bg-gray-100 transition-colors text-sm"
              >
                <ImageIcon size={4} className="w-4 h-4" />
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
              className="relative"
                style={{
                transform: `scale(${canvasDisplayScale})`,
                transformOrigin: 'center center',
                width: `${100 / canvasDisplayScale}%`,
                height: `${100 / canvasDisplayScale}%`
              }}
            >
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
                      <div className="text-6xl mb-4">📱</div>
                      <p className="text-sm font-medium">¡Comienza a crear tu post!</p>
                      <p className="text-xs">Usa las herramientas para agregar elementos</p>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
