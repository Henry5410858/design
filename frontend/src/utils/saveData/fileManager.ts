import { DesignData, ObjectData, SaveOptions } from './types';
import { compressDesignData, createMinimalDesignData, exceedsSizeLimit, getDataSize, chunkObjects } from './compression';

// Save design data to separate files
export const saveDesignToFiles = async (
  designData: DesignData,
  options: SaveOptions = {}
): Promise<{ success: boolean; files: string[]; error?: string }> => {
  try {
    const files: string[] = [];
    const timestamp = Date.now();
    const randomSuffix = Math.random().toString(36).substr(2, 9);
    const baseFilename = `design-${timestamp}-${randomSuffix}`;
    
    // 1. Save main design metadata
    const metadataFile = `${baseFilename}-metadata.json`;
    const metadataData = {
      id: designData.id,
      editorType: designData.editorType,
      canvasSize: designData.canvasSize,
      backgroundColor: designData.backgroundColor,
      backgroundImage: designData.backgroundImage,
      templateKey: designData.templateKey,
      metadata: designData.metadata,
      objectCount: designData.objects.length
    };
    
    await saveToFile(metadataFile, metadataData);
    files.push(metadataFile);
    
    // 2. Save objects data
    const objectsFile = `${baseFilename}-objects.json`;
    await saveToFile(objectsFile, designData.objects);
    files.push(objectsFile);
    
    // 3. Save text objects separately (if any)
    const textObjects = designData.objects.filter(obj => obj.type === 'text' || obj.type === 'i-text');
    if (textObjects.length > 0) {
      const textFile = `${baseFilename}-text.json`;
      await saveToFile(textFile, textObjects);
      files.push(textFile);
    }
    
    // 4. Save image objects separately (if any)
    const imageObjects = designData.objects.filter(obj => obj.type === 'image');
    if (imageObjects.length > 0) {
      const imageFile = `${baseFilename}-images.json`;
      await saveToFile(imageFile, imageObjects);
      files.push(imageFile);
    }
    
    // 5. Save shape objects separately (if any)
    const shapeObjects = designData.objects.filter(obj => 
      ['rect', 'circle', 'triangle', 'polygon', 'path'].includes(obj.type)
    );
    if (shapeObjects.length > 0) {
      const shapeFile = `${baseFilename}-shapes.json`;
      await saveToFile(shapeFile, shapeObjects);
      files.push(shapeFile);
    }
    
    // 6. Save line objects separately (if any)
    const lineObjects = designData.objects.filter(obj => obj.type === 'line');
    if (lineObjects.length > 0) {
      const lineFile = `${baseFilename}-lines.json`;
      await saveToFile(lineFile, lineObjects);
      files.push(lineFile);
    }
    
    return { success: true, files };
  } catch (error) {
    console.error('Error saving design to files:', error);
    return { 
      success: false, 
      files: [], 
      error: error instanceof Error ? error.message : 'Unknown error' 
    };
  }
};

// Save data to a specific file
const saveToFile = async (filename: string, data: any): Promise<void> => {
  const response = await fetch('http://localhost:4000/api/templates/save-design', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      designData: data,
      filename: filename
    })
  });
  
  if (!response.ok) {
    throw new Error(`Failed to save file ${filename}: ${response.statusText}`);
  }
  
  const result = await response.json();
  console.log(`✅ Saved ${filename}:`, result);
};

// Load design from separate files
export const loadDesignFromFiles = async (baseFilename: string): Promise<DesignData | null> => {
  try {
    // Load metadata first
    const metadataResponse = await fetch(`http://localhost:4000/api/templates/design/${baseFilename}-metadata.json`);
    if (!metadataResponse.ok) {
      throw new Error('Failed to load metadata file');
    }
    const metadataResult = await metadataResponse.json();
    const metadata = metadataResult.designData;
    
    // Load objects
    const objectsResponse = await fetch(`http://localhost:4000/api/templates/design/${baseFilename}-objects.json`);
    if (!objectsResponse.ok) {
      throw new Error('Failed to load objects file');
    }
    const objectsResult = await objectsResponse.json();
    const objects = objectsResult.designData;
    
    // Reconstruct design data
    const designData: DesignData = {
      id: metadata.id,
      editorType: metadata.editorType,
      canvasSize: metadata.canvasSize,
      backgroundColor: metadata.backgroundColor,
      backgroundImage: metadata.backgroundImage,
      templateKey: metadata.templateKey,
      objects: objects,
      metadata: metadata.metadata
    };
    
    return designData;
  } catch (error) {
    console.error('Error loading design from files:', error);
    return null;
  }
};

// Get file list for a design
export const getDesignFiles = (baseFilename: string): string[] => {
  return [
    `${baseFilename}-metadata.json`,
    `${baseFilename}-objects.json`,
    `${baseFilename}-text.json`,
    `${baseFilename}-images.json`,
    `${baseFilename}-shapes.json`,
    `${baseFilename}-lines.json`
  ];
};
