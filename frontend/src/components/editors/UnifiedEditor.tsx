'use client';
import React, { useState, useRef, useEffect, useCallback } from 'react';
import { FiImage, FiType, FiSquare, FiDownload, FiSave, FiRotateCcw, FiRotateCw, FiTrash2, FiCopy, FiLayers, FiMove, FiZoomIn, FiZoomOut, FiFileText, FiMinus, FiPlus, FiEdit3, FiDroplet } from 'react-icons/fi';
import { useUser } from '@/context/UserContext';
import * as fabric from 'fabric';
import { jsPDF } from 'jspdf';
import { buildDesignData, saveDesignToFiles, SaveOptions, getDataSize, exceedsSizeLimit, optimizeDesignData, createUltraMinimalDesignData } from '@/utils/saveData';

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
  opacity?: number;
  stroke?: string;
  strokeWidth?: number;
  strokeLineCap?: string;
  strokeLineJoin?: string;
  shadow?: any;
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

  // Font families - 100+ fonts available
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
    'Lora',
    'Merriweather',
    'Playfair Display',
    'Crimson Text',
    'Libre Baskerville',
    
    // Google Fonts - Display & Decorative
    'Bebas Neue',
    'Anton',
    'Righteous',
    'Fredoka One',
    'Bungee',
    'Lobster',
    'Pacifico',
    'Dancing Script',
    'Great Vibes',
    'Satisfy',
    'Kaushan Script',
    'Amatic SC',
    'Caveat',
    'Indie Flower',
    'Permanent Marker',
    'Shadows Into Light',
    'Yellowtail',
    'Lobster Two',
    'Chewy',
    'Fredoka',
    
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
    
    // Google Fonts - Display
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
    'Crimson Pro',
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
    'Fjalla One',
    'Francois One',
    'Hind',
    'Hind Madurai',
    'Hind Siliguri',
    'Hind Vadodara',
    'Inconsolata',
    'Josefin Sans',
    'Josefin Slab',
    'Kanit',
    'Karla',
    'Libre Franklin',
    'Maven Pro',
    'Muli',
    'Nunito Sans',
    'Oxygen',
    'Oxygen Mono',
    'PT Sans Caption',
    'PT Sans Narrow',
    'Quattrocento',
    'Quattrocento Sans',
    'Rokkitt',
    'Slabo 27px',
    'Slabo 13px',
    'Source Code Pro',
    'Space Mono',
    'Titillium Web',
    'Varela',
    'Varela Round',
    'Work Sans',
    'Yanone Kaffeesatz',
    'Zilla Slab',
    'Zilla Slab Highlight',
    'Vladimir Script',
    
    // Additional Google Fonts - Part 1
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
    'Amatic SC',
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
    'Anton',
    'Arapey',
    'Arbutus',
    'Arbutus Slab',
    'Architects Daughter',
    'Archivo Black',
    'Archivo Narrow',
    'Arimo',
    'Arizonia',
    'Armata',
    'Artifika',
    'Arvo',
    'Asap',
    'Asap Condensed',
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
    'Cabin',
    'Cabin Condensed',
    'Cabin Sketch',
    'Caesar Dressing',
    'Cagliostro',
    'Calligraffitti',
    'Cambay',
    'Cambo',
    'Candal',
    'Cantarell',
    'Cantata One',
    'Cantora One',
    'Capriola',
    'Cardo',
    'Carme',
    'Carrois Gothic',
    'Carrois Gothic SC',
    'Carter One',
    'Caudex',
    'Caveat',
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
    'Chewy',
    'Chicle',
    'Chivo',
    'Cinzel',
    'Cinzel Decorative',
    'Clicker Script',
    'Coda',
    'Coda Caption',
    'Codystar',
    'Combo',
    'Comfortaa',
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
    'Cousine',
    'Coustard',
    'Covered By Your Grace',
    'Crafty Girls',
    'Creepster',
    'Crete Round',
    'Crimson Text',
    'Croissant One',
    'Crushed',
    'Cuprum',
    'Cutive',
    'Cutive Mono',
    'Damion',
    'Dancing Script',
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
    'Droid Sans',
    'Droid Sans Mono',
    'Droid Serif',
    'Duru Sans',
    'Dynalight',
    'EB Garamond',
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
    'Exo',
    'Exo 2',
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
    'Fira Mono',
    'Fira Sans',
    'Fira Sans Condensed',
    'Fira Sans Extra Condensed',
    'Fjalla One',
    'Fjord One',
    'Flamenco',
    'Flavors',
    'Fondamento',
    'Fontdiner Swanky',
    'Forum',
    'Francois One',
    'Freckle Face',
    'Fredericka the Great',
    'Fredoka One',
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
    'Great Vibes',
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
    'Hind',
    'Hind Guntur',
    'Hind Madurai',
    'Hind Siliguri',
    'Hind Vadodara',
    'Holtwood One SC',
    'Homemade Apple',
    'Homenaje',
    'Iceberg',
    'Iceland',
    'Imprima',
    'Inconsolata',
    'Inder',
    'Indie Flower',
    'Inika',
    'Inknut Antiqua',
    'Irish Grover',
    'Istok Web',
    'Italiana',
    'Italianno',
    'Itim',
    'Jacques Francois',
    'Jacques Francois Shadow',
    'Jaldi',
    'Jim Nightshade',
    'Jockey One',
    'Jolly Lodger',
    'Jomhuria',
    'Josefin Sans',
    'Josefin Slab',
    'Joti One',
    'Judson',
    'Julee',
    'Julius Sans One',
    'Junge',
    'Jura',
    'Just Another Hand',
    'Just Me Again Down Here',
    'Kadwa',
    'Kalam',
    'Kameron',
    'Kanit',
    'Kantumruy',
    'Karla',
    'Karma',
    'Katibeh',
    'Kaushan Script',
    'Kavivanar',
    'Kavoon',
    'Kdam Thmor',
    'Keania One',
    'Kelly Slab',
    'Kenia',
    'Khand',
    'Khmer',
    'Khula',
    'Kite One',
    'Knewave',
    'Kotta One',
    'Koulen',
    'Kranky',
    'Kreon',
    'Kristi',
    'Krona One',
    'Kumar One',
    'Kumar One Outline',
    'Kurale',
    'La Belle Aurore',
    'Laila',
    'Lakki Reddy',
    'Lalezar',
    'Lancelot',
    'Lateef',
    'Lato',
    'League Script',
    'Leckerli One',
    'Ledger',
    'Lekton',
    'Lemon',
    'Lemonada',
    'Libre Baskerville',
    'Libre Caslon Text',
    'Libre Franklin',
    'Life Savers',
    'Lilita One',
    'Lily Script One',
    'Limelight',
    'Linden Hill',
    'Lobster',
    'Lobster Two',
    'Londrina Outline',
    'Londrina Shadow',
    'Londrina Sketch',
    'Londrina Solid',
    'Lora',
    'Love Ya Like A Sister',
    'Loved by the King',
    'Lovers Quarrel',
    'Luckiest Guy',
    'Lusitana',
    'Lustria',
    'Macondo',
    'Macondo Swash Caps',
    'Mada',
    'Magra',
    'Maiden Orange',
    'Maitree',
    'Mako',
    'Mallanna',
    'Mandali',
    'Marcellus',
    'Marcellus SC',
    'Marck Script',
    'Margarine',
    'Marko One',
    'Marmelad',
    'Martel',
    'Martel Sans',
    'Marvel',
    'Mate',
    'Mate SC',
    'Maven Pro',
    'McLaren',
    'Meddon',
    'MedievalSharp',
    'Medula One',
    'Meera Inimai',
    'Megrim',
    'Meie Script',
    'Merienda',
    'Merienda One',
    'Merriweather',
    'Merriweather Sans',
    'Metal',
    'Metal Mania',
    'Metamorphous',
    'Metrophobic',
    'Michroma',
    'Milonga',
    'Miltonian',
    'Miltonian Tattoo',
    'Miniver',
    'Miriam Libre',
    'Mirza',
    'Miss Fajardose',
    'Mitr',
    'Modak',
    'Modern Antiqua',
    'Mogra',
    'Molengo',
    'Molle',
    'Monda',
    'Monofett',
    'Monoton',
    'Monsieur La Doulaise',
    'Montaga',
    'Montez',
    'Montserrat',
    'Montserrat Alternates',
    'Montserrat Subrayada',
    'Moul',
    'Moulpali',
    'Mountains of Christmas',
    'Mouse Memoirs',
    'Mr Bedfort',
    'Mr Dafoe',
    'Mr De Haviland',
    'Mrs Saint Delafield',
    'Mrs Sheppards',
    'Mukti',
    'Mukti Vaani',
    'Muli',
    'Mystery Quest',
    'NTR',
    'Neucha',
    'Neuton',
    'New Rocker',
    'News Cycle',
    'Niconne',
    'Nixie One',
    'Nobile',
    'Nokora',
    'Norican',
    'Nosifer',
    'Nothing You Could Do',
    'Noticia Text',
    'Noto Sans',
    'Noto Sans HK',
    'Noto Sans JP',
    'Noto Sans KR',
    'Noto Sans SC',
    'Noto Sans TC',
    'Noto Serif',
    'Noto Serif JP',
    'Noto Serif KR',
    'Noto Serif SC',
    'Noto Serif TC',
    'Nova Cut',
    'Nova Flat',
    'Nova Mono',
    'Nova Oval',
    'Nova Round',
    'Nova Script',
    'Nova Slim',
    'Nova Square',
    'Numans',
    'Nunito',
    'Nunito Sans',
    'Odor Mean Chey',
    'Offside',
    'Old Standard TT',
    'Oldenburg',
    'Oleo Script',
    'Oleo Script Swash Caps',
    'Open Sans',
    'Open Sans Condensed',
    'Oranienbaum',
    'Orbitron',
    'Oregano',
    'Orienta',
    'Original Surfer',
    'Oswald',
    'Over the Rainbow',
    'Overlock',
    'Overlock SC',
    'Overpass',
    'Overpass Mono',
    'Ovo',
    'Oxygen',
    'Oxygen Mono',
    'PT Mono',
    'PT Sans',
    'PT Sans Caption',
    'PT Sans Narrow',
    'PT Serif',
    'PT Serif Caption',
    'Pacifico',
    'Padauk',
    'Palanquin',
    'Palanquin Dark',
    'Pangolin',
    'Paprika',
    'Parisienne',
    'Passero One',
    'Passion One',
    'Pathway Gothic One',
    'Patrick Hand',
    'Patrick Hand SC',
    'Pattaya',
    'Patua One',
    'Pavanam',
    'Paytone One',
    'Peddana',
    'Peralta',
    'Permanent Marker',
    'Petit Formal Script',
    'Petrona',
    'Philosopher',
    'Piedra',
    'Pinyon Script',
    'Pirata One',
    'Plaster',
    'Play',
    'Playball',
    'Playfair Display',
    'Playfair Display SC',
    'Podkova',
    'Poiret One',
    'Poller One',
    'Poly',
    'Pompiere',
    'Pontano Sans',
    'Poppins',
    'Port Lligat Sans',
    'Port Lligat Slab',
    'Pragati Narrow',
    'Prata',
    'Preahvihear',
    'Press Start 2P',
    'Pridi',
    'Princess Sofia',
    'Prociono',
    'Prompt',
    'Prosto One',
    'Proza Libre',
    'Puritan',
    'Purple Purse',
    'Quando',
    'Quantico',
    'Quattrocento',
    'Quattrocento Sans',
    'Questrial',
    'Quicksand',
    'Quintessential',
    'Qwigley',
    'Racing Sans One',
    'Radley',
    'Rajdhani',
    'Rakkas',
    'Raleway',
    'Raleway Dots',
    'Ramabhadra',
    'Ramaraja',
    'Rambla',
    'Rammetto One',
    'Ranchers',
    'Rancho',
    'Ranga',
    'Rasa',
    'Rationale',
    'Ravi Prakash',
    'Red Hat Display',
    'Red Hat Text',
    'Redressed',
    'Reem Kufi',
    'Reenie Beanie',
    'Revalia',
    'Rhodium Libre',
    'Ribeye',
    'Ribeye Marrow',
    'Righteous',
    'Risque',
    'Roboto',
    'Roboto Condensed',
    'Roboto Mono',
    'Roboto Slab',
    'Rochester',
    'Rock Salt',
    'Rokkitt',
    'Romanesco',
    'Ropa Sans',
    'Rosario',
    'Rosarivo',
    'Rouge Script',
    'Rozha One',
    'Rubik',
    'Rubik Mono One',
    'Ruda',
    'Rufina',
    'Ruge Boogie',
    'Ruluko',
    'Rum Raisin',
    'Ruslan Display',
    'Russo One',
    'Ruthie',
    'Rye',
    'Sacramento',
    'Sahitya',
    'Sail',
    'Saira',
    'Saira Condensed',
    'Saira Extra Condensed',
    'Saira Semi Condensed',
    'Salsa',
    'Sanchez',
    'Sancreek',
    'Sansita',
    'Sarabun',
    'Sarala',
    'Sarina',
    'Sarpanch',
    'Satisfy',
    'Sawarabi Gothic',
    'Sawarabi Mincho',
    'Scada',
    'Scheherazade',
    'Schoolbell',
    'Scope One',
    'Seaweed Script',
    'Secular One',
    'Sedgwick Ave',
    'Sedgwick Ave Display',
    'Sevillana',
    'Seymour One',
    'Shadows Into Light',
    'Shadows Into Light Two',
    'Shanti',
    'Share',
    'Share Tech',
    'Share Tech Mono',
    'Shojumaru',
    'Short Stack',
    'Shrikhand',
    'Siemreap',
    'Sigmar One',
    'Signika',
    'Signika Negative',
    'Simonetta',
    'Sintony',
    'Sirin Stencil',
    'Six Caps',
    'Skranji',
    'Slabo 13px',
    'Slabo 27px',
    'Slackey',
    'Smokum',
    'Smythe',
    'Sniglet',
    'Snippet',
    'Snowburst One',
    'Sofadi One',
    'Sofia',
    'Sonsie One',
    'Sorts Mill Goudy',
    'Source Code Pro',
    'Source Sans Pro',
    'Source Serif Pro',
    'Space Mono',
    'Special Elite',
    'Spectral',
    'Spectral SC',
    'Spicy Rice',
    'Spinnaker',
    'Spirax',
    'Squada One',
    'Sree Krushnadevaraya',
    'Sriracha',
    'Srisakdi',
    'Stalemate',
    'Stalinist One',
    'Stardos Stencil',
    'Stint Ultra Condensed',
    'Stint Ultra Expanded',
    'Stoke',
    'Strait',
    'Sue Ellen Francisco',
    'Suez One',
    'Sulphur Point',
    'Sumana',
    'Sunshiney',
    'Supermercado One',
    'Sura',
    'Suranna',
    'Suravaram',
    'Suwannaphum',
    'Swanky and Moo Moo',
    'Syncopate',
    'Tajawal',
    'Tangerine',
    'Taprom',
    'Tauri',
    'Taviraj',
    'Teko',
    'Telex',
    'Tenali Ramakrishna',
    'Tenor Sans',
    'Text Me One',
    'The Girl Next Door',
    'Tienne',
    'Tillana',
    'Timmana',
    'Tinos',
    'Titan One',
    'Titillium Web',
    'Trade Winds',
    'Trirong',
    'Trocchi',
    'Trochut',
    'Trykker',
    'Tulpen One',
    'Ubuntu',
    'Ubuntu Condensed',
    'Ubuntu Mono',
    'Ultra',
    'Uncial Antiqua',
    'Underdog',
    'Unica One',
    'UnifrakturCook',
    'UnifrakturMaguntia',
    'Unkempt',
    'Unlock',
    'Unna',
    'VT323',
    'Vampiro One',
    'Varela',
    'Varela Round',
    'Vast Shadow',
    'Vesper Libre',
    'Viaoda Libre',
    'Vibes',
    'Vibur',
    'Vidaloka',
    'Viga',
    'Voces',
    'Volkhov',
    'Vollkorn',
    'Vollkorn SC',
    'Voltaire',
    'Waiting for the Sunrise',
    'Wallpoet',
    'Walter Turncoat',
    'Warnes',
    'Wellfleet',
    'Wendy One',
    'Wire One',
    'Work Sans',
    'Yanone Kaffeesatz',
    'Yantramanav',
    'Yatra One',
    'Yellowtail',
    'Yeon Sung',
    'Yeseva One',
    'Yesteryear',
    'Yrsa',
    'ZCOOL KuaiLe',
    'ZCOOL QingKe HuangYou',
    'ZCOOL XiaoWei',
    'Zeyada',
    'Zhi Mang Xing',
    'Zilla Slab',
    'Zilla Slab Highlight'
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
      // Get the current state of all objects from the Fabric.js canvas
      const canvasObjects = canvas.getObjects();
      const canvasState = canvas.toJSON();
      
      // Convert Fabric.js objects to our EditorObject format
      const currentObjects: EditorObject[] = canvasObjects.map((obj: fabric.Object) => ({
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
        // Include opacity and other properties
        opacity: obj.opacity || 1,
        stroke: (obj as any).stroke || 'transparent',
        strokeWidth: (obj as any).strokeWidth || 0,
        strokeLineCap: (obj as any).strokeLineCap || 'butt',
        strokeLineJoin: (obj as any).strokeLineJoin || 'miter',
        shadow: (obj as any).shadow || null
      }));
      
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
        } else {
          // Shape
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
        } else {
          // Shape
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

  // Load template preset
  const loadTemplate = async (templateKey: string) => {
    console.log('🚀 loadTemplate called with key:', templateKey);
    
    try {
      // First try to load from database
      const response = await fetch(`http://localhost:4000/api/templates/by-key/${templateKey}`);
      if (response.ok) {
        const template = await response.json();
        console.log('✅ Template metadata loaded from database:', template);
        
        // If template has a design file, check if it exists first
        if (template.designFilename) {
          console.log('📁 Checking design file:', template.designFilename);
          const fileExists = await checkDesignFileExists(template.designFilename);
          
          if (fileExists) {
            console.log('✅ Design file exists, loading...');
            const designResponse = await fetch(`http://localhost:4000/api/templates/design/${template.designFilename}`);
            if (designResponse.ok) {
              const designData = await designResponse.json();
              console.log('🎨 Design data loaded from file:', designData);
              await loadTemplateFromData(templateKey, designData);
              return;
            }
          } else {
            console.warn('⚠️ Design file does not exist:', template.designFilename);
            console.log('🔄 Falling back to template data from database...');
            
            // Clean up the orphaned design file reference
            await cleanupOrphanedDesignFile(templateKey);
          }
          
          // Fallback to loading from template data if design file doesn't exist
          await loadTemplateFromData(templateKey, template);
          return;
        } else {
          // No design file specified, load from template data
          console.log('📋 No design file specified, loading from template data...');
          await loadTemplateFromData(templateKey, template);
          return;
        }
      }
    } catch (error) {
      console.warn('⚠️ Failed to load template from database, falling back to constant:', error);
    }
    
    // Fallback to hard-coded template
    const template = realEstateTemplates[templateKey as keyof typeof realEstateTemplates];
    if (template && canvas) {
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
            return {
              ...baseObj,
              path: pathObj.path || '',
              opacity: pathObj.opacity || 1,
              strokeWidth: pathObj.strokeWidth || 0,
              strokeLineCap: pathObj.strokeLineCap || 'butt',
              strokeLineJoin: pathObj.strokeLineJoin || 'miter',
              shadow: pathObj.shadow || null
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
      
      // If editing a template, update the template in the database
      if (templateKey) {
        console.log('🏠 Updating template in database:', templateKey);
        try {
          // First, save the full design data as a file
          console.log('💾 Saving design data as file...');
          
          // Use JSON method instead of FormData for better reliability
          console.log('📤 Sending design data as JSON to backend...');
          console.log('📊 Design data size:', getDataSize(designData), 'bytes');
          
          // Check if data is too large and optimize if needed
          let dataToSave = designData;
          let isOptimized = false;
          
          if (exceedsSizeLimit(designData, 500000)) {
            console.log('⚠️ Data too large, optimizing...');
            const optimization = optimizeDesignData(designData as any, 500000);
            dataToSave = optimization.optimized;
            isOptimized = optimization.isMinimal;
            console.log('🗜️ Data optimized:', {
              originalSize: optimization.originalSize,
              optimizedSize: optimization.optimizedSize,
              reduction: `${Math.round((1 - optimization.optimizedSize / optimization.originalSize) * 100)}%`
            });
          }
          
          const fileResponse = await fetch('http://localhost:4000/api/templates/save-design', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              designData: dataToSave,
              templateKey: templateKey // Include template key for individual file naming
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
            const optimizationMessage = isOptimized ? '\n🗜️ Datos optimizados para reducir tamaño' : '';
            alert(`✅ Template "${templateKey}" actualizado exitosamente!\n📁 Datos guardados en: ${designFilename}${optimizationMessage}`);
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
        
        if (isOptimized) {
          message += '\n🗜️ Datos optimizados para reducir tamaño';
        }
        
        alert(message);
        console.log('💾 Diseño guardado en localStorage:', designData);
        
        // Note: Default template is now managed in database, not localStorage
        console.log('💾 Design saved successfully. Default template managed in database.');
        
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
        
        // Note: Default template is now managed in database, not localStorage
        console.log('✅ Ultra-minimal design saved successfully. Default template managed in database.');
      }
      
    } catch (error) {
      console.error('❌ Error al guardar el diseño:', error);
      console.error('❌ Error details:', error);
      alert('Error al guardar el diseño. Revisa la consola para más detalles.');
    }
  };

  // Save design using modular approach (new method)
  const saveDesignModular = async () => {
    console.log('🚀 Modular save button clicked!');
    console.log('🎨 Canvas exists:', !!canvas);
    console.log('🆔 Design ID:', id);
    console.log('📝 Editor Type:', editorTypeState);
    
    if (!canvas) {
      console.error('❌ Canvas is not ready');
      alert('El canvas no está listo. Espera un momento e intenta nuevamente.');
      return;
    }

    try {
      console.log('📊 Building design data...');
      
      // Build design data using the new modular system
      const designData = buildDesignData(
        canvas,
        id,
        editorTypeState,
        canvasSize,
        backgroundColor,
        backgroundImage,
        templateKey || null,
        { includeMetadata: true, separateFiles: true }
      );
      
      console.log('💾 Design data built:', designData);
      console.log('📊 Design data size:', JSON.stringify(designData).length, 'bytes');
      console.log('🔢 Number of objects:', designData.objects.length);
      
      // Save to separate files
      const saveOptions: SaveOptions = {
        includeMetadata: true,
        separateFiles: true,
        compressData: false
      };
      
      const saveResult = await saveDesignToFiles(designData, saveOptions);
      
      if (saveResult.success) {
        console.log('✅ Design saved to files successfully:', saveResult.files);
        const optimizationMessage = saveResult.optimized ? ' (datos optimizados para reducir tamaño)' : '';
        alert(`Diseño guardado exitosamente en ${saveResult.files.length} archivos${optimizationMessage}!`);
      } else {
        console.error('❌ Failed to save design:', saveResult.error);
        alert(`Error al guardar el diseño: ${saveResult.error}`);
      }
    } catch (error) {
      console.error('❌ Error saving design:', error);
      alert('Error al guardar el diseño. Intenta nuevamente.');
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
                onClick={async () => await saveDesignModular()}
                className="flex items-center space-x-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
                title="Guardar en Archivos Separados"
              >
                <FiSave className="w-4 h-4" />
                <span className="hidden sm:inline">Guardar Modular</span>
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

        {/* Shape Selector Modal */}
        {showShapeSelector && (
          <div 
            className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 backdrop-blur-sm"
            onClick={() => setShowShapeSelector(false)}
          >
            <div 
              className="bg-white rounded-2xl shadow-2xl p-6 mx-4 max-w-lg w-full"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-xl font-semibold text-gray-900">Seleccionar Forma</h3>
                <button
                  onClick={() => setShowShapeSelector(false)}
                  className="p-2 rounded-lg hover:bg-gray-100 transition-colors"
                  title="Cerrar selector de formas"
                >
                  <FiMinus className="w-5 h-5 text-gray-600" />
                </button>
              </div>
              
              <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                {/* Rectangle */}
                <button
                  onClick={() => addShape('rectangle')}
                  className="flex flex-col items-center p-6 rounded-xl border-2 border-gray-200 hover:border-blue-500 hover:bg-blue-50 transition-all duration-200 group"
                >
                  <div className="w-16 h-12 bg-blue-500 rounded-sm mb-3 group-hover:bg-blue-600 transition-colors"></div>
                  <span className="text-sm font-medium text-gray-700">Rectángulo</span>
                </button>
                
                {/* Rounded Rectangle */}
                <button
                  onClick={() => addShape('rounded-rectangle')}
                  className="flex flex-col items-center p-6 rounded-xl border-2 border-gray-200 hover:border-green-500 hover:bg-green-50 transition-all duration-200 group"
                >
                  <div className="w-16 h-12 bg-green-500 rounded-md mb-3 group-hover:bg-green-600 transition-colors"></div>
                  <span className="text-sm font-medium text-gray-700">Rectángulo Redondeado</span>
                </button>
                
                {/* Circle */}
                <button
                  onClick={() => addShape('circle')}
                  className="flex flex-col items-center p-6 rounded-xl border-2 border-gray-200 hover:border-purple-500 hover:bg-purple-50 transition-all duration-200 group"
                >
                  <div className="w-16 h-16 bg-purple-500 rounded-full mb-3 group-hover:bg-purple-600 transition-colors"></div>
                  <span className="text-sm font-medium text-gray-700">Círculo</span>
                </button>
                
                {/* Triangle */}
                <button
                  onClick={() => addShape('triangle')}
                  className="flex flex-col items-center p-6 rounded-xl border-2 border-gray-200 hover:border-orange-500 hover:bg-orange-50 transition-all duration-200 group"
                >
                  <div className="w-0 h-0 border-l-[8px] border-r-[8px] border-b-[16px] border-l-transparent border-r-transparent border-b-orange-500 mb-3 group-hover:border-b-orange-600 transition-colors"></div>
                  <span className="text-sm font-medium text-gray-700">Triángulo</span>
                </button>
                
                {/* Line */}
                <button
                  onClick={() => addShape('line')}
                  className="flex flex-col items-center p-6 rounded-xl border-2 border-gray-200 hover:border-red-500 hover:bg-red-50 transition-all duration-200 group"
                >
                  <div className="w-16 h-1 bg-red-500 mb-3 group-hover:bg-red-600 transition-colors"></div>
                  <span className="text-sm font-medium text-gray-700">Línea</span>
                </button>
                
                {/* Dash Line */}
                <button
                  onClick={() => addShape('dashline')}
                  className="flex flex-col items-center p-6 rounded-xl border-2 border-gray-200 hover:border-indigo-500 hover:bg-indigo-50 transition-all duration-200 group"
                >
                  <div className="w-16 h-1 bg-indigo-500 mb-3 group-hover:bg-indigo-600 transition-colors" style={{backgroundImage: 'repeating-linear-gradient(to right, currentColor 0px, currentColor 4px, transparent 4px, transparent 8px)'}}></div>
                  <span className="text-sm font-medium text-gray-700">Línea Discontinua</span>
                </button>
              </div>
              
              <div className="mt-6 pt-4 border-t border-gray-200">
                <button
                  onClick={() => setShowShapeSelector(false)}
                  className="w-full px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg transition-colors"
                >
                  Cancelar
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Secondary Toolbar with Tabs */}
        <div className="bg-white rounded-2xl shadow-lg mb-6 w-full min-w-[800px] h-fit max-h-none">
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
            {selectedObject && (selectedObject.type === 'rect' || selectedObject.type === 'circle' || selectedObject.type === 'triangle' || selectedObject.type === 'polygon' || selectedObject.type === 'path' || selectedObject.type === 'line') && (
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
            
            {/* Brand Kit Tab */}
            <button
              onClick={() => setActiveTab('brandKit')}
              className={`px-6 py-3 text-sm font-medium border-b-2 transition-colors ${
                activeTab === 'brandKit'
                  ? 'border-blue-500 text-blue-600 bg-blue-50'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              <div className="flex items-center space-x-2">
                <FiDroplet className="w-4 h-4" />
                <span>Marca</span>
              </div>
            </button>
            
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
          <div className="p-4 overflow-hidden min-h-[150px]">
            {/* Elements Tab */}
            {activeTab === 'elements' && (
              <div className="space-y-3 min-h-[120px]">
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
              <div className="space-y-3 min-h-[120px]">
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
              <div className="space-y-3 min-h-[120px]">
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
              <div className="space-y-3 min-h-[120px]">
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
            {activeTab === 'format' && selectedObject && (selectedObject.type === 'rect' || selectedObject.type === 'circle' || selectedObject.type === 'triangle' || selectedObject.type === 'polygon' || selectedObject.type === 'path' || selectedObject.type === 'line') && (
              <div className="space-y-3 min-h-[120px]">
                <div className="flex items-center justify-between">
                  <h4 className="text-sm font-semibold text-gray-900">Formato del Objeto</h4>
                  <span className="text-xs text-blue-600 bg-blue-100 px-2 py-1 rounded-full">
                    {selectedObject.type || 'Objeto'}
                  </span>
                </div>
                
                <div className="grid grid-cols-8 gap-2">
                  {/* Fill Color (Content Color) */}
                  <div>
                    <label className="block text-xs font-medium text-gray-700 mb-1">Relleno</label>
                    <div className="flex items-center space-x-1">
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
                        className="w-6 h-6 rounded border border-gray-300 cursor-pointer"
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
                        className="w-full px-2 py-1 text-xs border border-gray-300 rounded focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
                      />
                    </div>
                  </div>
                  
                  {/* Stroke Color (Border Color) */}
                  <div>
                    <label className="block text-xs font-medium text-gray-700 mb-1">Borde</label>
                    <div className="flex items-center space-x-1">
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
                        className="w-6 h-6 rounded border border-gray-300 cursor-pointer"
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
                        className="w-full px-2 py-1 text-xs border border-gray-300 rounded focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
                      />
                    </div>
                  </div>
                  
                  {/* Stroke Width (Border Width) */}
                  <div>
                    <label className="block text-xs font-medium text-gray-700 mb-1">Ancho</label>
                    <div className="flex items-center space-x-1">
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
                        className="flex-1 h-1 bg-gray-200 rounded appearance-none cursor-pointer"
                      />
                      <span className="text-xs text-gray-600 min-w-[2rem] text-center">
                        {(selectedObject.strokeWidth as number) || 0}
                      </span>
                    </div>
                  </div>
                  
                  {/* Opacity */}
                  <div>
                    <label className="block text-xs font-medium text-gray-700 mb-1">Opacidad</label>
                    <div className="flex items-center space-x-1">
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
                        className="flex-1 h-1 bg-gray-200 rounded appearance-none cursor-pointer"
                      />
                      <span className="text-xs text-gray-600 min-w-[2rem] text-center">
                        {((selectedObject.opacity as number) || 1).toFixed(1)}
                      </span>
                    </div>
                  </div>
                  {/* Stroke Line Cap */}
                  <div>
                    <label className="block text-xs font-medium text-gray-700 mb-1">Estilo</label>
                    <select
                      value={(selectedObject.strokeLineCap as string) || 'butt'}
                      onChange={(e) => {
                        if (selectedObject) {
                          selectedObject.set('strokeLineCap', e.target.value);
                          canvas?.renderAll();
                          saveCanvasToHistory();
                        }
                      }}
                      className="w-full px-2 py-1 text-xs border border-gray-300 rounded focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
                    >
                      <option value="butt">Recto</option>
                      <option value="round">Redondeado</option>
                      <option value="square">Cuadrado</option>
                    </select>
                  </div>
                  
                  {/* Stroke Line Join */}
                  <div>
                    <label className="block text-xs font-medium text-gray-700 mb-1">Unión</label>
                    <select
                      value={(selectedObject.strokeLineJoin as string) || 'miter'}
                      onChange={(e) => {
                        if (selectedObject) {
                          selectedObject.set('strokeLineJoin', e.target.value);
                          canvas?.renderAll();
                          saveCanvasToHistory();
                        }
                      }}
                      className="w-full px-2 py-1 text-xs border border-gray-300 rounded focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
                    >
                      <option value="miter">Angular</option>
                      <option value="round">Redondeado</option>
                      <option value="bevel">Biselado</option>
                    </select>
                  </div>
                  
                  {/* Shadow */}
                  <div>
                    <label className="block text-xs font-medium text-gray-700 mb-1">Sombra</label>
                    <div className="flex items-center space-x-1">
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
                      <span className="text-xs text-gray-600">Activar</span>
                    </div>
                  </div>
                  
                  {/* Reset to Default */}
                  <div>
                    <label className="block text-xs font-medium text-gray-700 mb-1">Restablecer</label>
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
                      className="w-full px-2 py-1 text-xs bg-gray-100 hover:bg-gray-200 text-gray-700 rounded transition-colors"
                    >
                      Reset
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
            {activeTab === 'format' && selectedObject && !['rect', 'circle', 'triangle', 'polygon', 'path', 'line'].includes(selectedObject.type) && (
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
            
            {/* Brand Kit Tab */}
            {activeTab === 'brandKit' && (
              <div className="space-y-3 min-h-[120px]">
                <div className="text-center text-gray-500 py-8">
                  <p className="text-sm">Brand Kit content will be added here</p>
                </div>
              </div>
            )}
            
            {/* Text Properties Tab */}
            {activeTab === 'text' && selectedObject && (selectedObject.type === 'text' || selectedObject.type === 'i-text') && (
              <div className="space-y-3 min-h-[120px]">
                <div className="flex items-center justify-between">
                  <h4 className="text-sm font-semibold text-gray-900">Propiedades del Texto</h4>
                  <span className="text-xs text-blue-600 bg-blue-100 px-2 py-1 rounded-full">
                    {(selectedObject as fabric.IText).text || 'Texto'}
                  </span>
                </div>
                
                <div className="grid grid-cols-8 gap-2">
                  {/* Font Family */}
                  <div>
                    <label className="block text-xs font-medium text-gray-700 mb-1">Fuente</label>
                    <select
                      value={(selectedObject as fabric.IText).fontFamily || 'Arial'}
                      onChange={(e) => {
                        if (selectedObject && (selectedObject.type === 'text' || selectedObject.type === 'i-text')) {
                          (selectedObject as fabric.IText).set('fontFamily', e.target.value);
                          canvas?.renderAll();
                          saveCanvasToHistory();
                        }
                      }}
                      className="w-full px-2 py-1 text-xs border border-gray-300 rounded focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
                    >
                      {fontFamilies.map(font => (
                        <option key={font} value={font} style={{ fontFamily: font }}>
                          {font}
                        </option>
                      ))}
                    </select>
                  </div>
                  
                  {/* Font Size */}
                  <div>
                    <label className="block text-xs font-medium text-gray-700 mb-1">Tamaño</label>
                    <div className="flex items-center space-x-1">
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
                        className="flex-1 h-1 bg-gray-200 rounded appearance-none cursor-pointer"
                      />
                      <span className="text-xs text-gray-600 min-w-[2rem] text-center">
                        {(selectedObject as fabric.IText).fontSize || 48}
                      </span>
                    </div>
                  </div>
                  
                                  {/* Font Weight */}
                <div>
                    <label className="block text-xs font-medium text-gray-700 mb-1">Peso</label>
                  <select
                    value={(selectedObject as fabric.IText).fontWeight || 'normal'}
                    onChange={(e) => {
                      if (selectedObject && (selectedObject.type === 'text' || selectedObject.type === 'i-text')) {
                        (selectedObject as fabric.IText).set('fontWeight', e.target.value);
                        canvas?.renderAll();
                        saveCanvasToHistory();
                      }
                    }}
                      className="w-full px-2 py-1 text-xs border border-gray-300 rounded focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
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
                    <label className="block text-xs font-medium text-gray-700 mb-1">Color</label>
                    <div className="flex items-center space-x-1">
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
                        className="w-6 h-6 rounded border border-gray-300 cursor-pointer"
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
                        className="w-full px-2 py-1 text-xs border border-gray-300 rounded focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
                      />
                    </div>
                  </div>
                  {/* Font Style (Italic) */}
                  <div>
                    <label className="block text-xs font-medium text-gray-700 mb-1">Estilo</label>
                    <div className="flex items-center space-x-1">
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
                        className={`px-2 py-1 text-xs rounded border transition-colors ${
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
                        className={`px-2 py-1 text-xs rounded border transition-colors ${
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
                        className={`px-2 py-1 text-xs rounded border transition-colors ${
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
                    <label className="block text-xs font-medium text-gray-700 mb-1">Alineación</label>
                    <div className="flex items-center space-x-1">
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
                          className={`p-1 rounded border transition-colors ${
                            (selectedObject as fabric.IText).textAlign === align.value
                              ? 'border-blue-500 bg-blue-50 text-blue-700'
                              : 'border-gray-300 hover:border-gray-400'
                          }`}
                          title={align.label}
                        >
                          <div className="text-sm">{align.icon}</div>
                          <div className="text-xs">{align.label}</div>
                        </button>
                      ))}
                    </div>
                  </div>
                  
                  {/* Letter Spacing */}
                  <div>
                    <label className="block text-xs font-medium text-gray-700 mb-1">Espaciado</label>
                    <div className="flex items-center space-x-1">
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
                        className="flex-1 h-1 bg-gray-200 rounded appearance-none cursor-pointer"
                      />
                      <span className="text-xs text-gray-600 min-w-[2rem] text-center">
                        {(selectedObject as fabric.IText).charSpacing || 0}
                      </span>
                    </div>
                  </div>
                  
                  {/* Line Height */}
                  <div>
                    <label className="block text-xs font-medium text-gray-700 mb-1">Altura de Línea</label>
                    <div className="flex items-center space-x-1">
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
                        className="flex-1 h-1 bg-gray-200 rounded appearance-none cursor-pointer"
                      />
                      <span className="text-xs text-gray-600 min-w-[2rem] text-center">
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



        <div className="w-full">
          {/* Canvas */}
          <div className="w-full">
            <div className="bg-white rounded-2xl shadow-lg p-6">
              <div className="mb-4">
                <h3 className="text-lg font-semibold text-gray-900">Canvas</h3>
              </div>
              
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
