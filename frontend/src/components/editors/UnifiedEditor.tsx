'use client';
import React, { useState, useRef, useEffect, useCallback } from 'react';
import { 
  FloppyDisk, 
  Download, 
  FilePdf, 
  ArrowsOutCardinal, 
  Pencil, 
  TextT, 
  Image as ImageIcon, 
  Square, 
  Palette 
} from 'phosphor-react';
import { useUser } from '@/context/UserContext';
import * as fabric from 'fabric';
import { jsPDF } from 'jspdf';
import { buildDesignData, saveDesignToFiles, SaveOptions, getDataSize, exceedsSizeLimit, optimizeDesignData, createUltraMinimalDesignData } from '@/utils/saveData';

interface UnifiedEditorProps {
  id: string;
  editorType?: 'flyer' | 'social' | 'story' | 'badge' | 'banner' | 'document' | 'brochure' | 'square-post' | 'marketplace-flyer' | 'fb-feed-banner' | 'digital-badge';
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
  opacity?: number;
  stroke?: string;
  strokeWidth?: number;
  strokeLineCap?: string;
  strokeLineJoin?: string;
  shadow?: any;
  // Path-specific properties for wave shapes and other path objects
  pathData?: any;
  isPath?: boolean;
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
  // Editor type configurations - moved to top to avoid initialization order issues
  const editorConfigs = {
    // Legacy types (for backward compatibility)
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
    },
    
    // New template types from CreateTemplateModal
    'square-post': {
      icon: '📱',
      name: 'IG/FB Square Post',
      defaultSize: '1080x1080',
      sizes: [
        { value: '1080x1080', label: 'IG/FB Square Post (1080×1080)', width: 1080, height: 1080 }
      ]
    },
    'marketplace-flyer': {
      icon: '📄',
      name: 'Marketplace Flyer',
      defaultSize: '1200x1500',
      sizes: [
        { value: '1200x1500', label: 'Marketplace Flyer (1200×1500)', width: 1200, height: 1500 }
      ]
    },
    'fb-feed-banner': {
      icon: '🚩',
      name: 'FB Feed Banner',
      defaultSize: '1200x628',
      sizes: [
        { value: '1200x628', label: 'FB Feed Banner (1200×628)', width: 1200, height: 628 }
      ]
    },
    'digital-badge': {
      icon: '🏷️',
      name: 'Digital Badge / Visual Card',
      defaultSize: '1080x1350',
      sizes: [
        { value: '1080x1350', label: 'Digital Badge (1080×1350)', width: 1080, height: 1350 }
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
  
  // UI state
  const [showShapeSelector, setShowShapeSelector] = useState(false);
  const [showColorPicker, setShowColorPicker] = useState(false);
  const [showFontSelector, setShowFontSelector] = useState(false);
  const [showDownloadDropdown, setShowDownloadDropdown] = useState(false);
  const [canvasDisplayScale, setCanvasDisplayScale] = useState(1);
  const [activeTab, setActiveTab] = useState('elements');

  
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
  const { user } = useUser();
  const userPlan = (user?.plan as 'Free' | 'Premium' | 'Ultra-Premium') || 'Free';
  
  // Templates will be loaded from database - no hard-coded data
  const [templates, setTemplates] = useState<any[]>([]);
  // Removed default templates - editors now only work with specific templates

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
    'Oswald',
    'Montserrat',
    'Poppins',
    'Inter',
    'Roboto',
    
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
      loadTemplateById(id).catch(error => {
        console.error('❌ Error loading template by ID:', error);
          // Fallback to templateKey if ID loading fails
          if (templateKey) {
            console.log('🔄 Falling back to templateKey loading:', templateKey);
            loadTemplate(templateKey).catch(fallbackError => {
              console.error('❌ TemplateKey loading also failed:', fallbackError);
              // No more fallbacks - user must provide valid template
              console.log('❌ No fallback templates available - user must provide valid template');
            });
          }
        });
      } else if (templateKey) {
        // If no ID, load by templateKey
        console.log('🎯 Loading template by key:', templateKey);
        loadTemplate(templateKey).catch(error => {
          console.error('❌ Error loading template from database:', error);
                  // No more fallbacks - user must provide valid template
        console.log('❌ No fallback templates available - user must provide valid template');
        });
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
      title = `DesignCenter Editor`;
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
      document.title = `DesignCenter Editor`;
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
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [showDownloadDropdown, showShapeSelector]);
  
  // Initialize Fabric.js canvas
  useEffect(() => {
    if (canvasRef.current && !canvas) {
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
        const allTemplatesResponse = await fetch('http://localhost:4000/api/templates');
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
          const savedObj = {
            id: (obj as any).id || `obj_${Date.now()}_${Math.random()}`,
            type: 'shape' as const,
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
            shadow: (obj as any).shadow || null,
            // Preserve path-specific data
            pathData: (obj as fabric.Path).path,
            isPath: true,
            // Preserve wave-specific data
            isWaveShape: (obj as any).isWaveShape || false,
            shapeType: (obj as any).shapeType || 'path'
          };
          
          // Debug logging for wave shapes
          if ((obj as any).isWaveShape) {
            console.log('💾 Wave shape saved to history:', {
              id: savedObj.id,
              type: savedObj.type,
              isPath: savedObj.isPath,
              isWaveShape: savedObj.isWaveShape,
              shapeType: savedObj.shapeType,
              pathData: savedObj.pathData
            });
          }
          
          return savedObj;
        }
        
        return {
          id: (obj as any).id || `obj_${Date.now()}_${Math.random()}`,
          type: (obj.type === 'text' || obj.type === 'i-text' ? 'text' : 
                 obj.type === 'image' ? 'image' : 
                 obj.type === 'placeholder' ? 'placeholder' : 'shape') as 'text' | 'image' | 'shape' | 'placeholder',
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
          // UNDO FUNCTION: Restore path objects (like waves) with their original path data
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
          
          // Restore wave-specific properties
          if ((obj as any).isWaveShape) {
            (fabricObj as any).isWaveShape = true;
            (fabricObj as any).shapeType = (obj as any).shapeType || 'wave';
            (fabricObj as any).id = (obj as any).id || `wave_${Date.now()}_${Math.random()}`;
          }
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
          // REDO FUNCTION: Restore path objects (like waves) with their original path data
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
          
          // Restore wave-specific properties
          if ((obj as any).isWaveShape) {
            (fabricObj as any).isWaveShape = true;
            (fabricObj as any).shapeType = (obj as any).shapeType || 'wave';
            (fabricObj as any).id = (obj as any).id || `wave_${Date.now()}_${Math.random()}`;
          }
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
          // Mark as wave shape for proper saving/loading
          (wavePath as any).isWaveShape = true;
          (wavePath as any).shapeType = 'wave';
          (wavePath as any).id = `wave_${Date.now()}_${Math.random()}`;
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
          // Mark as wave shape for proper saving/loading
          (verticalWavePath as any).isWaveShape = true;
          (verticalWavePath as any).shapeType = 'wave-vertical';
          (verticalWavePath as any).id = `wave_vertical_${Date.now()}_${Math.random()}`;
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
          // Mark as wave shape for proper saving/loading
          (simpleWavePath as any).isWaveShape = true;
          (simpleWavePath as any).shapeType = 'wave-simple';
          (simpleWavePath as any).id = `wave_simple_${Date.now()}_${Math.random()}`;
          shape = simpleWavePath;
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
      
      // Debug logging for wave shapes
      if ((shape as any).isWaveShape) {
        console.log('🌊 Wave shape created:', {
          id: (shape as any).id,
          type: (shape as any).shapeType,
          isWaveShape: (shape as any).isWaveShape,
          path: (shape as fabric.Path).path
        });
      }
      
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
      fabric.Image.fromURL(brandKit.logo).then((img: any) => {
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

  // Check if design file exists
  const checkDesignFileExists = async (filename: string): Promise<boolean> => {
    try {
      const response = await fetch(`http://localhost:4000/api/templates/design/${filename}`);
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
      const response = await fetch(`http://localhost:4000/api/templates/by-key/${templateKey}`, {
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
      const response = await fetch(`http://localhost:4000/api/templates/${templateId}`);
      if (response.ok) {
        const template = await response.json();
        console.log('✅ Template loaded by ID:', template);
        
        // Check if template has a design file using _id-based filename
        const designFilename = `${templateId}.json`;
        console.log('📁 Checking design file with _id-based filename:', designFilename);
        const fileExists = await checkDesignFileExists(designFilename);
          
          if (fileExists) {
          console.log('✅ Design file exists, loading user-saved design...');
          const designResponse = await fetch(`http://localhost:4000/api/templates/design/${designFilename}`);
          if (designResponse.ok) {
            const designData = await designResponse.json();
            console.log('🎨 User-saved design data loaded from file:', designData);
            
            // Load user-saved design directly (not through loadTemplateFromData)
            await loadUserSavedDesign(designData, template);
            return;
          }
        } else {
          console.warn('⚠️ Design file does not exist:', designFilename);
          
          // Fallback: check if template has legacy designFilename in database
          if (template.designFilename) {
            console.log('📁 Checking legacy design file:', template.designFilename);
            const legacyFileExists = await checkDesignFileExists(template.designFilename);
            
            if (legacyFileExists) {
              console.log('✅ Legacy design file exists, loading user-saved design...');
            const designResponse = await fetch(`http://localhost:4000/api/templates/design/${template.designFilename}`);
            if (designResponse.ok) {
              const designData = await designResponse.json();
                console.log('🎨 User-saved design data loaded from legacy file:', designData);
                
                // Load user-saved design directly (not through loadTemplateFromData)
                await loadUserSavedDesign(designData, template);
              return;
            }
          } else {
              console.warn('⚠️ Legacy design file does not exist:', template.designFilename);
            }
          }
        }
        
        // Fallback to loading from template data (fresh template)
        console.log('📋 Loading fresh template from template data...');
        await loadTemplateFromData(templateId, template);
        return;
      } else {
        console.error('❌ Failed to fetch template by ID:', response.status);
      }
    } catch (error) {
      console.error('❌ Error loading template by ID:', error);
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
        console.log('✅ Template metadata loaded from database:', template);
        
        // Check for _id-based design file first (new approach)
        const idBasedFilename = `${template._id}.json`;
        console.log('📁 Checking _id-based design file:', idBasedFilename);
        const idBasedFileExists = await checkDesignFileExists(idBasedFilename);
        
        if (idBasedFileExists) {
          console.log('✅ _id-based design file exists, loading...');
          const designResponse = await fetch(`http://localhost:4000/api/templates/design/${idBasedFilename}`);
          if (designResponse.ok) {
            const designData = await designResponse.json();
            console.log('🎨 Design data loaded from _id-based file:', designData);
            await loadTemplateFromData(templateKey, designData);
            return;
          }
        } else {
          console.log('📋 _id-based design file not found, checking legacy files...');
        }
        
        // Check for template-specific design file (legacy approach)
        const templateFilename = `${templateKey}-design.json`;
        console.log('📁 Checking template-specific design file:', templateFilename);
        const fileExists = await checkDesignFileExists(templateFilename);
        
        if (fileExists) {
          console.log('✅ Template-specific design file exists, loading...');
          const designResponse = await fetch(`http://localhost:4000/api/templates/design/${templateFilename}`);
          if (designResponse.ok) {
            const designData = await designResponse.json();
            console.log('🎨 Design data loaded from template file:', designData);
            await loadTemplateFromData(templateKey, designData);
            return;
          }
        } else {
          console.log('📋 Template-specific design file not found, checking database...');
        }
        
        // If template has a design file in database, check if it exists
        if (template.designFilename) {
          console.log('📁 Checking database design file:', template.designFilename);
          const fileExists = await checkDesignFileExists(template.designFilename);
          
          if (fileExists) {
            console.log('✅ Database design file exists, loading...');
            const designResponse = await fetch(`http://localhost:4000/api/templates/design/${template.designFilename}`);
            if (designResponse.ok) {
              const designData = await designResponse.json();
              console.log('🎨 Design data loaded from database file:', designData);
              await loadTemplateFromData(templateKey, designData);
              return;
            }
          } else {
            console.warn('⚠️ Database design file does not exist:', template.designFilename);
            console.log('🔄 Falling back to template data from database...');
            
            // Clean up the orphaned design file reference
            await cleanupOrphanedDesignFile(templateKey);
          }
        }
        
        // Fallback to loading from template data
        console.log('📋 Loading from template data...');
        await loadTemplateFromData(templateKey, template);
        return;
      }
    } catch (error) {
      console.warn('⚠️ Failed to load template from database, falling back to constant:', error);
    }
    
    // No more fallbacks to hard-coded templates - user must provide valid template
    console.log('❌ No fallback templates available - user must provide valid template');
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
    
    // Set background with fallbacks - ensure no default background images
    const backgroundColor = templateData.backgroundColor || '#ffffff';
    const backgroundImage: string | null = null; // Force no background images for templates
    
    setBackgroundColor(backgroundColor);
    setBackgroundImage(backgroundImage);
    
    // Set canvas background color
    canvas.backgroundColor = backgroundColor;
    
    // Background images disabled for templates - only use background color
    console.log('🚫 Background images disabled for templates - using background color only');
    
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
               height: obj.height || undefined,
               opacity: obj.opacity || 1,
               stroke: obj.stroke || 'transparent',
               strokeWidth: obj.strokeWidth || 0,
               strokeLineCap: obj.strokeLineCap || 'butt',
               strokeLineJoin: obj.strokeLineJoin || 'miter',
               shadow: obj.shadow || null
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
              selectable: true,
              opacity: obj.opacity || 1,
              shadow: obj.shadow || null
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
              selectable: true,
              opacity: obj.opacity || 1,
              shadow: obj.shadow || null
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
              selectable: true,
              opacity: obj.opacity || 1,
              shadow: obj.shadow || null
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
            if (obj.path) {
              const path = new fabric.Path(obj.path, {
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
              canvas.add(path);
              console.log(`✅ Path object loaded`);
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
                scaleX: obj.scaleX || 1,
                scaleY: obj.scaleY || 1,
                angle: obj.angle || obj.rotation || 0,
                selectable: true,
                hasControls: true,
                opacity: obj.opacity || 1,
                shadow: obj.shadow || null
              });
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
      console.log('📁 Loading user-saved design data from file:', templateData.designFilename);
      try {
        const designResponse = await fetch(`http://localhost:4000/api/templates/design/${templateData.designFilename}`);
        if (designResponse.ok) {
          const designData = await designResponse.json();
          console.log('✅ User-saved design data loaded from file:', designData);
          
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
      // This is a fresh template - start clean (no default objects)
      console.log('🆕 Fresh template detected - starting with clean canvas (no default objects)');
      setBackgroundImage(null);
    }
    
    // Wait a bit for objects to load, then render
    setTimeout(() => {
      canvas.renderAll();
      saveCanvasToHistory();
      
      const finalObjectCount = canvas.getObjects().length;
      if (templateData.designFilename) {
        console.log('✅ User-saved design loaded successfully:', templateKey);
        console.log('🎨 Final canvas objects:', finalObjectCount);
      } else {
        console.log('✅ Fresh template loaded successfully:', templateKey);
        console.log('🎨 Final canvas objects:', finalObjectCount, '(clean canvas)');
      }
      
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

  // Load user-saved design (for designs with saved content)
  const loadUserSavedDesign = async (designData: any, templateData: any) => {
    console.log('🚀 loadUserSavedDesign called with design data and template data');
    
    if (!canvas) {
      console.error('❌ Canvas is not ready');
      return;
    }
    
    // Clear current canvas
    canvas.clear();
    
    // Set background from saved design
    const backgroundColor = designData.designData?.backgroundColor || templateData.backgroundColor || '#ffffff';
    setBackgroundColor(backgroundColor);
    
    // Load user-saved background image
    if (designData.designData && designData.designData.backgroundImage) {
      console.log('🖼️ Loading user-saved background image...');
      setBackgroundImage(designData.designData.backgroundImage);
      
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
        console.error('❌ Background image URL:', designData.designData.backgroundImage);
        setBackgroundImage(null);
      };
      
      // Start loading the image
      imgElement.src = designData.designData.backgroundImage;
      
    } else {
      console.log('ℹ️ No user-saved background image found');
      setBackgroundImage(null);
    }
    
    // Set canvas background color (will be overridden if background image loads)
    canvas.backgroundColor = backgroundColor;
    
    // Load user-saved objects from design file
    if (designData.designData && designData.designData.objects && Array.isArray(designData.designData.objects)) {
      console.log(`🎨 Loading ${designData.designData.objects.length} user-saved objects from design file...`);
      
      // Log background image info for debugging
      if (designData.designData.backgroundImage) {
        console.log('🖼️ Background image URL for duplicate checking:', designData.designData.backgroundImage);
      }
      
      designData.designData.objects.forEach((obj: any, index: number) => {
        // Use the same object loading logic as in loadTemplateFromData
        try {
          console.log(`🎨 Loading object ${index + 1}:`, obj);
          
          if (obj.type === 'text' || obj.type === 'i-text') {
            const text = new fabric.IText(obj.text || obj.content || 'Texto', {
              left: obj.left !== undefined && obj.left !== null ? obj.left : (obj.x !== undefined && obj.x !== null ? obj.x : 100),
              top: obj.top !== undefined && obj.top !== null ? obj.top : (obj.y !== undefined && obj.y !== null ? obj.y : 100),
              fontSize: obj.fontSize || 48,
              fontFamily: obj.fontFamily || obj.font || 'Arial',
              fontWeight: obj.fontWeight || 'normal',
              fill: obj.fill || obj.color || '#000000',
              textAlign: obj.textAlign || 'left',
              selectable: true,
              editable: true
            });
            canvas.add(text);
          } else if (obj.type === 'image') {
            // Skip image objects that are the same as the background image to avoid duplication
            if (obj.src && obj.src !== designData.designData?.backgroundImage) {
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
            } else if (obj.src === designData.designData?.backgroundImage) {
              console.log('🚫 Skipping duplicate image object (same as background):', obj.src);
            }
          } else if (obj.type === 'rect' || obj.type === 'rectangle') {
            const rect = new fabric.Rect({
              left: obj.left !== undefined && obj.left !== null ? obj.left : (obj.x !== undefined && obj.x !== null ? obj.x : 100),
              top: obj.top !== undefined && obj.top !== null ? obj.top : (obj.y !== undefined && obj.y !== null ? obj.y : 100),
              width: obj.width !== undefined && obj.width !== null ? obj.width : 100,
              height: obj.height !== undefined && obj.height !== null ? obj.height : 100,
              fill: obj.fill || obj.color || '#cccccc',
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
          } else if (obj.type === 'path' && obj.path) {
            // Handle path objects (like waves) with path property (from saved design files)
            const path = new fabric.Path(obj.path, {
              left: obj.left !== undefined && obj.left !== null ? obj.left : (obj.x !== undefined && obj.x !== null ? obj.x : 100),
              top: obj.top !== undefined && obj.top !== null ? obj.top : (obj.y !== undefined && obj.y !== null ? obj.y : 100),
              fill: obj.fill || obj.color || '#cccccc',
              stroke: obj.stroke || 'transparent',
              strokeWidth: obj.strokeWidth !== undefined && obj.strokeWidth !== null ? obj.strokeWidth : 0,
              strokeLineCap: obj.strokeLineCap || 'butt',
              strokeLineJoin: obj.strokeLineJoin || 'miter',
              scaleX: obj.scaleX !== undefined && obj.scaleX !== null ? obj.scaleX : 1,
              scaleY: obj.scaleY !== undefined && obj.scaleY !== null ? obj.scaleY : 1,
              angle: obj.angle !== undefined && obj.angle !== null ? obj.angle : (obj.rotation !== undefined && obj.rotation !== null ? obj.rotation : 0),
              selectable: true,
              hasControls: true,
              opacity: obj.opacity !== undefined && obj.opacity !== null ? obj.opacity : 1
            });
            
            // Restore wave-specific properties
            if ((obj as any).isWaveShape) {
              (path as any).isWaveShape = true;
              (path as any).shapeType = (obj as any).shapeType || 'wave';
              (path as any).id = (obj as any).id || `wave_${Date.now()}_${Math.random()}`;
            }
            
            canvas.add(path);
            console.log(`✅ Path object (wave) loaded with path property and wave metadata`);
          } else if ((obj as any).isPath && (obj as any).pathData) {
            // Handle path objects (like waves) with pathData property (from history)
            const path = new fabric.Path((obj as any).pathData, {
              left: obj.left !== undefined && obj.left !== null ? obj.left : (obj.x !== undefined && obj.x !== null ? obj.x : 100),
              top: obj.top !== undefined && obj.top !== null ? obj.top : (obj.y !== undefined && obj.y !== null ? obj.y : 100),
              fill: obj.fill || obj.color || '#cccccc',
              stroke: obj.stroke || 'transparent',
              strokeWidth: obj.strokeWidth !== undefined && obj.strokeWidth !== null ? obj.strokeWidth : 0,
              strokeLineCap: obj.strokeLineCap || 'butt',
              strokeLineJoin: obj.strokeLineJoin || 'miter',
              scaleX: obj.scaleX !== undefined && obj.scaleX !== null ? obj.scaleX : 1,
              scaleY: obj.scaleY !== undefined && obj.scaleY !== null ? obj.scaleY : 1,
              angle: obj.angle !== undefined && obj.angle !== null ? obj.angle : (obj.rotation !== undefined && obj.rotation !== null ? obj.rotation : 0),
              selectable: true,
              hasControls: true,
              opacity: obj.opacity !== undefined && obj.opacity !== null ? obj.opacity : 1
            });
            
            // Restore wave-specific properties
            if ((obj as any).isWaveShape) {
              (path as any).isWaveShape = true;
              (path as any).shapeType = (obj as any).shapeType || 'wave';
              (path as any).id = (obj as any).id || `wave_${Date.now()}_${Math.random()}`;
            }
            
            canvas.add(path);
            console.log(`✅ Path object (wave) loaded with pathData property and wave metadata`);
          } else if (obj.type === 'shape' && (obj as any).pathData) {
            // Handle shape objects that have path data (like waves)
            const path = new fabric.Path((obj as any).pathData, {
              left: obj.left !== undefined && obj.left !== null ? obj.left : (obj.x !== undefined && obj.x !== null ? obj.x : 100),
              top: obj.top !== undefined && obj.top !== null ? obj.top : (obj.y !== undefined && obj.y !== null ? obj.y : 100),
              fill: obj.fill || obj.color || '#cccccc',
              stroke: obj.stroke || 'transparent',
              strokeWidth: obj.strokeWidth !== undefined && obj.strokeWidth !== null ? obj.strokeWidth : 0,
              strokeLineCap: obj.strokeLineCap || 'butt',
              strokeLineJoin: obj.strokeLineJoin || 'miter',
              scaleX: obj.scaleX !== undefined && obj.scaleX !== null ? obj.scaleX : 1,
              scaleY: obj.scaleY !== undefined && obj.scaleY !== null ? obj.scaleY : 1,
              angle: obj.angle !== undefined && obj.angle !== null ? obj.angle : (obj.rotation !== undefined && obj.rotation !== null ? obj.rotation : 0),
              selectable: true,
              hasControls: true,
              opacity: obj.opacity !== undefined && obj.opacity !== null ? obj.opacity : 1
            });
            
            // Restore wave-specific properties
            if ((obj as any).isWaveShape) {
              (path as any).isWaveShape = true;
              (path as any).shapeType = (obj as any).shapeType || 'wave';
              (path as any).id = (obj as any).id || `wave_${Date.now()}_${Math.random()}`;
            }
            
            canvas.add(path);
            console.log(`✅ Shape object with path data (wave) loaded and wave metadata restored`);
          } else if (obj.type === 'shape' && obj.path) {
            // Handle shape objects that have path property (from saved design files)
            const path = new fabric.Path(obj.path, {
              left: obj.left !== undefined && obj.left !== null ? obj.left : (obj.x !== undefined && obj.x !== null ? obj.x : 100),
              top: obj.top !== undefined && obj.top !== null ? obj.top : (obj.y !== undefined && obj.y !== null ? obj.y : 100),
              fill: obj.fill || obj.color || '#cccccc',
              stroke: obj.stroke || 'transparent',
              strokeWidth: obj.strokeWidth !== undefined && obj.strokeWidth !== null ? obj.strokeWidth : 0,
              strokeLineCap: obj.strokeLineCap || 'butt',
              strokeLineJoin: obj.strokeLineJoin || 'miter',
              scaleX: obj.scaleX !== undefined && obj.scaleX !== null ? obj.scaleX : 1,
              scaleY: obj.scaleY !== undefined && obj.scaleY !== null ? obj.scaleY : 1,
              angle: obj.angle !== undefined && obj.angle !== null ? obj.angle : (obj.rotation !== undefined && obj.rotation !== null ? obj.rotation : 0),
              selectable: true,
              hasControls: true,
              opacity: obj.opacity !== undefined && obj.opacity !== null ? obj.opacity : 1
            });
            
            // Restore wave-specific properties
            if ((obj as any).isWaveShape) {
              (path as any).isWaveShape = true;
              (path as any).shapeType = (obj as any).shapeType || 'wave';
              (path as any).id = (obj as any).id || `wave_${Date.now()}_${Math.random()}`;
            }
            
            canvas.add(path);
            console.log(`✅ Shape object with path property (wave) loaded and wave metadata restored`);
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
      
      // Remove all objects temporarily
      allObjects.forEach(obj => canvas.remove(obj));
      
      // Add background objects first (bottom layer)
      backgroundObjects.forEach(obj => canvas.add(obj));
      
      // Add content objects on top
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
      allObjects.forEach((obj, index) => {
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
        }
        
        console.log(`🎨 Object ${index + 1}:`, objInfo);
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
            opacity: obj.opacity || 1,
            strokeWidth: (obj as any).strokeWidth || 0,
            strokeLineCap: (obj as any).strokeLineCap || 'butt',
            strokeLineJoin: (obj as any).strokeLineJoin || 'miter',
            shadow: (obj as any).shadow || null,
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
              text: textObj.text || '',
              opacity: textObj.opacity || 1,
              strokeWidth: textObj.strokeWidth || 0,
              strokeLineCap: textObj.strokeLineCap || 'butt',
              strokeLineJoin: textObj.strokeLineJoin || 'miter',
              shadow: textObj.shadow || null
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
              rx: rectObj.rx || 0,  // Rounded corner radius X
              ry: rectObj.ry || 0,  // Rounded corner radius Y
              opacity: rectObj.opacity || 1,
              strokeWidth: rectObj.strokeWidth || 0,
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
              radius: circleObj.radius || 0,
              opacity: circleObj.opacity || 1,
              strokeWidth: circleObj.strokeWidth || 0,
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
              opacity: triangleObj.opacity || 1,
              strokeWidth: triangleObj.strokeWidth || 0,
              strokeLineCap: triangleObj.strokeLineCap || 'butt',
              strokeLineJoin: triangleObj.strokeLineJoin || 'miter',
              shadow: triangleObj.shadow || null
            };
          }
          
          // Add polygon-specific properties
          if (obj.type === 'polygon') {
            const polygonObj = obj as fabric.Polygon;
            return {
              ...baseObj,
              points: polygonObj.points || [],
              opacity: polygonObj.opacity || 1,
              strokeWidth: polygonObj.strokeWidth || 0,
              strokeLineCap: polygonObj.strokeLineCap || 'butt',
              strokeLineJoin: polygonObj.strokeLineJoin || 'miter',
              shadow: polygonObj.shadow || null
            };
          }
          
          // Add path-specific properties
          if (obj.type === 'path') {
            const pathObj = obj as fabric.Path;
            const savedPathObj = {
              ...baseObj,
              path: pathObj.path || '',
              opacity: pathObj.opacity || 1,
              strokeWidth: pathObj.strokeWidth || 0,
              strokeLineCap: pathObj.strokeLineCap || 'butt',
              strokeLineJoin: pathObj.strokeLineJoin || 'miter',
              shadow: pathObj.shadow || null,
              // Preserve wave-specific data
              isWaveShape: (obj as any).isWaveShape || false,
              shapeType: (obj as any).shapeType || 'path'
            };
            
            // Debug logging for wave shapes
            if ((obj as any).isWaveShape) {
              console.log('💾 Wave shape saved to design file:', {
                id: savedPathObj.id,
                type: savedPathObj.type,
                path: savedPathObj.path,
                isWaveShape: savedPathObj.isWaveShape,
                shapeType: savedPathObj.shapeType
              });
            }
            
            return savedPathObj;
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
        
        // Only optimize if data is extremely large (over 2MB) to prevent server issues
        if (exceedsSizeLimit(designData, 2000000)) {
          console.log('⚠️ Data extremely large, optimizing but keeping as single file...');
          const optimization = optimizeDesignData(designData as any, 2000000);
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
            const currentTemplateResponse = await fetch(`http://localhost:4000/api/templates/by-key/${templateKey}`);
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
          const response = await fetch(`http://localhost:4000/api/templates/by-key/${templateKey}`, {
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
          const fileResponse = await fetch('http://localhost:4000/api/templates/save-design', {
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
          
              const rollbackResponse = await fetch(`http://localhost:4000/api/templates/by-key/${templateKey}`, {
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
            
            // Show success message to user
              const optimizationMessage = isOptimized ? '\n🗜️ Datos optimizados para reducir tamaño' : '';
              alert(`✅ Template "${templateKey}" actualizado exitosamente!\n📁 Datos guardados en un solo archivo: ${designFilename}${optimizationMessage}`);
          } else {
            // For new designs (no templateKey), just show success message
            console.log('✅ New design saved as file:', designFilename);
            const optimizationMessage = isOptimized ? '\n🗜️ Datos optimizados para reducir tamaño' : '';
          alert(`✅ Diseño guardado exitosamente!\n📁 Datos guardados en: ${filename}${optimizationMessage}`);
          }
        } catch (backendError) {
          console.error('❌ Error saving to backend:', backendError);
          console.error('❌ Backend error details:', backendError);
          
          // Show error to user and fall back to localStorage
          const errorMessage = backendError instanceof Error ? backendError.message : 'Backend save failed';
          console.log('🔄 Falling back to localStorage due to backend error...');
        }
      
      // Try to save to localStorage with quota management and optimization
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
      
      // Optimize data for localStorage if needed
      let dataToSave = designData;
      let isOptimized = false;
      
                      if (exceedsSizeLimit(designData, 200000)) { // 200KB limit for localStorage
        console.log('⚠️ Data too large for localStorage, optimizing...');
        
        // For very large data, use ultra-minimal optimization
        if (getDataSize(designData) > 1000000) { // 1MB or more
          console.log('🚨 Very large data detected, using ultra-minimal optimization...');
          dataToSave = createUltraMinimalDesignData(designData as any);
          isOptimized = true;
          console.log('🗜️ Ultra-minimal data created for localStorage:', {
            originalSize: getDataSize(designData),
            optimizedSize: getDataSize(dataToSave),
            reduction: `${Math.round((1 - getDataSize(dataToSave) / getDataSize(designData)) * 100)}%`
          });
        } else {
          const optimization = optimizeDesignData(designData as any, 200000);
          dataToSave = optimization.optimized;
          isOptimized = optimization.isMinimal;
          console.log('🗜️ Data optimized for localStorage:', {
            originalSize: optimization.originalSize,
            optimizedSize: optimization.optimizedSize,
            reduction: `${Math.round((1 - optimization.optimizedSize / optimization.originalSize) * 100)}%`
          });
        }
      }
      
      if (existingIndex >= 0) {
        savedDesigns[existingIndex] = dataToSave;
        console.log('✅ Diseño actualizado:', dataToSave.id);
      } else {
        savedDesigns.push(dataToSave);
        console.log('✅ Nuevo diseño guardado:', dataToSave.id);
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
          message = `Diseño "${dataToSave.id}" actualizado exitosamente!`;
        } else {
          message = `Nuevo diseño "${dataToSave.id}" guardado exitosamente!`;
        }
        
        message += '\n📁 Datos guardados en un solo archivo';
        
        if (isOptimized) {
          message += '\n🗜️ Datos optimizados para reducir tamaño';
        }
        
        alert(message);
        console.log('💾 Diseño guardado en localStorage:', designData);
        
        // Note: No more default templates - all templates must be user-created
        console.log('💾 Design saved successfully. Template managed in database.');
        
      } catch (quotaError) {
        console.error('❌ Quota exceeded, trying to save with ultra-minimal data...');
        
        // Use the ultra-minimal optimization system
        const ultraMinimalData = createUltraMinimalDesignData(designData as any);
        const ultraMinimalSize = getDataSize(ultraMinimalData);
        const originalSize = getDataSize(designData);
        
        console.log('🗜️ Ultra-minimal data created:', {
          originalSize: originalSize,
          optimizedSize: ultraMinimalSize,
          reduction: `${Math.round((1 - ultraMinimalSize / originalSize) * 100)}%`
        });
        
        // If even ultra-minimal data is too large, skip localStorage entirely
        if (ultraMinimalSize > 50000) { // 50KB limit
          console.log('⚠️ Even ultra-minimal data is too large, skipping localStorage...');
          alert(`Diseño demasiado grande para localStorage (${Math.round(originalSize / 1024)}KB).\n💾 Los datos se guardaron en el servidor pero no localmente.\n🗜️ Reducción intentada: ${Math.round((1 - ultraMinimalSize / originalSize) * 100)}%`);
          console.log('✅ Design saved to server only, skipped localStorage due to size');
          return; // Exit without trying localStorage
        }
        
        // Clear all old designs and save only this one
        localStorage.clear();
        localStorage.setItem('savedDesigns', JSON.stringify([ultraMinimalData]));
        
        alert(`Diseño guardado con datos ultra-minimales debido a limitaciones de espacio.\n🗜️ Reducción: ${Math.round((1 - ultraMinimalSize / originalSize) * 100)}%\n📝 Solo se guardaron los primeros 5 objetos.`);
        console.log('💾 Diseño guardado con datos ultra-minimales:', ultraMinimalData);
        
        // Note: No more default templates - all templates must be user-created
        console.log('✅ Ultra-minimal design saved successfully. Template managed in database.');
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
      // Set background - but don't load default background images
      setBackgroundColor(design.backgroundColor);
      setBackgroundImage(null); // Force no background images for templates
      
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
          // Create image object from saved data
          if (obj.src) {
            (fabric.Image.fromURL as any)(obj.src, (img: fabric.Image) => {
              img.set({
                left: obj.left || 0,
                top: obj.top || 0,
                scaleX: obj.scaleX || 1,
                scaleY: obj.scaleY || 1,
                angle: obj.angle || 0,
                opacity: obj.opacity || 1,
                selectable: true,
                evented: true,
                lockMovementX: false,
                lockMovementY: false,
                lockRotation: false,
                lockScalingX: false,
                lockScalingY: false,
                cornerStyle: 'circle',
                cornerColor: '#00525b',
                cornerSize: 8,
                transparentCorners: false,
                borderColor: '#00525b',
                borderScaleFactor: 1
              });
              canvas.add(img);
              canvas.renderAll();
            });
          } else {
            // Fallback to placeholder if no src
          const rect = new fabric.Rect({
            left: obj.left || 0,
            top: obj.top || 0,
            width: obj.width || 100,
            height: obj.height || 100,
            fill: obj.fill || '#cccccc',
            selectable: true
          });
          canvas.add(rect);
          }
          
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

  const currentConfig = editorConfigs[editorTypeState as keyof typeof editorConfigs] || editorConfigs.flyer;

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Main Toolbar - Full Width Top Bar with Integrated Tabs */}
      <div className="fixed top-0 left-0 right-0 z-50 bg-white border-b border-gray-200 shadow-sm">
        {/* Top Row - File and Edit Operations */}
        <div className="flex items-center justify-between px-6 py-3 border-b border-gray-100">
          {/* Left Section - File Operations */}
          <div className="flex items-center space-x-2">
            {/* Keep/Save Button */}
            <button
              onClick={async () => await saveDesign()}
              className="p-2 rounded-lg bg-gray-100 hover:bg-gray-200 transition-colors"
              title="Guardar Diseño (Ctrl+S) - Guarda todo en un solo archivo"
            >
                              <FloppyDisk size={20} />
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
              <ArrowsOutCardinal size={5} className="w-5 h-5" />
            </button>
            
            <button
              onClick={redo}
              disabled={historyIndex >= history.length - 1}
              className="p-2 rounded-lg bg-gray-100 hover:bg-gray-200 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              title="Rehacer (Ctrl+Y)"
            >
              <ArrowsOutCardinal size={5} className="w-5 h-5" />
            </button>
            
            <div className="w-px h-8 bg-gray-300 mx-2"></div>
            
            <button
              onClick={duplicateSelectedObject}
              disabled={!selectedObject}
              className="p-2 rounded-lg bg-gray-100 hover:bg-gray-200 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              title="Duplicar (Ctrl+D)"
            >
              <Pencil size={4} className="w-4 h-4" />
            </button>
            
            <button
              onClick={deleteSelectedObject}
              disabled={!selectedObject}
              className="p-2 rounded-lg bg-gray-100 hover:bg-gray-200 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              title="Eliminar (Delete)"
            >
              <Pencil size={4} className="w-4 h-4" />
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
              {/* Basic Design Tools Row */}
              <div className="flex items-center space-x-4">
                <span className="text-sm font-medium text-gray-700">Agregar:</span>
                
                {/* Add Text */}
                <button
                  onClick={addText}
                  className="flex items-center space-x-2 px-3 py-2 bg-blue-50 hover:bg-blue-100 rounded-lg transition-colors"
                  title="Agregar Texto"
                >
                  <TextT size={4} className="w-4 h-4 text-blue-600" />
                  <span className="text-sm font-medium text-blue-800">Texto</span>
                </button>
                
                {/* Add Image */}
                <button
                  onClick={() => fileInputRef.current?.click()}
                  className="flex items-center space-x-2 px-3 py-2 bg-green-50 hover:bg-green-100 rounded-lg transition-colors"
                  title="Agregar Imagen"
                >
                  <ImageIcon size={4} className="w-4 h-4 text-green-600" />
                  <span className="text-sm font-medium text-green-800">Imagen</span>
                </button>
                


                {/* Add Shape */}
                <div className="relative shapes-container">
                  <button
                    onClick={() => setShowShapeSelector(true)}
                    className="flex items-center space-x-2 px-3 py-2 bg-purple-50 hover:bg-purple-100 rounded-lg transition-colors"
                    title="Agregar Forma"
                  >
                    <Square size={4} className="w-4 h-4 text-purple-600" />
                    <span className="text-sm font-medium text-purple-800">Formas</span>
                  </button>
                  
                  {/* Shape Selector Modal */}
                  {showShapeSelector && (
                    <div className="absolute top-full left-0 mt-2 bg-white rounded-xl shadow-2xl border border-gray-200 p-4 z-50 min-w-[280px]">
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
                      
                      <div className="grid grid-cols-2 gap-3">
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
                      </div>
                    </div>
                  )}
                </div>
              </div>
          
              {/* Background & Real Estate Tools Row */}
              <div className="flex items-center space-x-4">
                <span className="text-sm font-medium text-gray-700">Fondo:</span>
                
                {/* Background Color */}
                <div className="relative color-picker-container">
                  <button
                    onClick={() => setShowColorPicker(!showColorPicker)}
                    className="flex items-center space-x-2 px-3 py-2 bg-orange-50 hover:bg-orange-100 rounded-lg transition-colors"
                    title="Color de Fondo"
                  >
                    <Palette size={4} className="w-4 h-4 text-orange-600" />
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
                  onClick={() => setBackgroundImage(null)}
                  disabled={!backgroundImage}
                  className="px-3 py-2 bg-gray-50 hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed rounded-lg transition-colors"
                  title="Limpiar Imagen de Fondo"
                >
                  Limpiar
                </button>
              </div>
          
              {/* Real Estate Elements Row */}
              <div className="flex items-center space-x-4">
                <span className="text-sm font-medium text-gray-700">Bienes Raíces:</span>
                
                <button
                  onClick={() => addRealEstateElement('price')}
                  className="flex items-center space-x-2 px-3 py-2 bg-yellow-50 hover:bg-yellow-100 rounded-lg transition-colors"
                  title="Agregar Precio"
                >
                  <span className="text-lg">💰</span>
                  <span className="text-sm font-medium text-yellow-800">Precio</span>
                </button>
                
                <button
                  onClick={() => addRealEstateElement('bedrooms')}
                  className="flex items-center space-x-2 px-3 py-2 bg-blue-50 hover:bg-blue-100 rounded-lg transition-colors"
                  title="Agregar Habitaciones"
                >
                  <span className="text-lg">🛏️</span>
                  <span className="text-sm font-medium text-blue-800">Habitaciones</span>
                </button>
                
                <button
                  onClick={() => addRealEstateElement('contact')}
                  className="flex items-center space-x-2 px-3 py-2 bg-green-50 hover:bg-green-100 rounded-lg transition-colors"
                  title="Agregar Contacto"
                >
                  <span className="text-lg">📞</span>
                  <span className="text-sm font-medium text-green-800">Contacto</span>
                </button>
                
                <button
                  onClick={() => addRealEstateElement('address')}
                  className="flex items-center space-x-2 px-3 py-2 bg-purple-50 hover:bg-purple-100 rounded-lg transition-colors"
                  title="Agregar Dirección"
                >
                  <span className="text-lg">📍</span>
                  <span className="text-sm font-medium text-purple-800">Dirección</span>
                </button>
                
                <button
                  onClick={() => addRealEstateElement('propertyType')}
                  className="flex items-center space-x-2 px-3 py-2 bg-red-50 hover:bg-red-100 rounded-lg transition-colors"
                  title="Agregar Tipo de Propiedad"
                >
                  <span className="text-lg">🏠</span>
                  <span className="text-sm font-medium text-red-800">Tipo</span>
                </button>
                
                <button
                  onClick={addPromotionalText}
                  className="flex items-center space-x-2 px-3 py-2 bg-teal-50 hover:bg-teal-100 rounded-lg transition-colors"
                  title="Agregar Texto Promocional"
                >
                  <span className="text-lg">📢</span>
                  <span className="text-sm font-medium text-teal-800">Texto Promocional</span>
                </button>
              </div>
              
              {/* Selected Object Color Picker */}
              {selectedObject && (
                <div className="flex items-center space-x-4">
                  <span className="text-sm font-medium text-gray-700">Objeto seleccionado:</span>
                  
                  {/* Fill Color */}
                  <div className="flex items-center space-x-2">
                    <span className="text-xs text-gray-600">Relleno:</span>
                    <input
                      type="color"
                      value={(selectedObject.fill as string) || '#000000'}
                      onChange={(e) => {
                        if (selectedObject && canvas) {
                          selectedObject.set('fill', e.target.value);
                          canvas.renderAll();
                          saveCanvasToHistory();
                        }
                      }}
                      className="w-8 h-8 rounded border border-gray-300 cursor-pointer"
                      title="Color de relleno"
                    />
                  </div>
                  
                  {/* Stroke Color */}
                  <div className="flex items-center space-x-2">
                    <span className="text-xs text-gray-600">Borde:</span>
                    <input
                      type="color"
                      value={(selectedObject.stroke as string) || '#000000'}
                      onChange={(e) => {
                        if (selectedObject && canvas) {
                          selectedObject.set('stroke', e.target.value);
                          canvas.renderAll();
                          saveCanvasToHistory();
                        }
                      }}
                      className="w-8 h-8 rounded border border-gray-300 cursor-pointer"
                      title="Color de borde"
                    />
                  </div>
                  
                  {/* Stroke Width */}
                  <div className="flex items-center space-x-2">
                    <span className="text-xs text-gray-600">Ancho borde:</span>
                    <input
                      type="range"
                      min="0"
                      max="20"
                      step="0.5"
                      value={(selectedObject.strokeWidth as number) || 0}
                      onChange={(e) => {
                        if (selectedObject && canvas) {
                          selectedObject.set('strokeWidth', parseFloat(e.target.value));
                          canvas.renderAll();
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
              )}
            </div>
          )}
          

          
          {activeTab === 'text' && selectedObject && (selectedObject.type === 'text' || selectedObject.type === 'i-text') && (
            <div className="space-y-3">
              {/* Text Content Row */}
              <div className="flex items-center space-x-4">
                <span className="text-sm font-medium text-gray-700">Contenido:</span>
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
                  rows={1}
                  className="w-64 px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 resize-none"
                  placeholder="Escribe tu texto aquí..."
                />
              </div>
              
              {/* Text Properties Row */}
              <div className="flex items-center space-x-4">
                <span className="text-sm font-medium text-gray-700">Propiedades:</span>
                
                {/* Font Family */}
                                  <select
                    value={(selectedObject as fabric.IText).fontFamily || 'Arial'}
                    onChange={(e) => {
                      if (selectedObject && (selectedObject.type === 'text' || selectedObject.type === 'i-text')) {
                        (selectedObject as fabric.IText).set('fontFamily', e.target.value);
                        canvas?.renderAll();
                        saveCanvasToHistory();
                      }
                    }}
                    className="px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  >
                    {fontFamilies.map((font) => (
                      <option key={font} value={font}>{font}</option>
                    ))}
                  </select>
                
                {/* Font Size */}
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
                  className="w-20 px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  placeholder="48"
                />
                
                {/* Text Color */}
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

                {/* Bold/Italic/Underline */}
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
                  className={`px-3 py-2 text-sm rounded border transition-colors ${
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
                  className={`px-3 py-2 text-sm rounded border transition-colors ${
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
              {/* Object Properties Row */}
              <div className="flex items-center space-x-4">
                <span className="text-sm font-medium text-gray-700">Formato:</span>
                
                {/* Fill Color */}
                <div className="flex items-center space-x-2">
                  <span className="text-xs text-gray-600">Relleno:</span>
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
                    title="Color de relleno"
                  />
                </div>
                
                {/* Stroke Color */}
                <div className="flex items-center space-x-2">
                  <span className="text-xs text-gray-600">Borde:</span>
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
                    title="Color de borde"
                  />
                </div>
                
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
              
              {/* Quick Color Palette and Gradients */}
              <div className="space-y-3">
                {/* 7 Predefined Colors */}
                <div className="space-y-2">
                  <span className="text-sm font-medium text-gray-700">Colores rápidos:</span>
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
                        className="w-8 h-8 rounded border border-gray-300 hover:scale-110 transition-transform"
                        style={{ backgroundColor: color }}
                        title={`Usar ${color}`}
                      />
                    ))}
                  </div>
                </div>
                
                {/* Gradient Options */}
                <div className="space-y-2">
                  <span className="text-sm font-medium text-gray-700">Gradientes:</span>
                  <div className="flex space-x-2">
                    <button
                      onClick={() => {
                        if (selectedObject && canvas) {
                          // Create teal to blue gradient
                          const gradient = new fabric.Gradient({
                            type: 'linear',
                            coords: {
                              x1: 0,
                              y1: 0,
                              x2: selectedObject.width || 200,
                              y2: 0
                            },
                            colorStops: [
                              { offset: 0, color: '#01aac7' },   // Teal on left
                              { offset: 1, color: '#00525b' }     // Blue on right
                            ]
                          });
                          selectedObject.set('fill', gradient);
                          canvas.renderAll();
                          saveCanvasToHistory();
                        }
                      }}
                      className="px-3 py-2 bg-gradient-to-r from-teal-400 to-blue-600 text-white text-xs rounded hover:scale-105 transition-transform"
                      title="Gradiente Teal a Azul"
                    >
                      Teal → Azul
                    </button>
                    
                    <button
                                              onClick={() => {
                          if (selectedObject && canvas) {
                            // Create blue to teal gradient
                            const gradient = new fabric.Gradient({
                              type: 'linear',
                              coords: {
                                x1: 0,
                                y1: 0,
                                x2: selectedObject.width || 200,
                                y2: 0
                              },
                              colorStops: [
                                { offset: 0, color: '#00525b' },   // Blue on left
                                { offset: 1, color: '#01aac7' }     // Teal on right
                              ]
                            });
                            selectedObject.set('fill', gradient);
                            canvas.renderAll();
                            saveCanvasToHistory();
                          }
                        }}
                        className="px-3 py-2 bg-gradient-to-r from-blue-600 to-teal-400 text-white text-xs rounded hover:scale-105 transition-transform"
                        title="Gradiente Azul a Teal"
                      >
                        Azul → Teal
                      </button>
                  </div>
                </div>
              </div>
              
              {/* WordArt Effects Row */}
              {selectedObject && (selectedObject.type === 'text' || selectedObject.type === 'i-text') && (
                <div className="space-y-3">
                  <span className="text-sm font-medium text-gray-700">Efectos de Texto (WordArt):</span>
                  
                  {/* Text Effects */}
                  <div className="grid grid-cols-2 gap-2">
                    <button
                      onClick={() => {
                        if (selectedObject && canvas) {
                          // 3D Text Effect
                          (selectedObject as fabric.IText).set({
                            stroke: '#000000',
                            strokeWidth: 2,
                            shadow: new fabric.Shadow({
                              color: 'rgba(0,0,0,0.5)',
                              blur: 8,
                              offsetX: 3,
                              offsetY: 3
                            })
                          });
                          canvas.renderAll();
                          saveCanvasToHistory();
                        }
                      }}
                      className="px-3 py-2 bg-gradient-to-r from-purple-500 to-pink-500 text-white text-xs rounded hover:scale-105 transition-transform"
                      title="Efecto 3D"
                    >
                      3D Text
                    </button>
                    
                    <button
                      onClick={() => {
                        if (selectedObject && canvas) {
                          // Glow Effect
                          (selectedObject as fabric.IText).set({
                            stroke: '#00ffff',
                            strokeWidth: 4,
                            shadow: new fabric.Shadow({
                              color: '#00ffff',
                              blur: 20,
                              offsetX: 0,
                              offsetY: 0
                            })
                          });
                          canvas.renderAll();
                          saveCanvasToHistory();
                        }
                      }}
                      className="px-3 py-2 bg-gradient-to-r from-cyan-500 to-blue-500 text-white text-xs rounded hover:scale-105 transition-transform"
                      title="Efecto Brillo"
                    >
                      Glow Effect
                    </button>
                    
                    <button
                      onClick={() => {
                        if (selectedObject && canvas) {
                          // Neon Effect
                          (selectedObject as fabric.IText).set({
                            stroke: '#ff00ff',
                            strokeWidth: 3,
                            shadow: new fabric.Shadow({
                              color: '#ff00ff',
                              blur: 15,
                              offsetX: 0,
                              offsetY: 0
                            })
                          });
                          canvas.renderAll();
                          saveCanvasToHistory();
                        }
                      }}
                      className="px-3 py-2 bg-gradient-to-r from-pink-500 to-purple-500 text-white text-xs rounded hover:scale-105 transition-transform"
                      title="Efecto Neón"
                    >
                      Neon Effect
                    </button>
                    
                    <button
                      onClick={() => {
                        if (selectedObject && canvas) {
                          // Metallic Effect
                          const gradient = new fabric.Gradient({
                            type: 'linear',
                            coords: {
                              x1: 0,
                              y1: 0,
                              x2: selectedObject.width || 200,
                              y2: 0
                            },
                            colorStops: [
                              { offset: 0, color: '#c0c0c0' },   // Silver
                              { offset: 0.5, color: '#ffffff' },  // White
                              { offset: 1, color: '#808080' }     // Gray
                            ]
                          });
                          (selectedObject as fabric.IText).set({
                            fill: gradient,
                            stroke: '#404040',
                            strokeWidth: 1
                          });
                          canvas.renderAll();
                          saveCanvasToHistory();
                        }
                      }}
                      className="px-3 py-2 bg-gradient-to-r from-gray-400 to-gray-600 text-white text-xs rounded hover:scale-105 transition-transform"
                      title="Efecto Metálico"
                    >
                      Metallic
                    </button>
                  </div>
                  
                  {/* Text Transformations */}
                  <div className="space-y-2">
                    <span className="text-sm font-medium text-gray-700">Transformaciones:</span>
                    <div className="grid grid-cols-2 gap-2">
                      <button
                        onClick={() => {
                          if (selectedObject && canvas) {
                            // Uppercase
                            const currentText = (selectedObject as fabric.IText).text || '';
                            (selectedObject as fabric.IText).set('text', currentText.toUpperCase());
                            canvas.renderAll();
                            saveCanvasToHistory();
                          }
                        }}
                        className="px-3 py-2 bg-blue-100 hover:bg-blue-200 text-blue-800 text-xs rounded transition-colors"
                        title="Convertir a mayúsculas"
                      >
                        MAYÚSCULAS
                      </button>
                      
                      <button
                        onClick={() => {
                          if (selectedObject && canvas) {
                            // Title Case
                            const currentText = (selectedObject as fabric.IText).text || '';
                            const titleCase = currentText.replace(/\w\S*/g, (txt) => 
                              txt.charAt(0).toUpperCase() + txt.substr(1).toLowerCase()
                            );
                            (selectedObject as fabric.IText).set('text', titleCase);
                            canvas.renderAll();
                            saveCanvasToHistory();
                          }
                        }}
                        className="px-3 py-2 bg-green-100 hover:bg-green-200 text-green-800 text-xs rounded transition-colors"
                        title="Convertir a título"
                      >
                        Title Case
                      </button>
                    </div>
                  </div>
                </div>
              )}
              
              {/* Shadow and Effects Row */}
              <div className="flex items-center space-x-4">
                <span className="text-sm font-medium text-gray-700">Efectos:</span>
                
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
                  className={`px-3 py-2 text-sm rounded border transition-colors ${
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
                  className="px-3 py-2 text-sm bg-gray-100 hover:bg-gray-200 text-gray-700 rounded transition-colors"
                  title="Restablecer formato"
                >
                  Reset
                </button>
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

      {/* Content Area with proper spacing for merged toolbar */}
      <div className="w-full pt-64">
        {/* Canvas */}
        <div className="bg-white rounded-2xl shadow-lg p-6 mx-6">
          <div className="flex justify-center overflow-auto p-4">
            <div 
              className="relative border-2 border-gray-300 rounded-lg shadow-lg bg-white min-w-fit"
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
    </div>
  );
};
