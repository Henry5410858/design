import { ObjectData, DesignData } from './types';

// Compress object data by removing unnecessary properties and reducing precision
export const compressObjectData = (obj: ObjectData): ObjectData => {
  const compressed = { ...obj };
  
  // Round numbers to reduce precision and file size
  compressed.left = Math.round(obj.left * 100) / 100;
  compressed.top = Math.round(obj.top * 100) / 100;
  compressed.width = Math.round(obj.width * 100) / 100;
  compressed.height = Math.round(obj.height * 100) / 100;
  compressed.scaleX = Math.round(obj.scaleX * 1000) / 1000;
  compressed.scaleY = Math.round(obj.scaleY * 1000) / 1000;
  compressed.angle = Math.round(obj.angle * 100) / 100;
  compressed.opacity = Math.round(obj.opacity * 1000) / 1000;
  compressed.strokeWidth = Math.round(obj.strokeWidth * 100) / 100;
  
  // Remove default values to reduce size
  if (compressed.fill === '#000000') delete (compressed as any).fill;
  if (compressed.stroke === 'transparent') delete (compressed as any).stroke;
  if (compressed.scaleX === 1) delete (compressed as any).scaleX;
  if (compressed.scaleY === 1) delete (compressed as any).scaleY;
  if (compressed.angle === 0) delete (compressed as any).angle;
  if (compressed.opacity === 1) delete (compressed as any).opacity;
  if (compressed.strokeWidth === 0) delete (compressed as any).strokeWidth;
  if (compressed.strokeLineCap === 'butt') delete (compressed as any).strokeLineCap;
  if (compressed.strokeLineJoin === 'miter') delete (compressed as any).strokeLineJoin;
  if (!compressed.shadow) delete (compressed as any).shadow;
  if (!compressed.isBackground) delete (compressed as any).isBackground;
  
  // Compress text-specific properties
  if ('fontSize' in compressed) {
    if (compressed.fontSize === 48) delete (compressed as any).fontSize;
    if (compressed.fontFamily === 'Arial') delete (compressed as any).fontFamily;
    if (compressed.fontWeight === 'normal') delete (compressed as any).fontWeight;
    if (compressed.textAlign === 'left') delete (compressed as any).textAlign;
    if (!compressed.text || compressed.text.trim() === '') delete (compressed as any).text;
  }
  
  // Compress image-specific properties
  if ('src' in compressed) {
    // Keep only essential image properties
    if (compressed.crossOrigin === 'anonymous') delete (compressed as any).crossOrigin;
  }
  
  // Compress shape-specific properties
  if ('rx' in compressed || 'ry' in compressed || 'radius' in compressed) {
    if (compressed.rx === 0) delete (compressed as any).rx;
    if (compressed.ry === 0) delete (compressed as any).ry;
    if (compressed.radius === 0) delete (compressed as any).radius;
  }
  
  // Compress line-specific properties
  if ('x1' in compressed) {
    if (compressed.x1 === 0) delete (compressed as any).x1;
    if (compressed.y1 === 0) delete (compressed as any).y1;
    if (compressed.x2 === 0) delete (compressed as any).x2;
    if (compressed.y2 === 0) delete (compressed as any).y2;
    if (!compressed.strokeDashArray) delete (compressed as any).strokeDashArray;
  }
  
  return compressed;
};

// Compress design data by removing unnecessary metadata and compressing objects
export const compressDesignData = (designData: DesignData): DesignData => {
  const compressed = { ...designData };
  
  // Compress all objects
  compressed.objects = designData.objects.map(obj => compressObjectData(obj));
  
  // Remove unnecessary metadata
  if (compressed.metadata) {
    delete (compressed.metadata as any).createdAt;
    delete (compressed.metadata as any).updatedAt;
    if (compressed.metadata.version === '1.0.0') {
      delete (compressed.metadata as any).version;
    }
  }
  
  // Remove default values
  if (compressed.backgroundColor === '#ffffff') delete (compressed as any).backgroundColor;
  if (!compressed.backgroundImage) delete (compressed as any).backgroundImage;
  if (!compressed.templateKey) delete (compressed as any).templateKey;
  
  return compressed;
};

// Get compressed data size estimate
export const getDataSize = (data: any): number => {
  return JSON.stringify(data).length;
};

// Check if data exceeds size limit
export const exceedsSizeLimit = (data: any, limit: number = 1000000): boolean => {
  return getDataSize(data) > limit;
};

// Split large objects array into chunks
export const chunkObjects = (objects: ObjectData[], chunkSize: number = 50): ObjectData[][] => {
  const chunks: ObjectData[][] = [];
  for (let i = 0; i < objects.length; i += chunkSize) {
    chunks.push(objects.slice(i, i + chunkSize));
  }
  return chunks;
};

// Create minimal design data for saving
export const createMinimalDesignData = (designData: DesignData): any => {
  return {
    id: designData.id,
    editorType: designData.editorType,
    canvasSize: designData.canvasSize,
    backgroundColor: designData.backgroundColor,
    backgroundImage: designData.backgroundImage,
    templateKey: designData.templateKey,
    objectCount: designData.objects.length,
    // Only include essential object data
    objects: designData.objects.map(obj => ({
      id: obj.id,
      type: obj.type,
      left: Math.round(obj.left),
      top: Math.round(obj.top),
      width: Math.round(obj.width),
      height: Math.round(obj.height),
      // Only include non-default values
      ...(obj.fill !== '#000000' && { fill: obj.fill }),
      ...(obj.stroke !== 'transparent' && { stroke: obj.stroke }),
      ...(obj.scaleX !== 1 && { scaleX: Math.round(obj.scaleX * 100) / 100 }),
      ...(obj.scaleY !== 1 && { scaleY: Math.round(obj.scaleY * 100) / 100 }),
      ...(obj.angle !== 0 && { angle: Math.round(obj.angle) }),
      ...(obj.opacity !== 1 && { opacity: Math.round(obj.opacity * 100) / 100 }),
      // Type-specific minimal data
      ...(obj.type === 'text' || obj.type === 'i-text' ? {
        fontSize: (obj as any).fontSize,
        fontFamily: (obj as any).fontFamily,
        text: (obj as any).text
      } : {}),
      ...(obj.type === 'image' ? {
        src: (obj as any).src
      } : {}),
      ...(obj.type === 'line' ? {
        x1: (obj as any).x1,
        y1: (obj as any).y1,
        x2: (obj as any).x2,
        y2: (obj as any).y2
      } : {})
    }))
  };
};
