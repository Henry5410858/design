import { DesignData, ObjectData } from './types';

// Calculate the size of data in bytes
export const getDataSize = (data: any): number => {
  return new Blob([JSON.stringify(data)]).size;
};

// Check if data exceeds size limit
export const exceedsSizeLimit = (data: any, limitBytes: number = 500000): boolean => {
  return getDataSize(data) > limitBytes;
};

// Create minimal object data (only essential properties)
export const createMinimalObjectData = (obj: ObjectData): any => {
  const minimal: any = {
    id: obj.id,
    type: obj.type,
    left: obj.left,
    top: obj.top,
    width: obj.width,
    height: obj.height,
    fill: obj.fill,
    scaleX: obj.scaleX,
    scaleY: obj.scaleY,
    angle: obj.angle,
    opacity: obj.opacity
  };

  // Add type-specific minimal properties
  if (obj.type === 'text' || obj.type === 'i-text') {
    const textObj = obj as any;
    minimal.text = textObj.text || '';
    minimal.fontSize = textObj.fontSize || 48;
    minimal.fontFamily = textObj.fontFamily || 'Arial';
  } else if (obj.type === 'image') {
    const imageObj = obj as any;
    // For images, preserve the actual src to maintain functionality
    minimal.src = imageObj.src || 'placeholder';
    minimal.isImage = true;
  } else if (obj.type === 'line') {
    const lineObj = obj as any;
    minimal.x1 = lineObj.x1 || 0;
    minimal.y1 = lineObj.y1 || 0;
    minimal.x2 = lineObj.x2 || 0;
    minimal.y2 = lineObj.y2 || 0;
  }

  return minimal;
};

// Create ultra-minimal object data (absolute minimum)
export const createUltraMinimalObjectData = (obj: ObjectData): any => {
  const ultraMinimal: any = {
    id: obj.id,
    type: obj.type,
    left: Math.round(obj.left),
    top: Math.round(obj.top),
    width: Math.round(obj.width),
    height: Math.round(obj.height),
    fill: obj.fill
  };

  // Only add absolutely essential type-specific properties
  if (obj.type === 'text' || obj.type === 'i-text') {
    const textObj = obj as any;
    ultraMinimal.text = (textObj.text || '').substring(0, 50); // Limit text length
    ultraMinimal.fontSize = Math.round(textObj.fontSize || 48);
    ultraMinimal.fontFamily = textObj.fontFamily || 'Arial';
  } else if (obj.type === 'image') {
    const imageObj = obj as any;
    // For images, preserve the actual src to maintain functionality
    ultraMinimal.src = imageObj.src || 'placeholder';
    ultraMinimal.isImage = true;
  } else if (obj.type === 'line') {
    const lineObj = obj as any;
    ultraMinimal.x1 = Math.round(lineObj.x1 || 0);
    ultraMinimal.y1 = Math.round(lineObj.y1 || 0);
    ultraMinimal.x2 = Math.round(lineObj.x2 || 0);
    ultraMinimal.y2 = Math.round(lineObj.y2 || 0);
  }

  return ultraMinimal;
};

// Create minimal design data
export const createMinimalDesignData = (designData: DesignData): any => {
  return {
    id: designData.id,
    editorType: designData.editorType,
    canvasSize: designData.canvasSize,
    backgroundColor: designData.backgroundColor,
    backgroundImage: designData.backgroundImage,
    templateKey: designData.templateKey,
    objects: designData.objects.map(obj => createMinimalObjectData(obj)),
    metadata: {
      createdAt: designData.metadata.createdAt,
      updatedAt: designData.metadata.updatedAt,
      version: designData.metadata.version,
      minimal: true
    }
  };
};

// Create ultra-minimal design data (absolute minimum for localStorage)
export const createUltraMinimalDesignData = (designData: DesignData): any => {
  return {
    id: designData.id,
    editorType: designData.editorType,
    canvasSize: designData.canvasSize,
    backgroundColor: designData.backgroundColor,
    backgroundImage: null, // Remove background image to save space
    templateKey: designData.templateKey,
    objects: designData.objects.slice(0, 5).map(obj => createUltraMinimalObjectData(obj)), // Only first 5 objects
    metadata: {
      createdAt: designData.metadata.createdAt,
      updatedAt: designData.metadata.updatedAt,
      version: 'ultra-minimal',
      ultraMinimal: true
    }
  };
};

// Split objects into chunks
export const chunkObjects = (objects: ObjectData[], chunkSize: number = 25): ObjectData[][] => {
  const chunks: ObjectData[][] = [];
  for (let i = 0; i < objects.length; i += chunkSize) {
    chunks.push(objects.slice(i, i + chunkSize));
  }
  return chunks;
};

// Optimize design data for saving
export const optimizeDesignData = (designData: DesignData, maxSizeBytes: number = 500000): {
  optimized: any;
  isMinimal: boolean;
  originalSize: number;
  optimizedSize: number;
} => {
  const originalSize = getDataSize(designData);
  
  // If data is small enough, return as is
  if (originalSize <= maxSizeBytes) {
    return {
      optimized: designData,
      isMinimal: false,
      originalSize,
      optimizedSize: originalSize
    };
  }
  
  // Try with minimal data
  const minimalData = createMinimalDesignData(designData);
  const minimalSize = getDataSize(minimalData);
  
  if (minimalSize <= maxSizeBytes) {
    return {
      optimized: minimalData,
      isMinimal: true,
      originalSize,
      optimizedSize: minimalSize
    };
  }
  
  // Try with ultra-minimal data for very small limits (like localStorage)
  if (maxSizeBytes <= 100000) { // 100KB or less
    const ultraMinimalData = createUltraMinimalDesignData(designData);
    const ultraMinimalSize = getDataSize(ultraMinimalData);
    
    return {
      optimized: ultraMinimalData,
      isMinimal: true,
      originalSize,
      optimizedSize: ultraMinimalSize
    };
  }
  
  // If still too large, reduce objects further
  const ultraMinimalData = {
    ...minimalData,
    objects: minimalData.objects.slice(0, 10) // Keep only first 10 objects
  };
  
  return {
    optimized: ultraMinimalData,
    isMinimal: true,
    originalSize,
    optimizedSize: getDataSize(ultraMinimalData)
  };
};
