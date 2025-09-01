'use client'
import { useEffect, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import jsPDF from 'jspdf';
import { getTokenFromStorage } from '../../context/UserContext';

// CSS for smooth animations
const animationStyles = `
  @keyframes fadeInScale {
    from {
      opacity: 0;
      transform: scale(0.8) translate3d(0, 0, 0);
    }
    to {
      opacity: 1;
      transform: scale(1) translate3d(0, 0, 0);
    }
  }
  
  @keyframes slideIn {
    from {
      opacity: 0;
      transform: translateY(20px) translate3d(0, 0, 0);
    }
    to {
      opacity: 1;
      transform: translateY(0) translate3d(0, 0, 0);
    }
  }
`;

// Inject styles
if (typeof document !== 'undefined') {
  const styleSheet = document.createElement('style');
  styleSheet.textContent = animationStyles;
  document.head.appendChild(styleSheet);
}

// Types
interface Template {
  _id: string;  // MongoDB uses _id, not id
  name: string;
  type: string;
  thumbnail: string;
  fileUrl?: string;
  objects?: CanvasObject[];
  backgroundColor?: string;
}

type CanvasObject = {
  id: string;
  type: 'text' | 'image' | 'rect';
  x: number;
  y: number;
  width: number;
  height: number;
  text?: string;
  font?: string;
  color?: string;
  src?: string;
  placeholder?: string;
  originalAspectRatio?: number;
  imageFilter?: string; // Color filter for images
};

// Native Canvas thumbnail generation - manually draws all elements without html2canvas
function generateNativeThumbnail(canvas: HTMLElement, width: number, height: number, objects: CanvasObject[], backgroundColor: string): Promise<Blob> {
  return new Promise((resolve, reject) => {
    try {
      console.log('🎨 Generating thumbnail using native Canvas API...');
      
      // Create a new canvas element for the thumbnail
      const thumbnailCanvas = document.createElement('canvas');
      thumbnailCanvas.width = width;
      thumbnailCanvas.height = height;
      const ctx = thumbnailCanvas.getContext('2d');
      
      if (!ctx) {
        reject(new Error('Could not get canvas context'));
        return;
      }
      
      // Set background color from template
      ctx.fillStyle = backgroundColor;
      ctx.fillRect(0, 0, width, height);
      
      // Get all template objects
      const textObjects = canvas.querySelectorAll('[data-object-type="text"]');
      const rectObjects = canvas.querySelectorAll('[data-object-type="rect"]');
      const imageObjects = canvas.querySelectorAll('[data-object-type="image"]');
      
      console.log(`🎨 Found ${textObjects.length} text objects, ${rectObjects.length} rect objects, ${imageObjects.length} image objects`);
      
      // Draw text objects with their actual colors
      textObjects.forEach((el, idx) => {
        const element = el as HTMLElement;
        const rect = element.getBoundingClientRect();
        const canvasRect = canvas.getBoundingClientRect();
        
        // Calculate position relative to canvas
        const x = rect.left - canvasRect.left;
        const y = rect.top - canvasRect.top;
        const w = rect.width;
        const h = rect.height;
        
        // Get text content
        const text = element.textContent || 'Edit me';
        
        // Find the corresponding object to get the actual color
        const objectId = element.getAttribute('data-object-id');
        const templateObject = objects.find(obj => obj.id === objectId);
        const textColor = templateObject?.color || '#222222'; // Use actual color or fallback
        
        console.log(`🎨 Text object ${idx} color: ${textColor}`);
        
        // Set text style with actual color
        ctx.fillStyle = textColor;
        ctx.font = '16px Arial';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        
        // Draw text
        ctx.fillText(text, x + w/2, y + h/2);
        
        console.log(`🎨 Drew text "${text}" at (${x}, ${y}) with color ${textColor}`);
      });
      
      // Draw rectangle objects with their actual colors
      rectObjects.forEach((el, idx) => {
        const element = el as HTMLElement;
        const rect = element.getBoundingClientRect();
        const canvasRect = canvas.getBoundingClientRect();
        
        // Calculate position relative to canvas
        const x = rect.left - canvasRect.left;
        const y = rect.top - canvasRect.top;
        const w = rect.width;
        const h = rect.height;
        
        // Find the corresponding object to get the actual color
        const objectId = element.getAttribute('data-object-id');
        const templateObject = objects.find(obj => obj.id === objectId);
        const rectColor = templateObject?.color || '#10B981'; // Use actual color or fallback
        
        console.log(`🎨 Rect object ${idx} color: ${rectColor}`);
        
        // Set fill style with actual color
        ctx.fillStyle = rectColor;
        
        // Draw rectangle
        ctx.fillRect(x, y, w, h);
        
        console.log(`🎨 Drew rectangle at (${x}, ${y}) with size ${w}x${h} and color ${rectColor}`);
      });
      
      // Draw image objects
      imageObjects.forEach((el, idx) => {
        const element = el as HTMLElement;
        const rect = element.getBoundingClientRect();
        const canvasRect = canvas.getBoundingClientRect();
        
        // Calculate position relative to canvas
        const x = rect.left - canvasRect.left;
        const y = rect.top - canvasRect.top;
        const w = rect.width;
        const h = rect.height;
        
        // Get image source
        const imgElement = element.querySelector('img');
        if (imgElement && imgElement.src) {
          const img = new Image();
          img.crossOrigin = 'anonymous';
          
          img.onload = () => {
            // Draw image
            ctx.drawImage(img, x, y, w, h);
            console.log(`🎨 Drew image at (${x}, ${y}) with size ${w}x${h}`);
            
            // Convert to blob
            thumbnailCanvas.toBlob((blob) => {
              if (blob) {
                resolve(blob);
              } else {
                reject(new Error('Failed to create blob from canvas'));
              }
            }, 'image/png', 1.0);
          };
          
          img.onerror = () => {
            console.warn(`🎨 Failed to load image, drawing placeholder rectangle`);
            // Draw placeholder rectangle if image fails to load
            ctx.fillStyle = '#e5e7eb';
            ctx.fillRect(x, y, w, h);
            ctx.strokeStyle = '#9ca3af';
            ctx.lineWidth = 2;
            ctx.strokeRect(x, y, w, h);
            
            // Convert to blob
            thumbnailCanvas.toBlob((blob) => {
              if (blob) {
                resolve(blob);
              } else {
                reject(new Error('Failed to create blob from canvas'));
              }
            }, 'image/png', 1.0);
          };
          
          img.src = imgElement.src;
        } else {
          // Draw placeholder if no image
          ctx.fillStyle = '#e5e7eb';
          ctx.fillRect(x, y, w, h);
          ctx.strokeStyle = '#9ca3af';
          ctx.lineWidth = 2;
          ctx.strokeRect(x, y, w, h);
          
          console.log(`🎨 Drew image placeholder at (${x}, ${y}) with size ${w}x${h}`);
        }
      });
      
      // If no images, convert to blob immediately
      if (imageObjects.length === 0) {
        thumbnailCanvas.toBlob((blob) => {
          if (blob) {
            resolve(blob);
          } else {
            reject(new Error('Failed to create blob from canvas'));
          }
        }, 'image/png', 1.0);
      }
      
    } catch (error) {
      reject(error);
    }
  });
}

export default function TemplateEditor({ id }: { id: string }) {
  const [template, setTemplate] = useState<Template | null>(null);
  const [objects, setObjects] = useState<CanvasObject[]>([]);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [editingTextId, setEditingTextId] = useState<string | null>(null);
  const [backgroundColor, setBackgroundColor] = useState('#ffffff');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [canvasSize, setCanvasSize] = useState('800x600'); // Default size
  const fileInputRef = useRef<HTMLInputElement>(null);
  const router = useRouter();
  const [showDownloadDropdown, setShowDownloadDropdown] = useState(false);
  const [brandKit, setBrandKit] = useState<{
    logo?: string;
    colors?: {
      primary?: string;
      secondary?: string;
      accent?: string;
    };
  } | null>(null);
  const [contextMenu, setContextMenu] = useState<{
    visible: boolean;
    x: number;
    y: number;
    targetId: string;
  } | null>(null);
  const token = getTokenFromStorage();

  // Get canvas dimensions based on selected size
  const getCanvasDimensions = () => {
    switch (canvasSize) {
      case 'b5':
        return { width: 176 * 2.83465, height: 250 * 2.83465 }; // Convert mm to px (1mm = 2.83465px)
      case 'a4':
        return { width: 210 * 2.83465, height: 297 * 2.83465 }; // A4 in px
      case 'letter':
        return { width: 216 * 2.83465, height: 279 * 2.83465 }; // US Letter in px
      case '800x600':
      default:
        return { width: 800, height: 600 };
    }
  };

  // Fetch template details
  useEffect(() => {
    console.log('🔍 TemplateEditor: Fetching template with ID:', id);
    
    if (!id || id === 'undefined' || id === 'null') {
      console.error('❌ TemplateEditor: Invalid ID received:', id);
      setLoading(false);
      return;
    }
    
    fetch(`http://localhost:4000/api/templates/${id}`)
      .then(res => {
        if (!res.ok) {
          throw new Error(`HTTP error! status: ${res.status}`);
        }
        return res.json();
      })
      .then(data => {
        console.log('✅ TemplateEditor: Template data received:', data);
        setTemplate(data);
        setObjects(data.objects || []);
        setBackgroundColor(data.backgroundColor || '#ffffff');
        setLoading(false);
      })
      .catch(error => {
        console.error('❌ TemplateEditor: Error fetching template:', error);
        setLoading(false);
        // You could set an error state here to show a user-friendly message
      });
  }, [id]);

  // Fetch brand kit
  useEffect(() => {
    fetch('http://localhost:4000/api/brand-kit', {
      headers: { 'Authorization': `Bearer ${token}` }
    })
      .then(res => res.json())
      .then(data => setBrandKit(data));
  }, [token]);

  // Apply brand kit to template objects
  useEffect(() => {
    if (!brandKit || !template) return;
    setObjects(objs => objs.map(obj => {
      // Replace logo images
      if (obj.type === 'image' && brandKit.logo && obj.src && (obj.src.toLowerCase().includes('logo') || obj.src.toLowerCase().includes('placeholder'))) {
        return { ...obj, src: brandKit.logo };
      }
      // Replace colors
      if ((obj.type === 'text' || obj.type === 'rect') && brandKit.colors) {
        let newColor = obj.color;
        if (obj.color === '#1D4ED8') newColor = brandKit.colors.primary;
        if (obj.color === '#F59E0B') newColor = brandKit.colors.secondary;
        if (obj.color === '#10B981') newColor = brandKit.colors.accent;
        return { ...obj, color: newColor };
      }
      return obj;
    }));
    // Only update background color if brandKit.colors.primary is set and template/backgroundColor is not set
    // Comment out or remove the following if you want to always default to white
    // if (brandKit.colors && (backgroundColor === '#ffffff' || backgroundColor === '#FFFFFF')) {
    //   setBackgroundColor(expandHex(brandKit.colors.primary));
    // }
  }, [brandKit, template]);

  // Add text object with smooth animation
  const addText = () => {
    const newTextId = Math.random().toString(36).slice(2);
    const newText = {
      id: newTextId,
      type: 'text' as const,
      x: 100,
      y: 100,
      width: 200,
      height: 40,
      text: '',
      font: 'Arial',
      color: '#222',
      placeholder: 'Edit me',
    };
    
    setObjects(objs => [...objs, newText]);
    
    // Auto-select the new text object
    setTimeout(() => {
      setSelectedId(newTextId);
      setEditingTextId(newTextId);
    }, 100);
  };

  // Add image object
  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const formData = new FormData();
      formData.append('image', e.target.files[0]);
      const token = getTokenFromStorage();
      const res = await fetch('http://localhost:4000/api/brand-kit/uploads', {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}` },
        body: formData,
      });
      const data = await res.json();
      console.log('Upload response:', data); // Debug log
      
      if (data.url) {
        // Get the actual image dimensions
        const img = new Image();
        img.onload = () => {
          console.log('Image loaded:', img.width, 'x', img.height); // Debug log
          
          // Calculate dimensions to fit within reasonable bounds while maintaining aspect ratio
          const maxWidth = 400;  // Maximum width for initial display
          const maxHeight = 300; // Maximum height for initial display
          
          let { width, height } = img;
          
          // Scale down if image is too large, maintaining aspect ratio
          if (width > maxWidth || height > maxHeight) {
            const scale = Math.min(maxWidth / width, maxHeight / height);
            width = width * scale;
            height = height * scale;
          }
          
          // Ensure minimum dimensions
          width = Math.max(width, 100);
          height = Math.max(height, 100);
          
          const newImageObject: CanvasObject = {
            id: Math.random().toString(36).slice(2),
            type: 'image',
            x: 120,
            y: 120,
            width: Math.round(width),
            height: Math.round(height),
            src: data.url,
            originalAspectRatio: width / height, // Store original aspect ratio
          };
          
          console.log('Adding image object:', newImageObject); // Debug log
          
          setObjects(objs => {
            const newObjs = [...objs, newImageObject];
            console.log('Updated objects array:', newObjs); // Debug log
            return newObjs;
          });
        };
        
        img.onerror = (error) => {
          console.error('Image failed to load:', error); // Debug log
        };
        
        img.src = data.url.startsWith('/uploads/') ? 'http://localhost:4000' + data.url : data.url;
      } else {
        console.error('No URL in upload response:', data); // Debug log
      }
    }
  };

  // Add shape with smooth animation
  const addRect = () => {
    const newShapeId = Math.random().toString(36).slice(2);
    const newShape = {
      id: newShapeId,
      type: 'rect' as const,
      x: 150,
      y: 150,
      width: 100,
      height: 60,
      color: '#10B981',
    };
    
    setObjects(objs => [...objs, newShape]);
    
    // Auto-select the new shape
    setTimeout(() => {
      setSelectedId(newShapeId);
    }, 100);
  };

  // Change background color
  const handleBgColor = (e: React.ChangeEvent<HTMLInputElement>) => {
    setBackgroundColor(e.target.value);
  };

  // Select object
  const selectObject = (id: string) => setSelectedId(id);

  // Move/resize object
  const handleDrag = (idx: number, dx: number, dy: number) => {
    setObjects(objs => objs.map((obj, i) => i === idx ? { ...obj, x: obj.x + dx, y: obj.y + dy } : obj));
  };

  // Change font
  const changeFont = (font: string) => {
    if (!selectedId) return;
    setObjects(objs => objs.map(obj => obj.id === selectedId ? { ...obj, font } : obj));
  };

  // Change text color
  const changeTextColor = (color: string) => {
    if (!selectedId) return;
    setObjects(objs => objs.map(obj => obj.id === selectedId ? { ...obj, color } : obj));
  };

  // Duplicate template
  const duplicateTemplate = async () => {
    const res = await fetch(`http://localhost:4000/api/templates/${id}/duplicate`, { method: 'POST' });
    const data = await res.json();
    router.push(`/editor/${data.id}`);
  };

  // Download as PNG
  const downloadPNG = async () => {
    if (!canvasRef.current) return;
    
    // Wait a bit for content to fully render
    await new Promise(resolve => setTimeout(resolve, 100));
    
    const canvas = canvasRef.current;
    
    // Preload all images to ensure they're rendered
    const imagePromises = objects
      .filter(obj => obj.type === 'image' && obj.src)
      .map(obj => {
        return new Promise((resolve) => {
          const img = new Image();
          img.crossOrigin = 'anonymous';
          img.onload = () => resolve(true);
          img.onerror = () => resolve(false);
          img.src = obj.src!.startsWith('/uploads/') ? 'http://localhost:4000' + obj.src : obj.src!;
        });
      });
    
    // Wait for all images to load
    await Promise.all(imagePromises);
    
    // Wait a bit more for final rendering
    await new Promise(resolve => setTimeout(resolve, 200));
    
    // Ensure all images have proper dimensions for export
    const imageElements = canvas.querySelectorAll('img');
    imageElements.forEach(img => {
      if (img.style.objectFit !== 'fill') {
        img.style.objectFit = 'fill';
      }
      if (img.style.display !== 'block') {
        img.style.display = 'block';
      }
    });
    
    try {
      // Use current paper size dimensions for export (not canvas dimensions)
      let exportWidth, exportHeight;
      
      switch (canvasSize) {
        case 'b5':
          exportWidth = 176 * 2.83465;  // B5 width in px (1mm = 2.83465px)
          exportHeight = 250 * 2.83465; // B5 height in px
          break;
        case 'a4':
          exportWidth = 210 * 2.83465;  // A4 width in px
          exportHeight = 297 * 2.83465; // A4 height in px
          break;
        case 'letter':
          exportWidth = 216 * 2.83465;  // US Letter width in px
          exportHeight = 279 * 2.83465; // US Letter height in px
          break;
        case '800x600':
        default:
          exportWidth = 800;
          exportHeight = 600;
          break;
      }
      
      // Generate PNG using native Canvas API with paper size dimensions
      const pngBlob = await generateNativeThumbnail(canvas, exportWidth, exportHeight, objects, backgroundColor);
      
      // Create download link
      const url = URL.createObjectURL(pngBlob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `${template?.name || 'template'}-${canvasSize.toUpperCase()}.png`;
      link.click();
      
      // Clean up
      URL.revokeObjectURL(url);
      setShowDownloadDropdown(false);
      
      console.log(`✅ PNG saved with ${canvasSize.toUpperCase()} dimensions: ${exportWidth.toFixed(0)} × ${exportHeight.toFixed(0)} px`);
    } catch (error) {
      console.error('Export failed:', error);
      alert('Export failed. Please try again.');
    }
  };

  // Download as PDF
  const downloadPDF = async () => {
    if (!canvasRef.current) return;
    
    // Wait a bit for content to fully render
    await new Promise(resolve => setTimeout(resolve, 100));
    
    const canvas = canvasRef.current;
    
    // Preload all images to ensure they're rendered
    const imagePromises = objects
      .filter(obj => obj.type === 'image' && obj.src)
      .map(obj => {
        return new Promise((resolve) => {
          const img = new Image();
          img.crossOrigin = 'anonymous';
          img.onload = () => resolve(true);
          img.onerror = () => resolve(false);
          img.src = obj.src!.startsWith('/uploads/') ? 'http://localhost:4000' + obj.src : obj.src!;
        });
      });
    
    // Wait for all images to load
    await Promise.all(imagePromises);
    
    // Wait for final rendering
    await new Promise(resolve => setTimeout(resolve, 200));
    
    // Ensure all images have proper dimensions for export
    const imageElements = canvas.querySelectorAll('img');
    imageElements.forEach(img => {
      if (img.style.objectFit !== 'fill') {
        img.style.objectFit = 'fill';
      }
      if (img.style.display !== 'block') {
        img.style.display = 'block';
      }
    });
    
    try {
      // Use current paper size dimensions for export (not canvas dimensions)
      let exportWidth, exportHeight;
      
      switch (canvasSize) {
        case 'b5':
          exportWidth = 176 * 2.83465;  // B5 width in px (1mm = 2.83465px)
          exportHeight = 250 * 2.83465; // B5 height in px
          break;
        case 'a4':
          exportWidth = 210 * 2.83465;  // A4 width in px
          exportHeight = 297 * 2.83465; // A4 height in px
          break;
        case 'letter':
          exportWidth = 216 * 2.83465;  // US Letter width in px
          exportHeight = 279 * 2.83465; // US Letter height in px
          break;
        case '800x600':
        default:
          exportWidth = 800;
          exportHeight = 600;
          break;
      }
      
      // Generate PNG using native Canvas API with paper size dimensions
      const pngBlob = await generateNativeThumbnail(canvas, exportWidth, exportHeight, objects, backgroundColor);
      
      // Convert blob to data URL for jsPDF
      const dataUrl = await new Promise<string>((resolve) => {
        const reader = new FileReader();
        reader.onload = () => resolve(reader.result as string);
        reader.readAsDataURL(pngBlob);
      });
      
      // Get PDF dimensions based on selected size
      let pdfWidth, pdfHeight, pdfUnit, pdfFormat;
      
      switch (canvasSize) {
        case 'b5':
          pdfWidth = 176;  // B5 width in mm
          pdfHeight = 250; // B5 height in mm
          pdfUnit = 'mm';
          pdfFormat = [pdfWidth, pdfHeight];
          break;
        case 'a4':
          pdfWidth = 210;  // A4 width in mm
          pdfHeight = 297; // A4 height in mm
          pdfUnit = 'mm';
          pdfFormat = [pdfWidth, pdfHeight];
          break;
        case 'letter':
          pdfWidth = 216;  // US Letter width in mm
          pdfHeight = 279; // US Letter height in mm
          pdfUnit = 'mm';
          pdfFormat = [pdfWidth, pdfHeight];
          break;
        case '800x600':
        default:
          pdfWidth = exportWidth;
          pdfHeight = exportHeight;
          pdfUnit = 'px';
          pdfFormat = [pdfWidth, pdfHeight];
          break;
      }
      
      // Create PDF with selected dimensions
      const pdf = new jsPDF({ 
        orientation: 'portrait' as const, 
        unit: pdfUnit as any, 
        format: pdfFormat
      });
      
      if (canvasSize === '800x600') {
        // For custom size, use exact dimensions
        pdf.addImage(dataUrl, 'PNG', 0, 0, pdfWidth, pdfHeight);
      } else {
        // For paper sizes, maintain aspect ratio and center
        const designAspectRatio = exportWidth / exportHeight;
        const pdfAspectRatio = pdfWidth / pdfHeight;
        
        let scaledWidth, scaledHeight, offsetX, offsetY;
        
        if (designAspectRatio > pdfAspectRatio) {
          // Design is wider than paper, fit to width
          scaledWidth = pdfWidth - 20; // Leave 10mm margin on each side
          scaledHeight = scaledWidth / designAspectRatio;
          offsetX = 10; // Center horizontally
          offsetY = (pdfHeight - scaledHeight) / 2; // Center vertically
        } else {
          // Design is taller than paper, fit to height
          scaledHeight = pdfHeight - 20; // Leave 10mm margin on each side
          scaledWidth = scaledHeight * designAspectRatio;
          offsetX = (pdfWidth - scaledWidth) / 2; // Center horizontally
          offsetY = 10; // Center vertically
        }
        
        console.log(`📄 ${canvasSize.toUpperCase()} PDF: Design scaled to ${scaledWidth.toFixed(1)}${pdfUnit} × ${scaledHeight.toFixed(1)}${pdfUnit}`);
        console.log(`📄 ${canvasSize.toUpperCase()} PDF: Positioned at (${offsetX.toFixed(1)}, ${offsetY.toFixed(1)})`);
        
        // Add image to PDF maintaining aspect ratio and centering on page
        pdf.addImage(dataUrl, 'PNG', offsetX, offsetY, scaledWidth, scaledHeight);
        
        // Add size indicator
        pdf.setFontSize(8);
        pdf.setTextColor(128, 128, 128);
        pdf.text(`${canvasSize.toUpperCase()} Size (${pdfWidth}${pdfUnit} × ${pdfHeight}${pdfUnit})`, pdfWidth - 35, pdfHeight - 5);
      }
      
      pdf.save(`${template?.name || 'template'}-${canvasSize.toUpperCase()}.pdf`);
      setShowDownloadDropdown(false);
      
      console.log(`✅ PDF saved with ${canvasSize.toUpperCase()} dimensions and maintained aspect ratio`);
    } catch (error) {
      console.error('Export failed:', error);
      alert('Export failed. Please try again.');
    }
  };

  // Bring object to front
  const bringToFront = (objectId: string) => {
    setObjects(objs => {
      const newObjects = [...objs];
      const targetIndex = newObjects.findIndex(obj => obj.id === objectId);
      if (targetIndex !== -1) {
        const [targetObject] = newObjects.splice(targetIndex, 1);
        newObjects.push(targetObject); // Move to end (top layer)
      }
      return newObjects;
    });
    setContextMenu(null);
  };

  // Bring object to back
  const bringToBack = (objectId: string) => {
    setObjects(objs => {
      const newObjects = [...objs];
      const targetIndex = newObjects.findIndex(obj => obj.id === objectId);
      if (targetIndex !== -1) {
        const [targetObject] = newObjects.splice(targetIndex, 1);
        newObjects.unshift(targetObject); // Move to beginning (bottom layer)
      }
      return newObjects;
    });
    setContextMenu(null);
  };

  // Save template
  const saveTemplate = async () => {
    if (saving) return; // Prevent multiple saves
    
    setSaving(true);
    try {
      console.log('Saving template with data:', { objects, backgroundColor });
      
      // First save the template data
      const response = await fetch(`http://localhost:4000/api/templates/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          objects: objects,
          backgroundColor: backgroundColor 
        }),
      });
      
      if (response.ok) {
        const result = await response.json();
        console.log('Template saved successfully:', result);
        
        // Now generate the thumbnail using the exact same method as PNG download
        try {
          if (canvasRef.current) {
            console.log('Generating thumbnail...');
            
            // Wait a bit for content to fully render (same as PNG download)
            await new Promise(resolve => setTimeout(resolve, 100));
            
            const canvas = canvasRef.current;
            
            // Preload all images to ensure they're rendered (same as PNG download)
            const imagePromises = objects
              .filter(obj => obj.type === 'image' && obj.src)
              .map(obj => {
                return new Promise((resolve) => {
                  const img = new Image();
                  img.crossOrigin = 'anonymous';
                  img.onload = () => resolve(true);
                  img.onerror = () => resolve(false);
                  img.src = obj.src!.startsWith('/uploads/') ? 'http://localhost:4000' + obj.src : obj.src!;
                });
              });
            
            // Wait for all images to load (same as PNG download)
            await Promise.all(imagePromises);
            
            // Wait for final rendering (same as PNG download)
            await new Promise(resolve => setTimeout(resolve, 200));
            
            // Ensure all images have proper dimensions for export (same as PNG download)
            const imageElements = canvas.querySelectorAll('img');
            imageElements.forEach(img => {
              if (img.style.objectFit !== 'fill') {
                img.style.objectFit = 'fill';
              }
              if (img.style.display !== 'block') {
                img.style.display = 'block';
              }
            });
            
            // Use current paper size dimensions for export
            let exportWidth, exportHeight;
            
            switch (canvasSize) {
              case 'b5':
                exportWidth = 176 * 2.83465;  // B5 width in px (1mm = 2.83465px)
                exportHeight = 250 * 2.83465; // B5 height in px
                break;
              case 'a4':
                exportWidth = 210 * 2.83465;  // A4 width in px
                exportHeight = 297 * 2.83465; // A4 height in px
                break;
              case 'letter':
                exportWidth = 216 * 2.83465;  // US Letter width in px
                exportHeight = 279 * 2.83465; // US Letter height in px
                break;
              case '800x600':
              default:
                exportWidth = 800;
                exportHeight = 600;
                break;
            }
            
            console.log('Generating thumbnail with paper size dimensions:', exportWidth, 'x', exportHeight);
            
            // Debug: Log current editor state
            console.log('Current editor state:', {
              backgroundColor,
              objectsCount: objects.length,
              objects: objects.map(obj => ({
                id: obj.id,
                type: obj.type,
                color: obj.color,
                text: obj.text,
                position: { x: obj.x, y: obj.y },
                size: { width: obj.width, height: obj.height }
              }))
            });
            
            try {
              // Generate thumbnail using native Canvas API with paper size dimensions
              const thumbnailBlob = await generateNativeThumbnail(canvas, exportWidth, exportHeight, objects, backgroundColor);
              
              console.log('Thumbnail blob generated, size:', thumbnailBlob.size);
              
              // Create FormData and upload the thumbnail
              const formData = new FormData();
              formData.append('thumbnail', thumbnailBlob, 'thumbnail.png');
              
              const thumbnailResponse = await fetch(`http://localhost:4000/api/templates/${id}/thumbnail`, {
                method: 'POST',
                body: formData,
              });
              
              if (thumbnailResponse.ok) {
                const thumbnailResult = await thumbnailResponse.json();
                console.log('Thumbnail generated and uploaded successfully:', thumbnailResult);
                // Update the template with new thumbnail
                setTemplate(prev => prev ? { ...prev, thumbnail: thumbnailResult.thumbnail } : null);
              } else {
                console.error('Failed to upload thumbnail:', thumbnailResponse.status);
                const errorText = await thumbnailResponse.text();
                console.error('Thumbnail upload error details:', errorText);
              }
            } catch (thumbnailError) {
              console.error('Error generating thumbnail:', thumbnailError);
              // Don't fail the save if thumbnail generation fails
            }
          }
        } catch (thumbnailError) {
          console.error('Error generating thumbnail:', thumbnailError);
          // Don't fail the save if thumbnail generation fails
        }
        
        alert('Template saved successfully!');
      } else {
        console.error('Failed to save template:', response.status);
        const errorText = await response.text();
        console.error('Template save error details:', errorText);
        alert('Failed to save template. Please try again.');
      }
    } catch (error) {
      console.error('Error saving template:', error);
      alert('Error saving template. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  // Change image color/filter
  const changeImageColor = (color: string) => {
    if (!selectedId) return;
    setObjects(objs => objs.map(obj => obj.id === selectedId ? { ...obj, imageFilter: color } : obj));
  };

  // Apply image color filter to CSS
  const getImageFilterStyle = (obj: CanvasObject) => {
    if (obj.type === 'image' && obj.imageFilter) {
      // Convert hex color to CSS filter
      const hex = obj.imageFilter.replace('#', '');
      const r = parseInt(hex.substr(0, 2), 16);
      const g = parseInt(hex.substr(2, 2), 16);
      const b = parseInt(hex.substr(4, 2), 16);
      
      // Create a color matrix filter
      const brightness = 0.3; // Adjust brightness for better color application
      return {
        filter: `brightness(${brightness}) sepia(1) hue-rotate(${Math.atan2(Math.sqrt(3) * (g - b), 2 * r - g - b) * 180 / Math.PI}deg) saturate(2)`,
        mixBlendMode: 'multiply' as const
      };
    }
    return {};
  };

  // Canvas ref
  const canvasRef = useRef<HTMLDivElement>(null);

  // Render objects with manual drag and resize handle
  const renderObject = (obj: CanvasObject, idx: number) => {
    const isSelected = obj.id === selectedId;
    const style = {
      position: 'absolute' as const,
      left: obj.x,
      top: obj.y,
      width: obj.width,
      height: obj.height,
      border: isSelected ? '3px solid #3b82f6' : '2px solid transparent',
      borderRadius: obj.type === 'rect' ? '8px' : '4px',
      zIndex: isSelected ? 10 : 1,
      background: obj.type === 'rect' ? obj.color : undefined,
      color: obj.type === 'text' ? obj.color : undefined,
      fontFamily: obj.type === 'text' ? obj.font : undefined,
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      userSelect: 'none' as const,
      cursor: 'move',
      boxShadow: isSelected ? '0 10px 25px rgba(59, 130, 246, 0.3)' : '0 2px 8px rgba(0, 0, 0, 0.1)',
      transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
      transform: 'translate3d(0, 0, 0)', // Enable hardware acceleration
      animation: 'fadeInScale 0.4s ease-out', // Smooth entrance animation
    };
    // Smooth drag logic with performance optimization
    const onMouseDown = (e: React.MouseEvent<HTMLDivElement>) => {
      if (!isSelected) return;
      // Don't allow dragging if text is being edited
      if (obj.type === 'text' && editingTextId === obj.id) return;
      e.stopPropagation();
      
      // Calculate offset between mouse and object top-left
      const rect = (e.target as HTMLDivElement).getBoundingClientRect();
      const offsetX = e.clientX - rect.left;
      const offsetY = e.clientY - rect.top;
      
      // Add dragging class for visual feedback
      const element = e.currentTarget as HTMLElement;
      element.style.transition = 'none'; // Disable transition during drag for smooth movement
      element.style.zIndex = '1000'; // Bring to front during drag
      
      let isDragging = true;
      const lastX = e.clientX;
      const lastY = e.clientY;
      
      const onMouseMove = (moveEvent: MouseEvent) => {
        if (!isDragging) return;
        
        // Use requestAnimationFrame for smooth 60fps updates
        requestAnimationFrame(() => {
          const parentRect = (canvasRef.current as HTMLDivElement).getBoundingClientRect();
          const newX = moveEvent.clientX - parentRect.left - offsetX;
          const newY = moveEvent.clientY - parentRect.top - offsetY;
          
          // Allow dragging outside canvas boundaries with constraints
          // Only require a small portion (20px) of the component to remain visible
          const minVisibleWidth = Math.min(20, obj.width);
          const minVisibleHeight = Math.min(20, obj.height);
          
          // Constrain X position - at least minVisibleWidth pixels must remain visible
          let constrainedX = newX;
          if (newX > parentRect.width - minVisibleWidth) {
            constrainedX = parentRect.width - minVisibleWidth;
          }
          if (newX < -(obj.width - minVisibleWidth)) {
            constrainedX = -(obj.width - minVisibleWidth);
          }
          
          // Constrain Y position - at least minVisibleHeight pixels must remain visible
          let constrainedY = newY;
          if (newY > parentRect.height - minVisibleHeight) {
            constrainedY = parentRect.height - minVisibleHeight;
          }
          if (newY < -(obj.height - minVisibleHeight)) {
            constrainedY = -(obj.height - minVisibleHeight);
          }
          
          // Update object position smoothly
          setObjects(objs => objs.map((o, i) => i === idx ? { ...o, x: constrainedX, y: constrainedY } : o));
        });
      };
      
      const onMouseUp = () => {
        isDragging = false;
        
        // Re-enable smooth transitions after drag
        element.style.transition = 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)';
        element.style.zIndex = '10';
        
        window.removeEventListener('mousemove', onMouseMove);
        window.removeEventListener('mouseup', onMouseUp);
      };
      
      window.addEventListener('mousemove', onMouseMove);
      window.addEventListener('mouseup', onMouseUp, { once: true });
    };
    // Smooth resize handle logic with performance optimization
    const handleResizeMouseDown = (e: React.MouseEvent<HTMLDivElement>) => {
      e.stopPropagation();
      const startX = e.clientX;
      const startY = e.clientY;
      const startWidth = obj.width;
      const startHeight = obj.height;
      const startAspectRatio = startWidth / startHeight;
      
      // Disable transitions during resize for smooth movement
      const element = e.currentTarget.parentElement as HTMLElement;
      if (element) {
        element.style.transition = 'none';
      }
      
      let isResizing = true;
      
      const onMouseMove = (moveEvent: MouseEvent) => {
        if (!isResizing) return;
        
        // Use requestAnimationFrame for smooth 60fps updates
        requestAnimationFrame(() => {
          const dx = moveEvent.clientX - startX;
          const dy = moveEvent.clientY - startY;
          
          let newWidth = Math.max(20, startWidth + dx);
          let newHeight = Math.max(20, startHeight + dy);
          
          // If Shift key is pressed, maintain original aspect ratio (for images) or current aspect ratio
          if (moveEvent.shiftKey) {
            let targetAspectRatio = startAspectRatio;
            
            // For images, use the original aspect ratio if available
            if (obj.type === 'image' && obj.originalAspectRatio) {
              targetAspectRatio = obj.originalAspectRatio;
            }
            
            // Calculate which dimension changed more and apply to both
            const widthChange = Math.abs(dx);
            const heightChange = Math.abs(dy);
            
            if (widthChange > heightChange) {
              // Width changed more, adjust height proportionally
              newHeight = newWidth / targetAspectRatio;
            } else {
              // Height changed more, adjust width proportionally
              newWidth = newHeight * targetAspectRatio;
            }
            
            // Ensure minimum dimensions
            newWidth = Math.max(20, newWidth);
            newHeight = Math.max(20, newHeight);
          }
          
          setObjects(objs => objs.map((o, i) => i === idx ? {
            ...o,
            width: newWidth,
            height: newHeight,
          } : o));
        });
      };
      
      const onMouseUp = () => {
        isResizing = false;
        
        // Re-enable smooth transitions after resize
        if (element) {
          element.style.transition = 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)';
        }
        
        window.removeEventListener('mousemove', onMouseMove);
        window.removeEventListener('mouseup', onMouseUp);
      };
      
      window.addEventListener('mousemove', onMouseMove);
      window.addEventListener('mouseup', onMouseUp);
    };
    return (
      <div
        key={obj.id}
        data-object-id={obj.id}
        data-object-type={obj.type}
        style={style}
        onClick={e => { e.stopPropagation(); selectObject(obj.id); }}
        onDoubleClick={e => { e.stopPropagation(); if (obj.type === 'text') setEditingTextId(obj.id); }}
        onContextMenu={e => {
          e.preventDefault();
          e.stopPropagation();
          selectObject(obj.id);
          setContextMenu({
            visible: true,
            x: e.clientX,
            y: e.clientY,
            targetId: obj.id
          });
        }}
        onMouseDown={onMouseDown}
      >
        {obj.type === 'text' && editingTextId === obj.id ? (
          <textarea
            value={obj.text}
            placeholder="Edit me"
            style={{
              width: '100%',
              height: '100%',
              fontFamily: obj.font,
              color: obj.color,
              fontSize: 16,
              border: 'none',
              background: 'transparent',
              outline: 'none',
              textAlign: 'center',
              resize: 'none',
            }}
            onChange={e => {
              const newText = e.target.value;
              setObjects(objs => objs.map((o, i) => i === idx ? { ...o, text: newText } : o));
            }}
            onBlur={() => setEditingTextId(null)}
            onDoubleClick={e => e.stopPropagation()}
          />
        ) : obj.type === 'text' ? (
          obj.text ? <span>{obj.text}</span> : <span style={{ opacity: 0.5 }}>Double-click to edit</span>
        ) : null}
        {obj.type === 'image' && obj.src && (
          <div className="relative w-full h-full">
            <img
              src={obj.src.startsWith('/uploads/') ? 'http://localhost:4000' + obj.src : obj.src}
              alt=""
              style={{ 
                width: '100%', 
                height: '100%', 
                objectFit: 'fill', 
                visibility: 'visible', 
                userSelect: 'none' as const,
                display: 'block',
                ...getImageFilterStyle(obj) // Apply filter style
              }}
              draggable={false}
              onContextMenu={e => e.preventDefault()}
              onError={e => { (e.target as HTMLImageElement).src = 'http://localhost:4000/uploads/default-flyer-thumb.png'; }}
              crossOrigin="anonymous"
            />
            
            {/* Color Filter Indicator */}
            {obj.imageFilter && (
              <div className="absolute top-2 left-2 w-4 h-4 rounded-full border-2 border-white shadow-lg" 
                   style={{ backgroundColor: obj.imageFilter }}
                   title={`Color filter: ${obj.imageFilter}`}
              />
            )}
          </div>
        )}
        {obj.type === 'rect' && null}
        {/* Bottom-right resize handle */}
        {isSelected && (
          <div
            style={{
              position: 'absolute',
              right: -8,
              bottom: -8,
              width: 16,
              height: 16,
              background: 'linear-gradient(135deg, #3b82f6, #1d4ed8)',
              borderRadius: '50%',
              cursor: 'nwse-resize',
              zIndex: 20,
              border: '2px solid white',
              boxShadow: '0 4px 12px rgba(59, 130, 246, 0.4)',
              transition: 'all 0.2s ease-in-out',
            }}
            onMouseDown={handleResizeMouseDown}
            className="hover:scale-110"
          />
        )}
        {/* Modern delete handle in top-right corner */}
        {isSelected && (
          <div
            style={{
              position: 'absolute',
              top: -12,
              right: -12,
              width: 24,
              height: 24,
              background: 'linear-gradient(135deg, #ef4444, #dc2626)',
              color: 'white',
              borderRadius: '50%',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              cursor: 'pointer',
              zIndex: 30,
              fontWeight: 'bold',
              fontSize: 14,
              border: '2px solid white',
              boxShadow: '0 4px 12px rgba(239, 68, 68, 0.4)',
              transition: 'all 0.2s ease-in-out',
            }}
            onClick={e => {
              e.stopPropagation();
              setObjects(objs => objs.filter(o => o.id !== obj.id));
              setSelectedId(null);
            }}
            className="hover:scale-110"
          >
            ×
          </div>
        )}
      </div>
    );
  };

  // Dropdown close on outside click
  useEffect(() => {
    if (!showDownloadDropdown) return;
    const handleClick = (e: MouseEvent) => {
      setShowDownloadDropdown(false);
    };
    document.addEventListener('click', handleClick);
    return () => document.removeEventListener('click', handleClick);
  }, [showDownloadDropdown]);

  // Context menu close on outside click
  useEffect(() => {
    if (!contextMenu) return;
    const handleClick = (e: MouseEvent) => {
      setContextMenu(null);
    };
    document.addEventListener('click', handleClick);
    return () => document.removeEventListener('click', handleClick);
  }, [contextMenu]);

  if (loading) return <div>Loading...</div>;

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-[#41015F] to-gray-900 p-6">
      {/* Header */}
      <div className="max-w-7xl mx-auto mb-8">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-6">
            {/* Professional Back Button */}
            <button
              onClick={() => router.push('/templates')}
              className="group relative px-6 py-3 bg-gray-800/80 backdrop-blur-sm border border-[#31dFC5]/30 hover:border-[#31dFC5]/50 text-white rounded-xl font-medium transition-all duration-300 hover:shadow-lg hover:shadow-[#31dFC5]/20 hover:-translate-y-0.5 flex items-center gap-3"
            >
              {/* Animated Arrow Icon */}
              <div className="relative">
                <svg 
                  className="w-5 h-5 text-[#31dFC5] group-hover:text-[#01AAC7] transition-colors duration-300 transform group-hover:-translate-x-1" 
                  fill="none" 
                  stroke="currentColor" 
                  viewBox="0 0 24 24"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                </svg>
              </div>
              
              {/* Button Text */}
              <span className="text-white group-hover:text-[#31dFC5] font-semibold">
                Back to Gallery
              </span>
              
              {/* Subtle Background Glow on Hover */}
              <div className="absolute inset-0 bg-gradient-to-r from-[#31dFC5]/20 to-[#01AAC7]/20 rounded-xl opacity-0 group-hover:opacity-100 transition-opacity duration-300 -z-10"></div>
            </button>
            
            {/* Divider */}
            <div className="w-px h-8 bg-gradient-to-b from-transparent via-gray-300 to-transparent"></div>
            
            {/* Title Section */}
            <div>
              <h1 className="text-3xl font-bold text-white mb-2">Design Editor</h1>
              <p className="text-gray-300">Create beautiful designs with our intuitive editor</p>
            </div>
          </div>
          
          <div className="flex items-center gap-3">
            <button 
              className="px-6 py-3 bg-gradient-to-r from-[#01AAC7] to-[#31dFC5] text-white rounded-xl font-semibold shadow-lg hover:shadow-xl transform hover:scale-105 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
              onClick={saveTemplate}
              disabled={saving}
            >
              {saving ? '💾 Saving...' : '💾 Save Design'}
            </button>
          </div>
        </div>
      </div>

      {/* Main Editor Container */}
      <div className="max-w-7xl mx-auto">
        {/* Toolbar */}
        <div className="bg-gray-800/80 backdrop-blur-sm rounded-2xl shadow-2xl p-6 mb-6 border border-[#31dFC5]/30">
          <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
            🎨 Design Tools
          </h3>
          <div className="flex flex-wrap gap-3">
            <button 
              className="px-4 py-3 bg-gradient-to-r from-[#01AAC7] to-[#31dFC5] text-white rounded-xl font-medium shadow-md hover:shadow-lg transform hover:scale-105 transition-all duration-200 flex items-center gap-2"
              onClick={addText}
            >
              ✏️ Add Text
            </button>
            <button 
              className="px-4 py-3 bg-gradient-to-r from-[#31dFC5] to-[#01AAC7] text-white rounded-xl font-medium shadow-md hover:shadow-lg transform hover:scale-105 transition-all duration-200 flex items-center gap-2"
              onClick={addRect}
            >
              🔲 Add Shape
            </button>
            <label className="px-4 py-3 bg-gradient-to-r from-[#41015F] to-[#31dFC5] text-white rounded-xl font-medium shadow-md hover:shadow-lg transform hover:scale-105 transition-all duration-200 flex items-center gap-2 cursor-pointer">
              🖼️ Upload Image
              <input type="file" accept="image/*" className="hidden" ref={fileInputRef} onChange={handleImageUpload} />
            </label>
            
            <div className="flex items-center gap-2 px-4 py-3 bg-gray-700/50 rounded-xl border border-[#31dFC5]/30">
              <span className="text-sm font-medium text-white">Background:</span>
              <input 
                type="color" 
                value={backgroundColor} 
                onChange={handleBgColor} 
                title="Background Color"
                className="w-8 h-8 rounded-lg border-2 border-[#31dFC5] cursor-pointer"
              />
            </div>

            <select 
              onChange={e => changeFont(e.target.value)} 
              disabled={!selectedId} 
              className="px-4 py-3 bg-gray-700/50 border-2 border-[#31dFC5]/30 rounded-xl font-medium text-white hover:border-[#31dFC5] focus:border-[#31dFC5] focus:outline-none transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <option value="Arial">Arial</option>
              <option value="Inter">Inter</option>
              <option value="Roboto">Roboto</option>
              <option value="Montserrat">Montserrat</option>
              <option value="Lato">Lato</option>
            </select>

            <div className="flex items-center gap-2 px-4 py-3 bg-gray-700/50 rounded-xl border border-[#31dFC5]/30">
              <span className="text-sm font-medium text-white">Text Color:</span>
              <input 
                type="color" 
                onChange={e => changeTextColor(e.target.value)} 
                disabled={!selectedId}
                title="Text Color"
                className="w-8 h-8 rounded-lg border-2 border-[#31dFC5] cursor-pointer disabled:opacity-50"
              />
            </div>

            {/* Image Color Filter - Only show when image is selected */}
            {selectedId && objects.find(obj => obj.id === selectedId)?.type === 'image' && (
              <div className="flex items-center gap-2 px-4 py-3 bg-gray-700/50 rounded-xl border border-[#31dFC5]/30">
                <span className="text-sm font-medium text-white">Image Color:</span>
                <input 
                  type="color" 
                  onChange={e => changeImageColor(e.target.value)} 
                  title="Image Color Filter"
                  className="w-8 h-8 rounded-lg border-2 border-[#31dFC5] cursor-pointer"
                />
                <button
                  onClick={() => changeImageColor('')}
                  className="px-2 py-1 text-xs bg-[#31dFC5]/20 text-[#31dFC5] rounded hover:bg-[#31dFC5]/30 transition-colors border border-[#31dFC5]/30"
                  title="Remove color filter"
                >
                  Reset
                </button>
              </div>
            )}

            {selectedId && (
              <button
                className="px-4 py-3 bg-gradient-to-r from-red-600 to-red-700 text-white rounded-xl font-medium shadow-md hover:shadow-lg transform hover:scale-105 transition-all duration-200 flex items-center gap-2"
                onClick={() => {
                  setObjects(objs => objs.filter(obj => obj.id !== selectedId));
                  setSelectedId(null);
                }}
              >
                🗑️ Delete
              </button>
            )}
          </div>
        </div>

        {/* Action Buttons */}
        <div className="bg-gray-800/80 backdrop-blur-sm rounded-2xl shadow-2xl p-6 mb-6 border border-[#31dFC5]/30">
          <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
            ⚡ Actions
          </h3>
          <div className="flex flex-wrap gap-3">
            <button 
              className="px-4 py-3 bg-gradient-to-r from-[#41015F] to-[#31dFC5] text-white rounded-xl font-medium shadow-md hover:shadow-lg transform hover:scale-105 transition-all duration-200 flex items-center gap-2"
              onClick={duplicateTemplate}
            >
              📋 Duplicate
            </button>
            
            <div className="relative">
              <button
                className="px-4 py-3 bg-gradient-to-r from-[#01AAC7] to-[#31dFC5] text-white rounded-xl font-medium shadow-md hover:shadow-lg transform hover:scale-105 transition-all duration-200 flex items-center gap-2"
                onClick={e => { e.stopPropagation(); setShowDownloadDropdown(v => !v); }}
                type="button"
              >
                📥 Download
              </button>
              {showDownloadDropdown && (
                <div className="absolute left-0 mt-2 w-48 bg-gray-800/90 backdrop-blur-sm border border-[#31dFC5]/30 rounded-xl shadow-xl z-10 overflow-hidden" onClick={e => e.stopPropagation()}>
                  <button className="block w-full text-left px-4 py-3 hover:bg-[#31dFC5]/20 text-white hover:text-[#31dFC5] transition-colors flex items-center gap-2" onClick={downloadPNG}>
                    🖼️ Download as PNG
                  </button>
                  <button className="block w-full text-left px-4 py-3 hover:bg-[#31dFC5]/20 text-white hover:text-[#31dFC5] transition-colors flex items-center gap-2" onClick={downloadPDF}>
                    📄 Download as PDF
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Canvas */}
        <div className="bg-gray-800/80 backdrop-blur-sm rounded-2xl shadow-2xl p-6 border border-[#31dFC5]/30">
          <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
            🎨 Canvas
          </h3>
          
          {/* Canvas Size Selector */}
          <div className="mb-4 flex items-center gap-3">
            <span className="text-sm font-medium text-white">Paper Size:</span>
            <select 
              value={canvasSize} 
              onChange={(e) => setCanvasSize(e.target.value)}
              className="px-3 py-2 bg-gray-700/50 border-2 border-[#31dFC5]/30 rounded-lg font-medium text-white hover:border-[#31dFC5] focus:border-[#31dFC5] focus:outline-none transition-colors"
            >
              <option value="800x600">Custom (800×600)</option>
              <option value="b5">B5 (176×250 mm)</option>
              <option value="a4">A4 (210×297 mm)</option>
              <option value="letter">US Letter (8.5×11 in)</option>
            </select>
            <span className="text-sm text-gray-400">
              {getCanvasDimensions().width.toFixed(0)} × {getCanvasDimensions().height.toFixed(0)} px
            </span>
          </div>
          
          <div className="flex justify-center">
            <div className="relative border-2 border-[#31dFC5]/50 rounded-xl shadow-lg overflow-visible bg-gradient-to-br from-gray-800/50 to-gray-700/50">
              <div
                ref={canvasRef}
                className="relative"
                style={{ 
                  width: getCanvasDimensions().width, 
                  height: getCanvasDimensions().height, 
                  background: backgroundColor,
                  overflow: 'visible' // Allow components to extend beyond canvas
                }}
                onClick={() => setSelectedId(null)}
              >
                {/* Canvas grid overlay for better positioning */}
                <div className="absolute inset-0 opacity-20 pointer-events-none">
                  <div className="w-full h-full" style={{
                    backgroundImage: `
                      linear-gradient(rgba(0,0,0,0.1) 1px, transparent 1px),
                      linear-gradient(90deg, rgba(0,0,0,0.1) 1px, transparent 1px)
                    `,
                    backgroundSize: '20px 20px'
                  }} />
                </div>
                
                {objects.map((obj, idx) => renderObject(obj, idx))}
                
                {/* Empty state message */}
                {objects.length === 0 && (
                  <div className="absolute inset-0 flex items-center justify-center text-gray-400">
                    <div className="text-center">
                      <div className="text-6xl mb-4">🎨</div>
                      <p className="text-lg font-medium text-white">Start creating your design!</p>
                      <p className="text-sm text-gray-300">Use the tools above to add text, shapes, and images</p>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Modern Context Menu */}
      {contextMenu && (
        <div
          className="fixed bg-gray-800/90 backdrop-blur-sm border border-[#31dFC5]/30 rounded-2xl shadow-2xl z-50 py-2 overflow-hidden"
          style={{
            left: contextMenu.x,
            top: contextMenu.y,
            minWidth: '180px'
          }}
        >
          <button
            className="block w-full text-left px-6 py-3 hover:bg-gradient-to-r hover:from-[#31dFC5]/20 hover:to-[#01AAC7]/20 text-white hover:text-[#31dFC5] transition-all duration-200 flex items-center gap-3 text-sm font-medium"
            onClick={() => bringToFront(contextMenu.targetId)}
          >
            <span className="text-lg">⬆️</span>
            Bring to Front
          </button>
          <button
            className="block w-full text-left px-6 py-3 hover:bg-gradient-to-r hover:from-[#31dFC5]/20 hover:to-[#01AAC7]/20 text-white hover:text-[#31dFC5] transition-all duration-200 flex items-center gap-3 text-sm font-medium"
            onClick={() => bringToBack(contextMenu.targetId)}
          >
            <span className="text-lg">⬇️</span>
            Bring to Back
          </button>
        </div>
      )}
    </div>
  );
}
