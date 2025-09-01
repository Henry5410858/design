'use client';
import React, { useState, useRef, useEffect, useCallback } from 'react';
import { FiImage, FiType, FiSquare, FiDownload, FiSave, FiRotateCcw, FiRotateCw, FiTrash2, FiCopy, FiLayers, FiMove, FiZoomIn, FiZoomOut, FiFileText, FiMinus, FiPlus, FiEdit3 } from 'react-icons/fi';
import { useUser } from '@/context/UserContext';
import * as fabric from 'fabric';
import { jsPDF } from 'jspdf';

interface UnifiedEditorProps {
  id: string;
  editorType?: 'flyer' | 'social' | 'story' | 'badge' | 'banner' | 'document' | 'brochure';
  templateKey?: string; // For loading specific templates
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
  rotation?: number;
  zIndex?: number;
}

interface HistoryState {
  objects: EditorObject[];
  backgroundColor: string;
  backgroundImage?: string | null;
}

interface CanvasSize {
  value: string;
  label: string;
  width: number;
  height: number;
}

interface BrandKit {
  logo?: string;
  colors?: {
    primary?: string;
    secondary?: string;
    accent?: string;
  };
}

export default function UnifiedEditor({ id, editorType = 'flyer', templateKey }: UnifiedEditorProps) {
  // Editor state
  const [editorTypeState, setEditorTypeState] = useState(editorType);
  const [canvasSize, setCanvasSize] = useState('1200x1800');
  const [backgroundColor, setBackgroundColor] = useState('#ffffff');
  const [backgroundImage, setBackgroundImage] = useState<string | null>(null);
  const [objects, setObjects] = useState<EditorObject[]>([]);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [editingTextId, setEditingTextId] = useState<string | null>(null);
  const [isCanvasTextEditing, setIsCanvasTextEditing] = useState<boolean>(false);
  
  // UI state
  const [showShapeSelector, setShowShapeSelector] = useState(false);
  const [showColorPicker, setShowColorPicker] = useState(false);
  const [showFontSelector, setShowFontSelector] = useState(false);
  const [canvasDisplayScale, setCanvasDisplayScale] = useState(1);
  const [activeTab, setActiveTab] = useState('elements');
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  
  // History and undo/redo
  const [history, setHistory] = useState<HistoryState[]>([]);
  const [historyIndex, setHistoryIndex] = useState(-1);
  
  // Drag and resize state
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  const [isResizing, setIsResizing] = useState(false);
  const [resizeStart, setResizeStart] = useState({ x: 0, y: 0, width: 0, height: 0 });
  const [resizeTarget, setResizeTarget] = useState<string | null>(null);
  
  // Fabric.js canvas
  const [canvas, setCanvas] = useState<fabric.Canvas | null>(null);
  const [selectedObject, setSelectedObject] = useState<fabric.Object | null>(null);
  
  // Brand kit
  const [brandKit, setBrandKit] = useState<BrandKit>({
    logo: undefined,
    colors: {
      primary: '#00525b',
      secondary: '#01aac7',
      accent: '#32e0c5'
    }
  });
  
  // Refs
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  // User context
  const { user } = useUser();
  const userPlan = (user?.plan as 'Free' | 'Premium' | 'Ultra-Premium') || 'Free';

  // Editor type configurations
  const editorConfigs = {
    flyer: {
      icon: '📢',
      name: 'Flyer',
      defaultSize: '1200x1800',
      sizes: [
        { value: '1200x1800', label: 'Flyer A4 (1200×1800)', width: 1200, height: 1800 },
        { value: '1200x1600', label: 'Flyer Cuadrado (1200×1600)', width: 1200, height: 1600 },
        { value: '800x1200', label: 'Flyer Pequeño (800×1200)', width: 800, height: 1200 }
      ]
    },
    social: {
      icon: '📱',
      name: 'Social Media Post',
      defaultSize: '1080x1080',
      sizes: [
        { value: '1080x1080', label: 'Instagram Post (1080×1080)', width: 1080, height: 1080 },
        { value: '1200x630', label: 'Facebook Post (1200×630)', width: 1200, height: 630 },
        { value: '1200x1200', label: 'Twitter Post (1200×1200)', width: 1200, height: 1200 }
      ]
    },
    story: {
      icon: '📖',
      name: 'Story',
      defaultSize: '1080x1920',
      sizes: [
        { value: '1080x1920', label: 'Instagram Story (1080×1920)', width: 1080, height: 1920 },
        { value: '1080x1350', label: 'Facebook Story (1080×1350)', width: 1080, height: 1350 },
        { value: '1080x1920', label: 'WhatsApp Story (1080×1920)', width: 1080, height: 1920 }
      ]
    },
    badge: {
      icon: '🏷️',
      name: 'Badge',
      defaultSize: '600x600',
      sizes: [
        { value: '600x600', label: 'Badge Cuadrado (600×600)', width: 600, height: 600 },
        { value: '800x800', label: 'Badge Grande (800×800)', width: 800, height: 800 },
        { value: '400x400', label: 'Badge Pequeño (400×400)', width: 400, height: 400 }
      ]
    },
    banner: {
      icon: '🚩',
      name: 'Banner',
      defaultSize: '1200x400',
      sizes: [
        { value: '1200x400', label: 'Facebook Feed (1200×400)', width: 1200, height: 400 },
        { value: '1200x300', label: 'Web Banner (1200×300)', width: 1200, height: 300 },
        { value: '1200x600', label: 'Banner Alto (1200×600)', width: 1200, height: 600 }
      ]
    },
    document: {
      icon: '📄',
      name: 'Document',
      defaultSize: '1200x1600',
      sizes: [
        { value: '1200x1600', label: 'Documento A4 (1200×1600)', width: 1200, height: 1600 },
        { value: '1200x1800', label: 'Brochure (1200×1800)', width: 1200, height: 1800 },
        { value: '800x1200', label: 'Documento Pequeño (800×1200)', width: 800, height: 1200 }
      ]
    },
    brochure: {
      icon: '📋',
      name: 'Brochure',
      defaultSize: '1200x1800',
      sizes: [
        { value: '1200x1800', label: 'Trifold Brochure (1200×1800)', width: 1200, height: 1800 },
        { value: '1200x1600', label: 'Brochure Cuadrado (1200×1600)', width: 1200, height: 1600 },
        { value: '800x1200', label: 'Brochure Pequeño (800×1200)', width: 800, height: 1200 }
      ]
    }
  };
  
  // Templates will be loaded from database - no hard-coded data
  const [templates, setTemplates] = useState<any[]>([]);
  const [realEstateTemplates, setRealEstateTemplates] = useState<any[]>([]);
  const [defaultTemplates, setDefaultTemplates] = useState<any[]>([]);

  // Color palettes
  const colorPalettes = {
    brand: [
      '#00525b', // Dark teal
      '#01aac7', // Blue
      '#32e0c5', // Light teal
      '#ffffff', // White
      '#3f005f', // Dark purple
      '#230038'  // Very dark purple
    ],
    social: [
      '#ff6b6b', // Red
      '#4ecdc4', // Teal
      '#45b7d1', // Blue
      '#96ceb4', // Green
      '#feca57', // Yellow
      '#ff9ff3'  // Pink
    ],
    business: [
      '#2c3e50', // Dark blue
      '#34495e', // Blue gray
      '#7f8c8d', // Gray
      '#95a5a6', // Light gray
      '#ecf0f1', // Very light gray
      '#ffffff'  // White
    ],
    realEstate: [
      '#1e3a8a', // Dark blue
      '#0f766e', // Dark teal
      '#7c2d12', // Dark brown
      '#dc2626', // Red
      '#f59e0b', // Amber
      '#10b981', // Emerald
      '#8b5cf6', // Violet
      '#f97316'  // Orange
    ],
    luxury: [
      '#FFD700', // Gold
      '#C0C0C0', // Silver
      '#CD7F32', // Bronze
      '#000000', // Black
      '#FFFFFF', // White
      '#8B4513', // Saddle brown
      '#2F4F4F', // Dark slate gray
      '#696969'  // Dim gray
    ],
    modern: [
      '#f8fafc', // Slate 50
      '#e2e8f0', // Slate 200
      '#64748b', // Slate 500
      '#334155', // Slate 700
      '#1e293b', // Slate 800
      '#0f172a', // Slate 900
      '#3b82f6', // Blue 500
      '#ef4444'  // Red 500
    ]
  };

  // Font families
  const fontFamilies = [
    'Arial',
    'Helvetica',
    'Times New Roman',
    'Georgia',
    'Verdana',
    'Tahoma',
    'Trebuchet MS',
    'Impact',
    'Comic Sans MS',
    'Courier New',
    'Roboto',
    'Open Sans',
    'Lato',
    'Montserrat',
    'Poppins',
    'Inter',
    'Source Sans Pro',
    'Ubuntu',
    'Noto Sans',
    'Playfair Display',
    'Merriweather',
    'PT Serif',
    'Crimson Text'
  ];

  // Shape types
  const shapeTypes = [
    { id: 'rectangle', name: 'Rectangle', icon: '■' },
    { id: 'circle', name: 'Circle', icon: '●' },
    { id: 'triangle', name: 'Triangle', icon: '▲' },
    { id: 'rounded-rectangle', name: 'Rounded Rectangle', icon: '▢' },
    { id: 'diamond', name: 'Diamond', icon: '◆' },
    { id: 'star', name: 'Star', icon: '★' },
    { id: 'hexagon', name: 'Hexagon', icon: '⬡' },
    { id: 'pentagon', name: 'Pentagon', icon: '⬟' },
    { id: 'line', name: 'Line', icon: '➖' }
  ];

  // Initialize editor type and canvas size
  useEffect(() => {
    const config = editorConfigs[editorTypeState];
    setCanvasSize(config.defaultSize);
    setBackgroundColor('#ffffff');
    setBackgroundImage(null);
    setObjects([]);
    setHistory([]);
    setHistoryIndex(-1);
  }, [editorTypeState]);
  
  // Auto-load template when templateKey is provided (from template gallery)
  useEffect(() => {
    if (templateKey && canvas) {
      console.log('🎯 Template key provided, loading from database...');
      
      // Load template directly from database
      loadTemplate(templateKey).catch(error => {
        console.error('❌ Error loading template from database:', error);
        // If database fails, try to load from hard-coded fallback
        if (realEstateTemplates[templateKey as keyof typeof realEstateTemplates]) {
          console.log('🔄 Falling back to hard-coded template:', templateKey);
          const fallbackTemplate = realEstateTemplates[templateKey as keyof typeof realEstateTemplates];
          loadTemplateFromData(templateKey, fallbackTemplate);
        }
      });
    }
  }, [templateKey, canvas]);

  // Auto-load saved design when canvas is ready (default template)
  useEffect(() => {
    console.log('🔄 Auto-load effect triggered');
    console.log('🎨 Canvas exists:', !!canvas);
    console.log('📝 Template key:', templateKey);
    
    if (canvas) {
      console.log('✅ Canvas ready, checking for templates to load...');
      
      // Check if this is a page refresh (no templateKey)
      const isPageRefresh = !templateKey;
      console.log('🔍 Is page refresh:', isPageRefresh);
      
      if (isPageRefresh) {
        console.log('🔄 Page refresh detected, checking for default template in database...');
        
        // Try to load default template from database
        const loadDefaultFromDatabase = async () => {
          try {
            const response = await fetch('http://localhost:4000/api/templates?isDefault=true');
            if (response.ok) {
              const defaultTemplates = await response.json();
              if (defaultTemplates.length > 0) {
                const defaultTemplate = defaultTemplates[0];
                console.log('✅ Found default template in database:', defaultTemplate.name);
                setEditorTypeState(defaultTemplate.type);
                loadTemplateFromData(defaultTemplate.templateKey || 'default', defaultTemplate);
                return;
              }
            }
          } catch (error) {
            console.warn('⚠️ Could not fetch default template from database:', error);
          }
          
          // If no default template in database, set default editor type
          console.log('🔄 No default template found in database, setting default editor type');
          setEditorTypeState('flyer');
        };
        
        loadDefaultFromDatabase();
      } else {
        console.log('✅ Template key provided, specific template will be loaded');
      }
    } else {
      console.log('❌ Canvas not ready yet');
    }
  }, [canvas, templateKey]);
  
  // Initialize Fabric.js canvas
  useEffect(() => {
    if (canvasRef.current && !canvas) {
      const fabricCanvas = new fabric.Canvas(canvasRef.current, {
        width: getCurrentCanvasSize().width,
        height: getCurrentCanvasSize().height,
        backgroundColor: backgroundColor,
        selection: true,
        preserveObjectStacking: true
      });
      
      // Set up canvas events
      fabricCanvas.on('selection:created', (e) => {
        setSelectedObject(e.selected?.[0] || null);
      });
      
      fabricCanvas.on('selection:updated', (e) => {
        const newSelectedObject = e.selected?.[0] || null;
        setSelectedObject(newSelectedObject);
        
        // Auto-switch tabs based on object type
        if (newSelectedObject) {
          if (newSelectedObject.type === 'text' || newSelectedObject.type === 'i-text') {
            setActiveTab('text');
          } else if (['rect', 'circle', 'triangle', 'polygon', 'path'].includes(newSelectedObject.type)) {
            setActiveTab('format');
          }
        } else {
          // No object selected, go back to elements tab
          setActiveTab('elements');
        }
      });
      
      fabricCanvas.on('selection:cleared', () => {
        setSelectedObject(null);
        // No object selected, go back to elements tab
        setActiveTab('elements');
      });
      
      fabricCanvas.on('object:modified', () => {
        saveCanvasToHistory();
      });
      
      // Prevent text from being completely erased
      fabricCanvas.on('text:changed', (e) => {
        const textObject = e.target as fabric.IText;
        if (textObject && textObject.text !== undefined) {
          // Only prevent completely empty text
          if (textObject.text === '') {
            textObject.set('text', ' ');
            fabricCanvas.renderAll();
          }
        }
      });
      
      // Track when text editing is active on canvas
      fabricCanvas.on('text:editing:entered', (e) => {
        console.log('🔒 Text editing entered on canvas');
        setIsCanvasTextEditing(true);
      });
      
      fabricCanvas.on('text:editing:exited', (e) => {
        console.log('🔓 Text editing exited from canvas');
        setIsCanvasTextEditing(false);
      });
      
      // Add boundary constraints to keep objects within canvas
      fabricCanvas.on('object:moving', (e) => {
        const obj = e.target;
        if (obj) {
          const canvasWidth = fabricCanvas.getWidth();
          const canvasHeight = fabricCanvas.getHeight();
          
          // Keep object within canvas boundaries
          if (obj.left! < 0) obj.left = 0;
          if (obj.top! < 0) obj.top = 0;
          if (obj.left! + obj.width! * obj.scaleX! > canvasWidth) {
            obj.left = canvasWidth - obj.width! * obj.scaleX!;
          }
          if (obj.top! + obj.height! * obj.scaleY! > canvasHeight) {
            obj.top = canvasHeight - obj.height! * obj.scaleY!;
          }
        }
      });
      
      fabricCanvas.on('object:scaling', (e) => {
        const obj = e.target;
        if (obj) {
          const canvasWidth = fabricCanvas.getWidth();
          const canvasHeight = fabricCanvas.getHeight();
          
          // Prevent scaling beyond canvas boundaries
          const maxScaleX = canvasWidth / (obj.width! || 1);
          const maxScaleY = canvasHeight / (obj.height! || 1);
          
          if (obj.scaleX! > maxScaleX) obj.scaleX = maxScaleX;
          if (obj.scaleY! > maxScaleY) obj.scaleY = maxScaleY;
          
          // Keep object within boundaries after scaling
          if (obj.left! < 0) obj.left = 0;
          if (obj.top! < 0) obj.top = 0;
          if (obj.left! + obj.width! * obj.scaleX! > canvasWidth) {
            obj.left = canvasWidth - obj.width! * obj.scaleX!;
          }
          if (obj.top! + obj.height! * obj.scaleY! > canvasHeight) {
            obj.top = canvasHeight - obj.height! * obj.scaleY!;
          }
        }
      });
      
      setCanvas(fabricCanvas);
    }
  }, [canvasRef.current, canvas, backgroundColor]);
  
  // Update canvas size when editor type or canvas size changes
  useEffect(() => {
    if (canvas) {
      const dimensions = getCurrentCanvasSize();
      canvas.setDimensions({
        width: dimensions.width,
        height: dimensions.height
      });
      canvas.backgroundColor = backgroundColor;
      canvas.renderAll();
    }
  }, [canvas, editorTypeState, canvasSize, backgroundColor]);

  // Load all templates from database on component mount
  useEffect(() => {
    const loadTemplatesFromDatabase = async () => {
      try {
        console.log('🚀 Loading templates from database...');
        
        // Load all templates
        const allTemplatesResponse = await fetch('http://localhost:4000/api/templates');
        if (allTemplatesResponse.ok) {
          const allTemplates = await allTemplatesResponse.json();
          setTemplates(allTemplates);
          console.log('✅ All templates loaded:', allTemplates.length);
        }
        
        // Load real estate templates
        const realEstateResponse = await fetch('http://localhost:4000/api/templates/real-estate');
        if (realEstateResponse.ok) {
          const realEstateTemplates = await realEstateResponse.json();
          setRealEstateTemplates(realEstateTemplates);
          console.log('✅ Real estate templates loaded:', realEstateTemplates.length);
        }
        
        // Load default templates
        const defaultResponse = await fetch('http://localhost:4000/api/templates?isDefault=true');
        if (defaultResponse.ok) {
          const defaultTemplates = await defaultResponse.json();
          setDefaultTemplates(defaultTemplates);
          console.log('✅ Default templates loaded:', defaultTemplates.length);
        }
        
      } catch (error) {
        console.error('❌ Error loading templates from database:', error);
      }
    };
    
    loadTemplatesFromDatabase();
  }, []);

  // Auto-load design when no template is active (page refresh, new design)
  useEffect(() => {
    if (canvas && !templateKey) {
      console.log('🔄 No template key, checking for default template in database...');
      
      // Try to load default template from database
      const loadDefaultFromDatabase = async () => {
        try {
          const response = await fetch('http://localhost:4000/api/templates?isDefault=true');
          if (response.ok) {
            const defaultTemplates = await response.json();
            if (defaultTemplates.length > 0) {
              const defaultTemplate = defaultTemplates[0];
              console.log('✅ Found default template in database:', defaultTemplate.name);
              setEditorTypeState(defaultTemplate.type);
              loadTemplateFromData(defaultTemplate.templateKey || 'default', defaultTemplate);
              return;
          }
        }
      } catch (error) {
        console.warn('⚠️ Could not fetch default template from database:', error);
      }
      
      // If no default template in database, set default editor type
      console.log('🔄 No default template found in database, setting default editor type');
      setEditorTypeState('flyer');
    };
      
      loadDefaultFromDatabase();
    } else {
      console.log('✅ Template key provided, specific template will be loaded');
    }
  }, [canvas, templateKey]);
  
  // Save canvas state to history
  const saveCanvasToHistory = useCallback(() => {
    if (canvas) {
      const canvasState = canvas.toJSON();
      const newHistory = history.slice(0, historyIndex + 1);
      newHistory.push({
        objects: objects,
        backgroundColor: backgroundColor,
        backgroundImage: backgroundImage
      });
      setHistory(newHistory);
      setHistoryIndex(newHistory.length - 1);
    }
  }, [canvas, history, historyIndex, objects, backgroundColor, backgroundImage]);
  
  // Get current canvas dimensions
  const getCurrentCanvasSize = (): CanvasSize => {
    const config = editorConfigs[editorTypeState];
    const size = config.sizes.find(s => s.value === canvasSize);
    return size || config.sizes[0];
  };
  
  // Save current state to history
  const saveToHistory = useCallback((newObjects: EditorObject[], newBackgroundColor: string, newBackgroundImage?: string | null) => {
    const newHistory = history.slice(0, historyIndex + 1);
    newHistory.push({ 
      objects: newObjects, 
      backgroundColor: newBackgroundColor,
      backgroundImage: newBackgroundImage 
    });
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
      setBackgroundImage(state.backgroundImage || null);
      setHistoryIndex(newIndex);
    }
  }, [history, historyIndex, history]);
  
  // Redo function
  const redo = useCallback(() => {
    if (historyIndex < history.length - 1) {
      const newIndex = historyIndex + 1;
      const state = history[newIndex];
      setObjects(state.objects);
      setBackgroundColor(state.backgroundColor);
      setBackgroundImage(state.backgroundImage || null);
      setHistoryIndex(newIndex);
    }
  }, [history, historyIndex, history]);
  
  // Helper function to ensure objects are within canvas boundaries
  const ensureObjectInBounds = (obj: fabric.Object, canvas: fabric.Canvas) => {
    const canvasWidth = canvas.getWidth();
    const canvasHeight = canvas.getHeight();
    
    // Calculate object dimensions including scale
    const objWidth = (obj.width || 0) * (obj.scaleX || 1);
    const objHeight = (obj.height || 0) * (obj.scaleY || 1);
    
    // Ensure object is within canvas boundaries
    if (obj.left! < 0) obj.left = 0;
    if (obj.top! < 0) obj.top = 0;
    if (obj.left! + objWidth > canvasWidth) {
      obj.left = canvasWidth - objWidth;
    }
    if (obj.top! + objHeight > canvasHeight) {
      obj.top = canvasHeight - objHeight;
    }
    
    // If object is too large for canvas, scale it down
    if (objWidth > canvasWidth) {
      const scale = canvasWidth / (obj.width || 1);
      obj.scaleX = scale;
      obj.left = 0;
    }
    if (objHeight > canvasHeight) {
      const scale = canvasHeight / (obj.height || 1);
      obj.scaleY = scale;
      obj.top = 0;
    }
  };
   
  // Helper function to ensure text objects always have content
  const ensureTextHasContent = (textObj: fabric.IText) => {
    if (textObj && textObj.text !== undefined) {
      // Only prevent completely empty text
      if (textObj.text === '') {
        textObj.set('text', ' ');
        return true; // Text was modified
      }
    }
    return false; // Text was not modified
  };

  // Enhanced text addition with Fabric.js
  const addText = () => {
    if (canvas) {
      const text = new fabric.IText('Tu texto aquí', {
        left: 100,
        top: 100,
        fontSize: 48,
        fill: brandKit.colors?.primary || '#00525b',
        fontFamily: 'Arial',
        selectable: true,
        editable: true
      });
      
      // Ensure text is within canvas boundaries
      ensureObjectInBounds(text, canvas);
      
      canvas.add(text);
      canvas.setActiveObject(text);
      text.enterEditing();
      canvas.renderAll();
      saveCanvasToHistory();
    }
  };
  
  // Enhanced image addition with Fabric.js
  const addImage = () => {
    console.log('🎯 Image button clicked!');
    console.log('📁 File input ref:', fileInputRef.current);
    console.log('🎨 Canvas state:', canvas);
    
    if (fileInputRef.current) {
      console.log('✅ Triggering file input click...');
      fileInputRef.current.click();
    } else {
      console.error('❌ File input ref is null!');
      alert('Error: File input no está disponible. Recarga la página e intenta nuevamente.');
    }
  };
  
  // Simple and reliable image upload function
  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    console.log('🚀 handleImageUpload called!');
    console.log('📄 Event:', e);
    console.log('📁 Files:', e.target.files);
    
    const file = e.target.files?.[0];
    if (!file) {
      console.log('❌ No file selected');
      return;
    }
    
    console.log('✅ File selected:', file.name, file.type, file.size);
    
    // Validate file type
    if (!file.type.startsWith('image/')) {
      alert('Por favor selecciona un archivo de imagen válido.');
      return;
    }
    
    // Validate file size (max 10MB)
    if (file.size > 10 * 1024 * 1024) {
      alert('El archivo es demasiado grande. Máximo 10MB permitido.');
      return;
    }
    
    if (!canvas) {
      console.error('Canvas is not ready');
      alert('El canvas no está listo. Espera un momento e intenta nuevamente.');
      return;
    }
    
    console.log('Canvas is ready, processing image...');
    
    // Create a simple loading indicator
    const loadingText = new fabric.IText('Cargando imagen...', {
      left: 100,
      top: 100,
      fontSize: 16,
      fill: '#666',
      selectable: false
    });
    
    canvas.add(loadingText);
    canvas.renderAll();
    
    const reader = new FileReader();
    
    reader.onload = (event) => {
      const imageUrl = event.target?.result as string;
      console.log('File read successfully, creating background image...');
      
      // Remove loading text
      canvas.remove(loadingText);
      
      // Create a new Image object
      const imgElement = new Image();
      imgElement.onload = () => {
        console.log('Image loaded, creating Fabric background object...');
        
        // Create Fabric.js image from the loaded image
        const fabricImage = new fabric.Image(imgElement);
        
        // Set properties after creation
        fabricImage.set({
          left: canvas.getWidth() / 2,
          top: canvas.getHeight() / 2,
          originX: 'center',
          originY: 'center',
          selectable: false, // Background shouldn't be selectable
          evented: false,    // Background shouldn't trigger events
          lockMovementX: true, // Background shouldn't move
          lockMovementY: true,
          lockRotation: true,  // Background shouldn't rotate
          lockScalingX: true,  // Background shouldn't scale
          lockScalingY: true
        });
        
        // Scale image to fit canvas (cover mode) - REMOVED DUPLICATE
        
        // Remove any existing background image objects
        const existingObjects = canvas.getObjects();
        const backgroundObjects = existingObjects.filter(obj => 
          (obj as any).isBackground === true
        );
        backgroundObjects.forEach(obj => canvas.remove(obj));
        
        // Mark this as a background image
        (fabricImage as any).isBackground = true;
        
        // Set the image to cover the entire canvas
        fabricImage.set({
          left: 0,
          top: 0,
          originX: 'left',
          originY: 'top',
          selectable: false,
          evented: false,
          lockMovementX: true,
          lockMovementY: true,
          lockRotation: true,
          lockScalingX: true,
          lockScalingY: true
        });
        
        // Scale to cover entire canvas
        const canvasWidth = canvas.getWidth();
        const canvasHeight = canvas.getHeight();
        
        if (fabricImage.width && fabricImage.height) {
          const imageWidth = fabricImage.width;
          const imageHeight = fabricImage.height;
          
          // Scale to cover entire canvas (cover mode)
          const scaleX = canvasWidth / imageWidth;
          const scaleY = canvasHeight / imageHeight;
          const scale = Math.max(scaleX, scaleY);
          
          fabricImage.set({
            scaleX: scale,
            scaleY: scale
          });
          
          console.log(`Background image scaled to cover canvas: scale ${scale}`);
        }
        
        // Add background image to canvas
        canvas.add(fabricImage);
        
        // Set canvas background to transparent
        canvas.backgroundColor = 'transparent';
        
        // Render the canvas
        canvas.renderAll();
        
        // Update state
        setBackgroundImage(imageUrl);
        
        // Save to history
        if (typeof saveCanvasToHistory === 'function') {
          saveCanvasToHistory();
        }
        
        console.log('✅ Background image set successfully');
        console.log('🎨 Canvas objects after background:', canvas.getObjects());
        console.log('📏 Canvas dimensions:', canvas.getWidth(), 'x', canvas.getHeight());
        
        // Clear the file input for future uploads
        if (fileInputRef.current) {
          fileInputRef.current.value = '';
        }
        

      };
      
      imgElement.onerror = () => {
        canvas.remove(loadingText);
        canvas.renderAll();
        alert('Error al cargar la imagen. Intenta con otro archivo.');
      };
      
      imgElement.src = imageUrl;
    };
    
    reader.onerror = () => {
      canvas.remove(loadingText);
      canvas.renderAll();
      alert('Error al leer el archivo. Intenta nuevamente.');
    };
    
    reader.readAsDataURL(file);
  };
  
  // Enhanced shape addition with Fabric.js
  const addShape = (shapeType: string) => {
    if (canvas) {
      let shape: fabric.Object;
      
      switch (shapeType) {
        case 'circle':
          shape = new fabric.Circle({
            left: 100,
            top: 100,
            radius: 50,
            fill: brandKit.colors?.secondary || '#01aac7',
            selectable: true,
            resizable: true,
            hasControls: true,
            hasBorders: true
          });
          break;
        case 'triangle':
          shape = new fabric.Triangle({
            left: 100,
            top: 100,
            width: 100,
            height: 100,
            fill: brandKit.colors?.accent || '#32e0c5',
            selectable: true,
            resizable: true,
            hasControls: true,
            hasBorders: true
          });
          break;
        case 'rounded-rectangle':
          shape = new fabric.Rect({
            left: 100,
            top: 100,
            width: 200,
            height: 100,
            rx: 10,
            ry: 10,
            fill: brandKit.colors?.primary || '#00525b',
            selectable: true,
            resizable: true,
            hasControls: true,
            hasBorders: true
          });
          break;
        default:
          shape = new fabric.Rect({
            left: 100,
            top: 100,
            width: 200,
            height: 100,
            fill: brandKit.colors?.secondary || '#01aac7',
            selectable: true,
            resizable: true,
            hasControls: true,
            hasBorders: true
          });
      }
      
      // Ensure shape is within canvas boundaries
      ensureObjectInBounds(shape, canvas);
      
      canvas.add(shape);
      canvas.setActiveObject(shape);
      canvas.renderAll();
      saveCanvasToHistory();
      setShowShapeSelector(false);
    }
  };
  
  // Add image placeholder
  const addImagePlaceholder = () => {
    if (canvas) {
      const placeholder = new fabric.Rect({
        left: 100,
        top: 100,
        width: 200,
        height: 200,
        fill: '#e5e7eb',
        stroke: '#9ca3af',
        strokeDashArray: [5, 5],
        selectable: true,
        resizable: true,
        hasControls: true,
        hasBorders: true
      });
      
      // Ensure placeholder is within canvas boundaries
      ensureObjectInBounds(placeholder, canvas);
      
      canvas.add(placeholder);
      canvas.setActiveObject(placeholder);
      canvas.renderAll();
      saveCanvasToHistory();
    }
  };
  
  // Delete selected object
  const deleteSelectedObject = () => {
    if (canvas && selectedObject) {
      canvas.remove(selectedObject);
      setSelectedObject(null);
      canvas.renderAll();
      saveCanvasToHistory();
    }
  };
  
  // Duplicate selected object
  const duplicateSelectedObject = () => {
    if (canvas && selectedObject) {
      try {
        // Use the modern Fabric.js cloning approach with async/await
        selectedObject.clone().then((cloned: fabric.Object) => {
          // Set new position (offset by 20px)
          cloned.set({
            left: (selectedObject.left || 0) + 20,
            top: (selectedObject.top || 0) + 20
          });
          
          // Add to canvas
          canvas.add(cloned);
          canvas.setActiveObject(cloned);
          setSelectedObject(cloned);
          canvas.renderAll();
          saveCanvasToHistory();
          
          console.log('✅ Object duplicated successfully');
        }).catch((error: any) => {
          console.error('❌ Error duplicating object:', error);
          alert('Error al duplicar el objeto. Intenta nuevamente.');
        });
      } catch (error) {
        console.error('❌ Error in duplicate function:', error);
        alert('Error al duplicar el objeto. Intenta nuevamente.');
      }
    }
  };
  
  // Apply brand kit colors
  const applyBrandKitColors = () => {
    if (canvas && brandKit.colors) {
      canvas.getObjects().forEach((obj: fabric.Object) => {
        if (obj.type === 'text') {
          (obj as fabric.IText).set('fill', brandKit.colors?.primary);
        } else if (obj.type === 'rect' || obj.type === 'circle' || obj.type === 'triangle') {
          obj.set('fill', brandKit.colors?.secondary);
        }
      });
      canvas.renderAll();
      saveCanvasToHistory();
    }
  };
  
  // Apply brand logo
  const applyBrandLogo = () => {
    if (canvas && brandKit.logo) {
      fabric.Image.fromURL(brandKit.logo, (img: fabric.Image) => {
        img.set({
          left: 50,
          top: 50,
          selectable: true,
          resizable: true,
          hasControls: true,
          hasBorders: true
        });
        img.scaleToWidth(100);
        canvas.add(img);
        canvas.renderAll();
        saveCanvasToHistory();
      });
    }
  };

  // Load template preset
  const loadTemplate = async (templateKey: string) => {
    console.log('🚀 loadTemplate called with key:', templateKey);
    
    try {
      // First try to load from database
      const response = await fetch(`http://localhost:4000/api/templates/by-key/${templateKey}`);
      if (response.ok) {
        const template = await response.json();
        console.log('✅ Template loaded from database:', template);
        await loadTemplateFromData(templateKey, template);
        return;
      }
    } catch (error) {
      console.warn('⚠️ Failed to load template from database, falling back to constant:', error);
    }
    
    // Fallback to hard-coded template
    const template = realEstateTemplates[templateKey as keyof typeof realEstateTemplates];
    if (!template && canvas) {
      console.log('📋 Template data from constant:', template);
      await loadTemplateFromData(templateKey, template);
    }
  };

  // Load template from data (for updated templates)
  const loadTemplateFromData = async (templateKey: string, templateData: any) => {
    console.log('🚀 loadTemplateFromData called with key:', templateKey);
    console.log('📋 Template data:', templateData);
    
    if (!canvas) {
      console.error('❌ Canvas is not ready');
      return;
    }
    
    if (!templateData) {
      console.error('❌ Template data is undefined or null');
      return;
    }
    
    // Clear current canvas
    canvas.clear();
    
    // Set background with fallbacks
    const backgroundColor = templateData.backgroundColor || '#ffffff';
    const backgroundImage = templateData.backgroundImage || null;
    
    setBackgroundColor(backgroundColor);
    setBackgroundImage(backgroundImage);
    
    // Set canvas background color
    canvas.backgroundColor = backgroundColor;
    
    // Load background image if it exists
    if (backgroundImage) {
      console.log('🖼️ Loading background image:', backgroundImage);
      console.log('🔍 Background image type:', typeof backgroundImage);
      console.log('🔍 Background image starts with data:', backgroundImage.startsWith('data:'));
      
      try {
        // Create a new Image object
        const imgElement = new Image();
        imgElement.crossOrigin = 'anonymous';
        
        imgElement.onload = () => {
          console.log('✅ Background image loaded successfully');
          console.log('📏 Image dimensions:', imgElement.width, 'x', imgElement.height);
          
          // Create Fabric.js image from the loaded image
          const fabricImage = new fabric.Image(imgElement);
          console.log('✅ Fabric background image created');
          
          // Set properties for background image
          fabricImage.set({
            left: 0,
            top: 0,
            originX: 'left',
            originY: 'top',
            selectable: false,
            evented: false,
            lockMovementX: true,
            lockMovementY: true,
            lockRotation: true,
            lockScalingX: true,
            lockScalingY: true
          });
          
          // Scale image to cover entire canvas
          const canvasWidth = canvas.getWidth();
          const canvasHeight = canvas.getHeight();
          
          if (fabricImage.width && fabricImage.height) {
            const imageWidth = fabricImage.width;
            const imageHeight = fabricImage.height;
            
            // Scale to cover entire canvas (cover mode)
            const scaleX = canvasWidth / imageWidth;
            const scaleY = canvasHeight / imageHeight;
            const scale = Math.max(scaleX, scaleY);
            
            fabricImage.set({
              scaleX: scale,
              scaleY: scale
            });
            
            console.log(`🎯 Background image scaled to cover canvas: scale ${scale}`);
          }
          
          // Mark this as a background image
          (fabricImage as any).isBackground = true;
          
          // Add background image to canvas FIRST (so it's at the bottom)
          canvas.add(fabricImage);
          
          // Ensure background is at the very bottom
          const allObjects = canvas.getObjects();
          const nonBackgroundObjects = allObjects.filter(obj => (obj as any).isBackground !== true);
          
          // Remove all objects temporarily
          allObjects.forEach(obj => canvas.remove(obj));
          
          // Add background image first (bottom layer)
          canvas.add(fabricImage);
          
          // Add all other objects back (top layers)
          nonBackgroundObjects.forEach(obj => canvas.add(obj));
          
          // Set canvas background to transparent so image shows
          canvas.backgroundColor = 'transparent';
          
          // Render the canvas
          canvas.renderAll();
          
          console.log('✅ Background image loaded and positioned successfully');
          console.log('🎨 Canvas objects after background:', canvas.getObjects().length);
        };
        
        imgElement.onerror = (error) => {
          console.error('❌ Error loading background image:', error);
          console.error('❌ Background image URL:', backgroundImage);
          console.error('❌ Background image length:', backgroundImage.length);
        };
        
        // Start loading the image
        imgElement.src = backgroundImage;
        
      } catch (error) {
        console.error('❌ Error creating background image:', error);
      }
    } else {
      console.log('ℹ️ No background image to load');
    }
    
    // Enhanced object loading function
    const loadObjectToCanvas = (obj: any, index: number) => {
      try {
        console.log(`🎨 Loading object ${index + 1}:`, obj);
        
        // Handle different object types
        switch (obj.type) {
          case 'text':
          case 'i-text':
                         const text = new fabric.IText(obj.text || obj.content || 'Texto', {
               left: obj.left || obj.x || 0,
               top: obj.top || obj.y || 0,
               fontSize: obj.fontSize || obj.fontSize || 48,
               fill: obj.fill || obj.color || '#000000',
               fontFamily: obj.fontFamily || obj.font || 'Arial',
               fontWeight: obj.fontWeight || 'normal',
               textAlign: obj.textAlign || 'left',
               selectable: true,
               scaleX: obj.scaleX || 1,
               scaleY: obj.scaleY || 1,
               angle: obj.angle || obj.rotation || 0,
               width: obj.width || undefined,
               height: obj.height || undefined
             });
            canvas.add(text);
            console.log(`✅ Text object loaded: "${obj.text || obj.content}"`);
            break;
            
          case 'image':
            if (obj.src || obj.url) {
              const imgElement = new Image();
              imgElement.crossOrigin = 'anonymous';
              imgElement.onload = () => {
                const fabricImage = new fabric.Image(imgElement, {
                  left: obj.left || obj.x || 0,
                  top: obj.top || obj.y || 0,
                  scaleX: obj.scaleX || 1,
                  scaleY: obj.scaleY || 1,
                  angle: obj.angle || obj.rotation || 0,
                  selectable: true
                });
                canvas.add(fabricImage);
                canvas.renderAll();
                console.log(`✅ Image object loaded: ${obj.src || obj.url}`);
              };
              imgElement.src = obj.src || obj.url;
            }
            break;
            
                    case 'rect':
          case 'rectangle':
            const rect = new fabric.Rect({
              left: obj.left || obj.x || 0,
              top: obj.top || obj.y || 0,
              width: obj.width || 200,
              height: obj.height || 200,
              fill: obj.fill || obj.color || '#3b82f6',
              stroke: obj.stroke || obj.borderColor || 'transparent',
              strokeWidth: obj.strokeWidth || obj.borderWidth || 0,
              rx: obj.rx || 0,  // Rounded corner radius X
              ry: obj.ry || 0,  // Rounded corner radius Y
              strokeLineCap: obj.strokeLineCap || 'butt',
              strokeLineJoin: obj.strokeLineJoin || 'miter',
              scaleX: obj.scaleX || 1,
              scaleY: obj.scaleY || 1,
              angle: obj.angle || obj.rotation || 0,
              selectable: true
            });
            canvas.add(rect);
            console.log(`✅ Rectangle object loaded with rx: ${obj.rx}, ry: ${obj.ry}`);
            break;
            
          case 'circle':
            const circle = new fabric.Circle({
              left: obj.left || obj.x || 0,
              top: obj.top || obj.y || 0,
              radius: obj.radius || (obj.width || obj.height || 100) / 2,
              fill: obj.fill || obj.color || '#3b82f6',
              stroke: obj.stroke || obj.borderColor || 'transparent',
              strokeWidth: obj.strokeWidth || obj.borderWidth || 0,
              strokeLineCap: obj.strokeLineCap || 'butt',
              strokeLineJoin: obj.strokeLineJoin || 'miter',
              scaleX: obj.scaleX || 1,
              scaleY: obj.scaleY || 1,
              angle: obj.angle || obj.rotation || 0,
              selectable: true
            });
            canvas.add(circle);
            console.log(`✅ Circle object loaded with radius: ${obj.radius}`);
            break;
            
          case 'triangle':
            const triangle = new fabric.Triangle({
              left: obj.left || obj.x || 0,
              top: obj.top || obj.y || 0,
              width: obj.width || 200,
              height: obj.height || 200,
              fill: obj.fill || obj.color || '#3b82f6',
              stroke: obj.stroke || obj.borderColor || 'transparent',
              strokeWidth: obj.strokeWidth || obj.borderWidth || 0,
              strokeLineCap: obj.strokeLineCap || 'butt',
              strokeLineJoin: obj.strokeLineJoin || 'miter',
              scaleX: obj.scaleX || 1,
              scaleY: obj.scaleY || 1,
              angle: obj.angle || obj.rotation || 0,
              selectable: true
            });
            canvas.add(triangle);
            console.log(`✅ Triangle object loaded`);
            break;
            
          case 'polygon':
            if (obj.points && Array.isArray(obj.points)) {
              const polygon = new fabric.Polygon(obj.points, {
                left: obj.left || obj.x || 0,
                top: obj.top || obj.y || 0,
                fill: obj.fill || obj.color || '#3b82f6',
                stroke: obj.stroke || obj.borderColor || 'transparent',
                strokeWidth: obj.strokeWidth || obj.borderWidth || 0,
                scaleX: obj.scaleX || 1,
                scaleY: obj.scaleY || 1,
                angle: obj.angle || obj.rotation || 0,
                selectable: true,
                editable: true
              });
              canvas.add(polygon);
              console.log(`✅ Polygon object loaded`);
            }
            break;
            
          case 'path':
            if (obj.path) {
              const path = new fabric.Path(obj.path, {
                left: obj.left || obj.x || 0,
                top: obj.top || obj.y || 0,
                fill: obj.fill || obj.color || '#3b82f6',
                stroke: obj.stroke || obj.borderColor || 'transparent',
                strokeWidth: obj.strokeWidth || obj.borderWidth || 0,
                scaleX: obj.scaleX || 1,
                scaleY: obj.scaleY || 1,
                angle: obj.angle || obj.rotation || 0,
                selectable: true,
                editable: true
              });
              canvas.add(path);
              console.log(`✅ Path object loaded`);
            }
            break;
            
          default:
            console.warn(`⚠️ Unknown object type: ${obj.type}`, obj);
            break;
        }
      } catch (error) {
        console.error(`❌ Error loading object ${index + 1}:`, error, obj);
      }
    };
    
    // Try to load design data from file first, fallback to database objects
    if (templateData.designFilename) {
      console.log('📁 Loading design data from file:', templateData.designFilename);
      try {
        const designResponse = await fetch(`http://localhost:4000/api/templates/design/${templateData.designFilename}`);
        if (designResponse.ok) {
          const designData = await designResponse.json();
          console.log('✅ Design data loaded from file:', designData);
          
          // Check if design data has background image
          if (designData.designData && designData.designData.backgroundImage) {
            console.log('🖼️ Design data has background image, updating state...');
            setBackgroundImage(designData.designData.backgroundImage);
          }
          
          // Load objects from the design file
          if (designData.designData && designData.designData.objects && Array.isArray(designData.designData.objects)) {
            console.log(`🎨 Loading ${designData.designData.objects.length} objects from design file...`);
            designData.designData.objects.forEach((obj: any, index: number) => {
              loadObjectToCanvas(obj, index);
            });
          } else {
            console.warn('⚠️ No objects found in design file data');
          }
        } else {
          console.warn('⚠️ Failed to load design file, falling back to database objects');
          throw new Error('Design file not found');
        }
      } catch (fileError) {
        console.warn('⚠️ Error loading design file, falling back to database objects:', fileError);
        // Fallback to database objects
        if (templateData.objects && Array.isArray(templateData.objects)) {
          console.log(`🎨 Loading ${templateData.objects.length} objects from database...`);
          templateData.objects.forEach((obj: any, index: number) => {
            loadObjectToCanvas(obj, index);
          });
        } else {
          console.warn('⚠️ No objects found in template data');
        }
      }
    } else {
      // Fallback to database objects (backward compatibility)
      console.log('📋 Loading from database objects (backward compatibility)');
      if (templateData.objects && Array.isArray(templateData.objects)) {
        console.log(`🎨 Loading ${templateData.objects.length} objects from database...`);
        templateData.objects.forEach((obj: any, index: number) => {
          loadObjectToCanvas(obj, index);
        });
      } else {
        console.warn('⚠️ No objects found in template data');
      }
    }
    
    // Wait a bit for background image to load, then render
    setTimeout(() => {
      canvas.renderAll();
      saveCanvasToHistory();
      console.log('✅ Template loaded successfully:', templateKey);
      console.log('🎨 Final canvas objects:', canvas.getObjects().length);
      
      // Log all loaded objects for debugging
      const allObjects = canvas.getObjects();
      allObjects.forEach((obj, index) => {
        console.log(`🎨 Object ${index + 1}:`, {
          type: obj.type,
          left: obj.left,
          top: obj.top,
          width: obj.width,
          height: obj.height,
          text: obj.type === 'i-text' ? (obj as fabric.IText).text : 'N/A'
        });
      });
    }, 100);
  };
  
  // Add real estate specific elements
  const addRealEstateElement = (elementType: string) => {
    if (canvas) {
      let element: fabric.Object;
      
      switch (elementType) {
        case 'price':
          element = new fabric.IText('$999,999', {
            left: 100,
            top: 100,
            fontSize: 48,
            fill: '#FFD700',
            fontFamily: 'Arial',
            fontWeight: 'bold',
            selectable: true,
            editable: true
          });
          break;
        case 'bedrooms':
          element = new fabric.IText('4 BHK', {
            left: 100,
            top: 100,
            fontSize: 36,
            fill: '#FFFFFF',
            fontFamily: 'Arial',
            fontWeight: 'bold',
            selectable: true,
            editable: true
          });
          break;
        case 'contact':
          element = new fabric.IText('Call: +123-456-7890', {
            left: 100,
            top: 100,
            fontSize: 24,
            fill: '#FFFFFF',
            fontFamily: 'Arial',
            selectable: true,
            editable: true
          });
          break;
        case 'address':
          element = new fabric.IText('123 Anywhere St., Any City, ST 12345', {
            left: 100,
            top: 100,
            fontSize: 18,
            fill: '#FFFFFF',
            fontFamily: 'Arial',
            selectable: true,
            editable: true
          });
          break;
        case 'propertyType':
          element = new fabric.IText('LUXURY VILLA', {
            left: 100,
            top: 100,
            fontSize: 48,
            fill: '#FFD700',
            fontFamily: 'Georgia',
            fontWeight: 'bold',
            selectable: true,
            editable: true
          });
          break;
        default:
          return;
      }
      
      canvas.add(element);
      canvas.setActiveObject(element);
      canvas.renderAll();
      saveCanvasToHistory();
    }
  };
  
  // Add decorative elements
  const addDecorativeElement = (elementType: string) => {
    if (canvas) {
      let element: fabric.Object;
      
      switch (elementType) {
        case 'circle':
          element = new fabric.Circle({
            left: 100,
            top: 100,
            radius: 20,
            fill: 'transparent',
            stroke: '#FFD700',
            strokeWidth: 3,
            selectable: true,
            resizable: true,
            hasControls: true,
            hasBorders: true
          });
          break;
        case 'line':
          element = new fabric.Line([100, 100, 200, 100], {
            stroke: '#FFD700',
            strokeWidth: 3,
            selectable: true,
            hasControls: true,
            hasBorders: true
          });
          break;
        case 'rectangle':
          element = new fabric.Rect({
            left: 100,
            top: 100,
            width: 200,
            height: 4,
            fill: '#FFD700',
            selectable: true,
            resizable: true,
            hasControls: true,
            hasBorders: true
          });
          break;
        default:
          return;
      }
      
      canvas.add(element);
      canvas.setActiveObject(element);
      canvas.renderAll();
      saveCanvasToHistory();
    }
  };

  // Handle object selection
  const handleObjectClick = (objectId: string) => {
    setSelectedId(objectId);
    setEditingTextId(null);
  };

  // Handle canvas click (deselect)
  const handleCanvasClick = () => {
    setSelectedId(null);
    setEditingTextId(null);
  };

  // Handle text editing
  const handleTextEdit = (objectId: string) => {
    setEditingTextId(objectId);
    setSelectedId(objectId);
  };

  // Update object properties
  const updateObject = (objectId: string, updates: Partial<EditorObject>) => {
    const newObjects = objects.map(obj => 
      obj.id === objectId ? { ...obj, ...updates } : obj
    );
    setObjects(newObjects);
    saveToHistory(newObjects, backgroundColor, backgroundImage);
  };

  // Handle background color change
  const handleBackgroundColorChange = (color: string) => {
    setBackgroundColor(color);
    saveToHistory(objects, color, backgroundImage);
  }; 

  // Handle background image change
  const handleBackgroundImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    console.log('Background image change triggered!');
    console.log('Event:', e);
    console.log('Files:', e.target.files);
    
    const file = e.target.files?.[0];
    if (!file) {
      console.log('No file selected');
      return;
    }
    
    console.log('Background image upload started:', file.name, file.type, file.size);
    
    // Validate file type
    if (!file.type.startsWith('image/')) {
      console.error('Invalid file type:', file.type);
      alert('Por favor selecciona un archivo de imagen válido.');
      return;
    }
    
    // Validate file size (max 10MB)
    if (file.size > 10 * 1024 * 1024) {
      console.error('File too large:', file.size);
      alert('El archivo es demasiado grande. Máximo 10MB permitido.');
      return;
    }
    
    if (!canvas) {
      console.error('Canvas is not ready for background image');
      alert('El canvas no está listo. Espera un momento e intenta nuevamente.');
      return;
    }
    
    console.log('Canvas is ready, setting background image...');
    console.log('Canvas dimensions:', canvas.getWidth(), 'x', canvas.getHeight());
    console.log('Current canvas objects:', canvas.getObjects().length);
    
    const reader = new FileReader();
    reader.onload = (event) => {
      const imageUrl = event.target?.result as string;
      console.log('Background image loaded successfully');
      
      // Use manual image loading approach since fabric.Image.fromURL has issues
      console.log('🔄 Using manual image loading approach...');
      
      // Create a new Image object manually
      const imgElement = new Image();
      imgElement.crossOrigin = 'anonymous'; // Handle CORS issues
      
      imgElement.onload = () => {
        console.log('✅ Image loaded successfully');
        console.log('📏 Image dimensions:', imgElement.width, 'x', imgElement.height);
        
        // Create Fabric.js image from the loaded image
        const fabricImage = new fabric.Image(imgElement);
        console.log('✅ Fabric image created successfully');
        
        // Set properties after creation
        fabricImage.set({
          left: canvas.getWidth() / 2,
          top: canvas.getHeight() / 2,
          originX: 'center',
          originY: 'center',
          selectable: false, // Background shouldn't be selectable
          evented: false,    // Background shouldn't trigger events
          lockMovementX: true, // Background shouldn't move
          lockMovementY: true,
          lockRotation: true,  // Background shouldn't rotate
          lockScalingX: true,  // Background shouldn't scale
          lockScalingY: true
        });
        
        // Scale image to fit canvas
        const canvasWidth = canvas.getWidth();
        const canvasHeight = canvas.getHeight();
        
        if (fabricImage.width && fabricImage.height) {
          const scaleX = canvasWidth / fabricImage.width;
          const scaleY = canvasHeight / fabricImage.height;
          const scale = Math.max(scaleX, scaleY); // Cover the entire canvas
          fabricImage.scale(scale);
          console.log('🎯 Image scaled to:', scale);
        }
        
        // Remove any existing background image
        const existingObjects = canvas.getObjects();
        const backgroundObjects = existingObjects.filter(obj => 
          (obj as any).isBackground === true
        );
        backgroundObjects.forEach(obj => {
          console.log('🗑️ Removing existing background object');
          canvas.remove(obj);
        });
        
        // Mark this as a background image
        (fabricImage as any).isBackground = true;
        
        // Add background image to canvas
        canvas.add(fabricImage);
        console.log('➕ Background image added to canvas');
        
        // Move background image to the very bottom layer by reordering
        const allObjects = canvas.getObjects();
        const nonBackgroundObjects = allObjects.filter(obj => (obj as any).isBackground !== true);
        
        // Remove all objects temporarily
        allObjects.forEach(obj => canvas.remove(obj));
        
        // Add background image first (bottom layer)
        canvas.add(fabricImage);
        
        // Add all other objects back (top layers)
        nonBackgroundObjects.forEach(obj => canvas.add(obj));
        
        // Keep the original canvas background color so other content remains visible
        canvas.backgroundColor = backgroundColor;
        
        // Render the canvas
        canvas.renderAll();
        
        console.log('✅ Background image set successfully');
        console.log('🎨 Canvas objects after background:', canvas.getObjects());
        console.log('📏 Canvas dimensions:', canvas.getWidth(), 'x', canvas.getHeight());
      };
      
      imgElement.onerror = (error) => {
        console.error('❌ Error loading image:', error);
        alert('Error al cargar la imagen. Intenta con otra imagen.');
      };
      
      // Start loading the image
      imgElement.src = imageUrl;
      
      // Update state
      setBackgroundImage(imageUrl);
      
      // Save to history
      if (typeof saveCanvasToHistory === 'function') {
        saveCanvasToHistory();
      }
      
      console.log('Background image set successfully');
      
      
      // Clear the file input for future uploads
      const target = e.target as HTMLInputElement;
      if (target) {
        target.value = '';
      }
    };
    
    reader.onerror = () => {
      console.error('Error reading background image file');
      alert('Error al leer el archivo de imagen de fondo. Intenta nuevamente.');
    };
    
    reader.readAsDataURL(file);
  };

  // Handle drag and drop for images
  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    
    const files = Array.from(e.dataTransfer.files);
    const imageFile = files.find(file => file.type.startsWith('image/'));
    
    if (imageFile) {
      // Create a fake event to reuse the existing upload logic
      const fakeEvent = {
        target: { files: [imageFile] }
      } as unknown as React.ChangeEvent<HTMLInputElement>;
      handleImageUpload(fakeEvent);
    } else {
      alert('Por favor arrastra un archivo de imagen válido.');
    }
  };

  // Simple test image upload for debugging
  const testImageUpload = () => {
    console.log('Testing image upload...');
    console.log('Canvas exists:', !!canvas);
    console.log('File input exists:', !!fileInputRef.current);
    
    if (!canvas) {
      alert('Canvas no está inicializado. Espera un momento.');
      return;
    }
    
    if (!fileInputRef.current) {
      alert('File input no está disponible.');
      return;
    }
    
    // Create a simple test image
    const testImage = new fabric.Rect({
      left: 100,
      top: 100,
      width: 100,
      height: 100,
      fill: 'red',
      selectable: true,
      resizable: true,
      hasControls: true,
      hasBorders: true
    });
    
    canvas.add(testImage);
    canvas.setActiveObject(testImage);
    canvas.renderAll();
    
    console.log('Test image added successfully');
    alert('Imagen de prueba agregada. Revisa la consola para más detalles.');
  };

  // Simple test background image function
  const testBackgroundImage = () => {
    console.log('🧪 Testing background image functionality...');
    
    if (!canvas) {
      alert('Canvas no está listo');
      return;
    }
    
    console.log('🎨 Canvas is ready, creating test background...');
    console.log('📏 Canvas dimensions:', canvas.getWidth(), 'x', canvas.getHeight());
    console.log('🔢 Current objects:', canvas.getObjects().length);
    
    // Create a simple colored rectangle as background
    const backgroundRect = new fabric.Rect({
      left: 0,
      top: 0,
      width: canvas.getWidth(),
      height: canvas.getHeight(),
      fill: 'rgba(255, 0, 0, 0.5)', // More visible red
      selectable: false,
      evented: false
    });
    
    // Mark as background
    (backgroundRect as any).isBackground = true;
    
    // Remove existing backgrounds
    const existingObjects = canvas.getObjects();
    const backgroundObjects = existingObjects.filter(obj => 
      (obj as any).isBackground === true
    );
    backgroundObjects.forEach(obj => {
      console.log('🗑️ Removing existing background object');
      canvas.remove(obj);
    });
    
            // Add new background and ensure proper layering
        const allObjects = canvas.getObjects();
        const nonBackgroundObjects = allObjects.filter(obj => (obj as any).isBackground !== true);
        
        // Remove all objects temporarily
        allObjects.forEach(obj => canvas.remove(obj));
        
        // Add background rectangle first (bottom layer)
        canvas.add(backgroundRect);
        console.log('➕ Test background added to canvas');
        
        // Add all other objects back (top layers)
        nonBackgroundObjects.forEach(obj => canvas.add(obj));
        
        // Keep the original canvas background color
        canvas.backgroundColor = backgroundColor;
        
        // Render the canvas
        canvas.renderAll();
    
    console.log('✅ Test background added successfully');
    console.log('🎨 Canvas objects after test background:', canvas.getObjects());
    alert('Fondo de prueba agregado. Deberías ver un rectángulo rojo semi-transparente.');
  };

  // Render object based on type
  const renderObject = (obj: EditorObject, index: number) => {
    const isSelected = obj.id === selectedId;
    const isEditing = obj.id === editingTextId;
    
    const baseClasses = `absolute cursor-move select-none ${isSelected ? 'ring-2 ring-blue-500' : ''}`;
    
    switch (obj.type) {
      case 'text':
        return (
          <div
            key={obj.id}
            className={baseClasses}
            style={{
              left: obj.x,
              top: obj.y,
              fontSize: obj.fontSize || 48,
              color: obj.color || '#000000',
              fontFamily: obj.fontFamily || 'Arial',
              zIndex: obj.zIndex || index,
              transform: obj.rotation ? `rotate(${obj.rotation}deg)` : undefined
            }}
            onClick={(e) => {
              e.stopPropagation();
              handleObjectClick(obj.id);
            }}
            onDoubleClick={(e) => {
              e.stopPropagation();
              handleTextEdit(obj.id);
            }}
          >
            {isEditing ? (
              <input
                type="text"
                value={obj.content || ''}
                onChange={(e) => updateObject(obj.id, { content: e.target.value })}
                onBlur={() => setEditingTextId(null)}
                autoFocus
                className="bg-transparent border-none outline-none"
                style={{
                  fontSize: obj.fontSize || 48,
                  color: obj.color || '#000000',
                  fontFamily: obj.fontFamily || 'Arial',
                  minWidth: '100px'
                }}
              />
            ) : (
              <span>{obj.content || 'Tu texto aquí'}</span>
            )}
          </div>
        );
        
      case 'image':
        return (
          <div
            key={obj.id}
            className={baseClasses}
            style={{
              left: obj.x,
              top: obj.y,
              width: obj.width || 200,
              height: obj.height || 200,
              zIndex: obj.zIndex || index,
              transform: obj.rotation ? `rotate(${obj.rotation}deg)` : undefined
            }}
            onClick={(e) => {
              e.stopPropagation();
              handleObjectClick(obj.id);
            }}
          >
            <img
              src={obj.src}
              alt="Uploaded"
              className="w-full h-full object-cover"
              draggable={false}
            />
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
              width: obj.width || 200,
              height: obj.height || 200,
              backgroundColor: obj.color || '#3b82f6',
              zIndex: obj.zIndex || index,
              transform: obj.rotation ? `rotate(${obj.rotation}deg)` : undefined
            }}
            onClick={(e) => {
              e.stopPropagation();
              handleObjectClick(obj.id);
            }}
          >
            {obj.shape === 'circle' && (
              <div className="w-full h-full rounded-full" />
            )}
            {obj.shape === 'triangle' && (
              <div className="w-full h-full" style={{ clipPath: 'polygon(50% 0%, 0% 100%, 100% 100%)' }} />
            )}
            {obj.shape === 'rounded-rectangle' && (
              <div className="w-full h-full rounded-lg" />
            )}
            {obj.shape === 'diamond' && (
              <div className="w-full h-full" style={{ clipPath: 'polygon(50% 0%, 100% 50%, 50% 100%, 0% 50%)' }} />
            )}
            {obj.shape === 'star' && (
              <div className="w-full h-full" style={{ clipPath: 'polygon(50% 0%, 61% 35%, 98% 35%, 68% 57%, 79% 91%, 50% 70%, 21% 91%, 32% 57%, 2% 35%, 39% 35%)' }} />
            )}
            {obj.shape === 'hexagon' && (
              <div className="w-full h-full" style={{ clipPath: 'polygon(25% 0%, 75% 0%, 100% 50%, 75% 100%, 25% 100%, 0% 50%)' }} />
            )}
            {obj.shape === 'pentagon' && (
              <div className="w-full h-full" style={{ clipPath: 'polygon(50% 0%, 100% 38%, 82% 100%, 18% 100%, 0% 38%)' }} />
            )}
            {(!obj.shape || obj.shape === 'rectangle') && (
              <div className="w-full h-full" />
            )}
          </div>
        );
        
      case 'placeholder':
        return (
          <div
            key={obj.id}
            className={baseClasses}
            style={{
              left: obj.x,
              top: obj.y,
              width: obj.width || 200,
              height: obj.height || 200,
              backgroundColor: obj.color || '#e5e7eb',
              border: '2px dashed #9ca3af',
              zIndex: obj.zIndex || index
            }}
            onClick={(e) => {
              e.stopPropagation();
              handleObjectClick(obj.id);
            }}
          >
            <div className="w-full h-full flex items-center justify-center text-gray-500">
              <div className="text-center">
                <div className="text-2xl mb-2">📷</div>
                <div className="text-sm">Imagen</div>
              </div>
            </div>
          </div>
        );
        
      default:
        return null;
    }
  };

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.ctrlKey || e.metaKey) {
        if (e.key === 's') {
          e.preventDefault();
          saveDesign();
        } else if (e.key === 'z') {
          e.preventDefault();
          undo();
        } else if (e.key === 'y') {
          e.preventDefault();
          redo();
        } else if (e.key === 'd') {
          e.preventDefault();
          duplicateSelectedObject();
        }
      } else if (e.key === 'Delete' || e.key === 'Backspace') {
        // Check if text editing is active on canvas AND user is not in a textarea
        if (isCanvasTextEditing && document.activeElement?.tagName !== 'TEXTAREA') {
          // Prevent backspace/delete when editing text on canvas (but allow in textarea)
          e.preventDefault();
          console.log('🚫 Backspace/Delete blocked on canvas text editing');
          return;
        }
        // If not editing text on canvas OR user is in textarea, allow normal deletion
        if (!isCanvasTextEditing) {
          deleteSelectedObject();
        }
        // If user is in textarea, let the textarea handle the backspace normally
      } else if (e.key === 'Escape') {
        setSelectedId(null);
        setEditingTextId(null);
      } else if (e.key === 'b') {
        // Toggle sidebar with B key
        setSidebarCollapsed(prev => !prev);
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [undo, redo, duplicateSelectedObject, deleteSelectedObject]);

  // Save design
  const saveDesign = async () => {
    console.log('🚀 Save button clicked!');
    console.log('🎨 Canvas exists:', !!canvas);
    console.log('🆔 Design ID:', id);
    console.log('📝 Editor Type:', editorTypeState);
    
    if (!canvas) {
      console.error('❌ Canvas is not ready');
      alert('El canvas no está listo. Espera un momento e intenta nuevamente.');
      return;
    }

    try {
      console.log('📊 Getting canvas objects...');
      const canvasObjects = canvas.getObjects();
      console.log('🔢 Number of objects on canvas:', canvasObjects.length);
      console.log('🎯 Object types:', canvasObjects.map(obj => obj.type));
      
      // Create a more compact design data structure
      const designData = {
        id,
        editorType: editorTypeState,
        canvasSize,
        backgroundColor,
        backgroundImage,
        templateKey: templateKey || null, // Include template key if editing a template
        // Don't save the full canvasState to save space
        objects: canvasObjects.map(obj => {
          const baseObj = {
            id: `obj_${Date.now()}_${Math.random()}`,
            type: obj.type,
            left: obj.left || 0,
            top: obj.top || 0,
            width: obj.width || 0,
            height: obj.height || 0,
            fill: obj.fill || '#000000',
            stroke: obj.stroke || 'transparent',
            scaleX: obj.scaleX || 1,
            scaleY: obj.scaleY || 1,
            angle: obj.angle || 0,
            isBackground: (obj as any).isBackground || false
          };
          
          // Add text-specific properties if it's a text object
          if (obj.type === 'text' || obj.type === 'i-text') {
            const textObj = obj as fabric.IText;
            return {
              ...baseObj,
              fontSize: textObj.fontSize || 48,
              fontFamily: textObj.fontFamily || 'Arial',
              fontWeight: textObj.fontWeight || 'normal',
              textAlign: textObj.textAlign || 'left',
              text: textObj.text || ''
            };
          }
          
          // Add shape-specific properties
          if (obj.type === 'rect') {
            const rectObj = obj as fabric.Rect;
            return {
              ...baseObj,
              rx: rectObj.rx || 0,  // Rounded corner radius X
              ry: rectObj.ry || 0,  // Rounded corner radius Y
              strokeWidth: rectObj.strokeWidth || 0,
              strokeLineCap: rectObj.strokeLineCap || 'butt',
              strokeLineJoin: rectObj.strokeLineJoin || 'miter'
            };
          }
          
          // Add circle-specific properties
          if (obj.type === 'circle') {
            const circleObj = obj as fabric.Circle;
            return {
              ...baseObj,
              radius: circleObj.radius || 0,
              strokeWidth: circleObj.strokeWidth || 0,
              strokeLineCap: circleObj.strokeLineCap || 'butt',
              strokeLineJoin: circleObj.strokeLineJoin || 'miter'
            };
          }
          
          // Add triangle-specific properties
          if (obj.type === 'triangle') {
            const triangleObj = obj as fabric.Triangle;
            return {
              ...baseObj,
              strokeWidth: triangleObj.strokeWidth || 0,
              strokeLineCap: triangleObj.strokeLineCap || 'butt',
              strokeLineJoin: triangleObj.strokeLineJoin || 'miter'
            };
          }
          
          // Add polygon-specific properties
          if (obj.type === 'polygon') {
            const polygonObj = obj as fabric.Polygon;
            return {
              ...baseObj,
              points: polygonObj.points || [],
              strokeWidth: polygonObj.strokeWidth || 0,
              strokeLineCap: polygonObj.strokeLineCap || 'butt',
              strokeLineJoin: polygonObj.strokeLineJoin || 'miter'
            };
          }
          
          // Add path-specific properties
          if (obj.type === 'path') {
            const pathObj = obj as fabric.Path;
            return {
              ...baseObj,
              path: pathObj.path || '',
              strokeWidth: pathObj.strokeWidth || 0,
              strokeLineCap: pathObj.strokeLineCap || 'butt',
              strokeLineJoin: pathObj.strokeLineJoin || 'miter'
            };
          }
          
          return baseObj;
        }),
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };
      
      console.log('📋 Design data prepared:', designData);
      
      // If editing a template, update the template in the database
      if (templateKey) {
        console.log('🏠 Updating template in database:', templateKey);
        try {
          // First, save the full design data as a file
          console.log('💾 Saving design data as file...');
          
          // Use JSON method instead of FormData for better reliability
          console.log('📤 Sending design data as JSON to backend...');
          console.log('📊 Design data size:', JSON.stringify(designData).length, 'bytes');
          
          const fileResponse = await fetch('http://localhost:4000/api/templates/save-design', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              designData: designData
            })
          });
          
          console.log('📡 File response status:', fileResponse.status);
          console.log('📡 File response headers:', Object.fromEntries(fileResponse.headers.entries()));
          
          if (!fileResponse.ok) {
            const errorText = await fileResponse.text();
            console.error('❌ File save failed:', errorText);
            throw new Error(`Failed to save design data file: ${fileResponse.status} ${fileResponse.statusText}`);
          }
          
          const fileResult = await fileResponse.json();
          const designFilename = fileResult.filename;
          console.log('✅ Design data saved as file:', designFilename);
          
          // Now update the template in database with just the filename and essential metadata
          const templateUpdateData = {
            designFilename: designFilename, // Store only the filename
            backgroundColor: designData.backgroundColor,
            backgroundImage: designData.backgroundImage,
            canvasSize: designData.canvasSize,
            updatedAt: new Date().toISOString()
          };
          
          console.log('📋 Template update data (minimal):', templateUpdateData);
          
          // Update template in database via API
          const response = await fetch(`http://localhost:4000/api/templates/by-key/${templateKey}`, {
            method: 'PUT',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify(templateUpdateData)
          });
          
          if (response.ok) {
            const result = await response.json();
            console.log('✅ Template updated successfully in database:', templateKey);
            console.log('📋 Database response:', result);
            console.log('💾 Design data saved as file:', designFilename);
            console.log('💾 Template updated in database successfully');
            
            // Show success message to user
            alert(`✅ Template "${templateKey}" actualizado exitosamente!\n📁 Datos guardados en: ${designFilename}`);
          } else {
            const errorData = await response.json();
            console.error('❌ Failed to update template in database:', errorData);
            throw new Error(`Database update failed: ${errorData.error || 'Unknown error'}`);
          }
        } catch (templateError) {
          console.error('❌ Error updating template in database:', templateError);
          console.error('❌ Template error details:', templateError);
          
          // Show error to user - no fallback to localStorage
          const errorMessage = templateError instanceof Error ? templateError.message : 'Database update failed';
          alert(`Error updating template: ${errorMessage}`);
        }
      }
      
      // Try to save to localStorage with quota management
      console.log('💾 Saving to localStorage...');
      const savedDesigns = JSON.parse(localStorage.getItem('savedDesigns') || '[]');
      console.log('📚 Existing saved designs:', savedDesigns.length);
      
      // Check if we need to clear old designs to save space
      if (savedDesigns.length > 5) {
        console.log('🗑️ Clearing old designs to save space...');
        // Keep only the 3 most recent designs
        const recentDesigns = savedDesigns.slice(-3);
        localStorage.setItem('savedDesigns', JSON.stringify(recentDesigns));
        console.log('✅ Old designs cleared, kept 3 most recent');
      }
      
      const existingIndex = savedDesigns.findIndex((d: any) => d.id === id);
      console.log('🔍 Existing design index:', existingIndex);
      
      if (existingIndex >= 0) {
        savedDesigns[existingIndex] = designData;
        console.log('✅ Diseño actualizado:', designData.id);
      } else {
        savedDesigns.push(designData);
        console.log('✅ Nuevo diseño guardado:', designData.id);
      }
      
      // Try to save with error handling for quota
      try {
        localStorage.setItem('savedDesigns', JSON.stringify(savedDesigns));
        console.log('💾 localStorage updated successfully');
        
        // Show success message with more details
        let message = '';
        if (templateKey) {
          message = `Template "${templateKey}" actualizado exitosamente!`;
        } else if (existingIndex >= 0) {
          message = `Diseño "${designData.id}" actualizado exitosamente!`;
        } else {
          message = `Nuevo diseño "${designData.id}" guardado exitosamente!`;
        }
        
        alert(message);
        console.log('💾 Diseño guardado en localStorage:', designData);
        
        // Note: Default template is now managed in database, not localStorage
        console.log('💾 Design saved successfully. Default template managed in database.');
        
      } catch (quotaError) {
        console.error('❌ Quota exceeded, trying to save with reduced data...');
        
                 // Try saving without some data to reduce size
         const reducedDesignData = {
           ...designData,
           // Remove some properties to reduce size
           objects: designData.objects.map(obj => {
             const baseReduced = {
               id: obj.id,
               type: obj.type,
               left: obj.left,
               top: obj.top,
               width: obj.width,
               height: obj.height,
               fill: obj.fill
             };
             
             // Add text properties only if it's a text object
             if (obj.type === 'text' || obj.type === 'i-text') {
               return {
                 ...baseReduced,
                 text: (obj as any).text || '',
                 fontSize: (obj as any).fontSize || 48,
                 fontFamily: (obj as any).fontFamily || 'Arial'
               };
             }
             
             return baseReduced;
           })
         };
        
        // Clear all old designs and save only this one
        localStorage.clear();
        localStorage.setItem('savedDesigns', JSON.stringify([reducedDesignData]));
        
        alert(`Diseño guardado con datos reducidos debido a limitaciones de espacio.`);
        console.log('💾 Diseño guardado con datos reducidos:', reducedDesignData);
        
        // Note: Default template is now managed in database, not localStorage
        console.log('✅ Reduced design saved successfully. Default template managed in database.');
      }
      
    } catch (error) {
      console.error('❌ Error al guardar el diseño:', error);
      console.error('❌ Error details:', error);
      alert('Error al guardar el diseño. Revisa la consola para más detalles.');
    }
  };

  // Download design
  const downloadDesign = (format: 'PNG' | 'PDF') => {
    if (canvas) {
      if (format === 'PNG') {
        // Set background color for export
        const originalBackground = canvas.backgroundColor;
        canvas.backgroundColor = backgroundColor;
        canvas.renderAll();
        
        // Export as PNG data URL
        const dataURL = canvas.toDataURL({
          format: 'png',
          multiplier: 1,
          quality: 1
        });
        
        // Create download link
        const link = document.createElement('a');
        link.download = `design-${editorTypeState}-${Date.now()}.png`;
        link.href = dataURL;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        
        // Restore original background
        canvas.backgroundColor = originalBackground;
        canvas.renderAll();
      } else if (format === 'PDF') {
        // For PDF, we'll use jsPDF to convert the canvas
        try {
          // Convert canvas to image first
          const dataURL = canvas.toDataURL({
            format: 'png',
            multiplier: 1,
            quality: 1
          });
          
          // Create a temporary image to get dimensions
          const img = new Image();
          img.onload = () => {
            // Create PDF with canvas dimensions
            const pdf = new jsPDF({
              orientation: img.width > img.height ? 'landscape' : 'portrait',
              unit: 'px',
              format: [img.width, img.height]
            });
            
            // Add image to PDF
            pdf.addImage(dataURL, 'PNG', 0, 0, img.width, img.height);
            
            // Download PDF
            pdf.save(`design-${editorTypeState}-${Date.now()}.pdf`);
          };
          img.src = dataURL;
        } catch (error) {
          console.error('PDF generation error:', error);
          alert('Error generando PDF. Asegúrate de tener jsPDF instalado.');
        }
      }
    } else {
      alert(`Descargando diseño en formato ${format}...`);
    }
  };

  // Load saved design
  const loadSavedDesign = (designId: string) => {
    console.log('🚀 loadSavedDesign called with ID:', designId);
    
    try {
      console.log('📚 Getting saved designs from localStorage...');
      const savedDesigns = JSON.parse(localStorage.getItem('savedDesigns') || '[]');
      console.log('📚 Saved designs found:', savedDesigns.length);
      
      const design = savedDesigns.find((d: any) => d.id === designId);
      console.log('🔍 Looking for design ID:', designId);
      console.log('🎯 Design found:', !!design);
      
      if (!design) {
        console.error('❌ Design not found for ID:', designId);
        alert('Diseño no encontrado.');
        return;
      }
      
      console.log('📋 Design data:', design);
      
      if (!canvas) {
        console.error('❌ Canvas is not ready');
        alert('El canvas no está listo. Espera un momento e intenta nuevamente.');
        return;
      }
      
      console.log('🎨 Canvas is ready, clearing current content...');
      // Clear current canvas
      canvas.clear();
      
      console.log('🎨 Setting background color:', design.backgroundColor);
      // Set background
      setBackgroundColor(design.backgroundColor);
      setBackgroundImage(design.backgroundImage);
      
      // Load objects manually since we don't save canvasState anymore
      console.log('🎨 Recreating objects from saved data...');
      
      // Set canvas background
      canvas.backgroundColor = design.backgroundColor;
      canvas.renderAll();
      
      // Recreate all objects
      design.objects.forEach((obj: any) => {
        console.log('🔧 Creating object:', obj.type, obj);
        
        if (obj.type === 'text' || obj.type === 'i-text') {
          // Create text object
          const text = new fabric.IText(obj.text || 'Texto', {
            left: obj.left || 0,
            top: obj.top || 0,
            fontSize: obj.fontSize || 48,
            fontFamily: obj.fontFamily || 'Arial',
            fontWeight: obj.fontWeight || 'normal',
            fill: obj.fill || '#000000',
            textAlign: obj.textAlign || 'left',
            selectable: true,
            editable: true
          });
          canvas.add(text);
          
        } else if (obj.type === 'image') {
          // Create image object (placeholder for now)
          const rect = new fabric.Rect({
            left: obj.left || 0,
            top: obj.top || 0,
            width: obj.width || 100,
            height: obj.height || 100,
            fill: obj.fill || '#cccccc',
            selectable: true
          });
          canvas.add(rect);
          
        } else if (obj.type === 'rect') {
          // Create rectangle
          const rect = new fabric.Rect({
            left: obj.left || 0,
            top: obj.top || 0,
            width: obj.width || 100,
            height: obj.height || 100,
            fill: obj.fill || '#cccccc',
            stroke: obj.stroke || 'transparent',
            selectable: true
          });
          canvas.add(rect);
          
        } else if (obj.type === 'circle') {
          // Create circle
          const circle = new fabric.Circle({
            left: obj.left || 0,
            top: obj.top || 0,
            radius: (obj.width || 50) / 2,
            fill: obj.fill || '#cccccc',
            stroke: obj.stroke || 'transparent',
            selectable: true
          });
          canvas.add(circle);
        }
      });
      
      canvas.renderAll();
      console.log('✅ Diseño cargado exitosamente:', designId);
      alert(`Diseño "${designId}" cargado exitosamente!`);
      
    } catch (error) {
      console.error('❌ Error al cargar el diseño:', error);
      console.error('❌ Error details:', error);
      alert('Error al cargar el diseño. Revisa la consola para más detalles.');
    }
  };

  // Get list of saved designs
  const getSavedDesigns = () => {
    try {
      const savedDesigns = JSON.parse(localStorage.getItem('savedDesigns') || '[]');
      return savedDesigns;
    } catch (error) {
      console.error('❌ Error al obtener diseños guardados:', error);
      return [];
    }
  };

  const currentConfig = editorConfigs[editorTypeState];

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Main Toolbar */}
        <div className="bg-white rounded-2xl shadow-lg p-4 mb-6">
          <div className="flex items-center justify-between">
            {/* Left Section - File Operations */}
            <div className="flex items-center space-x-2">
              <button
                onClick={async () => await saveDesign()}
                className="flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                title="Guardar Diseño (Ctrl+S)"
              >
                <FiSave className="w-4 h-4" />
                <span className="hidden sm:inline">Guardar</span>
              </button>
              
              <button
                onClick={() => downloadDesign('PNG')}
                className="flex items-center space-x-2 px-3 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
                title="Descargar PNG"
              >
                <FiDownload className="w-4 h-4" />
                <span className="hidden sm:inline">PNG</span>
              </button>
              
              <button
                onClick={() => downloadDesign('PDF')}
                className="flex items-center space-x-2 px-3 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
                title="Descargar PDF"
              >
                <FiFileText className="w-4 h-4" />
                <span className="hidden sm:inline">PDF</span>
              </button>
            </div>

            {/* Center Section - Edit Operations */}
            <div className="flex items-center space-x-2">
              <button
                onClick={undo}
                disabled={historyIndex <= 0}
                className="p-2 rounded-lg bg-gray-100 hover:bg-gray-200 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                title="Deshacer (Ctrl+Z)"
              >
                <FiRotateCcw className="w-5 h-5" />
              </button>
              
              <button
                onClick={redo}
                disabled={historyIndex >= history.length - 1}
                className="p-2 rounded-lg bg-gray-100 hover:bg-gray-200 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                title="Rehacer (Ctrl+Y)"
              >
                <FiRotateCw className="w-5 h-5" />
              </button>
              
              <div className="w-px h-8 bg-gray-300 mx-2"></div>
              
              <button
                onClick={duplicateSelectedObject}
                disabled={!selectedObject}
                className="p-2 rounded-lg bg-gray-100 hover:bg-gray-200 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                title="Duplicar (Ctrl+D)"
              >
                <FiCopy className="w-5 h-5" />
              </button>
              
              <button
                onClick={deleteSelectedObject}
                disabled={!selectedObject}
                className="p-2 rounded-lg bg-gray-100 hover:bg-gray-200 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                title="Eliminar (Delete)"
              >
                <FiTrash2 className="w-5 h-5" />
              </button>
            </div>

            {/* Right Section - Canvas & View Controls */}
            <div className="flex items-center space-x-4">
              {/* Canvas Size Selector */}
              <div className="flex items-center space-x-2">
                <label className="text-sm font-medium text-gray-700 hidden sm:inline">Tamaño:</label>
                <select
                  value={canvasSize}
                  onChange={(e) => setCanvasSize(e.target.value)}
                  className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm"
                >
                  {currentConfig.sizes.map((size) => (
                    <option key={size.value} value={size.value}>
                      {size.label}
                    </option>
                  ))}
                </select>
                <span className="text-sm text-gray-500 hidden md:inline">
                  {getCurrentCanvasSize().width} × {getCurrentCanvasSize().height}
                </span>
              </div>
              

              
              {/* Zoom Controls */}
              <div className="flex items-center space-x-1">
                <button
                  onClick={() => {
                    if (canvas) {
                      const zoom = Math.max(0.1, (canvas.getZoom() || 1) - 0.1);
                      canvas.setZoom(zoom);
                      canvas.renderAll();
                    }
                  }}
                  className="p-1 rounded bg-gray-100 hover:bg-gray-200 transition-colors"
                  title="Zoom Out"
                >
                  <FiMinus className="w-4 h-4" />
                </button>
                <span className="text-sm text-gray-600 px-2 min-w-[3rem] text-center">
                  {canvas ? Math.round((canvas.getZoom() || 1) * 100) : 100}%
                </span>
                <button
                  onClick={() => {
                    if (canvas) {
                      const zoom = Math.min(3, (canvas.getZoom() || 1) + 0.1);
                      canvas.setZoom(zoom);
                      canvas.renderAll();
                    }
                  }}
                  className="p-1 rounded bg-gray-100 hover:bg-gray-200 transition-colors"
                  title="Zoom In"
                >
                  <FiPlus className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Secondary Toolbar with Tabs */}
        <div className="bg-white rounded-2xl shadow-lg mb-6 w-full max-w-none min-w-0 h-fit max-h-none">
          {/* Tab Navigation */}
          <div className="flex border-b border-gray-200">
            <button
              onClick={() => setActiveTab('elements')}
              className={`px-6 py-3 text-sm font-medium border-b-2 transition-colors ${
                activeTab === 'elements'
                  ? 'border-blue-500 text-blue-600 bg-blue-50'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              <div className="flex items-center space-x-2">
                <FiType className="w-4 h-4" />
                <span>Elementos</span>
              </div>
            </button>
            
            <button
              onClick={() => setActiveTab('background')}
              className={`px-6 py-3 text-sm font-medium border-b-2 transition-colors ${
                activeTab === 'background'
                  ? 'border-blue-500 text-blue-600 bg-blue-50'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              <div className="flex items-center space-x-2">
                <FiImage className="w-4 h-4" />
                <span>Fondo</span>
              </div>
            </button>
            
            <button
              onClick={() => setActiveTab('templates')}
              className={`px-6 py-3 text-sm font-medium border-b-2 transition-colors ${
                activeTab === 'templates'
                  ? 'border-blue-500 text-blue-600 bg-blue-50'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              <div className="flex items-center space-x-2">
                <FiType className="w-4 h-4" />
                <span>Plantillas</span>
              </div>
            </button>
            
            {/* Text Tab - Only show when text object is selected */}
            {selectedObject && (selectedObject.type === 'text' || selectedObject.type === 'i-text') && (
            <button
              onClick={() => setActiveTab('text')}
              className={`px-6 py-3 text-sm font-medium border-b-2 transition-colors ${
                activeTab === 'text'
                  ? 'border-blue-500 text-blue-600 bg-blue-50'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              <div className="flex items-center space-x-2">
                <FiType className="w-4 h-4" />
                <span>Texto</span>
              </div>
            </button>
            )}
            
            {/* Format Tab - Only show when shape object is selected */}
            {selectedObject && (selectedObject.type === 'rect' || selectedObject.type === 'circle' || selectedObject.type === 'triangle' || selectedObject.type === 'polygon' || selectedObject.type === 'path') && (
            <button
              onClick={() => setActiveTab('format')}
              className={`px-6 py-3 text-sm font-medium border-b-2 transition-colors ${
                activeTab === 'format'
                  ? 'border-blue-500 text-blue-600 bg-blue-50'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              <div className="flex items-center space-x-2">
                <FiEdit3 className="w-4 h-4" />
                <span>Formato</span>
              </div>
            </button>
            )}
            
            {/* Real Estate Elements Tab */}
            <button
              onClick={() => setActiveTab('realEstate')}
              className={`px-6 py-3 text-sm font-medium border-b-2 transition-colors ${
                activeTab === 'realEstate'
                  ? 'border-blue-500 text-blue-600 bg-blue-50'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              <div className="flex items-center space-x-2">
                <FiLayers className="w-4 h-4" />
                <span>Bienes Raíces</span>
              </div>
            </button>
          </div>
          
          {/* Tab Content */}
          <div className="p-4 overflow-hidden">
            {/* Elements Tab */}
            {activeTab === 'elements' && (
              <div className="space-y-4">
                <div className="flex items-center space-x-4">
                  <span className="text-sm font-medium text-gray-700">Agregar:</span>
                  <button
                    onClick={addText}
                    className="flex items-center space-x-2 px-4 py-2 bg-blue-50 hover:bg-blue-100 rounded-lg transition-colors"
                    title="Agregar Texto"
                  >
                    <FiType className="w-4 h-4 text-blue-600" />
                    <span className="text-blue-800 font-medium">Texto</span>
                  </button>
                  
                  <button
                    onClick={addImage}
                    className="flex items-center space-x-2 px-4 py-2 bg-green-50 hover:bg-green-100 rounded-lg transition-colors"
                    title="Agregar Imagen"
                  >
                    <FiImage className="w-4 h-4 text-green-600" />
                    <span className="text-green-800 font-medium">Imagen</span>
                  </button>
                  
                  <button
                    onClick={() => setShowShapeSelector(true)}
                    className="flex items-center space-x-2 px-4 py-2 bg-purple-50 hover:bg-purple-100 rounded-lg transition-colors"
                    title="Agregar Forma"
                  >
                    <FiSquare className="w-4 h-4 text-purple-600" />
                    <span className="text-purple-800 font-medium">Formas</span>
                  </button>
                </div>
              </div>
            )}
            
            {/* Background Tab */}
            {activeTab === 'background' && (
              <div className="space-y-4">
                {/* Background Color Picker */}
                <div className="flex items-center space-x-4">
                  <span className="text-sm font-medium text-gray-700">Color de Fondo:</span>
                  <input
                    type="color"
                    value={backgroundColor}
                    onChange={(e) => setBackgroundColor(e.target.value)}
                    className="w-8 h-8 rounded border border-gray-300 cursor-pointer"
                    title="Color de Fondo"
                  />
                  <input
                    type="text"
                    value={backgroundColor}
                    onChange={(e) => setBackgroundColor(e.target.value)}
                    placeholder="#ffffff"
                    className="w-24 px-2 py-1 text-sm border border-gray-300 rounded focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>
                
                <div className="flex items-center space-x-4">
                  <span className="text-sm font-medium text-gray-700">Configuración:</span>
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleBackgroundImageChange}
                    className="hidden"
                    id="background-image-input"
                  />
                  <label
                    htmlFor="background-image-input"
                    className="flex items-center space-x-2 px-4 py-2 bg-orange-50 hover:bg-orange-100 rounded-lg transition-colors cursor-pointer"
                    title="Subir Imagen de Fondo"
                  >
                    <FiImage className="w-4 h-4 text-orange-600" />
                    <span className="text-orange-800 font-medium">Imagen Fondo</span>
                  </label>
                  
                  <button
                    onClick={() => setBackgroundImage(null)}
                    disabled={!backgroundImage}
                    className="px-4 py-2 bg-gray-50 hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed rounded-lg transition-colors"
                    title="Limpiar Imagen de Fondo"
                  >
                    Limpiar
                  </button>
                </div>
              </div>
            )}
            
            {/* Templates Tab */}
            {activeTab === 'templates' && (
              <div className="space-y-4">
                <div className="flex items-center space-x-4">
                  <span className="text-sm font-medium text-gray-700">Elementos:</span>
                  <button
                    onClick={() => addRealEstateElement('price')}
                    className="flex items-center space-x-2 px-4 py-2 bg-indigo-50 hover:bg-indigo-100 rounded-lg transition-colors"
                    title="Agregar Elementos de Bienes Raíces"
                  >
                    <FiLayers className="w-4 h-4 text-indigo-600" />
                    <span className="text-indigo-800 font-medium">Bienes Raíces</span>
                  </button>
                </div>
              </div>
            )}
            
            {/* Real Estate Elements Tab */}
            {activeTab === 'realEstate' && (
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <h4 className="text-sm font-semibold text-gray-900">Elementos de Bienes Raíces</h4>
                  <span className="text-xs text-blue-600 bg-blue-100 px-2 py-1 rounded-full">
                    Propiedades
                  </span>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  <button
                    onClick={() => addRealEstateElement('price')}
                    className="flex items-center space-x-3 p-3 bg-yellow-50 hover:bg-yellow-100 rounded-lg transition-colors"
                  >
                    <span className="text-2xl">💰</span>
                    <span className="text-yellow-800 font-medium">Precio</span>
                  </button>
                  
                  <button
                    onClick={() => addRealEstateElement('bedrooms')}
                    className="flex items-center space-x-3 p-3 bg-blue-50 hover:bg-blue-100 rounded-lg transition-colors"
                  >
                    <span className="text-2xl">🛏️</span>
                    <span className="text-blue-800 font-medium">Habitaciones</span>
                  </button>
                  
                  <button
                    onClick={() => addRealEstateElement('contact')}
                    className="flex items-center space-x-3 p-3 bg-green-50 hover:bg-green-100 rounded-lg transition-colors"
                  >
                    <span className="text-2xl">📞</span>
                    <span className="text-green-800 font-medium">Contacto</span>
                  </button>
                  
                  <button
                    onClick={() => addRealEstateElement('address')}
                    className="flex items-center space-x-3 p-3 bg-purple-50 hover:bg-purple-100 rounded-lg transition-colors"
                  >
                    <span className="text-2xl">📍</span>
                    <span className="text-purple-800 font-medium">Dirección</span>
                  </button>
                  
                  <button
                    onClick={() => addRealEstateElement('propertyType')}
                    className="flex items-center space-x-3 p-3 bg-red-50 hover:bg-red-100 rounded-lg transition-colors"
                  >
                    <span className="text-2xl">🏠</span>
                    <span className="text-red-800 font-medium">Tipo de Propiedad</span>
                  </button>
                </div>
              </div>
            )}
            
            {/* Format Tab */}
            {activeTab === 'format' && selectedObject && (selectedObject.type === 'rect' || selectedObject.type === 'circle' || selectedObject.type === 'triangle' || selectedObject.type === 'polygon' || selectedObject.type === 'path') && (
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <h4 className="text-sm font-semibold text-gray-900">Formato del Objeto</h4>
                  <span className="text-xs text-blue-600 bg-blue-100 px-2 py-1 rounded-full">
                    {selectedObject.type || 'Objeto'}
                  </span>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                  {/* Fill Color (Content Color) */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Color de Relleno</label>
                    <div className="flex items-center space-x-2">
                      <input
                        type="color"
                        value={(selectedObject.fill as string) || '#000000'}
                        onChange={(e) => {
                          if (selectedObject) {
                            selectedObject.set('fill', e.target.value);
                            canvas?.renderAll();
                            saveCanvasToHistory();
                          }
                        }}
                        className="w-8 h-8 rounded border border-gray-300 cursor-pointer"
                      />
                      <input
                        type="text"
                        value={(selectedObject.fill as string) || '#000000'}
                        onChange={(e) => {
                          if (selectedObject) {
                            selectedObject.set('fill', e.target.value);
                            canvas?.renderAll();
                            saveCanvasToHistory();
                          }
                        }}
                        placeholder="#000000"
                        className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      />
                    </div>
                  </div>
                  
                  {/* Stroke Color (Border Color) */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Color del Borde</label>
                    <div className="flex items-center space-x-2">
                      <input
                        type="color"
                        value={(selectedObject.stroke as string) || '#000000'}
                        onChange={(e) => {
                          if (selectedObject) {
                            selectedObject.set('stroke', e.target.value);
                            canvas?.renderAll();
                            saveCanvasToHistory();
                          }
                        }}
                        className="w-8 h-8 rounded border border-gray-300 cursor-pointer"
                      />
                      <input
                        type="text"
                        value={(selectedObject.stroke as string) || '#000000'}
                        onChange={(e) => {
                          if (selectedObject) {
                            selectedObject.set('stroke', e.target.value);
                            canvas?.renderAll();
                            saveCanvasToHistory();
                          }
                        }}
                        placeholder="#000000"
                        className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      />
                    </div>
                  </div>
                  
                  {/* Stroke Width (Border Width) */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Ancho del Borde</label>
                    <div className="flex items-center space-x-2">
                      <input
                        type="range"
                        min="0"
                        max="20"
                        step="0.5"
                        value={(selectedObject.strokeWidth as number) || 0}
                        onChange={(e) => {
                          if (selectedObject) {
                            selectedObject.set('strokeWidth', parseFloat(e.target.value));
                            canvas?.renderAll();
                            saveCanvasToHistory();
                          }
                        }}
                        className="flex-1 h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer"
                      />
                      <span className="text-sm text-gray-600 min-w-[3rem] text-center">
                        {(selectedObject.strokeWidth as number) || 0}
                      </span>
                    </div>
                  </div>
                  
                  {/* Opacity */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Opacidad</label>
                    <div className="flex items-center space-x-2">
                      <input
                        type="range"
                        min="0"
                        max="1"
                        step="0.1"
                        value={(selectedObject.opacity as number) || 1}
                        onChange={(e) => {
                          if (selectedObject) {
                            selectedObject.set('opacity', parseFloat(e.target.value));
                            canvas?.renderAll();
                            saveCanvasToHistory();
                          }
                        }}
                        className="flex-1 h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer"
                      />
                      <span className="text-sm text-gray-600 min-w-[3rem] text-center">
                        {((selectedObject.opacity as number) || 1).toFixed(1)}
                      </span>
                    </div>
                  </div>
                </div>
                
                {/* Additional Formatting Options */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mt-4">
                  {/* Stroke Line Cap */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Estilo del Borde</label>
                    <select
                      value={(selectedObject.strokeLineCap as string) || 'butt'}
                      onChange={(e) => {
                        if (selectedObject) {
                          selectedObject.set('strokeLineCap', e.target.value);
                          canvas?.renderAll();
                          saveCanvasToHistory();
                        }
                      }}
                      className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    >
                      <option value="butt">Recto</option>
                      <option value="round">Redondeado</option>
                      <option value="square">Cuadrado</option>
                    </select>
                  </div>
                  
                  {/* Stroke Line Join */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Unión del Borde</label>
                    <select
                      value={(selectedObject.strokeLineJoin as string) || 'miter'}
                      onChange={(e) => {
                        if (selectedObject) {
                          selectedObject.set('strokeLineJoin', e.target.value);
                          canvas?.renderAll();
                          saveCanvasToHistory();
                        }
                      }}
                      className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    >
                      <option value="miter">Angular</option>
                      <option value="round">Redondeado</option>
                      <option value="bevel">Biselado</option>
                    </select>
                  </div>
                  
                  {/* Shadow */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Sombra</label>
                    <div className="flex items-center space-x-2">
                      <input
                        type="checkbox"
                        checked={!!(selectedObject as any).shadow}
                        onChange={(e) => {
                          if (selectedObject) {
                            if (e.target.checked) {
                              (selectedObject as any).set('shadow', new fabric.Shadow({
                                color: 'rgba(0,0,0,0.3)',
                                blur: 10,
                                offsetX: 5,
                                offsetY: 5
                              }));
                            } else {
                              (selectedObject as any).set('shadow', null);
                            }
                            canvas?.renderAll();
                            saveCanvasToHistory();
                          }
                        }}
                        className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                      />
                      <span className="text-sm text-gray-600">Activar Sombra</span>
                    </div>
                  </div>
                  
                  {/* Reset to Default */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Restablecer</label>
                    <button
                      onClick={() => {
                        if (selectedObject) {
                          selectedObject.set({
                            fill: '#000000',
                            stroke: 'transparent',
                            strokeWidth: 0,
                            opacity: 1,
                            shadow: null
                          });
                          canvas?.renderAll();
                          saveCanvasToHistory();
                        }
                      }}
                      className="w-full px-3 py-2 text-sm bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg transition-colors"
                    >
                      Restablecer Valores
                    </button>
                  </div>
                </div>
              </div>
            )}
            
            {/* No Object Selected Message for Format Tab */}
            {activeTab === 'format' && !selectedObject && (
              <div className="text-center py-8 text-gray-500">
                <FiEdit3 className="w-12 h-12 mx-auto mb-3 text-gray-300" />
                <p className="text-sm">Selecciona un objeto para editar su formato</p>
              </div>
            )}
            
            {/* Invalid Tab State - Redirect to Elements */}
            {activeTab === 'format' && selectedObject && !['rect', 'circle', 'triangle', 'polygon', 'path'].includes(selectedObject.type) && (
              <div className="text-center py-8 text-gray-500">
                <FiEdit3 className="w-12 h-12 mx-auto mb-3 text-gray-300" />
                <p className="text-sm">Este objeto no es una forma. Selecciona una forma para usar la pestaña de formato.</p>
                <button
                  onClick={() => setActiveTab('elements')}
                  className="mt-3 px-4 py-2 bg-blue-100 hover:bg-blue-200 text-blue-700 rounded-lg transition-colors"
                >
                  Ir a Elementos
                </button>
              </div>
            )}
            
            {/* Text Properties Tab */}
            {activeTab === 'text' && selectedObject && (selectedObject.type === 'text' || selectedObject.type === 'i-text') && (
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <h4 className="text-sm font-semibold text-gray-900">Propiedades del Texto</h4>
                  <span className="text-xs text-blue-600 bg-blue-100 px-2 py-1 rounded-full">
                    {(selectedObject as fabric.IText).text || 'Texto'}
                  </span>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                  {/* Font Family */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Fuente</label>
                    <select
                      value={(selectedObject as fabric.IText).fontFamily || 'Arial'}
                      onChange={(e) => {
                        if (selectedObject && (selectedObject.type === 'text' || selectedObject.type === 'i-text')) {
                          (selectedObject as fabric.IText).set('fontFamily', e.target.value);
                          canvas?.renderAll();
                          saveCanvasToHistory();
                        }
                      }}
                      className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    >
                      {fontFamilies.slice(0, 8).map(font => (
                        <option key={font} value={font}>{font}</option>
                      ))}
                    </select>
                  </div>
                  
                  {/* Font Size */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Tamaño</label>
                    <div className="flex items-center space-x-2">
                      <input
                        type="range"
                        min="8"
                        max="200"
                        value={(selectedObject as fabric.IText).fontSize || 48}
                        onChange={(e) => {
                          if (selectedObject && (selectedObject.type === 'text' || selectedObject.type === 'i-text')) {
                            (selectedObject as fabric.IText).set('fontSize', parseInt(e.target.value));
                            canvas?.renderAll();
                            saveCanvasToHistory();
                          }
                        }}
                        className="flex-1 h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer"
                      />
                      <span className="text-sm text-gray-600 min-w-[3rem] text-center">
                        {(selectedObject as fabric.IText).fontSize || 48}
                      </span>
                    </div>
                  </div>
                  
                                  {/* Font Weight */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Peso</label>
                  <select
                    value={(selectedObject as fabric.IText).fontWeight || 'normal'}
                    onChange={(e) => {
                      if (selectedObject && (selectedObject.type === 'text' || selectedObject.type === 'i-text')) {
                        (selectedObject as fabric.IText).set('fontWeight', e.target.value);
                        canvas?.renderAll();
                        saveCanvasToHistory();
                      }
                    }}
                    className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  >
                    <option value="100">100 - Thin</option>
                    <option value="200">200 - Extra Light</option>
                    <option value="300">300 - Light</option>
                    <option value="400">400 - Normal</option>
                    <option value="500">500 - Medium</option>
                    <option value="600">600 - Semi Bold</option>
                    <option value="700">700 - Bold</option>
                    <option value="800">800 - Extra Bold</option>
                    <option value="900">900 - Black</option>
                  </select>
                </div>
                  
                  {/* Text Color */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Color</label>
                    <div className="flex items-center space-x-2">
                      <input
                        type="color"
                        value={(selectedObject as fabric.IText).fill as string || '#000000'}
                        onChange={(e) => {
                          if (selectedObject && (selectedObject.type === 'text' || selectedObject.type === 'i-text')) {
                            (selectedObject as fabric.IText).set('fill', e.target.value);
                            canvas?.renderAll();
                            saveCanvasToHistory();
                          }
                        }}
                        className="w-8 h-8 rounded border border-gray-300 cursor-pointer"
                      />
                      <input
                        type="text"
                        value={(selectedObject as fabric.IText).fill as string || '#000000'}
                        onChange={(e) => {
                          if (selectedObject && (selectedObject.type === 'text' || selectedObject.type === 'i-text')) {
                            (selectedObject as fabric.IText).set('fill', e.target.value);
                            canvas?.renderAll();
                            saveCanvasToHistory();
                          }
                        }}
                        placeholder="#000000"
                        className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      />
                    </div>
                  </div>
                </div>
                
                {/* Additional Font Styling Options */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mt-4">
                  {/* Font Style (Italic) */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Estilo</label>
                    <div className="flex items-center space-x-2">
                      <button
                        onClick={() => {
                          if (selectedObject && (selectedObject.type === 'text' || selectedObject.type === 'i-text')) {
                            const currentStyle = (selectedObject as fabric.IText).fontStyle || 'normal';
                            const newStyle = currentStyle === 'italic' ? 'normal' : 'italic';
                            (selectedObject as fabric.IText).set('fontStyle', newStyle);
                            canvas?.renderAll();
                            saveCanvasToHistory();
                          }
                        }}
                        className={`px-3 py-2 text-sm rounded-lg border transition-colors ${
                          (selectedObject as fabric.IText).fontStyle === 'italic'
                            ? 'border-blue-500 bg-blue-50 text-blue-700'
                            : 'border-gray-300 hover:border-gray-400'
                        }`}
                        title="Italic"
                      >
                        <span className="italic">I</span>
                      </button>
                      
                      <button
                        onClick={() => {
                          if (selectedObject && (selectedObject.type === 'text' || selectedObject.type === 'i-text')) {
                            const currentDecoration = (selectedObject as any).textDecoration || '';
                            const newDecoration = currentDecoration.includes('underline') 
                              ? currentDecoration.replace('underline', '').trim()
                              : currentDecoration + ' underline';
                            (selectedObject as any).set('textDecoration', newDecoration);
                            canvas?.renderAll();
                            saveCanvasToHistory();
                          }
                        }}
                        className={`px-3 py-2 text-sm rounded-lg border transition-colors ${
                          (selectedObject as any).textDecoration?.includes('underline')
                            ? 'border-blue-500 bg-blue-50 text-blue-700'
                            : 'border-gray-300 hover:border-gray-400'
                        }`}
                        title="Underline"
                      >
                        <span className="underline">U</span>
                      </button>
                      
                      <button
                        onClick={() => {
                          if (selectedObject && (selectedObject.type === 'text' || selectedObject.type === 'i-text')) {
                            const currentDecoration = (selectedObject as any).textDecoration || '';
                            const newDecoration = currentDecoration.includes('line-through') 
                              ? currentDecoration.replace('line-through', '').trim()
                              : currentDecoration + ' line-through';
                            (selectedObject as any).set('textDecoration', newDecoration);
                            canvas?.renderAll();
                            saveCanvasToHistory();
                          }
                        }}
                        className={`px-3 py-2 text-sm rounded-lg border transition-colors ${
                          (selectedObject as any).textDecoration?.includes('line-through')
                            ? 'border-blue-500 bg-blue-50 text-blue-700'
                            : 'border-gray-300 hover:border-gray-400'
                        }`}
                        title="Strikethrough"
                      >
                        <span className="line-through">S</span>
                      </button>
                    </div>
                  </div>
                  
                  {/* Text Alignment */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Alineación</label>
                    <div className="flex items-center space-x-2">
                      {[
                        { value: 'left', label: 'Izquierda', icon: '⫷' },
                        { value: 'center', label: 'Centro', icon: '⫸' },
                        { value: 'right', label: 'Derecha', icon: '⫹' }
                      ].map(align => (
                        <button
                          key={align.value}
                          onClick={() => {
                            if (selectedObject && (selectedObject.type === 'text' || selectedObject.type === 'i-text')) {
                              (selectedObject as fabric.IText).set('textAlign', align.value as 'left' | 'center' | 'right');
                              canvas?.renderAll();
                              saveCanvasToHistory();
                            }
                          }}
                          className={`p-2 rounded-lg border-2 transition-colors ${
                            (selectedObject as fabric.IText).textAlign === align.value
                              ? 'border-blue-500 bg-blue-50 text-blue-700'
                              : 'border-gray-300 hover:border-gray-400'
                          }`}
                          title={align.label}
                        >
                          <div className="text-lg">{align.icon}</div>
                          <div className="text-xs">{align.label}</div>
                        </button>
                      ))}
                    </div>
                  </div>
                  
                  {/* Letter Spacing */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Espaciado</label>
                    <div className="flex items-center space-x-2">
                      <input
                        type="range"
                        min="-5"
                        max="20"
                        step="0.5"
                        value={(selectedObject as fabric.IText).charSpacing || 0}
                        onChange={(e) => {
                          if (selectedObject && (selectedObject.type === 'text' || selectedObject.type === 'i-text')) {
                            (selectedObject as fabric.IText).set('charSpacing', parseFloat(e.target.value));
                            canvas?.renderAll();
                            saveCanvasToHistory();
                          }
                        }}
                        className="flex-1 h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer"
                      />
                      <span className="text-sm text-gray-600 min-w-[3rem] text-center">
                        {(selectedObject as fabric.IText).charSpacing || 0}
                      </span>
                    </div>
                  </div>
                  
                  {/* Line Height */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Altura de Línea</label>
                    <div className="flex items-center space-x-2">
                      <input
                        type="range"
                        min="0.5"
                        max="3"
                        step="0.1"
                        value={(selectedObject as fabric.IText).lineHeight || 1.16}
                        onChange={(e) => {
                          if (selectedObject && (selectedObject.type === 'text' || selectedObject.type === 'i-text')) {
                            (selectedObject as fabric.IText).set('lineHeight', parseFloat(e.target.value));
                            canvas?.renderAll();
                            saveCanvasToHistory();
                          }
                        }}
                        className="flex-1 h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer"
                      />
                      <span className="text-sm text-gray-600 min-w-[3rem] text-center">
                        {((selectedObject as fabric.IText).lineHeight || 1.16).toFixed(1)}
                      </span>
                    </div>
                  </div>
                </div>
                
                {/* Text Content Editor - Hidden */}
                <div className="hidden">
                  <label className="block text-sm font-medium text-gray-700 mb-2">Contenido</label>
                  <div className="text-xs text-gray-500 mb-2">
                    💡 <strong>Nota:</strong> El backspace funciona normalmente aquí. Solo está deshabilitado cuando editas texto directamente en el canvas.
                  </div>
                  <textarea
                    value={(selectedObject as fabric.IText).text || ''}
                    onChange={(e) => {
                      if (selectedObject && (selectedObject.type === 'text' || selectedObject.type === 'i-text')) {
                        const newText = e.target.value;
                        
                        // Prevent completely empty text
                        if (newText.length === 0) {
                          (selectedObject as fabric.IText).set('text', ' ');
                        } else {
                          (selectedObject as fabric.IText).set('text', newText);
                        }
                        
                        canvas?.renderAll();
                        saveCanvasToHistory();
                      }
                    }}
                    rows={3}
                    className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 resize-none"
                    placeholder="Escribe tu texto aquí..."
                  />
                </div>
              </div>
            )}
            
            {/* No Text Object Selected Message */}
            {activeTab === 'text' && (!selectedObject || (selectedObject.type !== 'text' && selectedObject.type !== 'i-text')) && (
              <div className="text-center py-8 text-gray-500">
                <FiType className="w-12 h-12 mx-auto mb-3 text-gray-300" />
                <p className="text-sm">Selecciona un objeto de texto para editar sus propiedades</p>
              </div>
            )}
          </div>
        </div>



        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          {/* Tools Panel */}
          <div className={`${sidebarCollapsed ? 'lg:col-span-1' : 'lg:col-span-1'} transition-all duration-300`}>
            {/* Sidebar Header with Collapse Button */}
            <div className="bg-white rounded-2xl shadow-lg p-4 mb-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-lg font-semibold text-gray-900">Herramientas</h3>
                  <p className="text-xs text-gray-500">Presiona <kbd className="px-1 py-0.5 bg-gray-100 rounded text-xs">B</kbd> para alternar</p>
                </div>
                <button
                  onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
                  className="p-2 rounded-lg hover:bg-gray-100 transition-colors"
                  title={sidebarCollapsed ? "Expandir barra lateral" : "Colapsar barra lateral"}
                >
                  {sidebarCollapsed ? (
                    <FiPlus className="w-5 h-5 text-gray-600" />
                  ) : (
                    <FiMinus className="w-5 h-5 text-gray-600" />
                  )}
                </button>
              </div>
            </div>
            
            {/* Collapsible Sidebar Content */}
            <div className={`space-y-6 ${sidebarCollapsed ? 'hidden' : 'block'}`}>
            {/* Quick Actions */}
            <div className="bg-white rounded-2xl shadow-lg p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Acciones Rápidas</h3>
              <div className="space-y-3">
                <button
                  onClick={() => {
                    console.log('Canvas state:', canvas);
                    console.log('File input ref:', fileInputRef.current);
                    if (canvas) {
                      console.log('Canvas dimensions:', canvas.getWidth(), 'x', canvas.getHeight());
                      console.log('Canvas objects:', canvas.getObjects());
                    }
                  }}
                  className="w-full flex items-center space-x-3 p-3 bg-yellow-50 hover:bg-yellow-100 rounded-lg transition-colors"
                >
                  <span className="text-yellow-800 font-medium">🔍 Debug Canvas</span>
                </button>
                
                <button
                  onClick={() => {
                    if (canvas) {
                      canvas.clear();
                      canvas.renderAll();
                      saveCanvasToHistory();
                    }
                  }}
                  className="w-full flex items-center space-x-3 p-3 bg-red-50 hover:bg-red-100 rounded-lg transition-colors"
                >
                  <span className="text-red-800 font-medium">🗑️ Limpiar Canvas</span>
                </button>
                
                <button
                  onClick={() => {
                    if (canvas) {
                      const objects = canvas.getObjects();
                      console.log('📊 Canvas Objects:', objects.length);
                      objects.forEach((obj, index) => {
                        console.log(`Object ${index}:`, obj.type, obj);
                      });
                    }
                  }}
                  className="w-full flex items-center space-x-3 p-3 bg-blue-50 hover:bg-blue-100 rounded-lg transition-colors"
                >
                  <span className="text-blue-800 font-medium">📊 Info Canvas</span>
                </button>
                
                <button
                  onClick={testImageUpload}
                  className="w-full flex items-center space-x-3 p-3 bg-orange-50 hover:bg-orange-100 rounded-lg transition-colors"
                >
                  <span className="text-orange-800 font-medium">🧪 Test Image</span>
                </button>
                
                {/* Test background image button */}
                <button
                  onClick={testBackgroundImage}
                  className="w-full flex items-center space-x-3 p-3 bg-pink-50 hover:bg-pink-100 rounded-lg transition-colors"
                >
                  <span className="text-pink-800 font-medium">🎨 Test Background</span>
                </button>
                

                
                <button
                  onClick={addImagePlaceholder}
                  className="w-full flex items-center space-x-3 p-3 bg-gray-50 hover:bg-gray-100 rounded-lg transition-colors"
                >
                  <FiLayers className="w-5 h-5 text-gray-600" />
                  <span className="text-gray-800 font-medium">Marcador de Imagen</span>
                </button>
              </div>
            </div>
            

            
            {/* Decorative Elements */}
            <div className="bg-white rounded-2xl shadow-lg p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Elementos Decorativos</h3>
              <div className="space-y-3">
                <button
                  onClick={() => addDecorativeElement('circle')}
                  className="w-full flex items-center space-x-3 p-3 bg-pink-50 hover:bg-pink-100 rounded-lg transition-colors"
                >
                  <span className="text-2xl">⭕</span>
                  <span className="text-pink-800 font-medium">Círculo</span>
                </button>
                
                <button
                  onClick={() => addDecorativeElement('line')}
                  className="w-full flex items-center space-x-3 p-3 bg-indigo-50 hover:bg-indigo-100 rounded-lg transition-colors"
                >
                  <span className="text-2xl">➖</span>
                  <span className="text-indigo-800 font-medium">Línea</span>
                </button>
                
                <button
                  onClick={() => addDecorativeElement('rectangle')}
                  className="w-full flex items-center space-x-3 p-3 bg-orange-50 hover:bg-orange-100 rounded-lg transition-colors"
                >
                  <span className="text-2xl">▬</span>
                  <span className="text-orange-800 font-medium">Rectángulo</span>
                </button>
              </div>
            </div>

            {/* Background Settings */}
            <div className="bg-white rounded-2xl shadow-lg p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Fondo</h3>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Color de Fondo</label>
                  <div className="flex items-center space-x-3">
                    <input
                      type="color"
                      value={backgroundColor}
                      onChange={(e) => handleBackgroundColorChange(e.target.value)}
                      className="w-16 h-12 rounded-lg border border-gray-300 cursor-pointer"
                    />
                    <div className="flex-1">
                      <input
                        type="text"
                        value={backgroundColor}
                        onChange={(e) => handleBackgroundColorChange(e.target.value)}
                        placeholder="#ffffff"
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm"
                      />
                    </div>
                  </div>
                  <p className="mt-2 text-xs text-gray-500">
                    Selecciona un color o ingresa el código hexadecimal
                  </p>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Imagen de Fondo</label>
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleBackgroundImageChange}
                    className="w-full text-sm text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-medium file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
                  />
                  <p className="mt-2 text-xs text-gray-500">
                    Selecciona una imagen para usar como fondo del canvas
                  </p>
                  {/* Test background button */}
                  <button
                    onClick={testBackgroundImage}
                    className="mt-2 w-full px-3 py-2 bg-pink-100 text-pink-800 rounded-lg hover:bg-pink-200 text-sm"
                  >
                    🧪 Probar Fondo
                  </button>
                </div>
              </div>
            </div>

            {/* Object Properties */}
            {selectedId && (
              <div className="bg-white rounded-2xl shadow-lg p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Propiedades del Objeto</h3>
                <div className="space-y-4">
                  <button
                    onClick={duplicateSelectedObject}
                    className="w-full flex items-center justify-center space-x-2 p-2 bg-blue-50 hover:bg-blue-100 rounded-lg text-blue-800"
                    title="Duplicar (Ctrl+D)"
                  >
                    <FiCopy className="w-4 h-4" />
                    <span>Duplicar</span>
                  </button>
                  
                  <button
                    onClick={deleteSelectedObject}
                    className="w-full flex items-center justify-center space-x-2 p-2 bg-red-50 hover:bg-red-100 rounded-lg text-red-800"
                    title="Eliminar (Delete)"
                  >
                    <FiTrash2 className="w-4 h-4" />
                    <span>Eliminar</span>
                  </button>
                </div>
              </div>
            )}

            {/* Debug Panel - Show what's selected */}
            {selectedObject && (
              <div className="bg-gray-100 rounded-2xl shadow-lg p-4">
                <h3 className="text-sm font-semibold text-gray-700 mb-2">Debug Info</h3>
                <div className="text-xs text-gray-600 space-y-1">
                  <div>Type: {selectedObject.type}</div>
                  <div>ID: {selectedId}</div>
                  <div>Selected: {selectedObject ? 'Yes' : 'No'}</div>
                </div>
              </div>
            )}

            {/* Test Image Upload Panel */}
            <div className="bg-blue-50 rounded-2xl shadow-lg p-4">
              <h4 className="text-sm font-semibold text-blue-700 mb-2">Test Image Upload</h4>
              <div className="space-y-2">
                <button
                  onClick={() => {
                    if (fileInputRef.current) {
                      fileInputRef.current.click();
                    }
                  }}
                  className="w-full bg-blue-500 text-white px-3 py-2 rounded-lg text-sm hover:bg-blue-600 transition-colors"
                >
                  📁 Test Background Image Upload
                </button>
                <p className="text-xs text-blue-600">
                  Click to test background image upload
                </p>
                <button
                  onClick={() => {
                    // Create a fake file input event for testing
                    const fakeEvent = {
                      target: { files: [new File([''], 'test.png', { type: 'image/png' })] }
                    } as unknown as React.ChangeEvent<HTMLInputElement>;
                    handleBackgroundImageChange(fakeEvent);
                  }}
                  className="w-full bg-green-500 text-white px-3 py-2 rounded-lg text-sm hover:bg-green-600 transition-colors"
                >
                  🧪 Test Background Image Function
                </button>
                <button
                  onClick={() => {
                    // Test loading a template with background image
                    console.log('🧪 Testing template loading with background image...');
                    const testTemplate = {
                      backgroundColor: '#ffffff',
                      backgroundImage: 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChwGA60e6kgAAAABJRU5ErkJggg==',
                      canvasSize: '1200x1800',
                      objects: []
                    };
                    loadTemplateFromData('test', testTemplate);
                  }}
                  className="w-full bg-purple-500 text-white px-3 py-2 rounded-lg text-sm hover:bg-purple-600 transition-colors"
                >
                  🧪 Test Template Loading
                </button>
                <button
                  onClick={() => {
                    // Test text editing functionality
                    console.log('🧪 Testing text editing...');
                    if (canvas) {
                      const allObjects = canvas.getObjects();
                      const textObjects = allObjects.filter(obj => obj.type === 'text' || obj.type === 'i-text');
                      
                      if (textObjects.length > 0) {
                        const firstText = textObjects[0] as fabric.IText;
                        console.log('📝 First text object:', firstText.text);
                        const isInTextarea = document.activeElement?.tagName === 'TEXTAREA';
                        alert(`Text object found: "${firstText.text}"\n\nTry editing it in the textarea!\n\nCanvas Text Editing: ${isCanvasTextEditing ? 'ACTIVE' : 'INACTIVE'}\nTextarea Focused: ${isInTextarea ? 'YES' : 'NO'}\n\n💡 Backspace will work in textarea, but not on canvas!`);
                      } else {
                        console.log('❌ No text objects found');
                        alert('No text objects found. Add some text first!');
                      }
                    }
                  }}
                  className="w-full bg-orange-500 text-white px-3 py-2 rounded-lg text-sm hover:bg-orange-600 transition-colors"
                >
                  🧪 Test Text Editing
                </button>
                
                {/* Text Editing Status Indicator */}
                <div className={`w-full px-3 py-2 rounded-lg text-sm text-center font-medium ${
                  isCanvasTextEditing 
                    ? 'bg-red-100 text-red-700 border border-red-300' 
                    : 'bg-green-100 text-green-700 border border-green-300'
                }`}>
                  {isCanvasTextEditing ? '🔒 Canvas Text Editing: ACTIVE' : '🔓 Canvas Text Editing: INACTIVE'}
                </div>
              </div>
            </div>


            {selectedObject && (() => {
              console.log('🔍 Selected object type:', selectedObject.type);
              console.log('🔍 Selected object:', selectedObject);
              return selectedObject.type === 'text' || selectedObject.type === 'i-text';
            })() && (
              <div className="bg-white rounded-2xl shadow-lg p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Propiedades del Texto</h3>
                <div className="space-y-4">
                  {/* Text Content */}
                  <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-2">Contenido del Texto</label>
                    <div className="text-xs text-gray-500 mb-2">
                      💡 <strong>Nota:</strong> El backspace funciona normalmente aquí. Solo está deshabilitado cuando editas texto directamente en el canvas.
                    </div>
                    <textarea
                      value={(selectedObject as fabric.IText).text || ''}
                      onChange={(e) => {
                        if (selectedObject && (selectedObject.type === 'text' || selectedObject.type === 'i-text')) {
                          const newText = e.target.value;
                          
                          // Prevent completely empty text
                          if (newText.length === 0) {
                            (selectedObject as fabric.IText).set('text', ' ');
                          } else {
                            (selectedObject as fabric.IText).set('text', newText);
                          }
                          
                          canvas?.renderAll();
                          saveCanvasToHistory();
                        }
                      }}
                      rows={3}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm resize-none"
                      placeholder="Escribe tu texto aquí..."
                    />
                  </div>

                  {/* Font Family */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Fuente</label>
                    <select
                      value={(selectedObject as fabric.IText).fontFamily || 'Arial'}
                      onChange={(e) => {
                        if (selectedObject && (selectedObject.type === 'text' || selectedObject.type === 'i-text')) {
                          (selectedObject as fabric.IText).set('fontFamily', e.target.value);
                          canvas?.renderAll();
                          saveCanvasToHistory();
                        }
                      }}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm"
                    >
                      {fontFamilies.map(font => (
                        <option key={font} value={font}>{font}</option>
                      ))}
                    </select>
                    {/* Font Preview */}
                    <div className="mt-2 p-2 bg-gray-50 rounded-lg text-center">
                      <span 
                        className="text-lg"
                        style={{ 
                          fontFamily: (selectedObject as fabric.IText).fontFamily || 'Arial',
                          fontSize: '16px'
                        }}
                      >
                        AaBbCcDdEeFf
                      </span>
                      <div className="text-xs text-gray-500 mt-1">
                        {(selectedObject as fabric.IText).fontFamily || 'Arial'}
                      </div>
                    </div>
                  </div>

                  {/* Font Size */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Tamaño de Fuente: {(selectedObject as fabric.IText).fontSize || 48}px
                    </label>
                    <div className="space-y-2">
                      <input
                        type="range"
                        min="8"
                        max="200"
                        value={(selectedObject as fabric.IText).fontSize || 48}
                        onChange={(e) => {
                          if (selectedObject && (selectedObject.type === 'text' || selectedObject.type === 'i-text')) {
                            (selectedObject as fabric.IText).set('fontSize', parseInt(e.target.value));
                            canvas?.renderAll();
                            saveCanvasToHistory();
                          }
                        }}
                        className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer slider"
                      />
                      <div className="flex justify-between text-xs text-gray-500">
                        <span>8px</span>
                        <span>100px</span>
                        <span>200px</span>
                      </div>
                      {/* Quick Font Size Presets */}
                      <div className="flex flex-wrap gap-1 mt-2">
                        {[12, 16, 24, 32, 48, 64, 96].map(size => (
                          <button
                            key={size}
                            onClick={() => {
                              if (selectedObject && (selectedObject.type === 'text' || selectedObject.type === 'i-text')) {
                                (selectedObject as fabric.IText).set('fontSize', size);
                                canvas?.renderAll();
                                saveCanvasToHistory();
                              }
                            }}
                            className={`px-2 py-1 text-xs rounded border transition-colors ${
                              (selectedObject as fabric.IText).fontSize === size
                                ? 'bg-blue-500 text-white border-blue-500'
                                : 'bg-gray-100 text-gray-700 border-gray-300 hover:bg-gray-200'
                            }`}
                          >
                            {size}px
                          </button>
                        ))}
                      </div>
                    </div>
                    <input
                      type="number"
                      min="8"
                      max="200"
                      value={(selectedObject as fabric.IText).fontSize || 48}
                      onChange={(e) => {
                        if (selectedObject && (selectedObject.type === 'text' || selectedObject.type === 'i-text')) {
                          (selectedObject as fabric.IText).set('fontSize', parseInt(e.target.value));
                          canvas?.renderAll();
                          saveCanvasToHistory();
                        }
                      }}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm mt-2"
                    />
                  </div>

                  {/* Text Color */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Color del Texto</label>
                    <div className="flex items-center space-x-3">
                      <input
                        type="color"
                        value={(selectedObject as fabric.IText).fill as string || '#000000'}
                        onChange={(e) => {
                          if (selectedObject && (selectedObject.type === 'text' || selectedObject.type === 'i-text')) {
                            (selectedObject as fabric.IText).set('fill', e.target.value);
                            canvas?.renderAll();
                            saveCanvasToHistory();
                          }
                        }}
                        className="w-16 h-12 rounded-lg border border-gray-300 cursor-pointer"
                      />
                      <div className="flex-1">
                        <input
                          type="text"
                          value={(selectedObject as fabric.IText).fill as string || '#000000'}
                          onChange={(e) => {
                            if (selectedObject && (selectedObject.type === 'text' || selectedObject.type === 'i-text')) {
                              (selectedObject as fabric.IText).set('fill', e.target.value);
                              canvas?.renderAll();
                              saveCanvasToHistory();
                            }
                          }}
                          placeholder="#000000"
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm"
                        />
                      </div>
                    </div>
                  </div>

                  {/* Font Weight */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Estilo de Fuente</label>
                    <select
                      value={(selectedObject as fabric.IText).fontWeight || 'normal'}
                      onChange={(e) => {
                        if (selectedObject && (selectedObject.type === 'text' || selectedObject.type === 'i-text')) {
                          (selectedObject as fabric.IText).set('fontWeight', e.target.value);
                          canvas?.renderAll();
                          saveCanvasToHistory();
                        }
                      }}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm"
                    >
                      <option value="normal">Normal</option>
                      <option value="bold">Negrita</option>
                      <option value="100">100 - Thin</option>
                      <option value="200">200 - Extra Light</option>
                      <option value="300">300 - Light</option>
                      <option value="400">400 - Regular</option>
                      <option value="500">500 - Medium</option>
                      <option value="600">600 - Semi Bold</option>
                      <option value="700">700 - Bold</option>
                      <option value="800">800 - Extra Bold</option>
                      <option value="900">900 - Black</option>
                    </select>
                  </div>

                  {/* Text Alignment */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Alineación</label>
                    <div className="grid grid-cols-3 gap-2">
                      {[
                        { value: 'left', label: 'Izquierda', icon: '⫷' },
                        { value: 'center', label: 'Centro', icon: '⫸' },
                        { value: 'right', label: 'Derecha', icon: '⫹' }
                      ].map(align => (
                        <button
                          key={align.value}
                          onClick={() => {
                            if (selectedObject && (selectedObject.type === 'text' || selectedObject.type === 'i-text')) {
                              (selectedObject as fabric.IText).set('textAlign', align.value as 'left' | 'center' | 'right');
                              canvas?.renderAll();
                              saveCanvasToHistory();
                            }
                          }}
                          className={`p-2 rounded-lg border-2 transition-colors ${
                            (selectedObject as fabric.IText).textAlign === align.value
                              ? 'border-blue-500 bg-blue-50 text-blue-700'
                              : 'border-gray-300 hover:border-gray-400'
                          }`}
                          title={align.label}
                        >
                          <div className="text-lg">{align.icon}</div>
                          <div className="text-xs">{align.label}</div>
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            )}
            
            {/* Brand Kit Controls */}
            <div className="bg-white rounded-2xl shadow-lg p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Kit de Marca</h3>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Logo de Marca</label>
                  <input
                    type="file"
                    accept="image/*"
                    onChange={(e) => {
                      const file = e.target.files?.[0];
                      if (file) {
                        const reader = new FileReader();
                        reader.onload = (e) => {
                          setBrandKit(prev => ({ ...prev, logo: e.target?.result as string }));
                        };
                        reader.readAsDataURL(file);
                      }
                    }}
                    className="w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-medium file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
                  />
                  {brandKit.logo && (
                    <button
                      onClick={applyBrandLogo}
                      className="mt-2 w-full px-3 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 text-sm"
                    >
                      Aplicar Logo
                    </button>
                  )}
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Colores de Marca</label>
                  <div className="grid grid-cols-3 gap-2 mb-2">
                    <button
                      onClick={() => setBrandKit(prev => ({ ...prev, colors: { ...prev.colors, primary: '#00525b' } }))}
                      className="w-full h-8 rounded border-2 border-gray-300"
                      style={{ backgroundColor: '#00525b' }}
                      title="Color Primario"
                    />
                    <button
                      onClick={() => setBrandKit(prev => ({ ...prev, colors: { ...prev.colors, secondary: '#01aac7' } }))}
                      className="w-full h-8 rounded border-2 border-gray-300"
                      style={{ backgroundColor: '#01aac7' }}
                      title="Color Secundario"
                    />
                    <button
                      onClick={() => setBrandKit(prev => ({ ...prev, colors: { ...prev.colors, accent: '#32e0c5' } }))}
                      className="w-full h-8 rounded border-2 border-gray-300"
                      style={{ backgroundColor: '#32e0c5' }}
                      title="Color de Acento"
                    />
                  </div>
                  <button
                    onClick={applyBrandKitColors}
                    className="w-full px-3 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 text-sm"
                  >
                    Aplicar Colores
                  </button>
                </div>
              </div>
            </div>
            </div> {/* Close collapsible sidebar content */}
          </div>
          
          {/* Canvas */}
          <div className={`${sidebarCollapsed ? 'lg:col-span-3' : 'lg:col-span-3'} transition-all duration-300`}>
            <div className="bg-white rounded-2xl shadow-lg p-6">
              <div className="mb-4">
                <h3 className="text-lg font-semibold text-gray-900">Canvas</h3>
              </div>
              
              <div className="flex justify-center">
                <div 
                  className="relative border-2 border-gray-300 rounded-lg overflow-hidden shadow-lg"
                  onDragOver={handleDragOver}
                  onDrop={handleDrop}
                >
                  <canvas
                    ref={canvasRef}
                    className="block"
                    style={{ 
                      width: getCurrentCanvasSize().width, 
                      height: getCurrentCanvasSize().height
                    }}
                  />
                  
                  {/* Canvas Boundary Indicator */}
                  <div className="absolute inset-0 pointer-events-none border-2 border-blue-200 border-dashed opacity-50"></div>
                  
                  {/* Drag and drop overlay */}
                  <div className="absolute inset-0 pointer-events-none flex items-center justify-center opacity-0 transition-opacity duration-200 group-hover:opacity-100">
                    <div className="bg-black bg-opacity-50 text-white px-4 py-2 rounded-lg text-sm">
                      Arrastra imágenes aquí
                    </div>
                  </div>
                  
                  {/* Canvas Size Indicator */}
                  <div className="absolute top-2 right-2 bg-white bg-opacity-90 px-2 py-1 rounded text-xs text-gray-600 font-mono">
                    {getCurrentCanvasSize().width} × {getCurrentCanvasSize().height}
                  </div>
                </div>
              </div>
              
              {/* Upload instructions */}
              <div className="mt-4 text-center text-sm text-gray-600">
                <p>💡 <strong>Consejo:</strong> Haz clic en "Imagen" en el panel izquierdo o arrastra y suelta imágenes directamente en el canvas</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Hidden file input for image uploads */}
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        onChange={handleBackgroundImageChange}
        className="hidden"
      />

      {/* Custom CSS for slider */}
      <style jsx>{`
        .slider::-webkit-slider-thumb {
          appearance: none;
          height: 20px;
          width: 20px;
          border-radius: 50%;
          background: #3b82f6;
          cursor: pointer;
          border: 2px solid #ffffff;
          box-shadow: 0 2px 4px rgba(0,0,0,0.2);
        }
        
        .slider::-moz-range-thumb {
          height: 20px;
          width: 20px;
          border-radius: 50%;
          background: #3b82f6;
          cursor: pointer;
          border: 2px solid #ffffff;
          box-shadow: 0 2px 4px rgba(0,0,0,0.2);
        }
      `}</style>

      {/* Shape Selector Modal */}
      {showShapeSelector && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-2xl p-6 max-w-md w-full mx-4">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Seleccionar Forma</h3>
            <div className="grid grid-cols-2 gap-3">
              {shapeTypes.map((shape) => (
                <button
                  key={shape.id}
                  onClick={() => addShape(shape.id)}
                  className="p-4 border border-gray-200 rounded-lg hover:bg-gray-50 flex flex-col items-center space-y-2"
                >
                  <div className="text-2xl">{shape.icon}</div>
                  <span className="text-sm font-medium text-gray-700">{shape.name}</span>
                </button>
              ))}
            </div>
            <button
              onClick={() => setShowShapeSelector(false)}
              className="mt-4 w-full px-4 py-2 bg-gray-200 text-gray-800 rounded-lg hover:bg-gray-300"
            >
              Cancelar
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
