import { fabric } from 'fabric';
import { DesignData, ObjectData, SaveOptions } from './types';
import { extractObjectData } from './objectExtractors';

// Build complete design data structure
export const buildDesignData = (
  canvas: fabric.Canvas,
  id: string,
  editorType: string,
  canvasSize: string,
  backgroundColor: string,
  backgroundImage: string | null,
  templateKey: string | null,
  options: SaveOptions = {}
): DesignData => {
  const canvasObjects = canvas.getObjects();
  
  // Extract all object data
  const objects: ObjectData[] = canvasObjects.map(obj => extractObjectData(obj));
  
  // Build metadata
  const metadata = {
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    version: '1.0.0'
  };
  
  return {
    id,
    editorType,
    canvasSize,
    backgroundColor,
    backgroundImage,
    templateKey,
    objects,
    metadata: options.includeMetadata !== false ? metadata : {
      createdAt: '',
      updatedAt: '',
      version: ''
    }
  };
};

// Build minimal design data (without metadata)
export const buildMinimalDesignData = (
  canvas: fabric.Canvas,
  id: string,
  editorType: string,
  canvasSize: string,
  backgroundColor: string,
  backgroundImage: string | null,
  templateKey: string | null
): Omit<DesignData, 'metadata'> => {
  const canvasObjects = canvas.getObjects();
  const objects: ObjectData[] = canvasObjects.map(obj => extractObjectData(obj));
  
  return {
    id,
    editorType,
    canvasSize,
    backgroundColor,
    backgroundImage,
    templateKey,
    objects
  };
};

// Build objects-only data
export const buildObjectsData = (canvas: fabric.Canvas): ObjectData[] => {
  const canvasObjects = canvas.getObjects();
  return canvasObjects.map(obj => extractObjectData(obj));
};

// Build canvas settings data
export const buildCanvasSettingsData = (
  editorType: string,
  canvasSize: string,
  backgroundColor: string,
  backgroundImage: string | null
) => {
  return {
    editorType,
    canvasSize,
    backgroundColor,
    backgroundImage
  };
};
