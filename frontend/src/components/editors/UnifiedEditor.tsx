'use client';
import React, { useState, useRef, useEffect, useCallback } from 'react';
import { 
  FloppyDisk, 
  Download, 
  FilePdf,
  TextT, 
  Image as ImageIcon, 
  Square, 
  Palette, 
  ArrowArcLeft,
  ArrowArcRight,
  Scissors,
  Trash
} from 'phosphor-react';
import { useAuth } from '@/context/AuthContext';
import * as fabric from 'fabric';
import API_ENDPOINTS from '@/config/api';
import { jsPDF } from 'jspdf';
import { buildDesignData, saveDesignToFiles, SaveOptions, getDataSize, exceedsSizeLimit, optimizeDesignData, createUltraMinimalDesignData } from '@/utils/saveData';
import { saveTemplateBackground, getTemplateBackground, deleteTemplateBackground, canvasToBase64, getImageTypeFromDataUrl } from '@/utils/templateBackgrounds';
import { findOverlappingObjects, getHighContrastColor, getObjectBounds, CanvasObject } from '@/utils/overlapUtils';
import { ColorHarmonyManager, initializeObjectColorState } from '@/utils/colorHarmony';

interface UnifiedEditorProps {
  id: string;
  editorType?: 'flyer' | 'social' | 'story' | 'badge' | 'banner' | 'document' | 'brochure' | 'square-post' | 'marketplace-flyer' | 'fb-feed-banner' | 'digital-badge';
  templateKey?: string; // For loading specific templates
}

interface EditorObject {
  id: string;
  type: 'text' | 'image' | 'shape' | 'placeholder' | 'path' | 'triangle';
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
  opacity?: number;
  stroke?: string;
  strokeWidth?: number;
  strokeLineCap?: string;
  strokeLineJoin?: string;
  strokeDashArray?: any;
  strokeDashOffset?: number;
  strokeUniform?: boolean;
  strokeMiterLimit?: number;
  shadow?: any;
  fillRule?: string;
  paintFirst?: string;
  globalCompositeOperation?: string;
  skewX?: number;
  skewY?: number;
  flipX?: boolean;
  flipY?: boolean;
  // Path-specific properties for wave shapes and other path objects
  pathData?: any;
  isPath?: boolean;
  // Gradient properties
  gradientType?: string;
  gradientColors?: string[];
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
  // Console log for UnifiedEditor component initialization
  console.log('🎯 UnifiedEditor Component Initialized');
  console.log('📝 Template ID:', id);
  console.log('🔑 Template Key:', templateKey);
  console.log('📋 Editor Type:', editorType);
  // Editor type configurations - moved to top to avoid initialization order issues
  const editorConfigs = {
    // Legacy types (for backward compatibility)
    flyer: {
      icon: '📢',
      name: 'Folleto',
      defaultSize: '1200x1800',
      sizes: [
        { value: '1200x1800', label: 'Folleto A4 (1200×1800)', width: 1200, height: 1800 },
        { value: '1200x1600', label: 'Folleto Cuadrado (1200×1600)', width: 1200, height: 1600 },
        { value: '800x1200', label: 'Folleto Pequeño (800×1200)', width: 800, height: 1200 }
      ]
    },
    social: {
      icon: '📱',
      name: 'Publicación Redes Sociales',
      defaultSize: '1080x1080',
      sizes: [
        { value: '1080x1080', label: 'Publicación Instagram (1080×1080)', width: 1080, height: 1080 },
        { value: '1200x630', label: 'Publicación Facebook (1200×630)', width: 1200, height: 630 },
        { value: '1200x1200', label: 'Publicación Twitter (1200×1200)', width: 1200, height: 1200 }
      ]
    },
    story: {
      icon: '📖',
      name: 'Historia',
      defaultSize: '1080x1920',
      sizes: [
        { value: '1080x1920', label: 'Historia Instagram (1080×1920)', width: 1080, height: 1920 },
        { value: '1080x1350', label: 'Historia Facebook (1080×1350)', width: 1080, height: 1350 },
        { value: '1080x1920', label: 'Historia WhatsApp (1080×1920)', width: 1080, height: 1920 }
      ]
    },
    badge: {
      icon: '🏷️',
      name: 'Insignia',
      defaultSize: '600x600',
      sizes: [
        { value: '600x600', label: 'Insignia Cuadrada (600×600)', width: 600, height: 600 },
        { value: '800x800', label: 'Insignia Grande (800×800)', width: 800, height: 800 },
        { value: '400x400', label: 'Insignia Pequeña (400×400)', width: 400, height: 400 }
      ]
    },
    banner: {
      icon: '🚩',
      name: 'Banner',
      defaultSize: '1200x628',
      sizes: [
        { value: '1200x628', label: 'Banner Facebook (1200×628)', width: 1200, height: 628 },
        { value: '1200x400', label: 'Feed Facebook (1200×400)', width: 1200, height: 400 },
        { value: '1200x300', label: 'Banner Web (1200×300)', width: 1200, height: 300 },
        { value: '1200x600', label: 'Banner Alto (1200×600)', width: 1200, height: 600 }
      ]
    },
    document: {
      icon: '📄',
      name: 'Documento',
      defaultSize: '2480x3508',
      sizes: [
        { value: '2480x3508', label: 'Documento A4 (2480×3508 px, 300 dpi)', width: 2480, height: 3508 },
        { value: '1200x1600', label: 'Documento A4 (1200×1600)', width: 1200, height: 1600 },
        { value: '1200x1800', label: 'Folleto (1200×1800)', width: 1200, height: 1800 },
        { value: '800x1200', label: 'Documento Pequeño (800×1200)', width: 800, height: 1200 }
      ]
    },
    brochure: {
      icon: '📋',
      name: 'Folleto',
      defaultSize: '2480x3508',
      sizes: [
        { value: '2480x3508', label: 'Folleto A4 (2480×3508 px, 300 dpi)', width: 2480, height: 3508 },
        { value: '1200x1800', label: 'Folleto Tríptico (1200×1800)', width: 1200, height: 1800 },
        { value: '1200x1600', label: 'Folleto Cuadrado (1200×1600)', width: 1200, height: 1600 },
        { value: '800x1200', label: 'Folleto Pequeño (800×1200)', width: 800, height: 1200 }
      ]
    },
    
    // New template types from CreateTemplateModal
    'square-post': {
      icon: '📱',
      name: 'Publicación Cuadrada IG/FB',
      defaultSize: '1080x1080',
      sizes: [
        { value: '1080x1080', label: 'Publicación Cuadrada IG/FB (1080×1080)', width: 1080, height: 1080 }
      ]
    },
    'marketplace-flyer': {
      icon: '📄',
      name: 'Folleto Marketplace',
      defaultSize: '1200x1500',
      sizes: [
        { value: '1200x1500', label: 'Folleto Marketplace (1200×1500)', width: 1200, height: 1500 }
      ]
    },
    'fb-feed-banner': {
      icon: '🚩',
      name: 'Banner Feed FB',
      defaultSize: '1200x628',
      sizes: [
        { value: '1200x628', label: 'Banner Feed FB (1200×628)', width: 1200, height: 628 }
      ]
    },
    'digital-badge': {
      icon: '🏷️',
      name: 'Insignia Digital / Tarjeta Visual',
      defaultSize: '1080x1350',
      sizes: [
        { value: '1080x1350', label: 'Insignia Digital (1080×1350)', width: 1080, height: 1350 }
      ]
    }
  };

  // Editor state
  const [editorTypeState, setEditorTypeState] = useState(editorType);
  
  // Get default canvas size based on editor type
  const getDefaultCanvasSize = (type: string) => {
    const config = editorConfigs[type as keyof typeof editorConfigs];
    return config ? config.defaultSize : '1200x1800';
  };
  
  const [canvasSize, setCanvasSize] = useState(getDefaultCanvasSize(editorType));
  const [backgroundColor, setBackgroundColor] = useState('#ffffff');
  const [backgroundImage, setBackgroundImage] = useState<string | null>(null);
  const [objects, setObjects] = useState<EditorObject[]>([]);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [editingTextId, setEditingTextId] = useState<string | null>(null);
  const [isCanvasTextEditing, setIsCanvasTextEditing] = useState<boolean>(false);
  
  // Zoom state
  const [zoomLevel, setZoomLevel] = useState<number>(100);
  
  // Context menu state
  const [contextMenu, setContextMenu] = useState<{
    visible: boolean;
    x: number;
    y: number;
    targetObject: any;
  }>({
    visible: false,
    x: 0,
    y: 0,
    targetObject: null
  });

  // Color harmony manager
  const [colorHarmonyManager, setColorHarmonyManager] = useState<ColorHarmonyManager | null>(null);
  const [isColorHarmonyActive, setIsColorHarmonyActive] = useState<boolean>(false);
  
  // UI state
  const [showShapeSelector, setShowShapeSelector] = useState(false);
  const [showColorPicker, setShowColorPicker] = useState(false);
  const [showFontSelector, setShowFontSelector] = useState(false);
  const [showDownloadDropdown, setShowDownloadDropdown] = useState(false);
  const [canvasDisplayScale, setCanvasDisplayScale] = useState(1);
  const [activeTab, setActiveTab] = useState('elements');
  const [showUpgradeModal, setShowUpgradeModal] = useState(false);
  const [tempBackgroundColor, setTempBackgroundColor] = useState<string | null>(null);
  const [showImagePreview, setShowImagePreview] = useState(false);
  const [previewImageData, setPreviewImageData] = useState<string | null>(null);
  const [currentBackgroundId, setCurrentBackgroundId] = useState<string | null>(null);

  // Gradient editor state
  const [showGradientEditor, setShowGradientEditor] = useState(false);
  const [gradientStops, setGradientStops] = useState([
    { id: '1', color: '#ff0000', offset: 0 },
    { id: '2', color: '#0000ff', offset: 100 }
  ]);

  
  // History and undo/redo
  const [history, setHistory] = useState<HistoryState[]>([]);
  const [historyIndex, setHistoryIndex] = useState(-1);
  
  // Drag and resize state
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  const [isDragOver, setIsDragOver] = useState(false);
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
  const { user } = useAuth();
  const userPlan = (user?.plan as 'Free' | 'Premium' | 'Ultra-Premium') || 'Free';

  // Check if user can perform premium actions
  const canPerformPremiumAction = (action: string) => {
    if (userPlan === 'Free') {
      setShowUpgradeModal(true);
      console.log(`🚫 Free plan restriction: ${action} requires upgrade`);
      return false;
    }
    return true;
  };
  
  // Templates will be loaded from database - no hard-coded data
  const [templates, setTemplates] = useState<any[]>([]);
  // Removed default templates - editors now only work with specific templates

  // Helper function to get a safe color value from fill property
  const getSafeColorValue = (fill: any): string => {
    if (typeof fill === 'string') {
      return fill;
    }
    if (fill && typeof fill === 'object' && fill.type === 'gradient') {
      // For gradient objects, return the first color stop or a default
      if (fill.colorStops && fill.colorStops.length > 0) {
        return fill.colorStops[0].color;
      }
    }
    return '#000000';
  };

  // Helper function to check if fill is a gradient
  const isGradientFill = (fill: any): boolean => {
    return fill && typeof fill === 'object' && fill.type === 'gradient';
  };

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

  // Font families - Clean, deduplicated list
  const fontFamilies = [
    // System Fonts
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
    'Palatino',
    'Garamond',
    'Bookman',
    'Avant Garde',
    'Helvetica Neue',
    'Geneva',
    'Lucida Grande',
    'Lucida Sans Unicode',
    'MS Sans Serif',
    'MS Serif',
    
    // Google Fonts - Sans Serif
    'Roboto',
    'Open Sans',
    'Lato',
    'Montserrat',
    'Poppins',
    'Inter',
    'Source Sans Pro',
    'Ubuntu',
    'Noto Sans',
    'Nunito',
    'Raleway',
    'PT Sans',
    'Droid Sans',
    'Fira Sans',
    'Oswald',
    'Century Gothic',
    'Futura',
    'Avenir',
    'Gill Sans',
    
    // Google Fonts - Serif
    'Crimson Text',
    'Libre Baskerville',
    'Lora',
    'Merriweather',
    'Playfair Display',
    'PT Serif',
    'Source Serif Pro',
    'Crimson Pro',
    'EB Garamond',
    'Libre Caslon Text',
    
    // Google Fonts - Display & Decorative
    'Bebas Neue',
    'Anton',
    'Righteous',
    'Fredoka One',
    'Bungee',
    'Lobster',
    'Pacifico',
    'Yellowtail',
    'Lobster Two',
    'Chewy',
    'Fredoka',
    
    // Google Fonts - Handwriting
    'Kalam',
    'Caveat',
    'Indie Flower',
    'Shadows Into Light',
    'Dancing Script',
    'Satisfy',
    'Great Vibes',
    'Kaushan Script',
    'Amatic SC',
    'Permanent Marker',
    
    // Google Fonts - Monospace
    'Roboto Mono',
    'Source Code Pro',
    'Fira Code',
    'JetBrains Mono',
    'Inconsolata',
    'Space Mono',
    'Cousine',
    'PT Mono',
    'Overpass Mono',
    'IBM Plex Mono',
    
    // Additional Popular Fonts
    'Work Sans',
    'DM Sans',
    'Manrope',
    'Epilogue',
    'Sora',
    'Plus Jakarta Sans',
    'Figtree',
    'Outfit',
    'Space Grotesk',
    'Cabinet Grotesk',
    'Satoshi',
    'Clash Display',
    'Chillax',
    'General Sans',
    'Geist',
    'Inter Tight',
    'Instrument Sans',
    'Red Hat Display',
    'Red Hat Text',
    'IBM Plex Sans',
    'IBM Plex Serif',
    'Recursive',
    'JetBrains Sans',
    'Overpass',
    'Public Sans',
    'Rubik',
    'Quicksand',
    'Mukti',
    'Titillium Web',
    'Exo',
    'Orbitron',
    'Rajdhani',
    'Abril Fatface',
    'Crete Round',
    'Fjalla One',
    'Francois One',
    'Josefin Sans',
    'Josefin Slab',
    'Kanit',
    'Maven Pro',
    'Muli',
    'Nunito Sans',
    'PT Sans Caption',
    'Quattrocento',
    'Quattrocento Sans',
    'Rokkitt',
    'Slabo 27px',
    'Slabo 13px',
    'Varela',
    'Varela Round',
    'Yanone Kaffeesatz',
    'Zilla Slab',
    'Archivo',
    'Archivo Black',
    'Archivo Narrow',
    'Asap',
    'Asap Condensed',
    'Barlow',
    'Barlow Condensed',
    'Barlow Semi Condensed',
    'Cabin',
    'Cabin Condensed',
    'Cabin Sketch',
    'Cantarell',
    'Cardo',
    'Chivo',
    'Comfortaa',
    'Cormorant',
    'Cormorant Garamond',
    'Cormorant Infant',
    'Cormorant SC',
    'Cormorant Unicase',
    'DM Mono',
    'DM Serif Display',
    'DM Serif Text',
    'Encode Sans',
    'Encode Sans Condensed',
    'Encode Sans Expanded',
    'Encode Sans Semi Condensed',
    'Encode Sans Semi Expanded',
    'Exo 2',
    'Fira Sans Condensed',
    'Fira Sans Extra Condensed',
    'Hind',
    'Hind Madurai',
    'Hind Siliguri',
    'Hind Vadodara',
    'Karla',
    'Libre Franklin',
    'Oxygen',
    'Oxygen Mono',
    'PT Sans Narrow',
    
    // Vladimir Script and Other Unique Fonts
    'Vladimir Script',
    'Acme',
    'Alegreya',
    'Alegreya Sans',
    'Alegreya SC',
    'Aleo',
    'Allerta',
    'Allerta Stencil',
    'Allura',
    'Almendra',
    'Almendra Display',
    'Almendra SC',
    'Amarante',
    'Amaranth',
    'Amethysta',
    'Anaheim',
    'Andada',
    'Andika',
    'Angkor',
    'Annie Use Your Telescope',
    'Anonymous Pro',
    'Antic',
    'Antic Didone',
    'Antic Slab',
    'Arapey',
    'Arbutus',
    'Arbutus Slab',
    'Architects Daughter',
    'Arimo',
    'Arizonia',
    'Armata',
    'Artifika',
    'Arvo',
    'Asset',
    'Astloch',
    'Asul',
    'Atomic Age',
    'Aubrey',
    'Audiowide',
    'Autour One',
    'Average',
    'Average Sans',
    'Averia Gruesa Libre',
    'Averia Libre',
    'Averia Sans Libre',
    'Averia Serif Libre',
    'Bad Script',
    'Balthazar',
    'Bangers',
    'Basic',
    'Battambang',
    'Baumans',
    'Bayon',
    'Belgrano',
    'Belleza',
    'BenchNine',
    'Bentham',
    'Berkshire Swash',
    'Bevan',
    'Bigelow Rules',
    'Bigshot One',
    'Bilbo',
    'Bilbo Swash Caps',
    'Biryani',
    'Bitter',
    'Black Ops One',
    'Bokor',
    'Bonbon',
    'Boogaloo',
    'Bowlby One',
    'Bowlby One SC',
    'Brawler',
    'Bree Serif',
    'Bubblegum Sans',
    'Bubbler One',
    'Buda',
    'Buenard',
    'Butcherman',
    'Butterfly Kids',
    'Caesar Dressing',
    'Cagliostro',
    'Calligraffitti',
    'Cambay',
    'Cambo',
    'Candal',
    'Cantata One',
    'Cantora One',
    'Capriola',
    'Carme',
    'Carrois Gothic',
    'Carrois Gothic SC',
    'Carter One',
    'Caudex',
    'Caveat Brush',
    'Cedarville Cursive',
    'Ceviche One',
    'Changa One',
    'Chango',
    'Chau Philomene One',
    'Chela One',
    'Chelsea Market',
    'Chenla',
    'Cherry Cream Soda',
    'Cherry Swash',
    'Chicle',
    'Cinzel',
    'Cinzel Decorative',
    'Clicker Script',
    'Coda',
    'Coda Caption',
    'Codystar',
    'Combo',
    'Coming Soon',
    'Concert One',
    'Condiment',
    'Content',
    'Contrail One',
    'Convergence',
    'Cookie',
    'Copse',
    'Corben',
    'Courgette',
    'Coustard',
    'Covered By Your Grace',
    'Crafty Girls',
    'Creepster',
    'Croissant One',
    'Crushed',
    'Cuprum',
    'Cutive',
    'Cutive Mono',
    'Damion',
    'Dangrek',
    'Dawning of a New Day',
    'Days One',
    'Dekko',
    'Delius',
    'Delius Swash Caps',
    'Delius Unicase',
    'Della Respira',
    'Denk One',
    'Devonshire',
    'Dhurjati',
    'Didact Gothic',
    'Diplomata',
    'Diplomata SC',
    'Domine',
    'Donegal One',
    'Doppio One',
    'Dorsa',
    'Dosis',
    'Dr Sugiyama',
    'Duru Sans',
    'Dynalight',
    'Eagle Lake',
    'Eater',
    'Economica',
    'Ek Mukta',
    'Electrolize',
    'Elsie',
    'Elsie Swash Caps',
    'Emblema One',
    'Emilys Candy',
    'Engagement',
    'Englebert',
    'Enriqueta',
    'Erica One',
    'Esteban',
    'Euphoria Script',
    'Ewert',
    'Expletus Sans',
    'Fanwood Text',
    'Fascinate',
    'Fascinate Inline',
    'Faster One',
    'Fasthand',
    'Fauna One',
    'Federant',
    'Federo',
    'Felipa',
    'Fenix',
    'Finger Paint',
    'Fjord One',
    'Flamenco',
    'Flavors',
    'Fondamento',
    'Fontdiner Swanky',
    'Forum',
    'Freckle Face',
    'Fredericka the Great',
    'Freehand',
    'Fresca',
    'Frijole',
    'Fruktur',
    'Fugaz One',
    'GFS Didot',
    'GFS Neohellenic',
    'Gabriela',
    'Gafata',
    'Galdeano',
    'Galindo',
    'Gentium Basic',
    'Gentium Book Basic',
    'Geo',
    'Geostar',
    'Geostar Fill',
    'Germania One',
    'Gidugu',
    'Gilda Display',
    'Give You Glory',
    'Glass Antiqua',
    'Glegoo',
    'Gloria Hallelujah',
    'Goblin One',
    'Gochi Hand',
    'Gorditas',
    'Goudy Bookletter 1911',
    'Graduate',
    'Grand Hotel',
    'Gravitas One',
    'Griffy',
    'Gruppo',
    'Gudea',
    'Gurajada',
    'Habibi',
    'Halant',
    'Hammersmith One',
    'Hanalei',
    'Hanalei Fill',
    'Handlee',
    'Hanuman',
    'Happy Monkey',
    'Harmattan',
    'Headland One',
    'Heebo',
    'Henny Penny',
    'Herr Von Muellerhoff',
    'Hind Guntur',
    'Yrsa',
    'ZCOOL KuaiLe',
    'ZCOOL QingKe HuangYou',
    'ZCOOL XiaoWei',
    'Zeyada',
    'Zhi Mang Xing'
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
    const config = editorConfigs[editorTypeState as keyof typeof editorConfigs];
    if (config) {
    setCanvasSize(config.defaultSize);
    setBackgroundColor('#ffffff');
    setBackgroundImage(null);
    setObjects([]);
    setHistory([]);
    setHistoryIndex(-1);
    } else {
      console.warn(`Editor type '${editorTypeState}' not found, falling back to 'flyer'`);
      const fallbackConfig = editorConfigs.flyer;
      setCanvasSize(fallbackConfig.defaultSize);
      setBackgroundColor('#ffffff');
      setBackgroundImage(null);
      setObjects([]);
      setHistory([]);
      setHistoryIndex(-1);
    }
  }, [editorTypeState]);
  
  // Auto-load template when templateKey is provided (from template gallery)
  useEffect(() => {
    if (canvas) {
      console.log('🎯 Canvas ready, determining loading strategy...');
      console.log('📝 Template key:', templateKey);
      console.log('🆔 Template ID:', id);
      
      // Priority: If we have an ID (not 'new'), load by ID first
      if (id && id !== 'new') {
        console.log('🎯 Loading template by ID (priority):', id);
      loadTemplateById(id).catch((fallbackError: any) => {
        console.error('❌ Error loading template by ID:', fallbackError);
          // No fallback - user must provide valid template ID
          console.log('❌ No fallback templates available - user must provide valid template ID');
        });
      } else if (templateKey) {
        // Template key provided but no loadTemplate function - require template ID
        console.log('❌ Template key provided but loading by key is not supported - please provide template ID');
      }
    }
  }, [templateKey, id, canvas]); // Added canvas to dependencies

    // Set default editor type when no specific template is loaded
  useEffect(() => {
    if (!templateKey && !id) {
      console.log('🔄 No specific template to load, setting default editor type');
      setEditorTypeState('flyer');
    }
  }, [templateKey, id]);

  // Update document title based on template
  useEffect(() => {
    console.log('🎯 Setting document title:', { templateKey, id, editorTypeState });
    
    let title: string;
    
    if (templateKey && templateKey.trim() !== '') {
      title = `Editor of ${templateKey}`;
      console.log('✅ Setting title to template:', title);
    } else if (id && id !== 'new') {
      title = `Editor of Template ${id}`;
      console.log('✅ Setting title to ID:', title);
    } else if (editorTypeState) {
      title = `Editor of ${editorTypeState.charAt(0).toUpperCase() + editorTypeState.slice(1)}`;
      console.log('✅ Setting title to editor type:', title);
    } else {
      title = `Editor Centro de Diseño`;
      console.log('✅ Setting default title:', title);
    }
    
    document.title = title;
  }, [templateKey, id, editorTypeState]);

  // Also update title when template data is loaded
  useEffect(() => {
    if (templates.length > 0 && id && id !== 'new') {
      const template = templates.find(t => t._id === id);
      if (template && template.name) {
        console.log('🎯 Found template in database:', template.name);
        document.title = `Editor of ${template.name}`;
      }
    }
  }, [templates, id]);

      // Set initial title immediately
  useEffect(() => {
    if (templateKey && templateKey.trim() !== '') {
      document.title = `Editor of ${templateKey}`;
    } else if (id && id !== 'new') {
      document.title = `Editor of Template ${id}`;
    } else if (editorTypeState) {
      document.title = `Editor of ${editorTypeState.charAt(0).toUpperCase() + editorTypeState.slice(1)}`;
      } else {
      document.title = `Editor Centro de Diseño`;
    }
  }, []); // Run only once on mount

  // Close dropdowns and modals when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
        const target = event.target as Element;
      
      // Close download dropdown
      if (showDownloadDropdown && !target.closest('.download-dropdown')) {
          setShowDownloadDropdown(false);
        }
      
      // Close shapes modal
      if (showShapeSelector && !target.closest('.shapes-container')) {
        setShowShapeSelector(false);
      }
      
      // Close color picker modal
      if (showColorPicker && !target.closest('.color-picker-container')) {
        setShowColorPicker(false);
      }
      
      // Close gradient editor
      if (showGradientEditor && !target.closest('.gradient-editor-container')) {
        setShowGradientEditor(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [showDownloadDropdown, showShapeSelector, showColorPicker, showGradientEditor]);
  
  // Initialize Fabric.js canvas
  useEffect(() => {
    console.log("973");
    if (canvasRef.current && !canvas) {
      console.log("975");
      const fabricCanvas = new fabric.Canvas(canvasRef.current, {
        width: getCurrentCanvasSize().width,
        height: getCurrentCanvasSize().height,
        backgroundColor: backgroundColor,
        selection: true,
        preserveObjectStacking: true,
        renderOnAddRemove: true,
        skipTargetFind: false,
        allowTouchScrolling: true
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
        console.log("1016");
        saveCanvasToHistory();
        // Trigger color harmony analysis when objects are modified
        if (isColorHarmonyActive && colorHarmonyManager) {
          console.log('🎨 Object modified - triggering color harmony analysis');
          startColorHarmony();
        }
      });
      
      // Trigger color harmony when objects are added
      fabricCanvas.on('object:added', () => {
        console.log("1027", isColorHarmonyActive, colorHarmonyManager);

        if (isColorHarmonyActive && colorHarmonyManager) {
          console.log('🎨 Object added - triggering color harmony analysis');
          startColorHarmony();
        }
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
      
      // Add right-click context menu support
      fabricCanvas.on('mouse:down', (e) => {
        // Check if it's a right-click (only for MouseEvent, not TouchEvent)
        if (e.e && 'button' in e.e && e.e.button === 2 && e.target) {
          // Right-click on an object - show context menu
          const rect = fabricCanvas.getSelectionElement();
          if (rect) {
            const canvasRect = rect.getBoundingClientRect();
            const mouseEvent = e.e as MouseEvent;
            showContextMenu({
              clientX: mouseEvent.clientX,
              clientY: mouseEvent.clientY,
              preventDefault: () => {},
              stopPropagation: () => {}
            } as React.MouseEvent, e.target);
          }
        }
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
          
          // Trigger color harmony analysis when objects are moving
          if (isColorHarmonyActive && colorHarmonyManager) {
        console.log("1096");

            console.log('🎨 Object moving - triggering color harmony analysis');
            startColorHarmony();
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
      console.log("fabricCanvas", fabricCanvas)
      setCanvas(fabricCanvas);
      
      // Initialize color harmony manager
      const harmonyManager = new ColorHarmonyManager(fabricCanvas);
      setColorHarmonyManager(harmonyManager);
      
      console.log("1109", canvas, colorHarmonyManager)
      // Add window resize handler
      const handleResize = () => {
        if (fabricCanvas) {
          fabricCanvas.renderAll();
        }
      };
      
      window.addEventListener('resize', handleResize);
      
      // Cleanup
      return () => {
        window.removeEventListener('resize', handleResize);
      };
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
      
      // Force a re-render to ensure proper display
      setTimeout(() => {
        canvas.renderAll();
      }, 100);
    }
  }, [canvas, editorTypeState, canvasSize, backgroundColor]);

  // Handle canvas size changes from template data
  useEffect(() => {
    if (canvas && canvasSize) {
      console.log('🔄 Canvas size changed, updating dimensions:', canvasSize);
      const [width, height] = canvasSize.split('x').map(Number);
      if (width && height) {
        canvas.setDimensions({ width, height });
        canvas.renderAll();
      }
    }
  }, [canvasSize, canvas]);

  // Cleanup canvas on unmount
  useEffect(() => {
    return () => {
      if (canvas) {
        canvas.dispose();
      }
    };
  }, [canvas]);

  // Load all templates from database on component mount
  useEffect(() => {
    const loadTemplatesFromDatabase = async () => {
      try {
        console.log('🚀 Loading templates from database...');
        
        // Load all templates
        const allTemplatesResponse = await fetch(API_ENDPOINTS.TEMPLATES);
        if (allTemplatesResponse.ok) {
          const allTemplates = await allTemplatesResponse.json();
          setTemplates(allTemplates);
          console.log('✅ All templates loaded:', allTemplates.length);
        }
        
        // Removed default and real estate template loading - editors now only work with specific templates
        
      } catch (error) {
        console.error('❌ Error loading templates from database:', error);
      }
    };
    
    loadTemplatesFromDatabase();
  }, []);

  // No more auto-loading of default templates - editors now only work with specific templates
  useEffect(() => {
    if (canvas && !templateKey && !id) {
      console.log('🔄 No template specified - editor will remain blank until template is selected');
      setEditorTypeState('flyer'); // Set default editor type but don't load any content
    } else {
      console.log('✅ Template specified, will be loaded');
    }
  }, [templateKey, id, canvas]);
  

  // Load user-saved design (for designs with saved content)
  async function loadUserSavedDesign(designData: any, templateData: any) {
    console.log('🚀 loadUserSavedDesign called with design data and template data');
    console.log('📊 Full designData structure:', JSON.stringify(designData, null, 2));
    console.log('📊 Full templateData structure:', JSON.stringify(templateData, null, 2));
    
    if (!canvas) {
      console.error('❌ Canvas is not ready');
      return;
    }
    
    // Clear current canvas
    canvas.clear();
    
    // Check for custom background from backend first
    let customBackgroundImage = null;
    let backgroundId = null;
    if (user?.id) {
      try {
        const result = await getTemplateBackground(id, user.id);
        if (result.success && result.background) {
          customBackgroundImage = result.background.imageData;
          backgroundId = result.background.id;
          console.log('🖼️ Found custom background for template:', id, 'from backend');
        }
      } catch (error) {
        console.warn('⚠️ Error reading custom backgrounds from backend:', error);
      }
    }

    // Set background from saved design - prioritize custom background
    const backgroundColor = designData.designData?.backgroundColor || templateData.backgroundColor || '#ffffff';
    setBackgroundColor(backgroundColor);
    setCurrentBackgroundId(backgroundId);
    
    // Load background image - prioritize custom background over saved design
    const backgroundImageToLoad = customBackgroundImage || (designData.designData && designData.designData.backgroundImage);
    if (backgroundImageToLoad) {
      console.log('🖼️ Loading background image...', customBackgroundImage ? 'custom' : 'saved');
      setBackgroundImage(backgroundImageToLoad);
      
      // Create and add background image to canvas
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
        
        // Mark the background image properly
        (fabricImage as any).isBackground = true;
        (fabricImage as any).selectable = false;
        (fabricImage as any).evented = false;
        (fabricImage as any).zIndex = -1000; // Ensure it's at the very bottom
        
        // Ensure background is at the very bottom
        const allObjects = canvas.getObjects();
        const nonBackgroundObjects = allObjects.filter(obj => (obj as any).isBackground !== true);
        
        // Remove all objects temporarily
        allObjects.forEach(obj => canvas.remove(obj));
        
        // Add background image first (bottom layer)
        canvas.add(fabricImage);
        
        // Sort non-background objects by z-index before adding them back
        nonBackgroundObjects.sort((a, b) => {
          const aZ = (a as any).zIndex || 0;
          const bZ = (b as any).zIndex || 0;
          return aZ - bZ;
        });
        
        // Add all other objects back (top layers) in proper order
        nonBackgroundObjects.forEach(obj => canvas.add(obj));
        
        // Set canvas background to transparent so image shows
        canvas.backgroundColor = 'transparent';
        
        // Render the canvas
        canvas.renderAll();
        
        console.log('✅ Background image loaded and positioned successfully');
        console.log('🎨 Canvas objects after background:', canvas.getObjects().length);
        console.log('📋 Objects after background processing:', canvas.getObjects().map((obj, i) => ({
          index: i + 1,
          type: obj.type,
          isBackground: (obj as any).isBackground
        })));
      };
      
      imgElement.onerror = (error) => {
        console.error('❌ Error loading background image:', error);
        console.error('❌ Background image URL:', backgroundImageToLoad);
        setBackgroundImage(null);
      };
      
      // Start loading the image
      imgElement.src = backgroundImageToLoad;
      
    } else {
      console.log('ℹ️ No user-saved background image found');
      setBackgroundImage(null);
    }
    
    // Set canvas background color (will be overridden if background image loads)
    canvas.backgroundColor = backgroundColor;
    
    // Load user-saved objects from design file
    if (designData.designData && designData.designData.objects && Array.isArray(designData.designData.objects)) {
      console.log(`🎨 Loading ${designData.designData.objects.length} user-saved objects from design file...`);
      console.log(`🔍 All objects from design file:`, JSON.stringify(designData.designData.objects, null, 2));
      
      // Log background image info for debugging
      if (designData.designData.backgroundImage) {
        console.log('🖼️ Background image URL for duplicate checking:', designData.designData.backgroundImage);
      }
      
      // Sort objects by z-index before loading them
      const sortedObjects = [...designData.designData.objects].sort((a, b) => {
        const aZ = a.zIndex || 0;
        const bZ = b.zIndex || 0;
        return aZ - bZ;
      });
      
      console.log('🔢 Objects sorted by z-index:', sortedObjects.map((obj, i) => ({
        index: i,
        type: obj.type,
        zIndex: obj.zIndex || 0
      })));
      
      sortedObjects.forEach((obj: any, index: number) => {
        // Use the same object loading logic as in loadTemplateFromData
        try {
          console.log(`🎨 Loading object ${index + 1}:`, {
            type: obj.type,
            left: obj.left,
            top: obj.top,
        path: obj.path,
        pathData: (obj as any).pathData,
        isPath: (obj as any).isPath,
        gradientType: obj.gradientType,
        gradientColors: obj.gradientColors,
        gradientStops: obj.gradientStops,
        gradientCoords: obj.gradientCoords
      });
      console.log(`📋 Full object ${index + 1} data:`, JSON.stringify(obj, null, 2));
          
          if (obj.type === 'text' || obj.type === 'i-text') {
            const text = new fabric.IText(obj.text || obj.content || 'Texto', {
              left: obj.left !== undefined && obj.left !== null ? obj.left : (obj.x !== undefined && obj.x !== null ? obj.x : 100),
              top: obj.top !== undefined && obj.top !== null ? obj.top : (obj.y !== undefined && obj.y !== null ? obj.y : 100),
              fontSize: obj.fontSize !== undefined && obj.fontSize !== null ? obj.fontSize : 48,
              fontFamily: obj.fontFamily || obj.font || 'Arial',
              fontWeight: obj.fontWeight || 'normal',
              fontStyle: obj.fontStyle || 'normal',
              textAlign: obj.textAlign || 'left',
              fill: obj.fill || obj.color || '#000000',
              selectable: true,
              editable: true,
              hasControls: true,
              scaleX: obj.scaleX !== undefined && obj.scaleX !== null ? obj.scaleX : 1,
              scaleY: obj.scaleY !== undefined && obj.scaleY !== null ? obj.scaleY : 1,
              angle: obj.angle !== undefined && obj.angle !== null ? obj.angle : (obj.rotation !== undefined && obj.rotation !== null ? obj.rotation : 0),
              width: obj.width !== undefined && obj.width !== null ? obj.width : undefined,
              height: obj.height !== undefined && obj.height !== null ? obj.height : undefined,
              opacity: obj.opacity !== undefined && obj.opacity !== null ? obj.opacity : 1,
              stroke: obj.stroke || 'transparent',
              strokeWidth: obj.strokeWidth !== undefined && obj.strokeWidth !== null ? obj.strokeWidth : 0,
              strokeLineCap: obj.strokeLineCap || 'butt',
              strokeLineJoin: obj.strokeLineJoin || 'miter',
              strokeDashArray: obj.strokeDashArray || null,
              strokeDashOffset: obj.strokeDashOffset !== undefined && obj.strokeDashOffset !== null ? obj.strokeDashOffset : 0,
              strokeUniform: obj.strokeUniform || false,
              strokeMiterLimit: obj.strokeMiterLimit !== undefined && obj.strokeMiterLimit !== null ? obj.strokeMiterLimit : 4,
              shadow: obj.shadow || null,
              fillRule: obj.fillRule || 'nonzero',
              paintFirst: obj.paintFirst || 'fill',
              globalCompositeOperation: obj.globalCompositeOperation || 'source-over',
              skewX: obj.skewX !== undefined && obj.skewX !== null ? obj.skewX : 0,
              skewY: obj.skewY !== undefined && obj.skewY !== null ? obj.skewY : 0,
              flipX: obj.flipX || false,
              flipY: obj.flipY || false
            });
            
            // Restore gradient using helper function
            restoreGradient(obj, text);
            
            canvas.add(text);
            
            // Initialize color state with original color from saved JSON data
            initializeObjectColorState(text, obj);
            
            console.log(`✅ Text object loaded with enhanced properties:`, {
              text: obj.text || obj.content,
              fontSize: text.fontSize,
              fontFamily: text.fontFamily,
              fontWeight: text.fontWeight,
              fontStyle: text.fontStyle,
              fill: text.fill,
              stroke: text.stroke,
              strokeWidth: text.strokeWidth,
              scaleX: text.scaleX,
              scaleY: text.scaleY,
              angle: text.angle,
              opacity: text.opacity,
              gradientType: (text as any).gradientType,
              gradientColors: (text as any).gradientColors
            });
          } else if (obj.type === 'image') {
            // Skip image objects that are the same as the background image to avoid duplication
            if (obj.src && obj.src !== backgroundImageToLoad) {
              const imgElement = new Image();
              imgElement.crossOrigin = 'anonymous';
              imgElement.onload = () => {
                const fabricImage = new fabric.Image(imgElement, {
                  left: obj.left !== undefined && obj.left !== null ? obj.left : (obj.x !== undefined && obj.x !== null ? obj.x : 100),
                  top: obj.top !== undefined && obj.top !== null ? obj.top : (obj.y !== undefined && obj.y !== null ? obj.y : 100),
                  scaleX: obj.scaleX !== undefined && obj.scaleX !== null ? obj.scaleX : 1,
                  scaleY: obj.scaleY !== undefined && obj.scaleY !== null ? obj.scaleY : 1,
                  angle: obj.angle !== undefined && obj.angle !== null ? obj.angle : (obj.rotation !== undefined && obj.rotation !== null ? obj.rotation : 0),
                  opacity: obj.opacity !== undefined && obj.opacity !== null ? obj.opacity : 1,
                  selectable: true,
                  evented: true
                });
                canvas.add(fabricImage);
                canvas.renderAll();
              };
              imgElement.src = obj.src;
            } else if (obj.src === backgroundImageToLoad) {
              console.log('🚫 Skipping duplicate image object (same as background):', obj.src);
            }
          } else if (obj.type === 'rect' || obj.type === 'rectangle') {
            // Determine initial fill - use solid color if it's a gradient object, let restoreGradient handle it
            let initialFill = '#cccccc'; // default
            if (typeof obj.fill === 'string') {
              initialFill = obj.fill;
            } else if (obj.color) {
              initialFill = obj.color;
            }
            
            const rect = new fabric.Rect({
              left: obj.left !== undefined && obj.left !== null ? obj.left : (obj.x !== undefined && obj.x !== null ? obj.x : 100),
              top: obj.top !== undefined && obj.top !== null ? obj.top : (obj.y !== undefined && obj.y !== null ? obj.y : 100),
              width: obj.width !== undefined && obj.width !== null ? obj.width : 100,
              height: obj.height !== undefined && obj.height !== null ? obj.height : 100,
              fill: initialFill, // Set initial fill to a solid color
              stroke: obj.stroke || 'transparent',
              strokeWidth: obj.strokeWidth !== undefined && obj.strokeWidth !== null ? obj.strokeWidth : 0,
              strokeLineCap: obj.strokeLineCap || 'butt',
              strokeLineJoin: obj.strokeLineJoin || 'miter',
              rx: obj.rx !== undefined && obj.rx !== null ? obj.rx : 0,  // Rounded corner radius X
              ry: obj.ry !== undefined && obj.ry !== null ? obj.ry : 0,  // Rounded corner radius Y
              scaleX: obj.scaleX !== undefined && obj.scaleX !== null ? obj.scaleX : 1,
              scaleY: obj.scaleY !== undefined && obj.scaleY !== null ? obj.scaleY : 1,
              angle: obj.angle !== undefined && obj.angle !== null ? obj.angle : (obj.rotation !== undefined && obj.rotation !== null ? obj.rotation : 0),
              opacity: obj.opacity !== undefined && obj.opacity !== null ? obj.opacity : 1,
              selectable: true,
              hasControls: true
            });
            
            // Restore gradient using helper function
            console.log(`🔍 About to call restoreGradient for rect (loadUserSavedDesign):`, {
              gradientType: obj.gradientType,
              gradientColors: obj.gradientColors,
              hasGradientType: !!obj.gradientType,
              hasGradientColors: !!obj.gradientColors,
              gradientColorsLength: obj.gradientColors ? obj.gradientColors.length : 0,
              currentFill: rect.fill
            });
            
            // Always call restoreGradient if gradient metadata exists
            if (obj.gradientType && obj.gradientColors && obj.gradientColors.length >= 2) {
              console.log(`🔍 Calling restoreGradient for rect with gradient metadata (loadUserSavedDesign)`);
              restoreGradient(obj, rect);
            } else {
              console.log(`🔍 Skipping restoreGradient for rect - no gradient metadata (loadUserSavedDesign)`);
            }
            
            canvas.add(rect);
            console.log(`✅ Rectangle loaded with all properties:`, {
              left: rect.left,
              top: rect.top,
              width: rect.width,
              height: rect.height,
              fill: rect.fill,
              stroke: rect.stroke,
              strokeWidth: rect.strokeWidth,
              rx: rect.rx,
              ry: rect.ry,
              scaleX: rect.scaleX,
              scaleY: rect.scaleY,
              angle: rect.angle,
              opacity: rect.opacity
            });
          } else if (obj.type === 'circle') {
            const circle = new fabric.Circle({
              left: obj.left !== undefined && obj.left !== null ? obj.left : (obj.x !== undefined && obj.x !== null ? obj.x : 100),
              top: obj.top !== undefined && obj.top !== null ? obj.top : (obj.y !== undefined && obj.y !== null ? obj.y : 100),
              radius: obj.radius !== undefined && obj.radius !== null ? obj.radius : ((obj.width !== undefined && obj.width !== null ? obj.width : 100) / 2),
              fill: obj.fill || obj.color || '#cccccc',
              stroke: obj.stroke || 'transparent',
              strokeWidth: obj.strokeWidth !== undefined && obj.strokeWidth !== null ? obj.strokeWidth : 0,
              strokeLineCap: obj.strokeLineCap || 'butt',
              strokeLineJoin: obj.strokeLineJoin || 'miter',
              scaleX: obj.scaleX !== undefined && obj.scaleX !== null ? obj.scaleX : 1,
              scaleY: obj.scaleY !== undefined && obj.scaleY !== null ? obj.scaleY : 1,
              angle: obj.angle !== undefined && obj.angle !== null ? obj.angle : (obj.rotation !== undefined && obj.rotation !== null ? obj.rotation : 0),
              opacity: obj.opacity !== undefined && obj.opacity !== null ? obj.opacity : 1,
              selectable: true,
              hasControls: true
            });
            canvas.add(circle);
            console.log(`✅ Circle loaded with all properties:`, {
              left: circle.left,
              top: circle.top,
              radius: circle.radius,
              fill: circle.fill,
              stroke: circle.stroke,
              strokeWidth: circle.strokeWidth,
              scaleX: circle.scaleX,
              scaleY: circle.scaleY,
              angle: circle.angle,
              opacity: circle.opacity
            });
          } else if (obj.type === 'triangle') {
            const triangle = new fabric.Triangle({
              left: obj.left !== undefined && obj.left !== null ? obj.left : (obj.x !== undefined && obj.x !== null ? obj.x : 100),
              top: obj.top !== undefined && obj.top !== null ? obj.top : (obj.y !== undefined && obj.y !== null ? obj.y : 100),
              width: obj.width !== undefined && obj.width !== null ? obj.width : 100,
              height: obj.height !== undefined && obj.height !== null ? obj.height : 100,
              fill: obj.fill || obj.color || '#cccccc',
              stroke: obj.stroke || 'transparent',
              strokeWidth: obj.strokeWidth !== undefined && obj.strokeWidth !== null ? obj.strokeWidth : 0,
              strokeLineCap: obj.strokeLineCap || 'butt',
              strokeLineJoin: obj.strokeLineJoin || 'miter',
              strokeDashArray: obj.strokeDashArray || null,
              strokeDashOffset: obj.strokeDashOffset !== undefined && obj.strokeDashOffset !== null ? obj.strokeDashOffset : 0,
              strokeUniform: obj.strokeUniform || false,
              strokeMiterLimit: obj.strokeMiterLimit !== undefined && obj.strokeMiterLimit !== null ? obj.strokeMiterLimit : 4,
              scaleX: obj.scaleX !== undefined && obj.scaleX !== null ? obj.scaleX : 1,
              scaleY: obj.scaleY !== undefined && obj.scaleY !== null ? obj.scaleY : 1,
              angle: obj.angle !== undefined && obj.angle !== null ? obj.angle : (obj.rotation !== undefined && obj.rotation !== null ? obj.rotation : 0),
              opacity: obj.opacity !== undefined && obj.opacity !== null ? obj.opacity : 1,
              selectable: true,
              hasControls: true,
              fillRule: obj.fillRule || 'nonzero',
              paintFirst: obj.paintFirst || 'fill',
              globalCompositeOperation: obj.globalCompositeOperation || 'source-over',
              skewX: obj.skewX !== undefined && obj.skewX !== null ? obj.skewX : 0,
              skewY: obj.skewY !== undefined && obj.skewY !== null ? obj.skewY : 0,
              flipX: obj.flipX || false,
              flipY: obj.flipY || false
            });
            
            // Restore gradient properties if they exist
            if (obj.gradientType) {
              (triangle as any).gradientType = obj.gradientType;
            }
            if (obj.gradientColors) {
              (triangle as any).gradientColors = obj.gradientColors;
              
              // Recreate the actual gradient fill
              if (obj.gradientType === 'teal-blue' && obj.gradientColors.length >= 2) {
                const gradient = new fabric.Gradient({
                  type: 'linear',
                  coords: {
                    x1: 0,
                    y1: 0,
                    x2: triangle.width || 200,
                    y2: 0
                  },
                  colorStops: [
                    { offset: 0, color: obj.gradientColors[0] },   // Teal on left
                    { offset: 1, color: obj.gradientColors[1] }     // Blue on right
                  ]
                });
                triangle.set('fill', gradient);
                console.log('🎨 Teal → Blue gradient restored for triangle');
              } else if (obj.gradientType === 'blue-teal' && obj.gradientColors.length >= 2) {
                const gradient = new fabric.Gradient({
                  type: 'linear',
                  coords: {
                    x1: 0,
                    y1: 0,
                    x2: triangle.width || 200,
                    y2: 0
                  },
                  colorStops: [
                    { offset: 0, color: obj.gradientColors[0] },   // Blue on left
                    { offset: 1, color: obj.gradientColors[1] }     // Teal on right
                  ]
                });
                triangle.set('fill', gradient);
                console.log('🎨 Blue → Teal gradient restored for triangle');
              }
            }
            
            canvas.add(triangle);
            console.log(`✅ Triangle object loaded with enhanced properties:`, {
              left: triangle.left,
              top: triangle.top,
              width: triangle.width,
              height: triangle.height,
              fill: triangle.fill,
              stroke: triangle.stroke,
              strokeWidth: triangle.strokeWidth,
              scaleX: triangle.scaleX,
              scaleY: triangle.scaleY,
              angle: triangle.angle,
              opacity: triangle.opacity,
              gradientType: (triangle as any).gradientType,
              gradientColors: (triangle as any).gradientColors
            });
          } else if (obj.type === 'path' && (obj.path || (obj as any).pathData)) {
            // Handle path objects (like waves) with path or pathData property
            const pathData = obj.path || (obj as any).pathData;
            console.log(`🎯 Creating fabric.Path for wave with pathData:`, pathData);
            console.log(`🔍 Full path object data:`, JSON.stringify(obj, null, 2));
            const path = new fabric.Path(pathData, {
              left: obj.left !== undefined && obj.left !== null ? obj.left : (obj.x !== undefined && obj.x !== null ? obj.x : 100),
              top: obj.top !== undefined && obj.top !== null ? obj.top : (obj.y !== undefined && obj.y !== null ? obj.y : 100),
              fill: obj.fill || obj.color || '#cccccc',
              stroke: obj.stroke || 'transparent',
              strokeWidth: obj.strokeWidth !== undefined && obj.strokeWidth !== null ? obj.strokeWidth : 0,
              strokeLineCap: obj.strokeLineCap || 'butt',
              strokeLineJoin: obj.strokeLineJoin || 'miter',
              strokeDashArray: obj.strokeDashArray || null,
              strokeDashOffset: obj.strokeDashOffset || 0,
              strokeUniform: obj.strokeUniform || false,
              strokeMiterLimit: obj.strokeMiterLimit || 4,
              scaleX: obj.scaleX !== undefined && obj.scaleX !== null ? obj.scaleX : 1,
              scaleY: obj.scaleY !== undefined && obj.scaleY !== null ? obj.scaleY : 1,
              angle: obj.angle !== undefined && obj.angle !== null ? obj.angle : (obj.rotation !== undefined && obj.rotation !== null ? obj.rotation : 0),
              selectable: true,
              hasControls: true,
              opacity: obj.opacity !== undefined && obj.opacity !== null ? obj.opacity : 1,
              fillRule: obj.fillRule || 'nonzero',
              paintFirst: obj.paintFirst || 'fill',
              globalCompositeOperation: obj.globalCompositeOperation || 'source-over',
              skewX: obj.skewX || 0,
              skewY: obj.skewY || 0,
              flipX: obj.flipX || false,
              flipY: obj.flipY || false
            });
            
            // Restore gradient properties if they exist
            if (obj.gradientType) {
              (path as any).gradientType = obj.gradientType;
            }
            if (obj.gradientColors) {
              (path as any).gradientColors = obj.gradientColors;
              
              // Recreate the actual gradient fill
              if (obj.gradientType === 'teal-blue' && obj.gradientColors.length >= 2) {
                const gradient = new fabric.Gradient({
                  type: 'linear',
                  coords: {
                    x1: 0,
                    y1: 0,
                    x2: path.width || 200,
                    y2: 0
                  },
                  colorStops: [
                    { offset: 0, color: obj.gradientColors[0] },   // Teal on left
                    { offset: 1, color: obj.gradientColors[1] }     // Blue on right
                  ]
                });
                path.set('fill', gradient);
                console.log('🎨 Teal → Blue gradient restored for wave shape');
              } else if (obj.gradientType === 'blue-teal' && obj.gradientColors.length >= 2) {
                const gradient = new fabric.Gradient({
                  type: 'linear',
                  coords: {
                    x1: 0,
                    y1: 0,
                    x2: path.width || 200,
                    y2: 0
                  },
                  colorStops: [
                    { offset: 0, color: obj.gradientColors[0] },   // Blue on left
                    { offset: 1, color: obj.gradientColors[1] }     // Teal on right
                  ]
                });
                path.set('fill', gradient);
                console.log('🎨 Blue → Teal gradient restored for wave shape');
              }
            }
            
            canvas.add(path);
            console.log(`✅ Path object (wave) loaded with path data from design file:`, {
              left: path.left,
              top: path.top,
              fill: path.fill,
              stroke: path.stroke,
              pathData: pathData,
              gradientType: (path as any).gradientType,
              gradientColors: (path as any).gradientColors
            });
          } else if (obj.type === 'shape' && (obj as any).pathData) {
            // Handle shape objects that have path data (like waves)
            console.log(`🎯 Creating fabric.Path for shape with pathData:`, (obj as any).pathData);
            const path = new fabric.Path((obj as any).pathData, {
              left: obj.left !== undefined && obj.left !== null ? obj.left : (obj.x !== undefined && obj.x !== null ? obj.x : 100),
              top: obj.top !== undefined && obj.top !== null ? obj.top : (obj.y !== undefined && obj.y !== null ? obj.y : 100),
              fill: obj.fill || obj.color || '#cccccc',
              stroke: obj.stroke || 'transparent',
              strokeWidth: obj.strokeWidth !== undefined && obj.strokeWidth !== null ? obj.strokeWidth : 0,
              strokeLineCap: obj.strokeLineCap || 'butt',
              strokeLineJoin: obj.strokeLineJoin || 'miter',
              strokeDashArray: obj.strokeDashArray || null,
              strokeDashOffset: obj.strokeDashOffset || 0,
              strokeUniform: obj.strokeUniform || false,
              strokeMiterLimit: obj.strokeMiterLimit || 4,
              scaleX: obj.scaleX !== undefined && obj.scaleX !== null ? obj.scaleX : 1,
              scaleY: obj.scaleY !== undefined && obj.scaleY !== null ? obj.scaleY : 1,
              angle: obj.angle !== undefined && obj.angle !== null ? obj.angle : (obj.rotation !== undefined && obj.rotation !== null ? obj.rotation : 0),
              selectable: true,
              hasControls: true,
              opacity: obj.opacity !== undefined && obj.opacity !== null ? obj.opacity : 1,
              fillRule: obj.fillRule || 'nonzero',
              paintFirst: obj.paintFirst || 'fill',
              globalCompositeOperation: obj.globalCompositeOperation || 'source-over',
              skewX: obj.skewX || 0,
              skewY: obj.skewY || 0,
              flipX: obj.flipX || false,
              flipY: obj.flipY || false
            });
            
            // Restore gradient properties if they exist
            if (obj.gradientType) {
              (path as any).gradientType = obj.gradientType;
            }
            if (obj.gradientColors) {
              (path as any).gradientColors = obj.gradientColors;
              
              // Recreate the actual gradient fill
              if (obj.gradientType === 'teal-blue' && obj.gradientColors.length >= 2) {
                const gradient = new fabric.Gradient({
                  type: 'linear',
                  coords: {
                    x1: 0,
                    y1: 0,
                    x2: path.width || 200,
                    y2: 0
                  },
                  colorStops: [
                    { offset: 0, color: obj.gradientColors[0] },   // Teal on left
                    { offset: 1, color: obj.gradientColors[1] }     // Blue on right
                  ]
                });
                path.set('fill', gradient);
                console.log('🎨 Teal → Blue gradient restored for shape with pathData');
              } else if (obj.gradientType === 'blue-teal' && obj.gradientColors.length >= 2) {
                const gradient = new fabric.Gradient({
                  type: 'linear',
                  coords: {
                    x1: 0,
                    y1: 0,
                    x2: path.width || 200,
                    y2: 0
                  },
                  colorStops: [
                    { offset: 0, color: obj.gradientColors[0] },   // Blue on left
                    { offset: 1, color: obj.gradientColors[1] }     // Teal on right
                  ]
                });
                path.set('fill', gradient);
                console.log('🎨 Blue → Teal gradient restored for shape with pathData');
              }
            }
            
            canvas.add(path);
            console.log(`✅ Shape object with path data (wave) loaded:`, {
              left: path.left,
              top: path.top,
              fill: path.fill,
              stroke: path.stroke,
              pathData: (obj as any).pathData,
              gradientType: (path as any).gradientType,
              gradientColors: (path as any).gradientColors
            });
          } else if ((obj as any).pathData || (obj as any).isPath) {
            // Catch-all for any object that has pathData or isPath flag (wave shapes)
            const pathData = (obj as any).pathData || obj.path;
            console.log(`🎯 Catch-all: Creating fabric.Path for object with pathData/isPath:`, {
              type: obj.type,
              pathData: pathData,
              isPath: (obj as any).isPath
            });
            const path = new fabric.Path(pathData, {
              left: obj.left !== undefined && obj.left !== null ? obj.left : (obj.x !== undefined && obj.x !== null ? obj.x : 100),
              top: obj.top !== undefined && obj.top !== null ? obj.top : (obj.y !== undefined && obj.y !== null ? obj.y : 100),
              fill: obj.fill || obj.color || '#cccccc',
              stroke: obj.stroke || 'transparent',
              strokeWidth: obj.strokeWidth !== undefined && obj.strokeWidth !== null ? obj.strokeWidth : 0,
              strokeLineCap: obj.strokeLineCap || 'butt',
              strokeLineJoin: obj.strokeLineJoin || 'miter',
              strokeDashArray: obj.strokeDashArray || null,
              strokeDashOffset: obj.strokeDashOffset || 0,
              strokeUniform: obj.strokeUniform || false,
              strokeMiterLimit: obj.strokeMiterLimit || 4,
              scaleX: obj.scaleX !== undefined && obj.scaleX !== null ? obj.scaleX : 1,
              scaleY: obj.scaleY !== undefined && obj.scaleY !== null ? obj.scaleY : 1,
              angle: obj.angle !== undefined && obj.angle !== null ? obj.angle : (obj.rotation !== undefined && obj.rotation !== null ? obj.rotation : 0),
              selectable: true,
              hasControls: true,
              opacity: obj.opacity !== undefined && obj.opacity !== null ? obj.opacity : 1,
              fillRule: obj.fillRule || 'nonzero',
              paintFirst: obj.paintFirst || 'fill',
              globalCompositeOperation: obj.globalCompositeOperation || 'source-over',
              skewX: obj.skewX || 0,
              skewY: obj.skewY || 0,
              flipX: obj.flipX || false,
              flipY: obj.flipY || false
            });
            
            // Restore gradient properties if they exist
            if (obj.gradientType) {
              (path as any).gradientType = obj.gradientType;
            }
            if (obj.gradientColors) {
              (path as any).gradientColors = obj.gradientColors;
              
              // Recreate the actual gradient fill
              if (obj.gradientType === 'teal-blue' && obj.gradientColors.length >= 2) {
                const gradient = new fabric.Gradient({
                  type: 'linear',
                  coords: {
                    x1: 0,
                    y1: 0,
                    x2: path.width || 200,
                    y2: 0
                  },
                  colorStops: [
                    { offset: 0, color: obj.gradientColors[0] },   // Teal on left
                    { offset: 1, color: obj.gradientColors[1] }     // Blue on right
                  ]
                });
                path.set('fill', gradient);
                console.log('🎨 Teal → Blue gradient restored for catch-all path object');
              } else if (obj.gradientType === 'blue-teal' && obj.gradientColors.length >= 2) {
                const gradient = new fabric.Gradient({
                  type: 'linear',
                  coords: {
                    x1: 0,
                    y1: 0,
                    x2: path.width || 200,
                    y2: 0
                  },
                  colorStops: [
                    { offset: 0, color: obj.gradientColors[0] },   // Blue on left
                    { offset: 1, color: obj.gradientColors[1] }     // Teal on right
                  ]
                });
                path.set('fill', gradient);
                console.log('🎨 Blue → Teal gradient restored for catch-all path object');
              }
            }
            
            canvas.add(path);
            console.log(`✅ Catch-all path object (wave) loaded:`, {
              left: path.left,
              top: path.top,
              fill: path.fill,
              stroke: path.stroke,
              pathData: pathData,
              gradientType: (path as any).gradientType,
              gradientColors: (path as any).gradientColors
            });
          }
        } catch (error) {
          console.error(`❌ Error loading object ${index + 1}:`, error, obj);
        }
      });
    } else {
      console.log('ℹ️ No user-saved objects found in design file');
    }
    
    // Wait a bit for objects to load, then render
    setTimeout(() => {
      // Ensure proper layering: background image at bottom, objects on top
      const allObjects = canvas.getObjects();
      const backgroundObjects = allObjects.filter(obj => (obj as any).isBackground === true);
      const contentObjects = allObjects.filter(obj => (obj as any).isBackground !== true);
      
      console.log('🔍 Before final layering - Total objects:', allObjects.length);
      console.log('🔍 Background objects found:', backgroundObjects.length);
      console.log('🔍 Content objects found:', contentObjects.length);
      
      // Remove all objects temporarily
      allObjects.forEach(obj => canvas.remove(obj));
      
      // Add background objects first (bottom layer)
      backgroundObjects.forEach(obj => canvas.add(obj));
      
      // Sort content objects by z-index before adding them
      contentObjects.sort((a, b) => {
        const aZ = (a as any).zIndex || 0;
        const bZ = (b as any).zIndex || 0;
        return aZ - bZ;
      });
      
      // Add content objects on top in proper order
      contentObjects.forEach(obj => canvas.add(obj));
      
      canvas.renderAll();
      saveCanvasToHistory();
      
      const finalObjectCount = canvas.getObjects().length;
      console.log('✅ User-saved design loaded successfully');
      console.log('🎨 Final canvas objects:', finalObjectCount);
      console.log('🖼️ Background objects:', backgroundObjects.length);
      console.log('🎨 Content objects:', contentObjects.length);
      
      // Log detailed object information for debugging
      console.log('📋 Detailed object breakdown:');
      const finalObjects = canvas.getObjects();
      finalObjects.forEach((obj, index) => {
        const objInfo: any = {
          index: index + 1,
          type: obj.type,
          left: obj.left,
          top: obj.top,
          width: obj.width,
          height: obj.height,
          isBackground: (obj as any).isBackground
        };
        
        if (obj.type === 'i-text') {
          objInfo.text = (obj as fabric.IText).text;
        } else if (obj.type === 'image') {
          objInfo.src = (obj as any).src || 'unknown';
        } else if (obj.type === 'path') {
          objInfo.pathData = (obj as any).pathData ? 'present' : 'missing';
        }
        
        console.log(`🎨 Object ${index + 1}:`, objInfo);
        console.log(`📋 Full object ${index + 1} details:`, JSON.stringify(obj, null, 2));
      });
      
      // Add brand kit logo after user-saved design is loaded
      setTimeout(async () => {
        await addBrandKitLogoIfNeeded();
      }, 300);
    }, 100);
  };
  

  // Load template from data (for updated templates)
  async function loadTemplateFromData(templateKey: string, templateData: any) {
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
    
    // Clear current canvas completely
    canvas.clear();
    canvas.renderAll();
    
    // Clear any existing objects from state
    setObjects([]);
    setSelectedObject(null);
    
    // Clear history to prevent conflicts
    setHistory([]);
    setHistoryIndex(-1);
    
    // Reset background
    setBackgroundColor('#ffffff');
    setBackgroundImage(null);
    
    console.log('🧹 Canvas and state completely cleared');
    
    // Set canvas size from template data
    if (templateData.canvasSize) {
      console.log('📐 Setting canvas size from template data:', templateData.canvasSize);
      setCanvasSize(templateData.canvasSize);
      
      // Parse canvas size and set canvas dimensions
      const [width, height] = templateData.canvasSize.split('x').map(Number);
      if (width && height) {
        canvas.setDimensions({ width, height });
        console.log('📐 Canvas dimensions set to:', width, 'x', height);
      }
    }
    
    // Check for custom background from backend first
    let customBackgroundImage = null;
    let backgroundId = null;
    if (user?.id) {
      try {
        const result = await getTemplateBackground(id, user.id);
        if (result.success && result.background) {
          customBackgroundImage = result.background.imageData;
          backgroundId = result.background.id;
          console.log('🖼️ Found custom background for template:', id, 'from backend');
        }
      } catch (error) {
        console.warn('⚠️ Error reading custom backgrounds from backend:', error);
      }
    }

    // Set background with fallbacks - prioritize custom background
    const backgroundColor = templateData.backgroundColor || '#ffffff';
    const backgroundImage = customBackgroundImage || templateData.backgroundImage || null;
    
    setBackgroundColor(backgroundColor);
    setBackgroundImage(backgroundImage);
    setCurrentBackgroundId(backgroundId);
    
    // Set canvas background color
    canvas.backgroundColor = backgroundColor;
    
    // Set background image if present
    if (backgroundImage) {
      console.log('🖼️ Setting background image from template data');
      // Note: Fabric.js background image handling would go here if needed
    } else {
      console.log('🎨 Using background color only:', backgroundColor);
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
              left: obj.left !== undefined && obj.left !== null ? obj.left : (obj.x !== undefined && obj.x !== null ? obj.x : 100),
              top: obj.top !== undefined && obj.top !== null ? obj.top : (obj.y !== undefined && obj.y !== null ? obj.y : 100),
              fontSize: obj.fontSize !== undefined && obj.fontSize !== null ? obj.fontSize : 48,
               fill: obj.fill || obj.color || '#000000',
               fontFamily: obj.fontFamily || obj.font || 'Arial',
               fontWeight: obj.fontWeight || 'normal',
              fontStyle: obj.fontStyle || 'normal',
               textAlign: obj.textAlign || 'left',
               selectable: true,
              hasControls: true,
              scaleX: obj.scaleX !== undefined && obj.scaleX !== null ? obj.scaleX : 1,
              scaleY: obj.scaleY !== undefined && obj.scaleY !== null ? obj.scaleY : 1,
              angle: obj.angle !== undefined && obj.angle !== null ? obj.angle : (obj.rotation !== undefined && obj.rotation !== null ? obj.rotation : 0),
              width: obj.width !== undefined && obj.width !== null ? obj.width : undefined,
              height: obj.height !== undefined && obj.height !== null ? obj.height : undefined,
              opacity: obj.opacity !== undefined && obj.opacity !== null ? obj.opacity : 1,
               stroke: obj.stroke || 'transparent',
              strokeWidth: obj.strokeWidth !== undefined && obj.strokeWidth !== null ? obj.strokeWidth : 0,
               strokeLineCap: obj.strokeLineCap || 'butt',
               strokeLineJoin: obj.strokeLineJoin || 'miter',
              strokeDashArray: obj.strokeDashArray || null,
              strokeDashOffset: obj.strokeDashOffset !== undefined && obj.strokeDashOffset !== null ? obj.strokeDashOffset : 0,
              strokeUniform: obj.strokeUniform || false,
              strokeMiterLimit: obj.strokeMiterLimit !== undefined && obj.strokeMiterLimit !== null ? obj.strokeMiterLimit : 4,
              shadow: obj.shadow || null,
              fillRule: obj.fillRule || 'nonzero',
              paintFirst: obj.paintFirst || 'fill',
              globalCompositeOperation: obj.globalCompositeOperation || 'source-over',
              skewX: obj.skewX !== undefined && obj.skewX !== null ? obj.skewX : 0,
              skewY: obj.skewY !== undefined && obj.skewY !== null ? obj.skewY : 0,
              flipX: obj.flipX || false,
              flipY: obj.flipY || false
            });
            
            // Restore gradient using helper function
            restoreGradient(obj, text);
            
            canvas.add(text);
            
            // Initialize color state with original color from saved JSON data
            initializeObjectColorState(text, obj);
            
            console.log(`✅ Text object loaded with enhanced properties:`, {
              text: obj.text || obj.content,
              fontSize: text.fontSize,
              fontFamily: text.fontFamily,
              fontWeight: text.fontWeight,
              fontStyle: text.fontStyle,
              fill: text.fill,
              stroke: text.stroke,
              strokeWidth: text.strokeWidth,
              scaleX: text.scaleX,
              scaleY: text.scaleY,
              angle: text.angle,
              opacity: text.opacity,
              gradientType: (text as any).gradientType,
              gradientColors: (text as any).gradientColors
            });
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
                  selectable: true,
                  opacity: obj.opacity || 1,
                  stroke: obj.stroke || 'transparent',
                  strokeWidth: obj.strokeWidth || 0,
                  strokeLineCap: obj.strokeLineCap || 'butt',
                  strokeLineJoin: obj.strokeLineJoin || 'miter',
                  shadow: obj.shadow || null
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
            // Determine initial fill - use solid color if it's a gradient object, let restoreGradient handle it
            let initialFill = '#3b82f6'; // default
            if (typeof obj.fill === 'string') {
              initialFill = obj.fill;
            } else if (obj.color) {
              initialFill = obj.color;
            }
            
            const rect = new fabric.Rect({
              left: obj.left || obj.x || 0,
              top: obj.top || obj.y || 0,
              width: obj.width || 200,
              height: obj.height || 200,
              fill: initialFill,
              stroke: obj.stroke || obj.borderColor || 'transparent',
              strokeWidth: obj.strokeWidth || obj.borderWidth || 0,
              rx: obj.rx || 0,  // Rounded corner radius X
              ry: obj.ry || 0,  // Rounded corner radius Y
              strokeLineCap: obj.strokeLineCap || 'butt',
              strokeLineJoin: obj.strokeLineJoin || 'miter',
              scaleX: obj.scaleX || 1,
              scaleY: obj.scaleY || 1,
              angle: obj.angle || obj.rotation || 0,
              selectable: true,
              opacity: obj.opacity || 1,
              shadow: obj.shadow || null
            });
            
            // Restore gradient using helper function
            console.log(`🔍 About to call restoreGradient for rect:`, {
              gradientType: obj.gradientType,
              gradientColors: obj.gradientColors,
              hasGradientType: !!obj.gradientType,
              hasGradientColors: !!obj.gradientColors,
              gradientColorsLength: obj.gradientColors ? obj.gradientColors.length : 0,
              currentFill: rect.fill
            });
            
            // Always call restoreGradient if gradient metadata exists
            if (obj.gradientType && obj.gradientColors && obj.gradientColors.length >= 2) {
              console.log(`🔍 Calling restoreGradient for rect with gradient metadata`);
              restoreGradient(obj, rect);
            } else {
              console.log(`🔍 Skipping restoreGradient for rect - no gradient metadata`);
            }
            
            canvas.add(rect);
            
            // Initialize color state with original color from saved JSON data
            initializeObjectColorState(rect, obj);
            
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
              selectable: true,
              opacity: obj.opacity || 1,
              shadow: obj.shadow || null
            });
            
            // Restore gradient using helper function
            restoreGradient(obj, circle);
            
            canvas.add(circle);
            
            // Initialize color state with original color from saved JSON data
            initializeObjectColorState(circle, obj);
            
            console.log(`✅ Circle object loaded with radius: ${obj.radius}`);
            break;
            
          case 'triangle':
            const triangle = new fabric.Triangle({
              left: obj.left !== undefined && obj.left !== null ? obj.left : (obj.x !== undefined && obj.x !== null ? obj.x : 100),
              top: obj.top !== undefined && obj.top !== null ? obj.top : (obj.y !== undefined && obj.y !== null ? obj.y : 100),
              width: obj.width !== undefined && obj.width !== null ? obj.width : 200,
              height: obj.height !== undefined && obj.height !== null ? obj.height : 200,
              fill: obj.fill || obj.color || '#3b82f6',
              stroke: obj.stroke || obj.borderColor || 'transparent',
              strokeWidth: obj.strokeWidth !== undefined && obj.strokeWidth !== null ? obj.strokeWidth : 0,
              strokeLineCap: obj.strokeLineCap || 'butt',
              strokeLineJoin: obj.strokeLineJoin || 'miter',
              strokeDashArray: obj.strokeDashArray || null,
              strokeDashOffset: obj.strokeDashOffset !== undefined && obj.strokeDashOffset !== null ? obj.strokeDashOffset : 0,
              strokeUniform: obj.strokeUniform || false,
              strokeMiterLimit: obj.strokeMiterLimit !== undefined && obj.strokeMiterLimit !== null ? obj.strokeMiterLimit : 4,
              scaleX: obj.scaleX !== undefined && obj.scaleX !== null ? obj.scaleX : 1,
              scaleY: obj.scaleY !== undefined && obj.scaleY !== null ? obj.scaleY : 1,
              angle: obj.angle !== undefined && obj.angle !== null ? obj.angle : (obj.rotation !== undefined && obj.rotation !== null ? obj.rotation : 0),
              selectable: true,
              hasControls: true,
              opacity: obj.opacity !== undefined && obj.opacity !== null ? obj.opacity : 1,
              fillRule: obj.fillRule || 'nonzero',
              paintFirst: obj.paintFirst || 'fill',
              globalCompositeOperation: obj.globalCompositeOperation || 'source-over',
              skewX: obj.skewX !== undefined && obj.skewX !== null ? obj.skewX : 0,
              skewY: obj.skewY !== undefined && obj.skewY !== null ? obj.skewY : 0,
              flipX: obj.flipX || false,
              flipY: obj.flipY || false,
              shadow: obj.shadow || null
            });
            
            // Restore gradient using helper function
            restoreGradient(obj, triangle);
            
            canvas.add(triangle);
            
            // Initialize color state with original color from saved JSON data
            initializeObjectColorState(triangle, obj);
            
            console.log(`✅ Triangle object loaded with enhanced properties:`, {
              left: triangle.left,
              top: triangle.top,
              width: triangle.width,
              height: triangle.height,
              fill: triangle.fill,
              stroke: triangle.stroke,
              strokeWidth: triangle.strokeWidth,
              scaleX: triangle.scaleX,
              scaleY: triangle.scaleY,
              angle: triangle.angle,
              opacity: triangle.opacity,
              gradientType: (triangle as any).gradientType,
              gradientColors: (triangle as any).gradientColors
            });
            break;
            
          case 'polygon':
            if (obj.points && Array.isArray(obj.points)) {
              const polygon = new fabric.Polygon(obj.points, {
                left: obj.left || obj.x || 0,
                top: obj.top || obj.y || 0,
                fill: obj.fill || obj.color || '#3b82f6',
                stroke: obj.stroke || obj.borderColor || 'transparent',
                strokeWidth: obj.strokeWidth || obj.borderWidth || 0,
                strokeLineCap: obj.strokeLineCap || 'butt',
                strokeLineJoin: obj.strokeLineJoin || 'miter',
                scaleX: obj.scaleX || 1,
                scaleY: obj.scaleY || 1,
                angle: obj.angle || obj.rotation || 0,
                selectable: true,
                hasControls: true,
                opacity: obj.opacity || 1,
                shadow: obj.shadow || null
              });
              canvas.add(polygon);
              console.log(`✅ Polygon object loaded`);
            }
            break;
            
          case 'path':
            if (obj.path || (obj as any).pathData) {
              const pathData = obj.path || (obj as any).pathData;
              const path = new fabric.Path(pathData, {
                left: obj.left || obj.x || 0,
                top: obj.top || obj.y || 0,
                fill: obj.fill || obj.color || '#3b82f6',
                stroke: obj.stroke || obj.borderColor || 'transparent',
                strokeWidth: obj.strokeWidth || obj.borderWidth || 0,
                strokeLineCap: obj.strokeLineCap || 'butt',
                strokeLineJoin: obj.strokeLineJoin || 'miter',
                strokeDashArray: obj.strokeDashArray || null,
                strokeDashOffset: obj.strokeDashOffset || 0,
                strokeUniform: obj.strokeUniform || false,
                strokeMiterLimit: obj.strokeMiterLimit || 4,
                scaleX: obj.scaleX || 1,
                scaleY: obj.scaleY || 1,
                angle: obj.angle || obj.rotation || 0,
                selectable: true,
                hasControls: true,
                opacity: obj.opacity || 1,
                shadow: obj.shadow || null,
                fillRule: obj.fillRule || 'nonzero',
                paintFirst: obj.paintFirst || 'fill',
                globalCompositeOperation: obj.globalCompositeOperation || 'source-over',
                skewX: obj.skewX || 0,
                skewY: obj.skewY || 0,
                flipX: obj.flipX || false,
                flipY: obj.flipY || false
              });
              
              // Restore gradient using helper function
              restoreGradient(obj, path);
              canvas.add(path);
              console.log(`✅ Path object loaded with path data:`, pathData ? 'yes' : 'no');
            } else {
              console.warn(`⚠️ Path object missing both 'path' and 'pathData' properties:`, obj);
            }
            break;
            
          case 'shape':
            // Handle shape objects that have path data (like waves)
            if ((obj as any).pathData) {
              const path = new fabric.Path((obj as any).pathData, {
                left: obj.left || obj.x || 0,
                top: obj.top || obj.y || 0,
                fill: obj.fill || obj.color || '#3b82f6',
                stroke: obj.stroke || obj.borderColor || 'transparent',
                strokeWidth: obj.strokeWidth || obj.borderWidth || 0,
                strokeLineCap: obj.strokeLineCap || 'butt',
                strokeLineJoin: obj.strokeLineJoin || 'miter',
                strokeDashArray: obj.strokeDashArray || null,
                strokeDashOffset: obj.strokeDashOffset || 0,
                strokeUniform: obj.strokeUniform || false,
                strokeMiterLimit: obj.strokeMiterLimit || 4,
                scaleX: obj.scaleX || 1,
                scaleY: obj.scaleY || 1,
                angle: obj.angle || obj.rotation || 0,
                selectable: true,
                hasControls: true,
                opacity: obj.opacity || 1,
                shadow: obj.shadow || null,
                fillRule: obj.fillRule || 'nonzero',
                paintFirst: obj.paintFirst || 'fill',
                globalCompositeOperation: obj.globalCompositeOperation || 'source-over',
                skewX: obj.skewX || 0,
                skewY: obj.skewY || 0,
                flipX: obj.flipX || false,
                flipY: obj.flipY || false
              });
              
              // Restore gradient using helper function
              restoreGradient(obj, path);
              canvas.add(path);
              console.log(`✅ Shape object with path data (wave) loaded`);
            } else {
              // Fallback to rectangle for regular shapes
              const rect = new fabric.Rect({
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
                selectable: true,
                hasControls: true,
                opacity: obj.opacity || 1,
                shadow: obj.shadow || null
              });
              
              // Restore gradient using helper function
              restoreGradient(obj, rect);
              
              canvas.add(rect);
              console.log(`✅ Regular shape object loaded as rectangle`);
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
    
    // Check if this is a user-saved design or a fresh template
    if (templateData.designFilename) {
      console.log('📁 Loading user-saved design data from designFilename field:', templateData.designFilename);
      try {
        const designResponse = await fetch(API_ENDPOINTS.GET_DESIGN(templateData.designFilename));
        if (designResponse.ok) {
          const designData = await designResponse.json();
          console.log('✅ User-saved design data loaded from designFilename:', designData);
          
          // Load user-saved background image (not template defaults)
          if (designData.designData && designData.designData.backgroundImage) {
            console.log('🖼️ Loading user-saved background image...');
            setBackgroundImage(designData.designData.backgroundImage);
          } else {
            console.log('ℹ️ No user-saved background image found');
            setBackgroundImage(null);
          }
          
          // Load user-saved objects from design file
          if (designData.designData && designData.designData.objects && Array.isArray(designData.designData.objects)) {
            console.log(`🎨 Loading ${designData.designData.objects.length} user-saved objects from design file...`);
            designData.designData.objects.forEach((obj: any, index: number) => {
              loadObjectToCanvas(obj, index);
            });
          } else {
            console.log('ℹ️ No user-saved objects found in design file');
          }
        } else {
          console.warn('⚠️ Failed to load user-saved design file, falling back to database objects');
          throw new Error('User-saved design file not found');
        }
      } catch (fileError) {
        console.warn('⚠️ Error loading user-saved design file, falling back to database objects:', fileError);
        // Load user-saved objects from database
        if (templateData.objects && Array.isArray(templateData.objects)) {
          console.log(`🎨 Loading ${templateData.objects.length} user-saved objects from database...`);
          templateData.objects.forEach((obj: any, index: number) => {
            loadObjectToCanvas(obj, index);
          });
        } else {
          console.log('ℹ️ No user-saved objects found in database');
        }
      }
    } else {
      // This is a fresh template or template with default objects
      console.log('🆕 Fresh template detected - checking for default objects...');
      setBackgroundImage(null);
      
      // Load default objects from database if they exist
      if (templateData.objects && Array.isArray(templateData.objects) && templateData.objects.length > 0) {
        console.log(`🎨 Loading ${templateData.objects.length} default objects from database...`);
        templateData.objects.forEach((obj: any, index: number) => {
          loadObjectToCanvas(obj, index);
        });
      } else {
        console.log('🆕 No default objects found - starting with clean canvas');
      }
    }
    
    // Wait a bit for objects to load, then render
    setTimeout(() => {
      canvas.renderAll();
      saveCanvasToHistory();
      
      // Check if brand kit logo should be added to existing templates (after canvas is fully rendered)
              setTimeout(async () => {
          await addBrandKitLogoIfNeeded();
        }, 200);
      
      const finalObjectCount = canvas.getObjects().length;
      if (templateData.designFilename) {
        console.log('✅ User-saved design loaded successfully:', templateKey);
        console.log('🎨 Final canvas objects:', finalObjectCount);
      } else {
        console.log('✅ Fresh template loaded successfully:', templateKey);
        console.log('🎨 Final canvas objects:', finalObjectCount, '(clean canvas)');
      }
      
      // Final render to ensure everything is displayed
      canvas.renderAll();
      
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
  
  // Save canvas state to history
  const saveCanvasToHistory = useCallback(() => {
    if (canvas) {
      // Get the current state of all objects from the Fabric.js canvas
      const canvasObjects = canvas.getObjects();
      const canvasState = canvas.toJSON();
      
      // Convert Fabric.js objects to our EditorObject format
      const currentObjects: EditorObject[] = canvasObjects.map((obj: fabric.Object) => {
                  // For path objects (like waves), preserve the path data
          if (obj.type === 'path') {
            const pathObj = obj as fabric.Path;
            console.log('🔍 saveCanvasToHistory - Path object found:', {
              type: pathObj.type,
              path: pathObj.path,
              hasPath: !!pathObj.path,
              pathLength: pathObj.path ? pathObj.path.length : 0
            });
            return {
              id: (obj as any).id || `obj_${Date.now()}_${Math.random()}`,
              type: 'path' as const,  // Keep as 'path' type for proper identification
              x: obj.left || 0,
              y: obj.top || 0,
              width: obj.width || 100,
              height: obj.height || 100,
              content: '',
              color: (obj as any).fill || '#000000',
              fontSize: 16,
              fontFamily: 'Arial',
              rotation: obj.angle || 0,
              zIndex: (obj as any).zIndex || 0,
              opacity: obj.opacity || 1,
              stroke: (obj as any).stroke || 'transparent',
              strokeWidth: (obj as any).strokeWidth || 0,
              strokeLineCap: (obj as any).strokeLineCap || 'butt',
              strokeLineJoin: (obj as any).strokeLineJoin || 'miter',
              strokeDashArray: (obj as any).strokeDashArray || null,
              strokeDashOffset: (obj as any).strokeDashOffset || 0,
              strokeUniform: (obj as any).strokeUniform || false,
              strokeMiterLimit: (obj as any).strokeMiterLimit || 4,
              shadow: (obj as any).shadow || null,
              fillRule: (obj as any).fillRule || 'nonzero',
              paintFirst: (obj as any).paintFirst || 'fill',
              globalCompositeOperation: (obj as any).globalCompositeOperation || 'source-over',
              skewX: (obj as any).skewX || 0,
              skewY: (obj as any).strokeY || 0,
              flipX: (obj as any).flipX || false,
              flipY: (obj as any).flipY || false,
              // Preserve path-specific data
              pathData: pathObj.path,
              isPath: true,
              // Preserve gradient properties
              gradientType: (pathObj as any).gradientType || null,
              gradientColors: (pathObj as any).gradientColors || null
            };
          }
          
          // For triangle objects, preserve all properties exactly
          if (obj.type === 'triangle') {
            const triangleObj = obj as fabric.Triangle;
            console.log('🔍 saveCanvasToHistory - Triangle object found:', {
              type: triangleObj.type,
              left: triangleObj.left,
              top: triangleObj.top,
              width: triangleObj.width,
              height: triangleObj.height,
              fill: triangleObj.fill,
              stroke: triangleObj.stroke,
              strokeWidth: triangleObj.strokeWidth
            });
            return {
              id: (obj as any).id || `obj_${Date.now()}_${Math.random()}`,
              type: 'triangle' as const,  // Keep as 'triangle' type for proper identification
              x: obj.left || 0,
              y: obj.top || 0,
              width: obj.width || 100,
              height: obj.height || 100,
              content: '',
              color: (obj as any).fill || '#000000',
              fontSize: 16,
              fontFamily: 'Arial',
              rotation: obj.angle || 0,
              zIndex: (obj as any).zIndex || 0,
              opacity: obj.opacity || 1,
              stroke: (obj as any).stroke || 'transparent',
              strokeWidth: (obj as any).strokeWidth || 0,
              strokeLineCap: (obj as any).strokeLineCap || 'butt',
              strokeLineJoin: (obj as any).strokeLineJoin || 'miter',
              strokeDashArray: (obj as any).strokeDashArray || null,
              strokeDashOffset: (obj as any).strokeDashOffset || 0,
              strokeUniform: (obj as any).strokeUniform || false,
              strokeMiterLimit: (obj as any).strokeMiterLimit || 4,
              shadow: (obj as any).shadow || null,
              fillRule: (obj as any).fillRule || 'nonzero',
              paintFirst: (obj as any).paintFirst || 'fill',
              globalCompositeOperation: (obj as any).globalCompositeOperation || 'source-over',
              skewX: (obj as any).skewX || 0,
              skewY: (obj as any).skewY || 0,
              flipX: (obj as any).flipX || false,
              flipY: (obj as any).flipY || false,
              // Preserve gradient properties
              gradientType: (triangleObj as any).gradientType || null,
              gradientColors: (triangleObj as any).gradientColors || null
            };
          }
          
          // For text objects, preserve all properties exactly
          if (obj.type === 'text' || obj.type === 'i-text') {
            const textObj = obj as fabric.IText;
            console.log('🔍 saveCanvasToHistory - Text object found:', {
              type: textObj.type,
              text: textObj.text,
              fontSize: textObj.fontSize,
              fontFamily: textObj.fontFamily,
              fontWeight: textObj.fontWeight,
              fontStyle: textObj.fontStyle,
              fill: textObj.fill,
              stroke: textObj.stroke,
              strokeWidth: textObj.strokeWidth
            });
            return {
              id: (obj as any).id || `obj_${Date.now()}_${Math.random()}`,
              type: 'text' as const,  // Keep as 'text' type for proper identification
              x: obj.left || 0,
              y: obj.top || 0,
              width: obj.width || 100,
              height: obj.height || 100,
              content: textObj.text || '',
              color: (obj as any).fill || '#000000',
              fontSize: textObj.fontSize || 16,
              fontFamily: textObj.fontFamily || 'Arial',
              fontWeight: textObj.fontWeight || 'normal',
              fontStyle: textObj.fontStyle || 'normal',
              textAlign: textObj.textAlign || 'left',
              rotation: obj.angle || 0,
              zIndex: (obj as any).zIndex || 0,
              opacity: obj.opacity || 1,
              stroke: (obj as any).stroke || 'transparent',
              strokeWidth: (obj as any).strokeWidth || 0,
              strokeLineCap: (obj as any).strokeLineCap || 'butt',
              strokeLineJoin: (obj as any).strokeLineJoin || 'miter',
              strokeDashArray: (obj as any).strokeDashArray || null,
              strokeDashOffset: (obj as any).strokeDashOffset || 0,
              strokeUniform: (obj as any).strokeUniform || false,
              strokeMiterLimit: (obj as any).strokeMiterLimit || 4,
              shadow: (obj as any).shadow || null,
              fillRule: (obj as any).fillRule || 'nonzero',
              paintFirst: (obj as any).paintFirst || 'fill',
              globalCompositeOperation: (obj as any).globalCompositeOperation || 'source-over',
              skewX: (obj as any).skewX || 0,
              skewY: (obj as any).skewY || 0,
              flipX: (obj as any).flipX || false,
              flipY: (obj as any).flipY || false,
              // Preserve gradient properties for text
              gradientType: (textObj as any).gradientType || null,
              gradientColors: (textObj as any).gradientColors || null
            };
          }
        
        return {
        id: (obj as any).id || `obj_${Date.now()}_${Math.random()}`,
        type: (obj.type === 'text' || obj.type === 'i-text' ? 'text' : 
               obj.type === 'image' ? 'image' : 
                 obj.type === 'placeholder' ? 'placeholder' : 
                 obj.type === 'path' ? 'path' : 'shape') as 'text' | 'image' | 'shape' | 'placeholder' | 'path',
        x: obj.left || 0,
        y: obj.top || 0,
        width: obj.width || 100,
        height: obj.height || 100,
        content: (obj as any).text || '',
        color: (obj as any).fill || '#000000',
        fontSize: (obj as any).fontSize || 16,
        fontFamily: (obj as any).fontFamily || 'Arial',
        rotation: obj.angle || 0,
        zIndex: (obj as any).zIndex || 0,
        opacity: obj.opacity || 1,
        stroke: (obj as any).stroke || 'transparent',
        strokeWidth: (obj as any).strokeWidth || 0,
        strokeLineCap: (obj as any).strokeLineCap || 'butt',
        strokeLineJoin: (obj as any).strokeLineJoin || 'miter',
          shadow: (obj as any).shadow || null,
          isPath: false
        };
      });
      
      const newHistory = history.slice(0, historyIndex + 1);
      newHistory.push({
        objects: currentObjects,
        backgroundColor: backgroundColor,
        backgroundImage: backgroundImage
      });
      setHistory(newHistory);
      setHistoryIndex(newHistory.length - 1);
      
      // Update the React state to match the canvas state
      setObjects(currentObjects);
    }
  }, [canvas, history, historyIndex, backgroundColor, backgroundImage]);
  
  // Get current canvas dimensions
  const getCurrentCanvasSize = (): CanvasSize => {
    const config = editorConfigs[editorTypeState as keyof typeof editorConfigs];
    
    // Fallback if config doesn't exist
    if (!config) {
      console.warn(`Editor type '${editorTypeState}' not found, falling back to 'flyer'`);
      const fallbackConfig = editorConfigs.flyer;
      return fallbackConfig.sizes[0];
    }
    
    const size = config.sizes.find(s => s.value === canvasSize);
    return size || config.sizes[0];
  };

  // Zoom functions
  const handleZoomChange = (newZoom: number) => {
    setZoomLevel(newZoom);
    // Don't use canvas.setZoom() - we'll scale the container instead
  };

  const zoomIn = () => {
    const newZoom = Math.min(zoomLevel + 25, 300);
    handleZoomChange(newZoom);
  };

  const zoomOut = () => {
    const newZoom = Math.max(zoomLevel - 25, 25);
    handleZoomChange(newZoom);
  };

  const resetZoom = () => {
    handleZoomChange(100);
  };

  // Thumbnail generation function
  const generateAndSaveThumbnail = async () => {
    if (!canvas) {
      console.error('❌ Canvas not available for thumbnail generation');
      return;
    }

    try {
      console.log('📸 Generating thumbnail for template:', id);
      
      // Generate thumbnail as PNG data URL
      const thumbnailDataURL = canvas.toDataURL({
        format: 'png',
        quality: 0.8,
        multiplier: 0.3 // Smaller size for thumbnail
      });

      // Save thumbnail to backend
      const token = localStorage.getItem('token');
      if (!token) {
        console.warn('⚠️ No auth token for thumbnail save');
        return;
      }

      const response = await fetch(API_ENDPOINTS.SAVE_THUMBNAIL, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          templateId: id,
          templateKey: templateKey,
          thumbnailData: thumbnailDataURL
        })
      });

      if (response.ok) {
        console.log('✅ Thumbnail saved successfully');
        // Dispatch event to notify template gallery
        window.dispatchEvent(new CustomEvent('thumbnailUpdated', { 
          detail: { templateId: id, templateKey: templateKey } 
        }));
      } else {
        console.warn('⚠️ Failed to save thumbnail:', response.status);
      }
    } catch (error) {
      console.error('❌ Error generating/saving thumbnail:', error);
    }
  };


  // Gradient editor functions
  const addGradientStop = () => {
    const newId = `stop_${Date.now()}`;
    const newStop = {
      id: newId,
      color: '#00ff00',
      offset: 50
    };
    setGradientStops([...gradientStops, newStop]);
  };

  const removeGradientStop = (stopId: string) => {
    if (gradientStops.length > 2) {
      setGradientStops(gradientStops.filter(stop => stop.id !== stopId));
    }
  };

  const updateGradientStop = (stopId: string, updates: { color?: string; offset?: number }) => {
    setGradientStops(gradientStops.map(stop => 
      stop.id === stopId ? { ...stop, ...updates } : stop
    ));
  };

  const applyGradient = () => {
    if (!canvas || !selectedObject) return;

    // Sort stops by offset
    const sortedStops = [...gradientStops].sort((a, b) => a.offset - b.offset);
    
    // Create Fabric.js gradient
    const gradient = new fabric.Gradient({
      type: 'linear',
      coords: {
        x1: 0,
        y1: 0,
        x2: selectedObject.width || 100,
        y2: 0
      },
      colorStops: sortedStops.map(stop => ({
        offset: stop.offset / 100,
        color: stop.color
      }))
    });

    // Apply gradient to selected object
    selectedObject.set('fill', gradient);
    
    // Store gradient metadata for database saving
    (selectedObject as any).gradientType = 'custom';
    (selectedObject as any).gradientColors = sortedStops.map(stop => stop.color);
    (selectedObject as any).gradientStops = sortedStops;
    (selectedObject as any).gradientCoords = {
      x1: 0,
      y1: 0,
      x2: selectedObject.width || 100,
      y2: 0
    };
    
    console.log('💾 Gradient metadata stored on object:', {
      gradientType: (selectedObject as any).gradientType,
      gradientColors: (selectedObject as any).gradientColors,
      gradientStops: (selectedObject as any).gradientStops,
      gradientCoords: (selectedObject as any).gradientCoords
    });
    
    canvas.renderAll();
    
    // Save to history
    saveCanvasToHistory();
    
    console.log('✅ Gradient applied:', sortedStops);
  };

  // Helper function to restore gradient from saved data
  const restoreGradient = (obj: any, fabricObj: fabric.Object) => {
    console.log(`🔍 restoreGradient called for ${obj.type}:`, {
      gradientType: obj.gradientType,
      gradientColors: obj.gradientColors,
      gradientStops: obj.gradientStops,
      gradientCoords: obj.gradientCoords
    });
    
    if (obj.gradientType && obj.gradientColors && obj.gradientColors.length >= 2) {
      let gradient;
      
      if (obj.gradientType === 'custom' && obj.gradientStops && obj.gradientCoords) {
        // Custom gradient from gradient editor
        gradient = new fabric.Gradient({
          type: 'linear',
          coords: obj.gradientCoords,
          colorStops: obj.gradientStops.map((stop: any) => ({
            offset: stop.offset / 100,
            color: stop.color
          }))
        });
        console.log('🎨 Custom gradient restored:', obj.gradientStops);
      } else if (obj.gradientType === 'teal-blue' && obj.gradientColors.length >= 2) {
        // Predefined teal-blue gradient
        gradient = new fabric.Gradient({
          type: 'linear',
          coords: {
            x1: 0,
            y1: 0,
            x2: fabricObj.width || 200,
            y2: 0
          },
          colorStops: [
            { offset: 0, color: obj.gradientColors[0] },
            { offset: 1, color: obj.gradientColors[1] }
          ]
        });
        console.log('🎨 Teal → Blue gradient restored');
      } else if (obj.gradientType === 'blue-teal' && obj.gradientColors.length >= 2) {
        // Predefined blue-teal gradient
        gradient = new fabric.Gradient({
          type: 'linear',
          coords: {
            x1: 0,
            y1: 0,
            x2: fabricObj.width || 200,
            y2: 0
          },
          colorStops: [
            { offset: 0, color: obj.gradientColors[0] },
            { offset: 1, color: obj.gradientColors[1] }
          ]
        });
        console.log('🎨 Blue → Teal gradient restored');
      }
      
      if (gradient) {
        fabricObj.set('fill', gradient);
        // Store gradient metadata
        (fabricObj as any).gradientType = obj.gradientType;
        (fabricObj as any).gradientColors = obj.gradientColors;
        if (obj.gradientStops) (fabricObj as any).gradientStops = obj.gradientStops;
        if (obj.gradientCoords) (fabricObj as any).gradientCoords = obj.gradientCoords;
      }
    }
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
    
    // Update thumbnail after saving to history
    setTimeout(() => {
      // UpdateTemplateThumbnail will be defined later in the component
      // For now, we'll skip this call to avoid the error
    }, 100);
  }, [history, historyIndex]);
  
  // Undo function
  const undo = useCallback(() => {
    if (historyIndex > 0 && canvas) {
      const newIndex = historyIndex - 1;
      const state = history[newIndex];
      
      // Clear canvas and restore objects
      canvas.clear();
      
      // Restore background
      setBackgroundColor(state.backgroundColor);
      setBackgroundImage(state.backgroundImage || null);
      
      // Restore objects to canvas with all their properties
      state.objects.forEach((obj: EditorObject) => {
        let fabricObj: fabric.Object;
        
        if (obj.type === 'text') {
          fabricObj = new fabric.IText(obj.content || 'Texto', {
            left: obj.x,
            top: obj.y,
            fontSize: obj.fontSize || 16,
            fontFamily: obj.fontFamily || 'Arial',
            fill: obj.color || '#000000',
            opacity: obj.opacity || 1
          });
        } else if (obj.type === 'image') {
          fabricObj = new fabric.Rect({
            left: obj.x,
            top: obj.y,
            width: obj.width || 100,
            height: obj.height || 100,
            fill: obj.color || '#000000',
            opacity: obj.opacity || 1,
            stroke: obj.stroke || 'transparent',
            strokeWidth: obj.strokeWidth || 0,
            strokeLineCap: (obj.strokeLineCap as any) || 'butt',
            strokeLineJoin: (obj.strokeLineJoin as any) || 'miter'
          });
        } else if ((obj as any).isPath && (obj as any).pathData) {
          // Restore path objects (like waves) with their original path data
          fabricObj = new fabric.Path((obj as any).pathData, {
            left: obj.x,
            top: obj.y,
            fill: obj.color || '#000000',
            opacity: obj.opacity || 1,
            stroke: obj.stroke || 'transparent',
            strokeWidth: obj.strokeWidth || 0,
            strokeLineCap: (obj.strokeLineCap as any) || 'butt',
            strokeLineJoin: (obj.strokeLineJoin as any) || 'miter'
          });
        } else {
          // Regular shape
          fabricObj = new fabric.Rect({
            left: obj.x,
            top: obj.y,
            width: obj.width || 100,
            height: obj.height || 100,
            fill: obj.color || '#000000',
            opacity: obj.opacity || 1,
            stroke: obj.stroke || 'transparent',
            strokeWidth: obj.strokeWidth || 0,
            strokeLineCap: (obj.strokeLineCap as any) || 'butt',
            strokeLineJoin: (obj.strokeLineJoin as any) || 'miter'
          });
        }
        
        // Set additional properties
        if (obj.rotation) fabricObj.set('angle', obj.rotation);
        if (obj.shadow) fabricObj.set('shadow', obj.shadow);
        (fabricObj as any).id = obj.id;
        
        canvas.add(fabricObj);
      });
      
      canvas.renderAll();
      setObjects(state.objects);
      setHistoryIndex(newIndex);
    }
  }, [history, historyIndex, canvas]);
  
  // Redo function
  const redo = useCallback(() => {
    if (historyIndex < history.length - 1 && canvas) {
      const newIndex = historyIndex + 1;
      const state = history[newIndex];
      
      // Clear canvas and restore objects
      canvas.clear();
      
      // Restore background
      setBackgroundColor(state.backgroundColor);
      setBackgroundImage(state.backgroundImage || null);
      
      // Restore objects to canvas with all their properties
      state.objects.forEach((obj: EditorObject) => {
        let fabricObj: fabric.Object;
        
        if (obj.type === 'text') {
          fabricObj = new fabric.IText(obj.content || 'Texto', {
            left: obj.x,
            top: obj.y,
            fontSize: obj.fontSize || 16,
            fontFamily: obj.fontFamily || 'Arial',
            fill: obj.color || '#000000',
            opacity: obj.opacity || 1
          });
        } else if (obj.type === 'image') {
          fabricObj = new fabric.Rect({
            left: obj.x,
            top: obj.y,
            width: obj.width || 100,
            height: obj.height || 100,
            fill: obj.color || '#000000',
            opacity: obj.opacity || 1,
            stroke: obj.stroke || 'transparent',
            strokeWidth: obj.strokeWidth || 0,
            strokeLineCap: (obj.strokeLineCap as any) || 'butt',
            strokeLineJoin: (obj.strokeLineJoin as any) || 'miter'
          });
        } else if ((obj as any).isPath && (obj as any).pathData) {
          // Restore path objects (like waves) with their original path data
          fabricObj = new fabric.Path((obj as any).pathData, {
            left: obj.x,
            top: obj.y,
            fill: obj.color || '#000000',
            opacity: obj.opacity || 1,
            stroke: obj.stroke || 'transparent',
            strokeWidth: obj.strokeWidth || 0,
            strokeLineCap: (obj.strokeLineCap as any) || 'butt',
            strokeLineJoin: (obj.strokeLineJoin as any) || 'miter'
          });
        } else {
          // Regular shape
          fabricObj = new fabric.Rect({
            left: obj.x,
            top: obj.y,
            width: obj.width || 100,
            height: obj.height || 100,
            fill: obj.color || '#000000',
            opacity: obj.opacity || 1,
            stroke: obj.stroke || 'transparent',
            strokeWidth: obj.strokeWidth || 0,
            strokeLineCap: (obj.strokeLineCap as any) || 'butt',
            strokeLineJoin: (obj.strokeLineJoin as any) || 'miter'
          });
        }
        
        // Set additional properties
        if (obj.rotation) fabricObj.set('angle', obj.rotation);
        if (obj.shadow) fabricObj.set('shadow', obj.shadow);
        (fabricObj as any).id = obj.id;
        
        canvas.add(fabricObj);
      });
      
      canvas.renderAll();
      setObjects(state.objects);
      setHistoryIndex(newIndex);
    }
  }, [history, historyIndex, canvas]);
  
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
      console.log('🎯 Adding new text with font family:', 'Arial');
      const text = new fabric.IText('Tu texto aquí', {
        left: 100,
        top: 100,
        fontSize: 48,
        fill: brandKit.colors?.primary || '#00525b',
        fontFamily: 'Arial',
        selectable: true,
        editable: true
      });
      
      console.log('✅ Text created with font family:', text.fontFamily);
      
      // Ensure text is within canvas boundaries
      ensureObjectInBounds(text, canvas);
      
      canvas.add(text);
      canvas.setActiveObject(text);
      text.enterEditing();
      canvas.renderAll();
      saveCanvasToHistory();
      
      console.log('🎨 Text added to canvas with font family:', text.fontFamily);
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
    
    // Validate file size (max 200MB)
    if (file.size > 200 * 1024 * 1024) {
      alert('El archivo es demasiado grande. Máximo 200MB permitido.');
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
        
        // Set properties for a regular, interactive image object
        fabricImage.set({
          left: canvas.getWidth() / 2,
          top: canvas.getHeight() / 2,
          originX: 'center',
          originY: 'center',
          selectable: true,    // Image should be selectable
          evented: true,       // Image should trigger events
          lockMovementX: false, // Image should be movable
          lockMovementY: false,
          lockRotation: false,  // Image should be rotatable
          lockScalingX: false,  // Image should be scalable
          lockScalingY: false,
          cornerStyle: 'circle',
          cornerColor: '#007bff',
          cornerSize: 8,
          transparentCorners: false
        });
        
        // Scale image to reasonable size (max 300px width or height)
        const maxSize = 300;
        if (fabricImage.width && fabricImage.height) {
          const imageWidth = fabricImage.width;
          const imageHeight = fabricImage.height;
          
          // Calculate scale to fit within maxSize while maintaining aspect ratio
          const scale = Math.min(maxSize / imageWidth, maxSize / imageHeight);
          
          fabricImage.set({
            scaleX: scale,
            scaleY: scale
          });
          
          console.log(`Image scaled to fit within ${maxSize}px: scale ${scale}`);
        }
        
        // Add image to canvas
        canvas.add(fabricImage);
        
        // Center the image on canvas using Fabric.js methods
        fabricImage.set({
          left: canvas.getWidth() / 2,
          top: canvas.getHeight() / 2,
          originX: 'center',
          originY: 'center'
        });
        
        // Make it the active object
        canvas.setActiveObject(fabricImage);
        
        // Render the canvas
        canvas.renderAll();
        
        // Save to history
        if (typeof saveCanvasToHistory === 'function') {
          saveCanvasToHistory();
        }
        
        console.log('✅ Image added successfully');
        console.log('🎨 Canvas objects after adding image:', canvas.getObjects());
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
        case 'rectangle':
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
          break;
        case 'line':
          shape = new fabric.Line([50, 50, 250, 50], {
            stroke: brandKit.colors?.primary || '#00525b',
            strokeWidth: 3,
            selectable: true,
            resizable: true,
            hasControls: true,
            hasBorders: true,
            lockScalingX: false,
            lockScalingY: true,
            lockUniScaling: true,
            cornerStyle: 'circle',
            cornerColor: '#00525b',
            cornerSize: 8,
            transparentCorners: false,
            borderColor: '#00525b',
            borderScaleFactor: 1
          });
          // Show only the middle controls and rotation
          shape.setControlsVisibility({
            mt: false, // middle top
            mb: false, // middle bottom
            ml: true,  // middle left
            mr: true,  // middle right
            tl: false, // top left
            tr: false, // top right
            bl: false, // bottom left
            br: false, // bottom right
            mtr: true  // rotation control
          });
          break;
        case 'dashline':
          shape = new fabric.Line([50, 50, 250, 50], {
            stroke: brandKit.colors?.accent || '#32e0c5',
            strokeWidth: 3,
            strokeDashArray: [5, 5],
            selectable: true,
            resizable: true,
            hasControls: true,
            hasBorders: true,
            lockScalingX: false,
            lockScalingY: true,
            lockUniScaling: true,
            cornerStyle: 'circle',
            cornerColor: '#32e0c5',
            cornerSize: 8,
            transparentCorners: false,
            borderColor: '#32e0c5',
            borderScaleFactor: 1
          });
          // Show only the middle controls and rotation
          shape.setControlsVisibility({
            mt: false, // middle top
            mb: false, // middle bottom
            ml: true,  // middle left
            mr: true,  // middle right
            tl: false, // top left
            tr: false, // top right
            bl: false, // bottom left
            br: false, // bottom right
            mtr: true  // rotation control
          });
          break;
        case 'wave':
          // Create a flowing wave shape using SVG path with multiple wave cycles
          const wavePath = new fabric.Path('M 0 120 C 25 80 50 120 75 80 C 100 120 125 80 150 120 C 175 80 200 120 225 80 C 250 120 275 80 300 120 C 325 80 350 120 375 80 C 400 120 425 80 450 120 C 475 80 500 120 500 120 L 500 200 L 0 200 Z', {
            left: 100,
            top: 100,
            fill: brandKit.colors?.accent || '#32e0c5',
            selectable: true,
            resizable: true,
            hasControls: true,
            hasBorders: true,
            scaleX: 1,
            scaleY: 1
          });
          shape = wavePath;
          break;
        case 'wave-vertical':
          // Create a vertical wave shape
          const verticalWavePath = new fabric.Path('M 120 0 C 80 25 120 50 80 75 C 120 100 80 125 120 150 C 80 175 120 200 80 225 C 120 250 80 275 120 300 C 80 325 120 350 80 375 C 120 400 80 425 120 450 L 200 450 L 200 0 Z', {
            left: 100,
            top: 100,
            fill: brandKit.colors?.secondary || '#01aac7',
            selectable: true,
            resizable: true,
            hasControls: true,
            hasBorders: true,
            scaleX: 1,
            scaleY: 1
          });
          shape = verticalWavePath;
          break;
        case 'wave-simple':
          // Create a simple wave shape
          const simpleWavePath = new fabric.Path('M 0 150 Q 100 100 200 150 Q 300 200 400 150 L 400 250 L 0 250 Z', {
            left: 100,
            top: 100,
            fill: brandKit.colors?.primary || '#00525b',
            selectable: true,
            resizable: true,
            hasControls: true,
            hasBorders: true,
            scaleX: 1,
            scaleY: 1
          });
          shape = simpleWavePath;
          break;
        case 'pill':
          // Create a pill shape (rounded rectangle with high radius)
          shape = new fabric.Rect({
            left: 100,
            top: 100,
            width: 200,
            height: 80,
            rx: 40, // High radius for pill effect
            ry: 40,
            fill: brandKit.colors?.accent || '#32e0c5',
            selectable: true,
            resizable: true,
            hasControls: true,
            hasBorders: true
          });
          break;
        case 'half-rounded':
          // Create a half-rounded rectangle (rounded on right side, sharp on left)
          // We need to create this using a custom path since fabric.Rect doesn't support different radius per corner
          const halfRoundedPath = new fabric.Path('M 0 0 L 160 0 Q 200 0 200 40 L 200 40 Q 200 80 160 80 L 0 80 Z', {
            left: 100,
            top: 100,
            fill: brandKit.colors?.accent || '#f59e0b', // Amber color
            selectable: true,
            resizable: true,
            hasControls: true,
            hasBorders: true,
            scaleX: 1,
            scaleY: 1
          });
          shape = halfRoundedPath;
          break;
        case 'map-pin':
          // Create a map pin shape using SVG path
          const mapPinPath = new fabric.Path('M 12 2 C 8.13 2 5 5.13 5 9 C 5 14.25 12 22 12 22 S 19 14.25 19 9 C 19 5.13 15.87 2 12 2 Z M 12 11.5 C 10.62 11.5 9.5 10.38 9.5 9 S 10.62 6.5 12 6.5 S 14.5 7.62 14.5 9 S 13.38 11.5 12 11.5 Z', {
            left: 100,
            top: 100,
            fill: brandKit.colors?.primary || '#dc2626', // Red color
            selectable: true,
            resizable: true,
            hasControls: true,
            hasBorders: true,
            scaleX: 1,
            scaleY: 1
          });
          shape = mapPinPath;
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
    // Check if user can delete objects (premium feature for free users)
    if (!canPerformPremiumAction('Delete objects')) {
      return;
    }
    
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
      fabric.Image.fromURL(brandKit.logo).then((img: any) => {
        img.set({
          left: 50,
          top: 50,
          selectable: true,
          evented: true,
          lockMovementX: false,
          lockMovementY: false,
          lockRotation: false,
          lockScalingX: false,
          lockScalingY: false,
          hasControls: true,
          hasBorders: false,
          isBrandKitLogo: true,
          stroke: null,
          strokeWidth: 0
        });
        
        // Add selection event handlers to show/hide borders
        img.on('selected', () => {
          console.log('🎨 Logo selected - showing borders');
          img.set({
            hasBorders: true,
            stroke: '#007bff',
            strokeWidth: 2
          });
          img.canvas?.renderAll();
        });

        img.on('deselected', () => {
          console.log('🎨 Logo deselected - hiding borders');
          img.set({
            hasBorders: false,
            stroke: null,
            strokeWidth: 0
          });
          img.canvas?.renderAll();
        });
        
        img.scaleToWidth(100);
        canvas.add(img);
        canvas.renderAll();
        saveCanvasToHistory();
        console.log('✅ Brand logo applied and is now movable and resizable');
      });
    }
  };

  // Check if design file exists
  const checkDesignFileExists = async (filename: string): Promise<boolean> => {
    try {
      const response = await fetch(API_ENDPOINTS.GET_DESIGN(filename));
      return response.ok;
    } catch (error) {
      console.warn('⚠️ Error checking design file existence:', error);
      return false;
    }
  };

  // Clean up orphaned design file reference from database
  const cleanupOrphanedDesignFile = async (templateKey: string) => {
    try {
      console.log('🧹 Cleaning up orphaned design file reference for template:', templateKey);
      const response = await fetch(API_ENDPOINTS.TEMPLATE_BY_KEY(templateKey), {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          designFilename: null, // Remove the orphaned filename
          updatedAt: new Date().toISOString()
        })
      });
      
      if (response.ok) {
        console.log('✅ Orphaned design file reference cleaned up');
      } else {
        console.warn('⚠️ Failed to clean up orphaned design file reference');
      }
    } catch (error) {
      console.warn('⚠️ Error cleaning up orphaned design file reference:', error);
    }
  };

  // Load template by ID (for templates without templateKey)
  const loadTemplateById = async (templateId: string) => {
    console.log('🚀 loadTemplateById called with ID:', templateId);
    
    try {
      // Fetch template by ID from database
      const response = await fetch(API_ENDPOINTS.TEMPLATE_BY_ID(templateId));
      if (response.ok) {
        const template = await response.json();
        console.log('✅ Template loaded by ID:', template);
        
        // Priority 1: Use designFilename field from database (primary method)
        if (template.designFilename) {
          console.log('📁 Loading design from designFilename field:', template.designFilename);
          
          try {
            const fileExists = await checkDesignFileExists(template.designFilename);
            
            if (fileExists) {
              console.log('✅ Design file exists, loading from designFilename...');
              const designResponse = await fetch(API_ENDPOINTS.GET_DESIGN(template.designFilename));
              if (designResponse.ok) {
                const designData = await designResponse.json();
                console.log('🎨 User-saved design data loaded from designFilename:', designData);
                
                // Load user-saved design directly (not through loadTemplateFromData)
                await loadUserSavedDesign(designData, template);
                
                // Add brand kit logo after user-saved design is loaded
                setTimeout(async () => {
                  await addBrandKitLogoIfNeeded();
                }, 300);
                return;
              } else {
                console.warn('⚠️ Failed to load design file from designFilename:', template.designFilename);
              }
            } else {
              console.warn('⚠️ Design file does not exist:', template.designFilename);
            }
          } catch (error) {
            console.error('❌ Error loading design file from designFilename:', template.designFilename, error);
          }
        }
        
        // Priority 2: Check _id-based filename (fallback)
        const idBasedFilename = `${templateId}.json`;
        console.log('📁 Checking design file with _id-based filename (fallback):', idBasedFilename);
        const fileExists = await checkDesignFileExists(idBasedFilename);
          
        if (fileExists) {
          console.log('✅ Design file exists, loading user-saved design...');
          const designResponse = await fetch(API_ENDPOINTS.GET_DESIGN(idBasedFilename));
          if (designResponse.ok) {
            const designData = await designResponse.json();
            console.log('🎨 User-saved design data loaded from _id-based file:', designData);
            
            // Load user-saved design directly (not through loadTemplateFromData)
            await loadUserSavedDesign(designData, template);
            
            // Add brand kit logo after user-saved design is loaded
            setTimeout(async () => {
              await addBrandKitLogoIfNeeded();
            }, 300);
            return;
          }
        } else {
          console.warn('⚠️ Design file does not exist:', idBasedFilename);
        }
        
        // Fallback to loading from template data (fresh template)
        console.log('📋 Loading fresh template from template data...');
        await loadTemplateFromData(templateId, template);
        
        // Add brand kit logo after template is loaded
        setTimeout(async () => {
          await addBrandKitLogoIfNeeded();
        }, 500);
        return;
      } else {
        console.error('❌ Failed to fetch template by ID:', response.status);
      }
    } catch (error) {
      console.error('❌ Error loading template by ID:', error);
    }
  };

  // Utility function to normalize color formats for Fabric.js
  const normalizeColor = (color: string): string => {
    if (!color || color === '#000000') {
      return 'rgba(0,0,0,0)'; // Convert black to transparent for canvas
    }
    
    // If it's already a valid color format, return as is
    // Fabric.js supports hex, rgb, rgba, hsl, hsla, and named colors
    return color;
  };

  // Adjust colors of objects that overlap with the logo for better contrast
  const adjustOverlappingObjectColors = (logoObject: fabric.Object) => {
    if (!canvas || !logoObject) {
      console.log('ℹ️ Canvas or logo object not available for overlap detection');
      return;
    }

    try {
      // Convert logo object to our CanvasObject interface
      const logoCanvasObject: CanvasObject = {
        id: logoObject.get('id') || 'logo',
        type: logoObject.type || 'image',
        left: logoObject.left || 0,
        top: logoObject.top || 0,
        width: logoObject.width || 0,
        height: logoObject.height || 0,
        scaleX: logoObject.scaleX || 1,
        scaleY: logoObject.scaleY || 1
      };

      // Get all canvas objects and convert them to our interface
      const allCanvasObjects: CanvasObject[] = canvas.getObjects().map(obj => ({
        id: obj.get('id') || Math.random().toString(36).slice(2),
        type: obj.type || 'unknown',
        left: obj.left || 0,
        top: obj.top || 0,
        width: obj.width || 0,
        height: obj.height || 0,
        scaleX: obj.scaleX || 1,
        scaleY: obj.scaleY || 1,
        color: obj.fill || (obj as any).color || '#000000',
        fill: obj.fill || (obj as any).color || '#000000'
      }));

      // Find overlapping objects
      const overlappingObjects = findOverlappingObjects(logoCanvasObject, allCanvasObjects);
      
      console.log(`🎨 Found ${overlappingObjects.length} overlapping objects with logo`);

      // Adjust colors for overlapping objects
      overlappingObjects.forEach((overlapInfo, index) => {
        const { object, overlapPercentage } = overlapInfo;
        
        // Only adjust objects with significant overlap (more than 10%)
        if (overlapPercentage > 10) {
          console.log(`🎨 Adjusting color for object ${index + 1} (${overlapPercentage.toFixed(1)}% overlap)`);
          
          // Find the corresponding fabric object on the canvas
          const fabricObject = canvas.getObjects().find(obj => 
            (obj.get('id') === object.id) || 
            (obj.left === object.left && obj.top === object.top && obj.type === object.type) ||
            (obj as any).isBrandKitLogo === true // Also check for brand kit logo identifier
          );

          if (fabricObject && (fabricObject.type === 'text' || fabricObject.type === 'i-text' || fabricObject.type === 'rect' || fabricObject.type === 'circle' || fabricObject.type === 'triangle')) {
            // Get the current color
            const currentColor = fabricObject.fill || (fabricObject as any).color || '#000000';
            
            // Generate a contrasting color based on the logo's background
            // For simplicity, we'll use the gradient background color as reference
            const logoBackgroundColor = brandKit.colors?.primary || '#000000';
            const contrastingColor = getHighContrastColor(logoBackgroundColor);
            
            console.log(`🎨 Changing color from ${currentColor} to ${contrastingColor} for better contrast`);
            
            // Apply the new color
            fabricObject.set('fill', contrastingColor);
            if (fabricObject.type === 'text' || fabricObject.type === 'i-text') {
              fabricObject.set('fill', contrastingColor);
            }
            
            // Mark that this object was auto-adjusted
            fabricObject.set('autoAdjustedForLogo', true);
            fabricObject.set('originalColor', currentColor);
          }
        }
      });

      // Render the canvas to show the changes
      canvas.renderAll();
      
      if (overlappingObjects.length > 0) {
        console.log(`✅ Adjusted colors for ${overlappingObjects.filter(o => o.overlapPercentage > 10).length} overlapping objects`);
      }
      
    } catch (error) {
      console.error('❌ Error adjusting overlapping object colors:', error);
    }
  };

  // Add brand kit logo to existing templates if needed
  const addBrandKitLogoIfNeeded = async () => {
    // Prevent multiple simultaneous calls
    if ((addBrandKitLogoIfNeeded as any).isRunning) {
      console.log('ℹ️ addBrandKitLogoIfNeeded is already running, skipping...');
      return;
    }
    
    (addBrandKitLogoIfNeeded as any).isRunning = true;
    
    try {
    console.log('🔍 addBrandKitLogoIfNeeded called');
    console.log('🔍 Current URL:', window.location.href);
    console.log('🔍 Canvas exists:', !!canvas);
    console.log('🔍 Canvas objects count:', canvas ? canvas.getObjects().length : 'N/A');
      // Check if canvas is available
      if (!canvas) {
        console.log('ℹ️ Canvas not available - skipping logo addition');
        return;
      }
      console.log('✅ Canvas is available');

      // Get brand kit data (logo and colors) from database
      try {
        const token = localStorage.getItem('token');
        if (!token) {
          console.log('ℹ️ No auth token found - skipping logo addition');
          return;
        }

        // Fetch brand kit data (logo and colors)
        const response = await fetch(API_ENDPOINTS.BRAND_KIT, {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        });

        if (!response.ok) {
          console.log('ℹ️ Failed to fetch brand kit data:', response.statusText);
          return;
        }

        const data = await response.json();
        console.log('🔍 Brand kit API response:', data);
        if (!data.success || !data.brandKit) {
          console.log('ℹ️ No brand kit found - skipping logo addition');
          console.log('🔍 Response data:', data);
          return;
        }

        const brandKit = data.brandKit;
        const brandKitLogo = brandKit.logo?.data;
        
        if (!brandKitLogo) {
          console.log('ℹ️ No logo found in brand kit - skipping logo addition');
          return;
        }
        console.log('🔍 Brand kit logo from database:', brandKitLogo.substring(0, 50) + '...');
        
        // Check if the logo data looks corrupted (too short or doesn't start with data:image)
        if (brandKitLogo.length < 100 || !brandKitLogo.startsWith('data:image/')) {
          console.log('❌ Logo data appears corrupted');
          console.log('🔍 Corrupted logo data preview:', brandKitLogo.substring(0, 50) + '...');
          console.log('✅ Please upload a fresh logo in the Brand Kit.');
          return;
        }

      // Check if logo already exists on canvas
      const existingObjects = canvas.getObjects();
      console.log('🔍 Existing objects on canvas:', existingObjects.length);
      existingObjects.forEach((obj, index) => {
        console.log(`🔍 Object ${index + 1}:`, {
          type: obj.type,
          src: (obj as any).src || 'N/A'
        });
      });
      
      const logoExists = existingObjects.some(obj => 
        obj.type === 'image' && 
        (obj as any).src === brandKitLogo // Check if any image object already has the brand kit logo
      );

      // First, check if we should replace any template logo placeholders
      const logoPlaceholders = existingObjects.filter(obj => 
        obj.type === 'image' && 
        (obj as any).src && 
        ((obj as any).src.toLowerCase().includes('logo') || (obj as any).src.toLowerCase().includes('placeholder'))
      );
      
      if (logoPlaceholders.length > 0) {
        console.log('🎨 Found template logo placeholders, replacing with brand kit logo...');
        
        // Replace the first logo placeholder with the brand kit logo
        const logoPlaceholder = logoPlaceholders[0];
        
        // Load the brand kit logo image and replace the placeholder
        const imgElement = new Image();
        imgElement.crossOrigin = 'anonymous';
        imgElement.onload = () => {
          logoPlaceholder.set({
            src: brandKitLogo,
            selectable: true,
            evented: true,
            lockMovementX: false,
            lockMovementY: false,
            lockRotation: false,
            lockScalingX: false,
            lockScalingY: false,
          stroke: null,
          strokeWidth: 0,
            isBrandKitLogo: true
          });
          
          canvas.renderAll();
          
          // Trigger overlap detection for the replaced logo
          setTimeout(() => {
            adjustOverlappingObjectColors(logoPlaceholder);
          }, 100);
        };
        imgElement.src = brandKitLogo;
        
        // Remove other logo placeholders to avoid duplicates
        logoPlaceholders.slice(1).forEach(placeholder => {
          canvas.remove(placeholder);
        });
        
        saveCanvasToHistory();
        console.log('✅ Template logo placeholders replaced with brand kit logo');
        return;
      }

      if (logoExists) {
        console.log('ℹ️ Brand kit logo already exists on canvas - making existing logo interactive...');
        
        // Find and update existing logo to make it movable and resizable
        const existingLogo = existingObjects.find(obj => 
          obj.type === 'image' && 
          (obj as any).src === brandKitLogo
        );
        
        if (existingLogo) {
          // Make the existing logo movable and resizable
          existingLogo.set({
            selectable: true,
            evented: true,
            lockMovementX: false,
            lockMovementY: false,
            lockRotation: false,
            lockScalingX: false,
            lockScalingY: false,
          stroke: null,
          strokeWidth: 0,
            isBrandKitLogo: true
          });
          
          canvas.renderAll();
          saveCanvasToHistory();
          console.log('✅ Existing logo is now movable and resizable');
        }
        return;
      }

      // Add brand kit logo to canvas
      console.log('🎨 Adding brand kit logo to existing template...');
      const imgElement = new Image();
      imgElement.crossOrigin = 'anonymous';
      
      imgElement.onload = () => {
        console.log('✅ Brand kit logo image loaded successfully');
        console.log('🔍 Logo image dimensions:', imgElement.width, 'x', imgElement.height);
        console.log('🔍 Logo image src:', imgElement.src);
        console.log('🔍 Logo image natural dimensions:', imgElement.naturalWidth, 'x', imgElement.naturalHeight);
        
        // Get canvas dimensions to position logo in top-left corner
        const canvasWidth = canvas.width || 1200;
        const canvasHeight = canvas.height || 1800;
        const maxLogoSize = 120; // Maximum size for top-left corner
        const padding = 20; // Padding around logo
        
        // Use Fabric.js built-in scaling like regular images
        // Don't set fixed dimensions - let Fabric.js scale naturally
        console.log('🔍 Logo using Fabric.js natural scaling:', {
          originalSize: { width: imgElement.naturalWidth, height: imgElement.naturalHeight }
        });
        
        // Create the logo image with transparent background
        const fabricImage = new fabric.Image(imgElement, {
          left: 20, // Position in top-left corner
          top: 20, // Position in top-left corner
          // Use scale to limit size while maintaining aspect ratio
          scaleX: Math.min(maxLogoSize / imgElement.naturalWidth, maxLogoSize / imgElement.naturalHeight),
          scaleY: Math.min(maxLogoSize / imgElement.naturalWidth, maxLogoSize / imgElement.naturalHeight),
          selectable: true, // Make editable and movable
          evented: true, // Make interactive
          lockMovementX: false, // Allow horizontal movement
          lockMovementY: false, // Allow vertical movement
          lockRotation: false, // Allow rotation
          lockScalingX: false, // Allow horizontal scaling
          lockScalingY: false, // Allow vertical scaling
          opacity: 1,
          shadow: null,
          // Add custom properties to identify this as a brand kit logo
          isBrandKitLogo: true,
          // Set minimum and maximum scale limits
          minScaleLimit: 0.1,
          maxScaleLimit: 3.0,
          // Show controls when selected, hide borders when unselected
          hasControls: true,
          hasBorders: false,
          // No border when unselected
          stroke: null,
          strokeWidth: 0
        });
        
        // Add selection event handlers to show/hide borders
        fabricImage.on('selected', () => {
          console.log('🎨 Logo selected - showing borders');
          fabricImage.set({
            hasBorders: true,
            stroke: '#007bff',
            strokeWidth: 2
          });
          fabricImage.canvas?.renderAll();
        });

        fabricImage.on('deselected', () => {
          console.log('🎨 Logo deselected - hiding borders');
          fabricImage.set({
            hasBorders: false,
            stroke: null,
            strokeWidth: 0
          });
          fabricImage.canvas?.renderAll();
        });

        // Link the logo and background so they move together
        const linkObjects = (primaryObj: fabric.Object, secondaryObj: fabric.Object) => {
          primaryObj.on('moving', () => {
            const deltaX = primaryObj.left! - (primaryObj as any).lastLeft;
            const deltaY = primaryObj.top! - (primaryObj as any).lastTop;
            secondaryObj.set({
              left: secondaryObj.left! + deltaX,
              top: secondaryObj.top! + deltaY
            });
            (primaryObj as any).lastLeft = primaryObj.left;
            (primaryObj as any).lastTop = primaryObj.top;
            canvas.renderAll();
          });

          primaryObj.on('scaling', () => {
            const scaleX = primaryObj.scaleX! / (primaryObj as any).lastScaleX;
            const scaleY = primaryObj.scaleY! / (primaryObj as any).lastScaleY;
            secondaryObj.set({
              scaleX: secondaryObj.scaleX! * scaleX,
              scaleY: secondaryObj.scaleY! * scaleY
            });
            (primaryObj as any).lastScaleX = primaryObj.scaleX;
            (primaryObj as any).lastScaleY = primaryObj.scaleY;
            canvas.renderAll();
          });

          primaryObj.on('rotating', () => {
            secondaryObj.set({
              angle: primaryObj.angle!
            });
            canvas.renderAll();
          });

          // Trigger overlap detection when logo movement/rotation/scaling is finished
          primaryObj.on('modified', () => {
            setTimeout(() => {
              adjustOverlappingObjectColors(primaryObj);
            }, 100);
          });

          // Initialize tracking properties
          (primaryObj as any).lastLeft = primaryObj.left;
          (primaryObj as any).lastTop = primaryObj.top;
          (primaryObj as any).lastScaleX = primaryObj.scaleX;
          (primaryObj as any).lastScaleY = primaryObj.scaleY;
        };

        // Add logo with transparent background
        canvas.add(fabricImage);
        // Ensure logo is on top
        canvas.bringObjectToFront(fabricImage);
        
        // Detect overlapping objects and adjust their colors for better contrast
        setTimeout(() => {
          adjustOverlappingObjectColors(fabricImage);
        }, 100);
        
        // Force canvas to render multiple times to ensure visibility
        canvas.renderAll();
        setTimeout(() => {
          canvas.renderAll();
          setTimeout(() => {
            canvas.renderAll();
          }, 100);
        }, 100);
        
        saveCanvasToHistory();
        console.log('✅ Brand kit logo added to existing template');
        console.log('🎨 Logo is now movable, resizable, and rotatable');
        console.log('🔍 Canvas objects after adding logo:', canvas.getObjects().length);
        console.log('🔍 Logo object details:', {
          left: fabricImage.left,
          top: fabricImage.top,
          width: fabricImage.width,
          height: fabricImage.height,
          visible: fabricImage.visible,
          opacity: fabricImage.opacity
        });
        
        // Add a test rectangle to verify the function is working
        // Test rectangle removed - no longer needed
        console.log('🔍 Canvas dimensions:', { width: canvas.width, height: canvas.height });
        console.log('🔍 Canvas viewport:', { 
          vpt: canvas.viewportTransform, 
          zoom: canvas.getZoom(),
          panX: canvas.viewportTransform[4],
          panY: canvas.viewportTransform[5]
        });
        console.log('🔍 Logo position:', { left: fabricImage.left, top: fabricImage.top, width: fabricImage.width, height: fabricImage.height });
        console.log('🔍 Logo is visible:', fabricImage.visible);
        console.log('🔍 Logo opacity:', fabricImage.opacity);
        console.log('🔍 Logo bounds:', fabricImage.getBoundingRect());
        console.log('🔍 Canvas viewport transform:', canvas.viewportTransform);
        console.log('🔍 Canvas zoom level:', canvas.getZoom());
        console.log('🔍 Canvas pan position:', { 
          panX: canvas.viewportTransform[4], 
          panY: canvas.viewportTransform[5] 
        });
              console.log('🔍 Logo should be visible at:', { 
        left: fabricImage.left, 
        top: fabricImage.top, 
        right: fabricImage.left + fabricImage.width, 
        bottom: fabricImage.top + fabricImage.height 
      });
      
              // Logo added successfully
      };
      imgElement.onerror = (error) => {
        console.error('❌ Error loading brand kit logo:', error);
        console.error('❌ Failed logo URL:', brandKitLogo);
      };
    
      imgElement.src = brandKitLogo;
      
    } catch (error) {
      console.error('❌ Error adding brand kit logo:', error);
    } finally {
      // Reset the running flag
      (addBrandKitLogoIfNeeded as any).isRunning = false;
    };
          } catch (error) {
    console.error("error");
  };
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
    
    // Add promotional banner text elements
    const addPromotionalText = () => {
      if (canvas) {
        const canvasWidth = canvas.getWidth();
        const canvasHeight = canvas.getHeight();
        
        // 1. "LAS MEJORES" - Large text at the top
        const mainTitle = new fabric.IText('LAS MEJORES', {
          left: canvasWidth / 2,
          top: 80,
          fontSize: 72,
          fill: '#FFFFFF',
          fontFamily: 'Arial',
          fontWeight: 'bold',
          textAlign: 'center',
          selectable: true,
          editable: true,
          stroke: '#000000',
          strokeWidth: 2
        });
        mainTitle.set({ left: mainTitle.left! - (mainTitle.width! / 2) }); // Center horizontally
        canvas.add(mainTitle);
        
        // 2. "OFERTAS EN UN SOLO LUGAR" - Centered on teal overlay
        const subtitle = new fabric.IText('OFERTAS EN UN SOLO LUGAR', {
          left: canvasWidth / 2,
          top: canvasHeight * 0.4,
          fontSize: 48,
          fill: '#FFFFFF',
          fontFamily: 'Arial',
          fontWeight: 'bold',
          textAlign: 'center',
          selectable: true,
          editable: true
        });
        subtitle.set({ left: subtitle.left! - (subtitle.width! - (subtitle.width! / 2)) }); // Center horizontally
        canvas.add(subtitle);
        
        // 3. Main paragraph text
        const paragraph = new fabric.IText('Estás listo para encontrar las mejores inversiones inmobiliarias en a un solo click, listo para hacer realidad tus sueños de inversión.', {
          left: canvasWidth / 2,
          top: canvasHeight * 0.55,
          fontSize: 24,
          fill: '#FFFFFF',
          fontFamily: 'Arial',
          fontWeight: 'normal',
          textAlign: 'center',
          selectable: true,
          editable: true,
          width: canvasWidth * 0.8 // Limit width for better readability
        });
        paragraph.set({ left: paragraph.left! - (paragraph.width! / 2) }); // Center horizontally
        canvas.add(paragraph);
        
        // 4. Call-to-action question
        const ctaText = new fabric.IText('¿Qué esperas para saber más sobre nuestros servicios?', {
          left: canvasWidth / 2,
          top: canvasHeight * 0.75,
          fontSize: 28,
          fill: '#FFFFFF',
          fontFamily: 'Arial',
          fontStyle: 'italic',
          textAlign: 'center',
          selectable: true,
          editable: true
        });
        ctaText.set({ left: ctaText.left! - (ctaText.width! / 2) }); // Center horizontally
        canvas.add(ctaText);
        
        // 5. UI elements (scroll indicator)
        const scrollLine = new fabric.Line([canvasWidth * 0.85, canvasHeight * 0.9, canvasWidth * 0.95, canvasHeight * 0.9], {
          stroke: '#FFFFFF',
          strokeWidth: 3,
          selectable: true,
          hasControls: true
        });
        canvas.add(scrollLine);
        
        const scrollTriangle = new fabric.Triangle({
          left: canvasWidth * 0.9,
          top: canvasHeight * 0.92,
          width: 20,
          height: 15,
          fill: '#FFFFFF',
          selectable: true,
          hasControls: true
        });
        canvas.add(scrollTriangle);
        
        // Set the main title as active object
        canvas.setActiveObject(mainTitle);
        canvas.renderAll();
        saveCanvasToHistory();
        
        console.log('✅ Promotional banner text elements added to canvas');
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
            resizable: true,
            hasControls: true,
            hasBorders: true,
            lockScalingX: false,
            lockScalingY: true,
            lockUniScaling: true,
            cornerStyle: 'circle',
            cornerColor: '#FFD700',
            cornerSize: 8,
            transparentCorners: false,
            borderColor: '#FFD700',
            borderScaleFactor: 1
          });
          // Show only the middle controls and rotation
          element.setControlsVisibility({
            mt: false, // middle top
            mb: false, // middle bottom
            ml: true,  // middle left
            mr: true,  // middle right
            tl: false, // top left
            tr: false, // top right
            bl: false, // bottom left
            br: false, // bottom right
            mtr: true  // rotation control
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

  // Handle temporary background color change (for preview only)
  const handleTempBackgroundColorChange = (color: string) => {
    setTempBackgroundColor(color);
    if (canvas) {
      canvas.backgroundColor = color;
      canvas.renderAll();
    }
  };

  // Update template thumbnail with current canvas state
  const updateTemplateThumbnail = useCallback(async () => {
    if (!canvas || !id) return;
    
    try {
      // Dispatch event to indicate thumbnail generation is starting
      window.dispatchEvent(new CustomEvent('templateThumbnailGenerating', {
        detail: { templateId: id }
      }));
      
      // Generate thumbnail from current canvas state
      const thumbnailDataURL = canvas.toDataURL({
        format: 'png',
        multiplier: 0.3, // Smaller size for thumbnail
        quality: 0.8
      });
      
      // Store thumbnail in localStorage for the gallery to access
      const templateThumbnails = JSON.parse(localStorage.getItem('templateThumbnails') || '{}');
      templateThumbnails[id] = {
        thumbnail: thumbnailDataURL,
        updatedAt: new Date().toISOString()
      };
      localStorage.setItem('templateThumbnails', JSON.stringify(templateThumbnails));
      
      // Dispatch custom event to notify other components
      window.dispatchEvent(new CustomEvent('templateThumbnailUpdated'));
      
      console.log('📸 Template thumbnail updated for:', id);
    } catch (error) {
      console.error('❌ Error updating template thumbnail:', error);
    }
  }, [canvas, id]);

  // Reset temporary background to original
  const resetTempBackground = () => {
    setTempBackgroundColor(null);
    if (canvas) {
      canvas.backgroundColor = backgroundColor;
      canvas.renderAll();
    }
  };

  // Generate and show image preview
  const generateImagePreview = () => {
    if (canvas) {
      // Temporarily set background if temp color is selected
      const originalBackground = canvas.backgroundColor;
      if (tempBackgroundColor) {
        canvas.backgroundColor = tempBackgroundColor;
      } else {
        canvas.backgroundColor = backgroundColor;
      }
      canvas.renderAll();
      
      // Generate data URL
      const dataURL = canvas.toDataURL({
        format: 'png',
        multiplier: 1,
        quality: 1
      });
      
      // Restore original background
      canvas.backgroundColor = originalBackground;
      canvas.renderAll();
      
      setPreviewImageData(dataURL);
      setShowImagePreview(true);
    }
  }; 

  // Handle background image change
  const handleBackgroundImageChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
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
    
    // Validate file size (max 200MB)
    if (file.size > 200 * 1024 * 1024) {
      console.error('File too large:', file.size);
      alert('El archivo es demasiado grande. Máximo 200MB permitido.');
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
    reader.onload = async (event) => {
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
      
      // Save background to backend
      if (user?.id) {
        try {
          const imageType = getImageTypeFromDataUrl(imageUrl);
          const result = await saveTemplateBackground({
            templateId: id,
            userId: user.id,
            imageData: imageUrl,
            imageType: imageType,
            fileName: file.name
          });
          
          if (result.success && result.backgroundId) {
            setCurrentBackgroundId(result.backgroundId);
            console.log('✅ Background saved to backend with ID:', result.backgroundId);
          } else {
            console.warn('⚠️ Failed to save background to backend:', result.message);
          }
        } catch (error) {
          console.error('❌ Error saving background to backend:', error);
        }
      }
      
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
    setIsDragOver(true);
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
    setIsDragOver(false);
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
    // Test red rectangle removed - no longer needed
    
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
      fill: 'rgba(0, 0, 0, 0.1)', // Light gray instead of red
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

  // Cleanup function to delete background when component unmounts (cancel scenario)
  const cleanupBackground = useCallback(async () => {
    if (user?.id && currentBackgroundId) {
      try {
        const result = await deleteTemplateBackground(id, user.id);
        if (result.success) {
          console.log('✅ Background cleaned up on component unmount');
        } else {
          console.warn('⚠️ Failed to cleanup background on unmount:', result.message);
        }
      } catch (error) {
        console.error('❌ Error cleaning up background on unmount:', error);
      }
    }
  }, [user?.id, currentBackgroundId, id]);

  // Layer control functions
  const bringToFront = useCallback((targetObject: any) => {
    if (!canvas || !targetObject) return;
    
    // Don't allow bringing background objects to front
    if ((targetObject as any).isBackground) {
      console.log('🚫 Cannot bring background objects to front');
      return;
    }
    
    // Bring object to front using Fabric.js method
    canvas.bringObjectToFront(targetObject);
    canvas.renderAll();
    
    console.log('⬆️ Object brought to front');
  }, [canvas]);

  const bringToBack = useCallback((targetObject: any) => {
    if (!canvas || !targetObject) return;
    
    // Don't allow bringing objects behind background
    if ((targetObject as any).isBackground) {
      console.log('🚫 Cannot move background objects');
      return;
    }
    
    // Find the first background object to position behind it
    const backgroundObjects = canvas.getObjects().filter(obj => (obj as any).isBackground === true);
    if (backgroundObjects.length > 0) {
      // Position object just above the first background object
      const backgroundIndex = canvas.getObjects().indexOf(backgroundObjects[0]);
      canvas.moveObjectTo(targetObject, backgroundIndex + 1);
    } else {
      // No background objects, just send to back
      canvas.sendObjectToBack(targetObject);
    }
    
    canvas.renderAll();
    console.log('⬇️ Object sent to back');
  }, [canvas]);

  // Context menu handlers
  const showContextMenu = useCallback((e: React.MouseEvent, targetObject: any) => {
    e.preventDefault();
    e.stopPropagation();
    
    setContextMenu({
      visible: true,
      x: e.clientX,
      y: e.clientY,
      targetObject: targetObject
    });
  }, []);

  const hideContextMenu = useCallback(() => {
    setContextMenu(prev => ({
      ...prev,
      visible: false
    }));
  }, []);

  const handleContextMenuAction = useCallback((action: 'bringToFront' | 'bringToBack') => {
    if (!contextMenu.targetObject) return;
    
    if (action === 'bringToFront') {
      bringToFront(contextMenu.targetObject);
    } else if (action === 'bringToBack') {
      bringToBack(contextMenu.targetObject);
    }
    
    hideContextMenu();
  }, [contextMenu.targetObject, bringToFront, bringToBack, hideContextMenu]);

  // Color harmony control functions
  const startColorHarmony = useCallback(() => {
    console.log("🎨 startColorHarmony called:", {
      colorHarmonyManager: !!colorHarmonyManager,
      canvas: !!canvas,
      canvasObjects: canvas?.getObjects()?.length || 0,
      isColorHarmonyActive
    });
    
    if (!colorHarmonyManager || !canvas) {
      console.warn('⚠️ Cannot start color harmony - missing dependencies', {
        colorHarmonyManager: !!colorHarmonyManager,
        canvas: !!canvas
      });
      return;
    }
    
    // Find the logo object
    const allObjects = canvas.getObjects();
    console.log('🎨 All canvas objects:', allObjects.map(obj => ({
      type: obj.type,
      isLogo: (obj as any).isLogo,
      isBrandKitLogo: (obj as any).isBrandKitLogo,
      id: obj.get('id')
    })));
    
    // Look for logo objects with multiple criteria - more flexible detection
    const logoObject = allObjects.find(obj => {
      const isLogo = (obj as any).isLogo || (obj as any).isBrandKitLogo;
      const hasLogoId = obj.get('id')?.includes('logo') || obj.get('id')?.includes('brand');
      const isLogoType = obj.type === 'image' && (obj as any).src?.includes('logo');
      
      // Additional criteria for better logo detection
      const hasLogoName = (obj as any).name?.toLowerCase().includes('logo');
      const isTextLogo = (obj.type === 'text' || obj.type === 'i-text') && 
                        (obj.text?.toLowerCase().includes('logo') || 
                         obj.get('id')?.toLowerCase().includes('logo'));
      const isGroupLogo = obj.type === 'group' && 
                         obj.getObjects?.()?.some((subObj: any) => 
                           (subObj as any).isLogo || 
                           subObj.get('id')?.includes('logo'));
      
      console.log('🎨 Checking object for logo criteria:', {
        type: obj.type,
        id: obj.get('id'),
        name: (obj as any).name,
        text: (obj as any).text,
        isLogo,
        isBrandKitLogo: (obj as any).isBrandKitLogo,
        hasLogoId,
        isLogoType,
        hasLogoName,
        isTextLogo,
        isGroupLogo,
        src: (obj as any).src,
        matches: isLogo || hasLogoId || isLogoType || hasLogoName || isTextLogo || isGroupLogo
      });
      
      return isLogo || hasLogoId || isLogoType || hasLogoName || isTextLogo || isGroupLogo;
    });
    console.log("logoObject", logoObject);
    if (logoObject) {
      console.log('🎨 Logo object found for harmony:', {
        type: logoObject.type,
        isLogo: (logoObject as any).isLogo,
        isBrandKitLogo: (logoObject as any).isBrandKitLogo,
        id: logoObject.get('id'),
        src: (logoObject as any).src
      });
      colorHarmonyManager.setLogoObject(logoObject);
      colorHarmonyManager.startMonitoring();
      setIsColorHarmonyActive(true);
      console.log('🎨 Color harmony monitoring started successfully');
    } else {
      console.warn('⚠️ No logo found for color harmony monitoring. Available objects:', allObjects.length);
      
      // Fallback: Start monitoring anyway and try to detect logo later
      console.log('🔄 Starting monitoring without logo - will detect logo when available');
      colorHarmonyManager.startMonitoring();
      setIsColorHarmonyActive(true);
      
      // Also try to find any object that could be considered a logo (first image or text object)
      const fallbackLogo = allObjects.find(obj => 
        obj.type === 'image' || 
        obj.type === 'text' || 
        obj.type === 'i-text' ||
        obj.type === 'group'
      );
      
      if (fallbackLogo) {
        console.log('🎯 Using fallback logo object:', {
          type: fallbackLogo.type,
          id: fallbackLogo.get('id')
        });
        colorHarmonyManager.setLogoObject(fallbackLogo);
      }
    }
  }, [colorHarmonyManager, canvas]);

  const stopColorHarmony = useCallback(() => {
    if (!colorHarmonyManager) return;
    
    colorHarmonyManager.stopMonitoring();
    setIsColorHarmonyActive(false);
    console.log('🎨 Color harmony monitoring stopped');
  }, [colorHarmonyManager]);

  const toggleColorHarmony = useCallback(() => {
    if (isColorHarmonyActive) {
      stopColorHarmony();
    } else {
      startColorHarmony();
    }
  }, [isColorHarmonyActive, startColorHarmony, stopColorHarmony]);

  // Manual trigger for testing color harmony
  const manualTriggerColorHarmony = useCallback(() => {
    console.log('🎨 Manual color harmony trigger');
    if (canvas && colorHarmonyManager) {
      const allObjects = canvas.getObjects();
      console.log('🎨 All objects on canvas:', allObjects.map(obj => ({
        type: obj.type,
        isLogo: (obj as any).isLogo,
        isBrandKitLogo: (obj as any).isBrandKitLogo,
        id: obj.get('id'),
        colorState: (obj as any).colorState
      })));
      
      const logoObject = allObjects.find(obj => {
        const isLogo = (obj as any).isLogo || (obj as any).isBrandKitLogo;
        const hasLogoId = obj.get('id')?.includes('logo') || obj.get('id')?.includes('brand');
        const isLogoType = obj.type === 'image' && (obj as any).src?.includes('logo');
        return isLogo || hasLogoId || isLogoType;
      });
      
      if (logoObject) {
        console.log('🎨 Found logo for manual trigger:', logoObject);
        colorHarmonyManager.setLogoObject(logoObject);
        startColorHarmony();
      } else {
        console.warn('⚠️ No logo found for manual trigger');
      }
    }
  }, [canvas, colorHarmonyManager, startColorHarmony]);

  // Color harmony auto-start
  useEffect(() => {
    console.log("canvas----");
    if (canvas && colorHarmonyManager && !isColorHarmonyActive) {
      // Auto-start color harmony when canvas and manager are ready
      console.log('🎨 Auto-starting color harmony system');
      startColorHarmony();
    }
  }, [canvas, colorHarmonyManager, isColorHarmonyActive, startColorHarmony]);

  // Color harmony object detection
  useEffect(() => {
    if (canvas && colorHarmonyManager && isColorHarmonyActive) {
      // Re-analyze color harmony when objects change
      console.log('🎨 Re-analyzing color harmony due to object changes');
      startColorHarmony();
    }
  }, [objects, canvas, colorHarmonyManager, isColorHarmonyActive, startColorHarmony]);

  // Hide context menu when clicking outside
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (contextMenu.visible) {
        hideContextMenu();
      }
    };

    if (contextMenu.visible) {
      document.addEventListener('click', handleClickOutside);
      document.addEventListener('contextmenu', handleClickOutside);
    }

    return () => {
      document.removeEventListener('click', handleClickOutside);
      document.removeEventListener('contextmenu', handleClickOutside);
    };
  }, [contextMenu.visible, hideContextMenu]);

  // Cleanup on component unmount
  useEffect(() => {
    return () => {
      // Only cleanup if we have a background that was saved but not applied
      if (currentBackgroundId) {
        cleanupBackground();
      }
    };
  }, [cleanupBackground]);

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
    
    // Check if user can save (premium feature for free users)
    if (!canPerformPremiumAction('Save template changes')) {
      return;
    }
    
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
      
      // Debug gradient data on objects
      canvasObjects.forEach((obj, index) => {
        console.log(`🔍 Object ${index + 1} (${obj.type}) properties:`, {
          type: obj.type,
          fill: obj.fill,
          hasGradientType: !!(obj as any).gradientType,
          gradientType: (obj as any).gradientType,
          gradientColors: (obj as any).gradientColors,
          gradientStops: (obj as any).gradientStops,
          gradientCoords: (obj as any).gradientCoords,
          left: obj.left,
          top: obj.top,
          width: obj.width,
          height: obj.height
        });
      });
      
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
            left: obj.left !== undefined && obj.left !== null ? obj.left : 0,
            top: obj.top !== undefined && obj.top !== null ? obj.top : 0,
            width: obj.width !== undefined && obj.width !== null ? obj.width : 0,
            height: obj.height !== undefined && obj.height !== null ? obj.height : 0,
            fill: obj.fill !== undefined && obj.fill !== null ? obj.fill : '#000000',
            stroke: obj.stroke !== undefined && obj.stroke !== null ? obj.stroke : 'transparent',
            scaleX: obj.scaleX !== undefined && obj.scaleX !== null ? obj.scaleX : 1,
            scaleY: obj.scaleY !== undefined && obj.scaleY !== null ? obj.scaleY : 1,
            angle: obj.angle !== undefined && obj.angle !== null ? obj.angle : 0,
            opacity: obj.opacity !== undefined && obj.opacity !== null ? obj.opacity : 1,
            strokeWidth: (obj as any).strokeWidth !== undefined && (obj as any).strokeWidth !== null ? (obj as any).strokeWidth : 0,
            strokeLineCap: (obj as any).strokeLineCap || 'butt',
            strokeLineJoin: (obj as any).strokeLineJoin || 'miter',
            shadow: (obj as any).shadow || null,
            isBackground: (obj as any).isBackground || false,
            // Add gradient properties for all objects
            gradientType: (obj as any).gradientType || null,
            gradientColors: (obj as any).gradientColors || null,
            gradientStops: (obj as any).gradientStops || null,
            gradientCoords: (obj as any).gradientCoords || null,
            // Add path property for path objects
            ...(obj.type === 'path' ? { path: (obj as fabric.Path).path || '' } : {})
          };
          

          
          // Add text-specific properties if it's a text object
          if (obj.type === 'text' || obj.type === 'i-text') {
            const textObj = obj as fabric.IText;
            return {
              ...baseObj,
              fontSize: textObj.fontSize || 48,
              fontFamily: textObj.fontFamily || 'Arial',
              fontWeight: textObj.fontWeight || 'normal',
              fontStyle: textObj.fontStyle || 'normal',
              textAlign: textObj.textAlign || 'left',
              text: textObj.text || '',
              opacity: textObj.opacity || 1,
              // Enhanced text outline and fill properties
              strokeWidth: textObj.strokeWidth !== undefined && textObj.strokeWidth !== null ? textObj.strokeWidth : 0,
              strokeLineCap: textObj.strokeLineCap || 'butt',
              strokeLineJoin: textObj.strokeLineJoin || 'miter',
              strokeDashArray: textObj.strokeDashArray || null,
              strokeDashOffset: textObj.strokeDashOffset !== undefined && textObj.strokeDashOffset !== null ? textObj.strokeDashOffset : 0,
              strokeUniform: textObj.strokeUniform || false,
              strokeMiterLimit: textObj.strokeMiterLimit !== undefined && textObj.strokeMiterLimit !== null ? textObj.strokeMiterLimit : 4,
              shadow: textObj.shadow || null,
              // Text-specific rendering properties
              fillRule: textObj.fillRule || 'nonzero',
              paintFirst: textObj.paintFirst || 'fill',
              globalCompositeOperation: textObj.globalCompositeOperation || 'source-over',
              // Text transformation properties
              skewX: textObj.skewX || 0,
              skewY: textObj.skewY || 0,
              flipX: textObj.flipX || false,
              flipY: textObj.flipY || false
            };
          }
          
          // Add image-specific properties
          if (obj.type === 'image') {
            const imageObj = obj as fabric.Image;
            return {
              ...baseObj,
              src: (imageObj as any).src || (imageObj as any).getSrc() || '',
              crossOrigin: (imageObj as any).crossOrigin || 'anonymous',
              opacity: imageObj.opacity || 1,
              strokeWidth: (imageObj as any).strokeWidth || 0,
              strokeLineCap: (imageObj as any).strokeLineCap || 'butt',
              strokeLineJoin: (imageObj as any).strokeLineJoin || 'miter',
              shadow: (imageObj as any).shadow || null
            };
          }
          
          // Add line-specific properties
          if (obj.type === 'line') {
            const lineObj = obj as fabric.Line;
            return {
              ...baseObj,
              x1: (lineObj as any).x1 || 0,
              y1: (lineObj as any).y1 || 0,
              x2: (lineObj as any).x2 || 0,
              y2: (lineObj as any).y2 || 0,
              strokeWidth: (lineObj as any).strokeWidth || 3,
              strokeDashArray: (lineObj as any).strokeDashArray || null,
              opacity: lineObj.opacity || 1,
              strokeLineCap: (lineObj as any).strokeLineCap || 'butt',
              strokeLineJoin: (lineObj as any).strokeLineJoin || 'miter',
              shadow: (lineObj as any).shadow || null
            };
          }
          
          // Add shape-specific properties
          if (obj.type === 'rect') {
            const rectObj = obj as fabric.Rect;
            return {
              ...baseObj,
              rx: rectObj.rx !== undefined && rectObj.rx !== null ? rectObj.rx : 0,  // Rounded corner radius X
              ry: rectObj.ry !== undefined && rectObj.ry !== null ? rectObj.ry : 0,  // Rounded corner radius Y
              opacity: rectObj.opacity !== undefined && rectObj.opacity !== null ? rectObj.opacity : 1,
              strokeWidth: rectObj.strokeWidth !== undefined && rectObj.strokeWidth !== null ? rectObj.strokeWidth : 0,
              strokeLineCap: rectObj.strokeLineCap || 'butt',
              strokeLineJoin: rectObj.strokeLineJoin || 'miter',
              shadow: rectObj.shadow || null
            };
          }
          
          // Add circle-specific properties
          if (obj.type === 'circle') {
            const circleObj = obj as fabric.Circle;
            return {
              ...baseObj,
              radius: circleObj.radius !== undefined && circleObj.radius !== null ? circleObj.radius : 0,
              opacity: circleObj.opacity !== undefined && circleObj.opacity !== null ? circleObj.opacity : 1,
              strokeWidth: circleObj.strokeWidth !== undefined && circleObj.strokeWidth !== null ? circleObj.strokeWidth : 0,
              strokeLineCap: circleObj.strokeLineCap || 'butt',
              strokeLineJoin: circleObj.strokeLineJoin || 'miter',
              shadow: circleObj.shadow || null
            };
          }
          
          // Add triangle-specific properties
          if (obj.type === 'triangle') {
            const triangleObj = obj as fabric.Triangle;
            return {
              ...baseObj,
              opacity: triangleObj.opacity !== undefined && triangleObj.opacity !== null ? triangleObj.opacity : 1,
              strokeWidth: triangleObj.strokeWidth !== undefined && triangleObj.strokeWidth !== null ? triangleObj.strokeWidth : 0,
              strokeLineCap: triangleObj.strokeLineCap || 'butt',
              strokeLineJoin: triangleObj.strokeLineJoin || 'miter',
              strokeDashArray: triangleObj.strokeDashArray || null,
              strokeDashOffset: triangleObj.strokeDashOffset !== undefined && triangleObj.strokeDashOffset !== null ? triangleObj.strokeDashOffset : 0,
              strokeUniform: triangleObj.strokeUniform || false,
              strokeMiterLimit: triangleObj.strokeMiterLimit !== undefined && triangleObj.strokeMiterLimit !== null ? triangleObj.strokeMiterLimit : 4,
              shadow: triangleObj.shadow || null,
              fillRule: triangleObj.fillRule || 'nonzero',
              paintFirst: triangleObj.paintFirst || 'fill',
              globalCompositeOperation: triangleObj.globalCompositeOperation || 'source-over',
              skewX: triangleObj.skewX !== undefined && triangleObj.skewX !== null ? triangleObj.skewX : 0,
              skewY: triangleObj.skewY !== undefined && triangleObj.skewY !== null ? triangleObj.skewY : 0,
              flipX: triangleObj.flipX || false,
              flipY: triangleObj.flipY || false
            };
          }
          
          // Add polygon-specific properties
          if (obj.type === 'polygon') {
            const polygonObj = obj as fabric.Polygon;
            return {
              ...baseObj,
              points: polygonObj.points || [],
              opacity: polygonObj.opacity !== undefined && polygonObj.opacity !== null ? polygonObj.opacity : 1,
              strokeWidth: polygonObj.strokeWidth !== undefined && polygonObj.strokeWidth !== null ? polygonObj.strokeWidth : 0,
              strokeLineCap: polygonObj.strokeLineCap || 'butt',
              strokeLineJoin: polygonObj.strokeLineJoin || 'miter',
              shadow: polygonObj.shadow || null
            };
          }
          
          // Add path-specific properties
          if (obj.type === 'path') {
            const pathObj = obj as fabric.Path;
            console.log('🔍 Saving path object:', {
              type: pathObj.type,
              path: pathObj.path,
              hasPath: !!pathObj.path,
              pathLength: pathObj.path ? pathObj.path.length : 0
            });
            // Get the path data directly from the path object
            const originalPathData = pathObj.path || '';
            
            // If pathData is an array, convert it to SVG path string
            let pathDataString = '';
            if (Array.isArray(originalPathData)) {
              console.log('🔍 Converting path array to SVG string:', originalPathData);
              // Convert Fabric.js path array to SVG path string
              pathDataString = originalPathData.map((cmd: any) => {
                if (typeof cmd === 'string') return cmd;
                if (Array.isArray(cmd)) {
                  return cmd.join(' ');
                }
                return '';
              }).join(' ');
              console.log('🔍 Converted to SVG path string:', pathDataString);
            } else {
              pathDataString = String(originalPathData);
            }
            
            console.log('🔍 Final path data for saving:', {
              path: pathDataString,
              hasPath: !!pathDataString,
              pathLength: pathDataString ? pathDataString.length : 0
            });
            
            return {
              ...baseObj,
              path: pathDataString,
              pathData: pathDataString, // Also store as pathData for compatibility
              opacity: pathObj.opacity !== undefined && pathObj.opacity !== null ? pathObj.opacity : 1,
              strokeWidth: pathObj.strokeWidth !== undefined && pathObj.strokeWidth !== null ? pathObj.strokeWidth : 0,
              strokeLineCap: pathObj.strokeLineCap || 'butt',
              strokeLineJoin: pathObj.strokeLineJoin || 'miter',
              strokeDashArray: pathObj.strokeDashArray || null,
              strokeDashOffset: pathObj.strokeDashOffset !== undefined && pathObj.strokeDashOffset !== null ? pathObj.strokeDashOffset : 0,
              strokeUniform: pathObj.strokeUniform || false,
              strokeMiterLimit: pathObj.strokeMiterLimit !== undefined && pathObj.strokeMiterLimit !== null ? pathObj.strokeMiterLimit : 4,
              shadow: pathObj.shadow || null,
              fillRule: pathObj.fillRule || 'nonzero',
              paintFirst: pathObj.paintFirst || 'fill',
              globalCompositeOperation: pathObj.globalCompositeOperation || 'source-over',
              skewX: pathObj.skewX !== undefined && pathObj.skewX !== null ? pathObj.skewX : 0,
              skewY: pathObj.skewY !== undefined && pathObj.skewY !== null ? pathObj.skewY : 0,
              flipX: pathObj.flipX || false,
              flipY: pathObj.flipY || false
            };
          }
          
          return baseObj;
        }),
        metadata: {
        createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
          version: '1.0.0'
        }
      };
      
      console.log('📋 Design data prepared:', designData);
      console.log('🔍 Objects in design data:', designData.objects.map((obj, index) => ({
        index: index + 1,
        type: obj.type,
        hasGradientType: !!obj.gradientType,
        gradientType: obj.gradientType,
        gradientColors: obj.gradientColors,
        gradientStops: obj.gradientStops,
        gradientCoords: obj.gradientCoords,
        fill: obj.fill
      })));
      
      // Always save as one single file (user requested)
      const dataSize = getDataSize(designData);
      console.log('📊 Design data size:', dataSize, 'bytes');
      console.log('💾 Saving as single file (user preference)...');
      
      // Always try to save to backend first (for both templates and new designs)
      console.log('💾 Saving design data to backend...');
      try {
        // Always save as single file - optimize if needed but keep everything together
        let dataToSave = designData;
        let isOptimized = false;
        
        // Only optimize if data is extremely large (over 100MB) to prevent server issues
        if (exceedsSizeLimit(designData, 100000000)) {
          console.log('⚠️ Data extremely large, optimizing but keeping as single file...');
          const optimization = optimizeDesignData(designData as any, 100000000);
          dataToSave = optimization.optimized;
          isOptimized = optimization.isMinimal;
          console.log('🗜️ Data optimized:', {
            originalSize: optimization.originalSize,
            optimizedSize: optimization.optimizedSize,
            reduction: `${Math.round((1 - optimization.optimizedSize / optimization.originalSize) * 100)}%`
          });
        }
        
        // Create filename using template's _id (as requested by user)
        // This ensures the JSON filename matches the template's _id for future scalability
        const filename = id && id !== 'new' 
          ? `${id}.json`
          : `design-${Date.now()}.json`;
        console.log('📁 Filename prepared:', filename);
        
        let databaseUpdated = false;
        let originalDesignFilename = null;
        
        // STEP 1: Update database FIRST (before file creation)
        if (templateKey) {
          console.log('🏠 Updating template in database FIRST:', templateKey);
          
          // Get current template data to store original filename for rollback
          try {
            const currentTemplateResponse = await fetch(API_ENDPOINTS.TEMPLATE_BY_KEY(templateKey));
            if (currentTemplateResponse.ok) {
              const currentTemplate = await currentTemplateResponse.json();
              originalDesignFilename = currentTemplate.designFilename;
              console.log('📋 Original designFilename for rollback:', originalDesignFilename);
            }
          } catch (error) {
            console.warn('⚠️ Could not get current template data for rollback:', error);
          }
          
          const templateUpdateData = {
            designFilename: filename, // Set the new filename BEFORE file creation
            backgroundColor: designData.backgroundColor,
            backgroundImage: designData.backgroundImage,
            canvasSize: designData.canvasSize,
            updatedAt: new Date().toISOString()
          };
          
          console.log('📋 Template update data (minimal):', templateUpdateData);
          
          // Update template in database FIRST
          const response = await fetch(API_ENDPOINTS.TEMPLATE_BY_KEY(templateKey), {
            method: 'PUT',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify(templateUpdateData)
          });
          
          if (response.ok) {
            const result = await response.json();
            console.log('✅ Template updated successfully in database FIRST:', templateKey);
            console.log('📋 Database response:', result);
            databaseUpdated = true;
          } else {
            const errorData = await response.json();
            console.error('❌ Failed to update template in database:', errorData);
            throw new Error(`Database update failed: ${errorData.error || 'Unknown error'}`);
          }
        }
        
        // STEP 2: Save file AFTER database update
        console.log('📁 Now saving design data to file:', filename);
          const fileResponse = await fetch(API_ENDPOINTS.SAVE_DESIGN, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
            designData: dataToSave,
            templateKey: templateKey || null,
            filename: filename
            })
          });
          
          console.log('📡 File response status:', fileResponse.status);
          console.log('📡 File response headers:', Object.fromEntries(fileResponse.headers.entries()));
          
          if (!fileResponse.ok) {
            const errorText = await fileResponse.text();
            console.error('❌ File save failed:', errorText);
          
          // ROLLBACK: If file save fails, revert database change
          if (databaseUpdated && templateKey) {
            console.log('🔄 Rolling back database change due to file save failure...');
            try {
              const rollbackData = {
                designFilename: originalDesignFilename, // Restore original filename
            backgroundColor: designData.backgroundColor,
            backgroundImage: designData.backgroundImage,
            canvasSize: designData.canvasSize,
            updatedAt: new Date().toISOString()
          };
          
              const rollbackResponse = await fetch(API_ENDPOINTS.TEMPLATE_BY_KEY(templateKey), {
            method: 'PUT',
            headers: {
              'Content-Type': 'application/json',
            },
                body: JSON.stringify(rollbackData)
              });
              
              if (rollbackResponse.ok) {
                console.log('✅ Database rollback successful');
              } else {
                console.error('❌ Database rollback failed');
              }
            } catch (rollbackError) {
              console.error('❌ Error during database rollback:', rollbackError);
            }
          }
          
          throw new Error(`Failed to save design data file: ${fileResponse.status} ${fileResponse.statusText}`);
        }
        
        const fileResult = await fileResponse.json();
        const designFilename = fileResult.filename;
        console.log('✅ Design data saved as file:', designFilename);
        
        // STEP 3: Show success message
        if (templateKey) {
            console.log('💾 Design data saved as file:', designFilename);
            console.log('💾 Template updated in database successfully');
            
            // Clear background ID since it's now part of the saved design
            setCurrentBackgroundId(null);
            
            // Show success message to user
              const optimizationMessage = isOptimized ? '\n🗜️ Datos optimizados para reducir tamaño' : '';
              alert(`✅ Template "${templateKey}" actualizado exitosamente!\n📁 Datos guardados en un solo archivo: ${designFilename}${optimizationMessage}`);
          } else {
            // For new designs (no templateKey), just show success message
            console.log('✅ New design saved as file:', designFilename);
            const optimizationMessage = isOptimized ? '\n🗜️ Datos optimizados para reducir tamaño' : '';
          alert(`✅ Diseño guardado exitosamente!\n📁 Datos guardados en: ${filename}${optimizationMessage}`);
          }
          
          // Generate and save thumbnail after successful save
          await generateAndSaveThumbnail();
        } catch (backendError) {
          console.error('❌ Error saving to backend:', backendError);
          console.error('❌ Backend error details:', backendError);
          
          // Show error to user - no localStorage fallback
          const errorMessage = backendError instanceof Error ? backendError.message : 'Backend save failed';
          alert(`❌ Error al guardar: ${errorMessage}\n\nPor favor, intenta nuevamente o contacta al soporte técnico.`);
          return;
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



  const currentConfig = editorConfigs[editorTypeState as keyof typeof editorConfigs] || editorConfigs.flyer;
  return (
    <div className="min-h-screen bg-gray-50 flex">
      {/* Sidebar Toolbar */}
      <div className="w-80 bg-white border-r border-gray-200 shadow-sm flex flex-col">
        {/* Top Row - File and Edit Operations */}
        <div className="flex items-center justify-between px-6 py-3 border-b border-gray-100">
          {/* Left Section - File Operations */}
            <div className="flex items-center space-x-2">
              {/* Keep/Save Button */}
                <button
                  onClick={async () => await saveDesign()}
                  className={`p-2 rounded-lg transition-colors relative ${
                    userPlan === 'Free' 
                      ? 'bg-gradient-to-r from-blue-100 to-purple-100 hover:from-blue-200 hover:to-purple-200' 
                      : 'bg-gray-100 hover:bg-gray-200'
                  }`}
                  title={userPlan === 'Free' ? 'Guardar Diseño (Premium) - Upgrade para guardar' : 'Guardar Diseño (Ctrl+S) - Guarda todo en un solo archivo'}
                >
                  <FloppyDisk size={20} />
                  {userPlan === 'Free' && (
                    <div className="absolute -top-1 -right-1 w-3 h-3 bg-gradient-to-r from-blue-500 to-purple-500 rounded-full flex items-center justify-center">
                      <svg className="w-2 h-2 text-white" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M11.3 1.046A1 1 0 0112 2v5h4a1 1 0 01.82 1.573l-7 10A1 1 0 018 18v-5H4a1 1 0 01-.82-1.573l7-10a1 1 0 011.12-.38z" clipRule="evenodd" />
                      </svg>
                    </div>
                  )}
                </button>
              
              {/* Color Harmony Toggle Button */}
              <button
                onClick={toggleColorHarmony}
                className={`p-2 rounded-lg transition-colors ${
                  isColorHarmonyActive 
                    ? 'bg-green-100 hover:bg-green-200 text-green-700' 
                    : 'bg-gray-100 hover:bg-gray-200'
                }`}
                title={isColorHarmonyActive ? 'Color Harmony: Activo' : 'Color Harmony: Inactivo - Click para activar'}
              >
                <Palette size={20} />
              </button>

              {/* Debug button for manual color harmony trigger */}
              <button
                onClick={manualTriggerColorHarmony}
                className="p-2 rounded-lg bg-blue-100 hover:bg-blue-200 text-blue-700 transition-colors"
                title="Debug: Trigger Color Harmony Manualmente"
              >
                🎨
              </button>

                          {/* Download Dropdown */}
            <div className="relative download-dropdown">
              <button
                onClick={() => setShowDownloadDropdown(!showDownloadDropdown)}
                className="p-2 rounded-lg bg-gray-100 hover:bg-gray-200 transition-colors"
                title="Descargar diseño"
              >
                <Download size={20} />
              </button>
              
              {/* Download Dropdown Menu */}
              {showDownloadDropdown && (
                <div className="absolute top-full left-0 mt-2 bg-white border border-gray-200 rounded-lg shadow-lg z-50 min-w-[120px]">
              <button
                      onClick={() => {
                        downloadDesign('PNG');
                        setShowDownloadDropdown(false);
                      }}
                      className="w-full px-4 py-2 text-left text-sm hover:bg-gray-50 flex items-center space-x-2 rounded-t-lg"
                    >
                    <Download size={16} className="text-green-600" />
                      <span>PNG</span>
                    </button>
                    <button
                      onClick={() => {
                        downloadDesign('PDF');
                        setShowDownloadDropdown(false);
                      }}
                      className="w-full px-4 py-2 text-left text-sm hover:bg-gray-50 flex items-center space-x-2 rounded-b-lg"
                    >
                    <FilePdf size={4} className="w-4 h-4 text-red-600" />
                      <span>PDF</span>
              </button>
                  </div>
                )}
              </div>
            </div>

          {/* Right Section - Edit Operations */}
            <div className="flex items-center space-x-2">
              <button
                onClick={undo}
                disabled={historyIndex <= 0}
                className="p-2 rounded-lg bg-gray-100 hover:bg-gray-200 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                title="Deshacer (Ctrl+Z)"
              >
              <ArrowArcLeft size={5} className="w-5 h-5" />
              </button>
              
              <button
                onClick={redo}
                disabled={historyIndex >= history.length - 1}
                className="p-2 rounded-lg bg-gray-100 hover:bg-gray-200 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                title="Rehacer (Ctrl+Y)"
              >
              <ArrowArcRight size={5} className="w-5 h-5" />
              </button>
              
              <div className="w-px h-8 bg-gray-300 mx-2"></div>
              
              <button
                onClick={duplicateSelectedObject}
                disabled={!selectedObject}
                className="p-2 rounded-lg bg-gray-100 hover:bg-gray-200 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                title="Duplicar (Ctrl+D)"
              >
              <Scissors size={4} className="w-4 h-4" />
              </button>
              
              <button
                onClick={deleteSelectedObject}
                disabled={!selectedObject}
                className={`p-2 rounded-lg transition-colors relative ${
                  userPlan === 'Free' 
                    ? 'bg-gradient-to-r from-red-100 to-pink-100 hover:from-red-200 hover:to-pink-200' 
                    : 'bg-gray-100 hover:bg-gray-200'
                } disabled:opacity-50 disabled:cursor-not-allowed`}
                title={userPlan === 'Free' ? 'Eliminar (Premium) - Upgrade para eliminar' : 'Eliminar (Delete)'}
              >
                <Trash size={4} className="w-4 h-4" />
                {userPlan === 'Free' && (
                  <div className="absolute -top-1 -right-1 w-3 h-3 bg-gradient-to-r from-red-500 to-pink-500 rounded-full flex items-center justify-center">
                    <svg className="w-2 h-2 text-white" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M11.3 1.046A1 1 0 0112 2v5h4a1 1 0 01.82 1.573l-7 10A1 1 0 018 18v-5H4a1 1 0 01-.82-1.573l7-10a1 1 0 011.12-.38z" clipRule="evenodd" />
                    </svg>
                  </div>
                )}
              </button>
          </div>
        </div>

        {/* Bottom Row - Tabs and Content */}
         <div className="px-6 py-3">
          {/* Tab Navigation */}
           <div className="flex border-b border-gray-200 mb-4">
            <button
              onClick={() => setActiveTab('elements')}
               className={`px-4 py-2 text-sm font-medium transition-colors ${
                activeTab === 'elements'
                   ? 'text-blue-600 border-b-2 border-blue-600'
                   : 'text-gray-500 hover:text-gray-700'
              }`}
            >
               Elementos
            </button>
            <button
              onClick={() => setActiveTab('text')}
               className={`px-4 py-2 text-sm font-medium transition-colors ${
                activeTab === 'text'
                   ? 'text-blue-600 border-b-2 border-blue-600'
                   : 'text-gray-500 hover:text-gray-700'
              }`}
            >
               Texto
            </button>
            <button
              onClick={() => setActiveTab('format')}
               className={`px-4 py-2 text-sm font-medium transition-colors ${
                activeTab === 'format'
                   ? 'text-blue-600 border-b-2 border-blue-600'
                   : 'text-gray-500 hover:text-gray-700'
              }`}
            >
               Formato
            </button>
          </div>
          
          {/* Tab Content */}
            {activeTab === 'elements' && (
             <div className="space-y-3">
               {/* Basic Design Tools */}
               <div className="space-y-2">
                 <h4 className="text-sm font-medium text-gray-700">Agregar Elementos</h4>
                 
                 {/* Add Text */}
                 <button
                   onClick={addText}
                   className="w-full flex items-center space-x-3 px-3 py-2 bg-blue-50 hover:bg-blue-100 rounded-lg transition-colors"
                   title="Agregar Texto"
                 >
                   <TextT size={16} className="text-blue-600" />
                   <span className="text-sm font-medium text-blue-800">Texto</span>
                 </button>
                 
                 {/* Add Image */}
                 <button
                   onClick={() => fileInputRef.current?.click()}
                   className="w-full flex items-center space-x-3 px-3 py-2 bg-green-50 hover:bg-green-100 rounded-lg transition-colors"
                   title="Agregar Imagen"
                 >
                   <ImageIcon size={16} className="text-green-600" />
                   <span className="text-sm font-medium text-green-800">Imagen</span>
                 </button>
                  


                 {/* Add Shape */}
                 <div className="relative shapes-container">
                   <button
                     onClick={() => setShowShapeSelector(true)}
                     className="w-full flex items-center space-x-3 px-3 py-2 bg-purple-50 hover:bg-purple-100 rounded-lg transition-colors"
                     title="Agregar Forma"
                   >
                     <Square size={16} className="text-purple-600" />
                     <span className="text-sm font-medium text-purple-800">Formas</span>
                   </button>
                  
                  {/* Shape Selector Modal */}
                  {showShapeSelector && (
                    <div className="absolute top-full left-0 mt-2 bg-white rounded-xl shadow-2xl border border-gray-200 p-4 z-50 min-w-[420px]">
                      <div className="flex items-center justify-between mb-3">
                        <h3 className="text-sm font-semibold text-gray-900">Seleccionar Forma</h3>
                        <button
                          onClick={() => setShowShapeSelector(false)}
                          className="text-gray-400 hover:text-gray-600 transition-colors"
                        >
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                          </svg>
                  </button>
                      </div>
                      
                      <div className="grid grid-cols-3 gap-3">
                        {/* Square */}
                        <button
                          onClick={() => addShape('rectangle')}
                          className="flex flex-col items-center p-3 bg-gray-50 hover:bg-gray-100 rounded-lg transition-colors group"
                        >
                          <div className="w-8 h-8 bg-purple-100 rounded flex items-center justify-center mb-2 group-hover:bg-purple-200 transition-colors">
                            <Square size={20} className="text-purple-600" />
                          </div>
                          <span className="text-xs font-medium text-gray-700">Cuadrado</span>
                        </button>
                        
                        {/* Triangle */}
                        <button
                          onClick={() => addShape('triangle')}
                          className="flex flex-col items-center p-3 bg-gray-50 hover:bg-gray-100 rounded-lg transition-colors group"
                        >
                          <div className="w-8 h-8 bg-blue-100 rounded flex items-center justify-center mb-2 group-hover:bg-blue-200 transition-colors">
                            <svg className="w-5 h-5 text-blue-600" fill="currentColor" viewBox="0 0 24 24">
                              <path d="M12 2L2 22h20L12 2z"/>
                            </svg>
                          </div>
                          <span className="text-xs font-medium text-gray-700">Triángulo</span>
                        </button>
                        
                        {/* Circle */}
                        <button
                          onClick={() => addShape('circle')}
                          className="flex flex-col items-center p-3 bg-gray-50 hover:bg-gray-100 rounded-lg transition-colors group"
                        >
                          <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center mb-2 group-hover:bg-green-200 transition-colors">
                            <svg className="w-5 h-5 text-green-600" fill="currentColor" viewBox="0 0 24 24">
                              <circle cx="12" cy="12" r="10"/>
                            </svg>
                          </div>
                          <span className="text-xs font-medium text-gray-700">Círculo</span>
                        </button>
                        
                        {/* Rounded Rectangle */}
                        <button
                          onClick={() => addShape('rounded-rectangle')}
                          className="flex flex-col items-center p-3 bg-gray-50 hover:bg-gray-100 rounded-lg transition-colors group"
                        >
                          <div className="w-8 h-8 bg-orange-100 rounded-lg flex items-center justify-center mb-2 group-hover:bg-orange-200 transition-colors">
                            <svg className="w-5 h-5 text-orange-600" fill="currentColor" viewBox="0 0 24 24">
                              <rect x="2" y="2" width="20" height="20" rx="3" ry="3"/>
                            </svg>
                          </div>
                          <span className="text-xs font-medium text-gray-700">Redondeado</span>
                        </button>
                        
                        {/* Line */}
                        <button
                          onClick={() => addShape('line')}
                          className="flex flex-col items-center p-3 bg-gray-50 hover:bg-gray-100 rounded-lg transition-colors group"
                        >
                          <div className="w-8 h-8 bg-red-100 rounded flex items-center justify-center mb-2 group-hover:bg-red-200 transition-colors">
                            <svg className="w-5 h-5 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 12h14"/>
                            </svg>
                          </div>
                          <span className="text-xs font-medium text-gray-700">Línea</span>
                        </button>
                        
                        {/* Dash Line */}
                        <button
                          onClick={() => addShape('dashline')}
                          className="flex flex-col items-center p-3 bg-gray-50 hover:bg-gray-100 rounded-lg transition-colors group"
                        >
                          <div className="w-8 h-8 bg-indigo-100 rounded flex items-center justify-center mb-2 group-hover:bg-indigo-200 transition-colors">
                            <svg className="w-5 h-5 text-indigo-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 12h14" strokeDasharray="5,5"/>
                            </svg>
                          </div>
                          <span className="text-xs font-medium text-gray-700">Línea Punteada</span>
                        </button>
                        
                        {/* Wave */}
                        <button
                          onClick={() => addShape('wave')}
                          className="flex flex-col items-center p-3 bg-gray-50 hover:bg-gray-100 rounded-lg transition-colors group"
                        >
                          <div className="w-8 h-8 bg-teal-100 rounded flex items-center justify-center mb-2 group-hover:bg-teal-200 transition-colors">
                            <svg className="w-5 h-5 text-teal-600" fill="currentColor" viewBox="0 0 24 24">
                              <path d="M2 12C2 12 6 8 12 8C18 8 22 12 22 12V20C22 20 18 24 12 24C6 24 2 20 2 20V12Z"/>
                            </svg>
                          </div>
                          <span className="text-xs font-medium text-gray-700">Onda</span>
                        </button>
                        
                        {/* Vertical Wave */}
                        <button
                          onClick={() => addShape('wave-vertical')}
                          className="flex flex-col items-center p-3 bg-gray-50 hover:bg-gray-100 rounded-lg transition-colors group"
                        >
                          <div className="w-8 h-8 bg-blue-100 rounded flex items-center justify-center mb-2 group-hover:bg-blue-200 transition-colors">
                            <svg className="w-5 h-5 text-blue-600" fill="currentColor" viewBox="0 0 24 24">
                              <path d="M12 2C12 2 8 6 8 12C8 18 12 22 12 22C12 22 16 18 16 12C16 6 12 2 12 2Z"/>
                            </svg>
                          </div>
                          <span className="text-xs font-medium text-gray-700">Onda Vertical</span>
                        </button>
                        
                        {/* Simple Wave */}
                        <button
                          onClick={() => addShape('wave-simple')}
                          className="flex flex-col items-center p-3 bg-gray-50 hover:bg-gray-100 rounded-lg transition-colors group"
                        >
                          <div className="w-8 h-8 bg-green-100 rounded flex items-center justify-center mb-2 group-hover:bg-green-200 transition-colors">
                            <svg className="w-5 h-5 text-green-600" fill="currentColor" viewBox="0 0 24 24">
                              <path d="M2 12C2 12 8 8 12 8C16 8 22 12 22 12V20C22 20 16 24 12 24C8 24 2 20 2 20V12Z"/>
                            </svg>
                          </div>
                          <span className="text-xs font-medium text-gray-700">Onda Simple</span>
                        </button>
                        
                        {/* Pill Shape */}
                        <button
                          onClick={() => addShape('pill')}
                          className="flex flex-col items-center p-3 bg-gray-50 hover:bg-gray-100 rounded-lg transition-colors group"
                        >
                          <div className="w-8 h-8 bg-pink-100 rounded-full flex items-center justify-center mb-2 group-hover:bg-pink-200 transition-colors">
                            <svg className="w-5 h-5 text-pink-600" fill="currentColor" viewBox="0 0 24 24">
                              <rect x="2" y="6" width="20" height="12" rx="6" ry="6"/>
                            </svg>
                          </div>
                          <span className="text-xs font-medium text-gray-700">Píldora</span>
                        </button>
                        
                        {/* Half-Rounded Rectangle */}
                        <button
                          onClick={() => addShape('half-rounded')}
                          className="flex flex-col items-center p-3 bg-gray-50 hover:bg-gray-100 rounded-lg transition-colors group"
                        >
                          <div className="w-8 h-8 bg-amber-100 rounded flex items-center justify-center mb-2 group-hover:bg-amber-200 transition-colors">
                            <svg className="w-5 h-5 text-amber-600" fill="currentColor" viewBox="0 0 24 24">
                              <path d="M2 6 L 14 6 Q 22 6 22 12 Q 22 18 14 18 L 2 18 Z"/>
                            </svg>
                          </div>
                          <span className="text-xs font-medium text-gray-700">Medio Redondeado</span>
                        </button>
                        
                        {/* Map Pin */}
                        <button
                          onClick={() => addShape('map-pin')}
                          className="flex flex-col items-center p-3 bg-gray-50 hover:bg-gray-100 rounded-lg transition-colors group"
                        >
                          <div className="w-8 h-8 bg-red-100 rounded flex items-center justify-center mb-2 group-hover:bg-red-200 transition-colors">
                            <svg className="w-5 h-5 text-red-600" fill="currentColor" viewBox="0 0 24 24">
                              <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z"/>
                            </svg>
                          </div>
                          <span className="text-xs font-medium text-gray-700">Pin de Mapa</span>
                        </button>
                      </div>
                    </div>
                  )}
                 </div>
               </div>
            
               {/* Background Tools */}
               <div className="space-y-2">
                 <h4 className="text-sm font-medium text-gray-700">Fondo</h4>
                 
                 {/* Background Color */}
                 <div className="relative color-picker-container">
                   <button
                     onClick={() => setShowColorPicker(!showColorPicker)}
                     className="w-full flex items-center space-x-3 px-3 py-2 bg-orange-50 hover:bg-orange-100 rounded-lg transition-colors"
                     title="Color de Fondo"
                   >
                     <Palette size={16} className="text-orange-600" />
                     <span className="text-sm font-medium text-orange-800">Color</span>
                   </button>
                  
                  {/* Background Color Picker Modal */}
                  {showColorPicker && (
                    <div className="absolute top-full left-0 mt-2 bg-white rounded-xl shadow-2xl border border-gray-200 p-4 z-50 min-w-[320px]">
                      <div className="flex items-center justify-between mb-3">
                        <h3 className="text-sm font-semibold text-gray-900">Color de Fondo</h3>
                        <button
                          onClick={() => setShowColorPicker(false)}
                          className="text-gray-400 hover:text-gray-600 transition-colors"
                        >
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                          </svg>
                        </button>
                      </div>
                      
                      {/* Current Color Display */}
                      <div className="flex items-center space-x-3 mb-4">
                        <span className="text-sm text-gray-600">Color actual:</span>
                        <div 
                          className="w-8 h-8 rounded border border-gray-300"
                          style={{ backgroundColor: backgroundColor }}
                        />
                        <span className="text-sm font-mono text-gray-800">{backgroundColor}</span>
                      </div>
                      
                      {/* Color Input */}
                      <div className="flex items-center space-x-3 mb-4">
                        <span className="text-sm text-gray-600">Nuevo color:</span>
                        <input
                          type="color"
                          value={backgroundColor}
                          onChange={(e) => handleBackgroundColorChange(e.target.value)}
                          className="w-12 h-12 rounded border border-gray-300 cursor-pointer"
                          title="Seleccionar color de fondo"
                        />
                      </div>
                      
                      {/* Quick Color Palette */}
                      <div className="space-y-3">
                        <span className="text-sm font-medium text-gray-700">Colores rápidos:</span>
                        <div className="grid grid-cols-6 gap-2">
                          {colorPalettes.brand.map((color) => (
                            <button
                              key={color}
                              onClick={() => handleBackgroundColorChange(color)}
                              className="w-8 h-8 rounded border border-gray-300 hover:scale-110 transition-transform"
                              style={{ backgroundColor: color }}
                              title={`Usar ${color}`}
                            />
                          ))}
                        </div>
                      </div>
                    </div>
                  )}
                </div>

                 {/* Background Image Upload */}
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleBackgroundImageChange}
                    className="hidden"
                    id="background-image-input"
                  />
                  <label
                    htmlFor="background-image-input"
                   className="flex items-center space-x-2 px-3 py-2 bg-orange-50 hover:bg-orange-100 rounded-lg transition-colors cursor-pointer"
                    title="Subir Imagen de Fondo"
                  >
                  <ImageIcon size={4} className="w-4 h-4 text-orange-600" />
                   <span className="text-sm font-medium text-orange-800">Imagen</span>
                  </label>
                  
                 {/* Clear Background Image */}
                  <button
                    onClick={async () => {
                      // Delete background from backend
                      if (user?.id && currentBackgroundId) {
                        try {
                          const result = await deleteTemplateBackground(id, user.id);
                          if (result.success) {
                            console.log('✅ Background deleted from backend');
                          } else {
                            console.warn('⚠️ Failed to delete background from backend:', result.message);
                          }
                        } catch (error) {
                          console.error('❌ Error deleting background from backend:', error);
                        }
                      }
                      
                      // Clear local state
                      setBackgroundImage(null);
                      setCurrentBackgroundId(null);
                      
                      // Remove background from canvas
                      if (canvas) {
                        const existingObjects = canvas.getObjects();
                        const backgroundObjects = existingObjects.filter(obj => 
                          (obj as any).isBackground === true
                        );
                        backgroundObjects.forEach(obj => {
                          canvas.remove(obj);
                        });
                        canvas.renderAll();
                      }
                    }}
                    disabled={!backgroundImage}
                   className="px-3 py-2 bg-gray-50 hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed rounded-lg transition-colors"
                    title="Limpiar Imagen de Fondo"
                  >
                    Limpiar
                  </button>

                 {/* Temporary Background Color Preview */}
                 <div className="space-y-2">
                   <h5 className="text-xs font-medium text-gray-600">Vista Previa Temporal</h5>
                   
                   {/* Temp Background Color Picker */}
                   <div className={`flex items-center space-x-2 p-2 rounded-lg transition-colors ${
                     tempBackgroundColor ? 'bg-yellow-50 border border-yellow-200' : 'bg-gray-50'
                   }`}>
                     <input
                       type="color"
                       value={tempBackgroundColor || backgroundColor}
                       onChange={(e) => handleTempBackgroundColorChange(e.target.value)}
                       className="w-8 h-8 rounded border border-gray-300 cursor-pointer"
                       title="Color temporal de fondo"
                     />
                     <div className="flex flex-col">
                       <span className="text-xs text-gray-600">Temporal</span>
                       {tempBackgroundColor && (
                         <span className="text-xs text-yellow-600 font-medium">Activo</span>
                       )}
                     </div>
                     {tempBackgroundColor && (
                       <button
                         onClick={resetTempBackground}
                         className="px-2 py-1 text-xs bg-red-100 hover:bg-red-200 text-red-700 rounded transition-colors"
                         title="Restaurar color original"
                       >
                         Restaurar
                       </button>
                     )}
                   </div>
                   
                   {/* Image Preview Button */}
                   <button
                     onClick={generateImagePreview}
                     className="w-full flex items-center justify-center space-x-2 px-3 py-2 bg-blue-50 hover:bg-blue-100 rounded-lg transition-colors"
                     title="Generar vista previa de imagen"
                   >
                     <ImageIcon size={16} className="text-blue-600" />
                     <span className="text-sm font-medium text-blue-800">Vista Previa</span>
                   </button>
                 </div>
                </div>
            
               {/* Real Estate Elements */}
               <div className="space-y-2">
                 <h4 className="text-sm font-medium text-gray-700">Bienes Raíces</h4>
                 
                 <button
                   onClick={() => addRealEstateElement('price')}
                   className="w-full flex items-center space-x-3 px-3 py-2 bg-yellow-50 hover:bg-yellow-100 rounded-lg transition-colors"
                   title="Agregar Precio"
                 >
                   <span className="text-lg">💰</span>
                   <span className="text-sm font-medium text-yellow-800">Precio</span>
                 </button>
                 
                 <button
                   onClick={() => addRealEstateElement('bedrooms')}
                   className="w-full flex items-center space-x-3 px-3 py-2 bg-blue-50 hover:bg-blue-100 rounded-lg transition-colors"
                   title="Agregar Habitaciones"
                 >
                   <span className="text-lg">🛏️</span>
                   <span className="text-sm font-medium text-blue-800">Habitaciones</span>
                 </button>
                 
                 <button
                   onClick={() => addRealEstateElement('contact')}
                   className="w-full flex items-center space-x-3 px-3 py-2 bg-green-50 hover:bg-green-100 rounded-lg transition-colors"
                   title="Agregar Contacto"
                 >
                   <span className="text-lg">📞</span>
                   <span className="text-sm font-medium text-green-800">Contacto</span>
                 </button>
                 
                 <button
                   onClick={() => addRealEstateElement('address')}
                   className="w-full flex items-center space-x-3 px-3 py-2 bg-purple-50 hover:bg-purple-100 rounded-lg transition-colors"
                   title="Agregar Dirección"
                 >
                   <span className="text-lg">📍</span>
                   <span className="text-sm font-medium text-purple-800">Dirección</span>
                 </button>
                 
                 <button
                   onClick={() => addRealEstateElement('propertyType')}
                   className="w-full flex items-center space-x-3 px-3 py-2 bg-red-50 hover:bg-red-100 rounded-lg transition-colors"
                   title="Agregar Tipo de Propiedad"
                 >
                   <span className="text-lg">🏠</span>
                   <span className="text-sm font-medium text-red-800">Tipo</span>
                 </button>
                 
                 <button
                   onClick={addPromotionalText}
                   className="w-full flex items-center space-x-3 px-3 py-2 bg-teal-50 hover:bg-teal-100 rounded-lg transition-colors"
                   title="Agregar Texto Promocional"
                 >
                   <span className="text-lg">📢</span>
                   <span className="text-sm font-medium text-teal-800">Texto Promocional</span>
                 </button>
               </div>
              
              </div>
            )}
            

            
           {activeTab === 'text' && selectedObject && (selectedObject.type === 'text' || selectedObject.type === 'i-text') && (
             <div className="space-y-3">
               {/* Text Content */}
               <div className="space-y-2">
                 <h4 className="text-sm font-medium text-gray-700">Contenido</h4>
                 <textarea
                   value={(selectedObject as fabric.IText).text || ''}
                   onChange={(e) => {
                     const newText = e.target.value;
                     if (selectedObject && canvas) {
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
                   rows={2}
                   className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 resize-none"
                   placeholder="Escribe tu texto aquí..."
                 />
               </div>
                  
               {/* Text Properties */}
               <div className="space-y-3">
                 <h4 className="text-sm font-medium text-gray-700">Propiedades</h4>
                 
                 {/* Font Family */}
                 <div className="space-y-1">
                   <label className="text-xs text-gray-600">Fuente</label>
                   <select
                     value={(selectedObject as fabric.IText).fontFamily || 'Arial'}
                     onChange={(e) => {
                       if (selectedObject && (selectedObject.type === 'text' || selectedObject.type === 'i-text')) {
                         console.log('🎨 Changing font family from', (selectedObject as fabric.IText).fontFamily, 'to', e.target.value);
                         (selectedObject as fabric.IText).set('fontFamily', e.target.value);
                         console.log('✅ Font family set to:', (selectedObject as fabric.IText).fontFamily);
                         canvas?.renderAll();
                         saveCanvasToHistory();
                       }
                     }}
                     className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                   >
                     {fontFamilies.map((font) => (
                       <option key={font} value={font}>{font}</option>
                     ))}
                   </select>
                 </div>
                 
                 {/* Font Size */}
                 <div className="space-y-1">
                   <label className="text-xs text-gray-600">Tamaño</label>
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
                     className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                     placeholder="48"
                   />
                 </div>
                  
                 {/* Text Color */}
                 <div className="space-y-2">
                   <label className="text-xs text-gray-600">Color</label>
                   <div className="flex items-center space-x-2">
                     <input
                       type="color"
                       value={getSafeColorValue((selectedObject as fabric.IText).fill)}
                       onChange={(e) => {
                         if (selectedObject && (selectedObject.type === 'text' || selectedObject.type === 'i-text')) {
                           (selectedObject as fabric.IText).set('fill', e.target.value);
                           canvas?.renderAll();
                           saveCanvasToHistory();
                         }
                       }}
                       className="w-10 h-10 rounded border border-gray-300 cursor-pointer"
                       title="Color del texto"
                     />
                     
                     {/* Quick Color Palette */}
                     <div className="flex space-x-1">
                       {colorPalettes.brand.slice(0, 6).map((color) => (
                         <button
                           key={color}
                           onClick={() => {
                             if (selectedObject && (selectedObject.type === 'text' || selectedObject.type === 'i-text')) {
                               (selectedObject as fabric.IText).set('fill', color);
                               canvas?.renderAll();
                               saveCanvasToHistory();
                             }
                           }}
                           className="w-6 h-6 rounded border border-gray-300 hover:scale-110 transition-transform"
                           style={{ backgroundColor: color }}
                           title={`Usar ${color}`}
                         />
                       ))}
                     </div>
                   </div>
                 </div>

                 {/* Text Formatting */}
                 <div className="space-y-2">
                   <label className="text-xs text-gray-600">Formato</label>
                   <div className="flex space-x-2">
                     <button
                       onClick={() => {
                         if (selectedObject && (selectedObject.type === 'text' || selectedObject.type === 'i-text')) {
                           const currentWeight = (selectedObject as fabric.IText).fontWeight || 'normal';
                           const newWeight = currentWeight === 'bold' ? 'normal' : 'bold';
                           (selectedObject as fabric.IText).set('fontWeight', newWeight);
                           canvas?.renderAll();
                           saveCanvasToHistory();
                         }
                       }}
                       className={`flex-1 px-3 py-2 text-sm rounded border transition-colors ${
                         (selectedObject as fabric.IText).fontWeight === 'bold'
                           ? 'border-blue-500 bg-blue-50 text-blue-700'
                           : 'border-gray-300 hover:border-gray-400'
                       }`}
                       title="Negrita"
                     >
                       <strong>B</strong>
                     </button>
                     
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
                       className={`flex-1 px-3 py-2 text-sm rounded border transition-colors ${
                         (selectedObject as fabric.IText).fontStyle === 'italic'
                           ? 'border-blue-500 bg-blue-50 text-blue-700'
                           : 'border-gray-300 hover:border-gray-400'
                       }`}
                       title="Cursiva"
                     >
                       <em>I</em>
                     </button>
                   </div>
                 </div>
               </div>
              
              {/* Text Formatting Row */}
              <div className="space-y-3">
                <h4 className="text-sm font-medium text-gray-700">Colores</h4>
                
                <div className="space-y-3">
                  {/* Text Fill Color Picker */}
                  <div className="space-y-2">
                    <label className="text-xs text-gray-600">Relleno</label>
                    <div className="flex items-center space-x-2">
                    <input
                      type="color"
                      value={getSafeColorValue(selectedObject.fill) === 'transparent' ? '#ffffff' : getSafeColorValue(selectedObject.fill)}
                      onChange={(e) => {
                        if (selectedObject && canvas) {
                          selectedObject.set('fill', e.target.value);
                          canvas.renderAll();
                          saveCanvasToHistory();
                        }
                      }}
                      className="w-8 h-8 rounded border border-gray-300 cursor-pointer"
                      title="Color de relleno del texto"
                      disabled={isGradientFill(selectedObject.fill)}
                    />
                    {isGradientFill(selectedObject.fill) && (
                      <span className="text-xs text-blue-600 bg-blue-100 px-2 py-1 rounded">
                        Gradiente
                      </span>
                    )}
                    <button
                      onClick={() => {
                        if (selectedObject && canvas) {
                          selectedObject.set('fill', 'transparent');
                          canvas.renderAll();
                          saveCanvasToHistory();
                        }
                      }}
                      className="px-2 py-1 text-xs bg-gray-100 hover:bg-gray-200 text-gray-700 rounded border border-gray-300 transition-colors"
                      title="Sin color (transparente)"
                    >
                      Sin color
                    </button>
                    </div>
                  </div>
                  
                  {/* Text Outline Color Picker */}
                  <div className="space-y-2">
                    <label className="text-xs text-gray-600">Contorno</label>
                    <div className="flex items-center space-x-2">
                    <input
                      type="color"
                      value={getSafeColorValue(selectedObject.stroke) === 'transparent' ? '#ffffff' : getSafeColorValue(selectedObject.stroke)}
                      onChange={(e) => {
                        if (selectedObject && canvas) {
                          selectedObject.set('stroke', e.target.value);
                          canvas.renderAll();
                          saveCanvasToHistory();
                        }
                      }}
                      className="w-8 h-8 rounded border border-gray-300 cursor-pointer"
                      title="Color del contorno del texto"
                    />
                    <button
                      onClick={() => {
                        if (selectedObject && canvas) {
                          selectedObject.set('stroke', 'transparent');
                          canvas.renderAll();
                          saveCanvasToHistory();
                        }
                      }}
                      className="px-2 py-1 text-xs bg-gray-100 hover:bg-gray-200 text-gray-700 rounded border border-gray-300 transition-colors"
                      title="Sin color (transparente)"
                    >
                      Sin color
                    </button>
                    </div>
                  </div>
                  
                  {/* Text Outline Width */}
                  <div className="flex items-center space-x-2">
                    <span className="text-xs text-gray-600">Ancho:</span>
                    <input
                      type="range"
                      min="0"
                      max="10"
                      step="0.5"
                      value={(selectedObject.strokeWidth as number) || 0}
                      onChange={(e) => {
                        if (selectedObject && canvas) {
                          selectedObject.set('strokeWidth', parseFloat(e.target.value));
                          canvas.renderAll();
                          saveCanvasToHistory();
                        }
                      }}
                      className="w-16 h-1 bg-gray-200 rounded appearance-none cursor-pointer"
                      title="Ancho del contorno del texto"
                    />
                    <span className="text-xs text-gray-600 min-w-[2rem] text-center">
                      {(selectedObject.strokeWidth as number) || 0}
                    </span>
                  </div>
                </div>
               </div>
             </div>
           )}
           
           {/* No Text Object Selected Message */}
           {activeTab === 'text' && (!selectedObject || (selectedObject.type !== 'text' && selectedObject.type !== 'i-text')) && (
             <div className="text-sm text-gray-500">
               Selecciona un objeto de texto para editarlo
             </div>
           )}

           {/* Format Tab - Advanced Object Formatting */}
           {activeTab === 'format' && selectedObject && (
             <div className="space-y-3">
               {/* Column Layout with Two Blocks */}
               <div className="flex flex-col space-y-4">
                 
                 {/* Block 1: Basic Formatting Tools */}
                 <div className="flex-1 bg-gray-50 p-4 rounded-lg border">
                   <div className="space-y-3">
                     <span className="text-sm font-medium text-gray-700">Formato Básico:</span>
                     
                     <div className="flex items-center space-x-4">
                 {/* Fill Color */}
                 <div className="flex items-center space-x-2">
                   <span className="text-xs text-gray-600">Relleno:</span>
                   <input
                     type="color"
                           value={getSafeColorValue(selectedObject.fill)}
                     onChange={(e) => {
                       if (selectedObject) {
                         selectedObject.set('fill', e.target.value);
                            canvas?.renderAll();
                            saveCanvasToHistory();
                          }
                        }}
                     className="w-8 h-8 rounded border border-gray-300 cursor-pointer"
                     title="Color de relleno"
                           disabled={isGradientFill(selectedObject.fill)}
                   />
                         {isGradientFill(selectedObject.fill) && (
                           <span className="text-xs text-blue-600 bg-blue-100 px-2 py-1 rounded">
                             Gradiente
                           </span>
                         )}
                  </div>
                  
                 {/* Stroke Color */}
                 <div className="flex items-center space-x-2">
                   <span className="text-xs text-gray-600">Borde:</span>
                   <input
                     type="color"
                           value={getSafeColorValue(selectedObject.stroke)}
                     onChange={(e) => {
                       if (selectedObject) {
                         selectedObject.set('stroke', e.target.value);
                              canvas?.renderAll();
                              saveCanvasToHistory();
                            }
                          }}
                     className="w-8 h-8 rounded border border-gray-300 cursor-pointer"
                     title="Color de borde"
                   />
                  </div>
                  </div>
                     <div className="flex items-center space-x-4">
                 {/* Stroke Width */}
                 <div className="flex items-center space-x-2">
                   <span className="text-xs text-gray-600">Ancho:</span>
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
                     className="w-20 h-1 bg-gray-200 rounded appearance-none cursor-pointer"
                     title="Ancho de borde"
                      />
                      <span className="text-xs text-gray-600 min-w-[2rem] text-center">
                     {(selectedObject.strokeWidth as number) || 0}
                      </span>
                  </div>
                  </div>
                  <div className="flex items-center space-x-4">
                 {/* Opacity */}
                 <div className="flex items-center space-x-2">
                   <span className="text-xs text-gray-600">Opacidad:</span>
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
                     className="w-20 h-1 bg-gray-200 rounded appearance-none cursor-pointer"
                     title="Opacidad"
                      />
                      <span className="text-xs text-gray-600 min-w-[2rem] text-center">
                     {((selectedObject.opacity as number) || 1).toFixed(1)}
                      </span>
                  </div>
                </div>
                
                     {/* Quick Color Palette */}
                     <div className="space-y-2">
                       <span className="text-xs text-gray-600">Colores rápidos:</span>
                       <div className="grid grid-cols-7 gap-2">
                         {[
                           '#01aac7', // Teal
                           '#00525b', // Dark Teal
                           '#32e0c5', // Light Teal
                           '#3f005f', // Dark Purple
                           '#230038', // Very Dark Purple
                           '#ffffff', // White
                           '#000000'  // Black
                         ].map((color) => (
                           <button
                             key={color}
                             onClick={() => {
                               if (selectedObject && canvas) {
                                 selectedObject.set('fill', color);
                                 canvas.renderAll();
                                 saveCanvasToHistory();
                               }
                             }}
                             className="w-6 h-6 rounded border border-gray-300 hover:scale-110 transition-transform"
                             style={{ backgroundColor: color }}
                             title={`Usar ${color}`}
                           />
                         ))}
                       </div>
                     </div>
                     
                     {/* Effects */}
                     <div className="flex items-center space-x-3">
                       <span className="text-xs text-gray-600">Efectos:</span>
                 
                 {/* Shadow Toggle */}
                 <button
                   onClick={() => {
                     if (selectedObject) {
                       if ((selectedObject as any).shadow) {
                         (selectedObject as any).set('shadow', null);
                        } else {
                         (selectedObject as any).set('shadow', new fabric.Shadow({
                           color: 'rgba(0,0,0,0.3)',
                           blur: 10,
                           offsetX: 5,
                           offsetY: 5
                         }));
                       }
                       canvas?.renderAll();
                       saveCanvasToHistory();
                     }
                   }}
                         className={`px-2 py-1 text-xs rounded border transition-colors ${
                     (selectedObject as any).shadow
                       ? 'border-blue-500 bg-blue-50 text-blue-700'
                       : 'border-gray-300 hover:border-gray-400'
                   }`}
                   title="Activar/Desactivar sombra"
                 >
                   {(selectedObject as any).shadow ? 'Sombra ON' : 'Sombra OFF'}
                 </button>

                 {/* Reset to Default */}
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
                         className="px-2 py-1 text-xs bg-gray-100 hover:bg-gray-200 text-gray-700 rounded transition-colors"
                   title="Restablecer formato"
                 >
                   Reset
                 </button>
                </div>
              </div>
                 </div>
                 
                 {/* Block 2: Gradient Tools */}
                 <div className="flex-1 bg-blue-50 p-4 rounded-lg border">
                   <div className="space-y-3">
                     <span className="text-sm font-medium text-gray-700">Editor de Gradiente:</span>
                     
                     {/* Inline Gradient Editor */}
                     {selectedObject && (
                       <div className="gradient-editor-container">
                         <div className="space-y-3">
                           <div className="flex items-center justify-between">
                             <span className="text-xs text-gray-600">Gradient Stops:</span>
                             <button
                               onClick={() => setShowGradientEditor(false)}
                               className="text-gray-400 hover:text-gray-600"
                             >
                               <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                 <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                               </svg>
                             </button>
                           </div>
                           
                           {/* Gradient Stops Container */}
                           <div className="space-y-2">
                             {gradientStops.map((stop, index) => (
                               <div key={stop.id} className="flex items-center space-x-2">
                                 <input
                                   type="color"
                                   value={stop.color}
                                   onChange={(e) => updateGradientStop(stop.id, { color: e.target.value })}
                                   className="w-6 h-6 rounded border border-gray-300 cursor-pointer"
                                 />
                                 <input
                                   type="range"
                                   min="0"
                                   max="100"
                                   value={stop.offset}
                                   onChange={(e) => updateGradientStop(stop.id, { offset: parseInt(e.target.value) })}
                                   className="flex-1 h-1 bg-gray-200 rounded appearance-none cursor-pointer"
                                 />
                                 <span className="text-xs text-gray-600 w-8 text-center">{stop.offset}%</span>
                                 {gradientStops.length > 2 && (
                                   <button
                                     onClick={() => removeGradientStop(stop.id)}
                                     className="text-red-500 hover:text-red-700 text-xs"
                                   >
                                     🗑
                                   </button>
                                 )}
                               </div>
                             ))}
                           </div>
                           
                           {/* Add Stop Button */}
                           <button
                             onClick={addGradientStop}
                             className="w-full px-3 py-2 text-xs bg-blue-100 hover:bg-blue-200 text-blue-700 rounded transition-colors"
                           >
                             ➕ Add Stop
                           </button>
                           
                           {/* Apply Gradient Button */}
                           <button
                             onClick={applyGradient}
                             className="w-full px-3 py-2 text-sm bg-blue-500 hover:bg-blue-600 text-white rounded transition-colors"
                           >
                             Apply Gradient
                           </button>
                           
                           {/* Gradient Status */}
                           {isGradientFill(selectedObject.fill) && (
                             <div className="p-2 bg-blue-100 rounded border border-blue-200">
                               <span className="text-xs text-blue-800 font-medium">Gradiente aplicado</span>
                               <div className="text-xs text-blue-600 mt-1">
                                 Tipo: {(selectedObject as any).gradientType || 'custom'}
                               </div>
                             </div>
                           )}
                         </div>
                       </div>
                     )}
                   </div>
                 </div>
                 
               </div>
             </div>
            )}

            
           {/* No Object Selected Message for Format Tab */}
           {activeTab === 'format' && !selectedObject && (
             <div className="text-sm text-gray-500">
               Selecciona un objeto para editar su formato
              </div>
            )}
          </div>
        </div>

      {/* Main Content Area */}
      <div className="flex-1 overflow-auto">
          {/* Canvas */}
         <div className="bg-white rounded-2xl shadow-lg p-6 mx-6">
              {/* Zoom Controls */}
              <div className="flex items-center justify-center mb-4 space-x-4">
                <button
                  onClick={zoomOut}
                  className="px-3 py-1 bg-gray-200 hover:bg-gray-300 rounded-lg text-sm font-medium transition-colors"
                  disabled={zoomLevel <= 25}
                >
                  -
                </button>
                
                <div className="flex items-center space-x-2">
                  <span className="text-sm text-gray-600 min-w-[50px]">{zoomLevel}%</span>
                  <input
                    type="range"
                    min="25"
                    max="300"
                    value={zoomLevel}
                    onChange={(e) => handleZoomChange(parseInt(e.target.value))}
                    className="w-32 h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer slider"
                  />
                </div>
                
                <button
                  onClick={zoomIn}
                  className="px-3 py-1 bg-gray-200 hover:bg-gray-300 rounded-lg text-sm font-medium transition-colors"
                  disabled={zoomLevel >= 300}
                >
                  +
                </button>
                
                <button
                  onClick={resetZoom}
                  className="px-3 py-1 bg-blue-500 hover:bg-blue-600 text-white rounded-lg text-sm font-medium transition-colors"
                >
                  Reset
                </button>
              </div>
              
              {/* Slider Styles */}
              <style jsx>{`
                .slider::-webkit-slider-thumb {
                  appearance: none;
                  width: 20px;
                  height: 20px;
                  border-radius: 50%;
                  background: #3b82f6;
                  cursor: pointer;
                  border: 2px solid #ffffff;
                  box-shadow: 0 2px 4px rgba(0,0,0,0.2);
                }
                
                .slider::-moz-range-thumb {
                  width: 20px;
                  height: 20px;
                  border-radius: 50%;
                  background: #3b82f6;
                  cursor: pointer;
                  border: 2px solid #ffffff;
                  box-shadow: 0 2px 4px rgba(0,0,0,0.2);
                }
                
                .slider:disabled {
                  opacity: 0.5;
                  cursor: not-allowed;
                }
              `}</style>
              
              <div className="flex justify-center overflow-auto p-4">
                <div 
                  className="relative border-2 border-gray-300 rounded-lg shadow-lg bg-white min-w-fit transition-transform duration-200"
                  style={{ 
                    transform: `scale(${zoomLevel / 100})`,
                    transformOrigin: 'top center'
                  }}
                  onDragOver={handleDragOver}
                  onDrop={handleDrop}
                >
                  <canvas
                    ref={canvasRef}
                    width={getCurrentCanvasSize().width}
                    height={getCurrentCanvasSize().height}
                    className="block max-w-full h-auto"
                    style={{ 
                      maxWidth: '100%', 
                      height: 'auto',
                      display: 'block'
                    }}
                  />
                  
                  {/* Canvas Boundary Indicator */}
                  <div className="absolute inset-0 pointer-events-none border-2 border-dashed border-blue-400 opacity-60 rounded-lg"></div>
                  
                  {/* Drag and drop overlay */}
                  {isDragOver && (
                    <div className="absolute inset-0 bg-blue-100 bg-opacity-70 flex items-center justify-center rounded-lg">
                      <div className="text-blue-600 font-medium text-lg">Suelta la imagen aquí</div>
                    </div>
                  )}
                  
                  {/* Canvas Size Indicator */}
                  <div className="absolute top-2 right-2 bg-gray-800 bg-opacity-80 text-white text-xs px-3 py-1 rounded-lg font-medium">
                    {getCurrentCanvasSize().width} × {getCurrentCanvasSize().height}
                  </div>
                </div>
              </div>
              
              {/* Upload instructions */}
              <div className="mt-4 text-center text-sm text-gray-600">
                <p className="mb-2">💡 <strong>Consejos para el canvas:</strong></p>
                <p>• Arrastra y suelta imágenes directamente en el canvas</p>
                <p>• Usa los botones de la barra de herramientas para agregar elementos</p>
                <p>• Haz clic en cualquier elemento para editarlo</p>
              </div>
            </div>
      </div>

      {/* Hidden file input for image uploads */}
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        onChange={handleImageUpload}
        className="hidden"
      />

      {/* Upgrade Modal */}
      {showUpgradeModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl p-6 max-w-md w-full mx-4">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-900">Exclusive Feature - Upgrade Your Plan</h3>
              <button
                onClick={() => setShowUpgradeModal(false)}
                className="text-gray-400 hover:text-gray-600 transition-colors"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            
            <div className="mb-6">
              <div className="bg-gradient-to-r from-blue-50 to-purple-50 rounded-lg p-4 mb-4">
                <div className="flex items-center mb-2">
                  <svg className="w-6 h-6 text-blue-600 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                  </svg>
                  <h4 className="text-lg font-semibold text-gray-900">Premium Feature</h4>
                </div>
                <p className="text-sm text-gray-600">
                  This feature is available in our Premium and Ultra-Premium plans. Upgrade now to unlock all features!
                </p>
              </div>
              
              <div className="space-y-3">
                <div className="flex items-center text-sm text-gray-600">
                  <svg className="w-4 h-4 text-green-500 mr-2" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                  </svg>
                  Save and edit templates
                </div>
                <div className="flex items-center text-sm text-gray-600">
                  <svg className="w-4 h-4 text-green-500 mr-2" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                  </svg>
                  Delete objects and templates
                </div>
                <div className="flex items-center text-sm text-gray-600">
                  <svg className="w-4 h-4 text-green-500 mr-2" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                  </svg>
                  Unlimited downloads
                </div>
                <div className="flex items-center text-sm text-gray-600">
                  <svg className="w-4 h-4 text-green-500 mr-2" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                  </svg>
                  Priority support
                </div>
              </div>
            </div>
            
            <div className="flex space-x-3">
              <button
                onClick={() => setShowUpgradeModal(false)}
                className="flex-1 px-4 py-2 bg-gray-200 text-gray-800 rounded-lg hover:bg-gray-300 transition-colors"
              >
                Maybe Later
              </button>
              <button
                onClick={() => {
                  setShowUpgradeModal(false);
                  // Navigate to upgrade page or open upgrade modal
                  window.open('/upgrade', '_blank');
                }}
                className="flex-1 px-4 py-2 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-lg hover:from-blue-700 hover:to-purple-700 transition-colors"
              >
                Upgrade Now
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Image Preview Modal */}
      {showImagePreview && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl p-6 max-w-4xl w-full mx-4 max-h-[90vh] overflow-auto">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="text-lg font-semibold text-gray-900">Vista Previa del Diseño</h3>
                {tempBackgroundColor && (
                  <p className="text-sm text-yellow-600 mt-1">
                    🟡 Mostrando con fondo temporal: {tempBackgroundColor}
                  </p>
                )}
              </div>
              <button
                onClick={() => setShowImagePreview(false)}
                className="text-gray-400 hover:text-gray-600 transition-colors"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            
            {previewImageData && (
              <div className="space-y-4">
                <div className="flex justify-center">
                  <img
                    src={previewImageData}
                    alt="Vista previa del diseño"
                    className="max-w-full max-h-[60vh] object-contain border border-gray-200 rounded-lg shadow-lg"
                  />
                </div>
                
                <div className="flex justify-center space-x-3">
                  <button
                    onClick={() => {
                      const link = document.createElement('a');
                      link.download = `design-preview-${Date.now()}.png`;
                      link.href = previewImageData;
                      document.body.appendChild(link);
                      link.click();
                      document.body.removeChild(link);
                    }}
                    className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center space-x-2"
                  >
                    <Download size={16} />
                    <span>Descargar PNG</span>
                  </button>
                  
                  <button
                    onClick={async () => {
                      try {
                        // Convert data URL to blob
                        const response = await fetch(previewImageData);
                        const blob = await response.blob();
                        
                        // Copy image to clipboard
                        await navigator.clipboard.write([
                          new ClipboardItem({
                            [blob.type]: blob
                          })
                        ]);
                        
                        // Show success message
                        alert('✅ Imagen copiada al portapapeles');
                      } catch (error) {
                        console.error('Error copying image:', error);
                        alert('❌ Error al copiar la imagen');
                      }
                    }}
                    className="px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors flex items-center space-x-2"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                    </svg>
                    <span>Copiar Imagen</span>
                  </button>
                  
                  <button
                    onClick={async () => {
                      try {
                        // Import jsPDF dynamically
                        const { default: jsPDF } = await import('jspdf');
                        
                        // Create new PDF document
                        const pdf = new jsPDF({
                          orientation: 'portrait',
                          unit: 'mm',
                          format: 'a4'
                        });
                        
                        // Get image dimensions
                        const img = new Image();
                        img.onload = () => {
                          // Calculate dimensions to fit A4 page
                          const pageWidth = pdf.internal.pageSize.getWidth();
                          const pageHeight = pdf.internal.pageSize.getHeight();
                          
                          const imgWidth = img.width;
                          const imgHeight = img.height;
                          const ratio = imgWidth / imgHeight;
                          
                          let width = pageWidth - 20; // 10mm margin on each side
                          let height = width / ratio;
                          
                          if (height > pageHeight - 20) {
                            height = pageHeight - 20; // 10mm margin on top/bottom
                            width = height * ratio;
                          }
                          
                          // Center the image on the page
                          const x = (pageWidth - width) / 2;
                          const y = (pageHeight - height) / 2;
                          
                          // Add image to PDF
                          pdf.addImage(previewImageData, 'PNG', x, y, width, height);
                          
                          // Download PDF
                          pdf.save(`design-preview-${Date.now()}.pdf`);
                        };
                        
                        img.src = previewImageData;
                      } catch (error) {
                        console.error('Error generating PDF:', error);
                        alert('❌ Error al generar PDF');
                      }
                    }}
                    className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors flex items-center space-x-2"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
                    </svg>
                    <span>Descargar PDF</span>
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Context Menu */}
      {contextMenu.visible && (
        <div
          className="fixed bg-white border border-gray-200 rounded-lg shadow-lg z-50 py-2 min-w-[160px]"
          style={{
            left: contextMenu.x,
            top: contextMenu.y,
          }}
          onClick={(e) => e.stopPropagation()}
        >
          {/* Bring to Front */}
          <button
            className="w-full px-4 py-2 text-left text-sm text-gray-700 hover:bg-gray-100 flex items-center space-x-2"
            onClick={() => handleContextMenuAction('bringToFront')}
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16l-4-4m0 0l4-4m-4 4h18M7 20l-4-4m0 0l4-4m-4 4h18" />
            </svg>
            <span>Bring to Front</span>
          </button>
          
          {/* Bring to Back */}
          <button
            className="w-full px-4 py-2 text-left text-sm text-gray-700 hover:bg-gray-100 flex items-center space-x-2"
            onClick={() => handleContextMenuAction('bringToBack')}
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3M17 4l4 4m0 0l-4 4m4-4H3" />
            </svg>
            <span>Send to Back</span>
          </button>
        </div>
      )}
    </div>
  );
};
