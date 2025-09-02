// Main export file for save data utilities
export * from './types';
export * from './objectExtractors';
export * from './designBuilder';
export * from './fileManager';

// Convenience functions for common operations
export { buildDesignData, buildMinimalDesignData, buildObjectsData, buildCanvasSettingsData } from './designBuilder';
export { saveDesignToFiles, loadDesignFromFiles, getDesignFiles } from './fileManager';
export { extractObjectData, extractTextObjectData, extractImageObjectData, extractShapeObjectData, extractLineObjectData } from './objectExtractors';
