import * as fabric from 'fabric';
import { BaseObjectData, TextObjectData, ImageObjectData, ShapeObjectData, LineObjectData, ObjectData } from './types';

// Extract base object properties
export const extractBaseObjectData = (obj: fabric.Object): BaseObjectData => {
  return {
    id: `obj_${Date.now()}_${Math.random()}`,
    type: obj.type || 'unknown',
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
};

// Extract text object properties
export const extractTextObjectData = (obj: fabric.IText): TextObjectData => {
  const baseData = extractBaseObjectData(obj);
  return {
    ...baseData,
    fontSize: obj.fontSize || 48,
    fontFamily: obj.fontFamily || 'Arial',
    fontWeight: obj.fontWeight || 'normal',
    textAlign: obj.textAlign || 'left',
    text: obj.text || '',
    opacity: obj.opacity || 1,
    strokeWidth: obj.strokeWidth || 0,
    strokeLineCap: obj.strokeLineCap || 'butt',
    strokeLineJoin: obj.strokeLineJoin || 'miter',
    shadow: obj.shadow || null
  };
};

// Extract image object properties
export const extractImageObjectData = (obj: fabric.Image): ImageObjectData => {
  const baseData = extractBaseObjectData(obj);
  return {
    ...baseData,
    src: obj.getSrc() || '',
    crossOrigin: (obj as any).crossOrigin || undefined
  };
};

// Extract shape object properties
export const extractShapeObjectData = (obj: fabric.Object): ShapeObjectData => {
  const baseData = extractBaseObjectData(obj);
  const shapeData: ShapeObjectData = { ...baseData };
  
  // Add shape-specific properties
  if (obj.type === 'rect') {
    const rect = obj as fabric.Rect;
    shapeData.rx = rect.rx || 0;
    shapeData.ry = rect.ry || 0;
  } else if (obj.type === 'circle') {
    const circle = obj as fabric.Circle;
    shapeData.radius = circle.radius || 0;
  } else if (obj.type === 'polygon') {
    const polygon = obj as fabric.Polygon;
    shapeData.points = polygon.points || [];
  } else if (obj.type === 'path') {
    const path = obj as fabric.Path;
    shapeData.path = path.path || '';
  }
  
  return shapeData;
};

// Extract line object properties
export const extractLineObjectData = (obj: fabric.Line): LineObjectData => {
  const baseData = extractBaseObjectData(obj);
  return {
    ...baseData,
    x1: obj.x1 || 0,
    y1: obj.y1 || 0,
    x2: obj.x2 || 0,
    y2: obj.y2 || 0,
    strokeDashArray: (obj as any).strokeDashArray || undefined
  };
};

// Main extractor function that determines object type and extracts appropriate data
export const extractObjectData = (obj: fabric.Object): ObjectData => {
  switch (obj.type) {
    case 'text':
    case 'i-text':
      return extractTextObjectData(obj as fabric.IText);
    case 'image':
      return extractImageObjectData(obj as fabric.Image);
    case 'line':
      return extractLineObjectData(obj as fabric.Line);
    case 'rect':
    case 'circle':
    case 'triangle':
    case 'polygon':
    case 'path':
      return extractShapeObjectData(obj);
    default:
      return extractBaseObjectData(obj);
  }
};
