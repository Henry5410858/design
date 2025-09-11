import API_ENDPOINTS from '../config/api';

export interface TemplateBackground {
  id: string;
  imageData: string;
  imageType: string;
  fileName: string;
  createdAt: string;
}

export interface SaveBackgroundRequest {
  templateId: string;
  userId: string;
  imageData: string;
  imageType: string;
  fileName?: string;
}

/**
 * Save template background to backend
 */
export const saveTemplateBackground = async (data: SaveBackgroundRequest): Promise<{ success: boolean; backgroundId?: string; message?: string }> => {
  try {
    const response = await fetch(API_ENDPOINTS.SAVE_TEMPLATE_BACKGROUND, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(data),
    });

    const result = await response.json();

    if (!response.ok) {
      throw new Error(result.error || 'Failed to save template background');
    }

    return result;
  } catch (error) {
    console.error('Error saving template background:', error);
    return { 
      success: false, 
      message: error instanceof Error ? error.message : 'Failed to save template background' 
    };
  }
};

/**
 * Get template background from backend
 */
export const getTemplateBackground = async (templateId: string, userId: string): Promise<{ success: boolean; background?: TemplateBackground; error?: string }> => {
  try {
    const response = await fetch(API_ENDPOINTS.GET_TEMPLATE_BACKGROUND(templateId, userId), {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    });

    const result = await response.json();

    if (!response.ok) {
      if (response.status === 404) {
        return { success: false, error: 'Background not found' };
      }
      throw new Error(result.error || 'Failed to fetch template background');
    }

    return { success: true, background: result.background };
  } catch (error) {
    console.error('Error fetching template background:', error);
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Failed to fetch template background' 
    };
  }
};

/**
 * Delete template background from backend
 */
export const deleteTemplateBackground = async (templateId: string, userId: string): Promise<{ success: boolean; message?: string }> => {
  try {
    const response = await fetch(API_ENDPOINTS.DELETE_TEMPLATE_BACKGROUND(templateId, userId), {
      method: 'DELETE',
      headers: {
        'Content-Type': 'application/json',
      },
    });

    const result = await response.json();

    if (!response.ok) {
      throw new Error(result.error || 'Failed to delete template background');
    }

    return result;
  } catch (error) {
    console.error('Error deleting template background:', error);
    return { 
      success: false, 
      message: error instanceof Error ? error.message : 'Failed to delete template background' 
    };
  }
};

/**
 * Delete template background by ID from backend
 */
export const deleteTemplateBackgroundById = async (backgroundId: string): Promise<{ success: boolean; message?: string }> => {
  try {
    const response = await fetch(API_ENDPOINTS.DELETE_TEMPLATE_BACKGROUND_BY_ID(backgroundId), {
      method: 'DELETE',
      headers: {
        'Content-Type': 'application/json',
      },
    });

    const result = await response.json();

    if (!response.ok) {
      throw new Error(result.error || 'Failed to delete template background');
    }

    return result;
  } catch (error) {
    console.error('Error deleting template background:', error);
    return { 
      success: false, 
      message: error instanceof Error ? error.message : 'Failed to delete template background' 
    };
  }
};

/**
 * Convert canvas to base64 image data
 */
export const canvasToBase64 = (canvas: HTMLCanvasElement, imageType: string = 'image/png', quality: number = 0.9): string => {
  return canvas.toDataURL(imageType, quality);
};

/**
 * Extract image type from base64 data URL
 */
export const getImageTypeFromDataUrl = (dataUrl: string): string => {
  const match = dataUrl.match(/^data:([^;]+);/);
  return match ? match[1] : 'image/png';
};

/**
 * Extract base64 data from data URL
 */
export const getBase64FromDataUrl = (dataUrl: string): string => {
  return dataUrl.split(',')[1] || dataUrl;
};
