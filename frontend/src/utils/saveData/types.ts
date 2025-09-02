// Types for save data utilities
export interface BaseObjectData {
  id: string;
  type: string;
  left: number;
  top: number;
  width: number;
  height: number;
  fill: string;
  stroke: string;
  scaleX: number;
  scaleY: number;
  angle: number;
  opacity: number;
  strokeWidth: number;
  strokeLineCap: string;
  strokeLineJoin: string;
  shadow: any;
  isBackground: boolean;
}

export interface TextObjectData extends BaseObjectData {
  fontSize: number;
  fontFamily: string;
  fontWeight: string;
  textAlign: string;
  text: string;
}

export interface ImageObjectData extends BaseObjectData {
  src: string;
  crossOrigin?: string;
}

export interface ShapeObjectData extends BaseObjectData {
  rx?: number;
  ry?: number;
  radius?: number;
  points?: number[][];
  path?: string;
}

export interface LineObjectData extends BaseObjectData {
  x1: number;
  y1: number;
  x2: number;
  y2: number;
  strokeDashArray?: number[];
}

export type ObjectData = TextObjectData | ImageObjectData | ShapeObjectData | LineObjectData;

export interface DesignData {
  id: string;
  editorType: string;
  canvasSize: string;
  backgroundColor: string;
  backgroundImage: string | null;
  templateKey: string | null;
  objects: ObjectData[];
  metadata: {
    createdAt: string;
    updatedAt: string;
    version: string;
  };
}

export interface SaveOptions {
  includeMetadata?: boolean;
  compressData?: boolean;
  separateFiles?: boolean;
}
