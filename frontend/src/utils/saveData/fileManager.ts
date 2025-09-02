import { DesignData, ObjectData, SaveOptions } from './types';
import { getDataSize, exceedsSizeLimit, optimizeDesignData, chunkObjects } from './dataOptimizer';

// Save design data to separate files with automatic optimization
export const saveDesignToFiles = async (
  designData: DesignData,
  options: SaveOptions = {}
): Promise<{ success: boolean; files: string[]; error?: string; optimized?: boolean }> => {
  try {
    const files: string[] = [];
    const timestamp = Date.now();
    const randomSuffix = Math.random().toString(36).substr(2, 9);
    const baseFilename = `design-${timestamp}-${randomSuffix}`;
    
    console.log('📊 Original data size:', getDataSize(designData), 'bytes');
    
    // Optimize data if needed
    const optimization = optimizeDesignData(designData, 500000); // 500KB limit
    const processedData = optimization.optimized;
    
    if (optimization.isMinimal) {
      console.log('🗜️ Data optimized:', {
        originalSize: optimization.originalSize,
        optimizedSize: optimization.optimizedSize,
        reduction: `${Math.round((1 - optimization.optimizedSize / optimization.originalSize) * 100)}%`
      });
    }
    
    // 1. Save main design metadata
    const metadataFile = `${baseFilename}-metadata.json`;
    const metadataData = {
      id: processedData.id,
      editorType: processedData.editorType,
      canvasSize: processedData.canvasSize,
      backgroundColor: processedData.backgroundColor,
      backgroundImage: processedData.backgroundImage,
      templateKey: processedData.templateKey,
      metadata: processedData.metadata,
      objectCount: processedData.objects.length,
      optimized: optimization.isMinimal,
      originalSize: optimization.originalSize
    };
    
    await saveToFile(metadataFile, metadataData);
    files.push(metadataFile);
    
    // 2. Save objects data (with chunking if too large)
    const objectsFile = `${baseFilename}-objects.json`;
    if (exceedsSizeLimit(processedData.objects, 200000)) {
      // Split objects into chunks
      const chunks = chunkObjects(processedData.objects, 25);
      console.log(`📦 Splitting ${processedData.objects.length} objects into ${chunks.length} chunks`);
      
      for (let i = 0; i < chunks.length; i++) {
        const chunkFile = `${baseFilename}-objects-chunk-${i + 1}.json`;
        await saveToFile(chunkFile, chunks[i]);
        files.push(chunkFile);
      }
    } else {
      await saveToFile(objectsFile, processedData.objects);
      files.push(objectsFile);
    }
    
    // 3. Save text objects separately (if any and not too large)
    const textObjects = processedData.objects.filter(obj => obj.type === 'text' || obj.type === 'i-text');
    if (textObjects.length > 0 && !exceedsSizeLimit(textObjects, 100000)) {
      const textFile = `${baseFilename}-text.json`;
      await saveToFile(textFile, textObjects);
      files.push(textFile);
    }
    
    // 4. Save image objects separately (if any and not too large)
    const imageObjects = processedData.objects.filter(obj => obj.type === 'image');
    if (imageObjects.length > 0 && !exceedsSizeLimit(imageObjects, 100000)) {
      const imageFile = `${baseFilename}-images.json`;
      await saveToFile(imageFile, imageObjects);
      files.push(imageFile);
    }
    
    // 5. Save shape objects separately (if any and not too large)
    const shapeObjects = processedData.objects.filter(obj => 
      ['rect', 'circle', 'triangle', 'polygon', 'path'].includes(obj.type)
    );
    if (shapeObjects.length > 0 && !exceedsSizeLimit(shapeObjects, 100000)) {
      const shapeFile = `${baseFilename}-shapes.json`;
      await saveToFile(shapeFile, shapeObjects);
      files.push(shapeFile);
    }
    
    // 6. Save line objects separately (if any and not too large)
    const lineObjects = processedData.objects.filter(obj => obj.type === 'line');
    if (lineObjects.length > 0 && !exceedsSizeLimit(lineObjects, 100000)) {
      const lineFile = `${baseFilename}-lines.json`;
      await saveToFile(lineFile, lineObjects);
      files.push(lineFile);
    }
    
    console.log(`✅ Saved design in ${files.length} files${optimization.isMinimal ? ' (optimized)' : ''}`);
    return { success: true, files, optimized: optimization.isMinimal };
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
