// Constants
const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:5002/api';
const ENDPOINTS = {
  SHAPES: `${API_BASE_URL}/shapes`,
  HEALTH: `${API_BASE_URL}/health`
};

const REQUEST_TIMEOUT = 10000; // 10 seconds
const DEFAULT_HEADERS = {
  'Content-Type': 'application/json'
};

// Helper function to handle fetch with timeout
const fetchWithTimeout = async (url, options = {}) => {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), REQUEST_TIMEOUT);

  try {
    const response = await fetch(url, {
      ...options,
      signal: controller.signal
    });
    clearTimeout(timeoutId);
    return response;
  } catch (error) {
    clearTimeout(timeoutId);
    throw error;
  }
};

// API Functions
export const loadShapes = async () => {
  try {
    const response = await fetchWithTimeout(ENDPOINTS.SHAPES);
    
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    
    const data = await response.json();
    return data;
  } catch (error) {
    console.error('Failed to load shapes:', error);
    throw new Error('Failed to load shapes from server');
  }
};

export const saveShapes = async (shapesData) => {
  try {
    const response = await fetchWithTimeout(ENDPOINTS.SHAPES, {
      method: 'POST',
      headers: DEFAULT_HEADERS,
      body: JSON.stringify(shapesData)
    });
    
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.error || `HTTP error! status: ${response.status}`);
    }
    
    const data = await response.json();
    return data;
  } catch (error) {
    console.error('Failed to save shapes:', error);
    throw new Error('Failed to save shapes to server');
  }
};

export const healthCheck = async () => {
  try {
    const response = await fetchWithTimeout(ENDPOINTS.HEALTH);
    
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    
    const data = await response.json();
    return data;
  } catch (error) {
    console.error('Health check failed:', error);
    throw new Error('Server health check failed');
  }
};

// Utility function to validate shape data before sending
export const validateShapeData = (shapesData) => {
  if (!shapesData || typeof shapesData !== 'object') {
    throw new Error('Invalid shapes data: must be an object');
  }
  
  if (!Array.isArray(shapesData.shapes)) {
    throw new Error('Invalid shapes data: shapes must be an array');
  }
  
  shapesData.shapes.forEach((shape, index) => {
    if (!shape.id || typeof shape.id !== 'string') {
      throw new Error(`Invalid shape at index ${index}: missing or invalid id`);
    }
    
    if (!shape.name || typeof shape.name !== 'string') {
      throw new Error(`Invalid shape at index ${index}: missing or invalid name`);
    }
    
    if (!Array.isArray(shape.points)) {
      throw new Error(`Invalid shape at index ${index}: points must be an array`);
    }
    
    if (typeof shape.active !== 'boolean') {
      throw new Error(`Invalid shape at index ${index}: active must be a boolean`);
    }
    
    shape.points.forEach((point, pointIndex) => {
      if (!point || typeof point !== 'object' || 
          typeof point.x !== 'number' || typeof point.y !== 'number') {
        throw new Error(`Invalid point at shape ${index}, point ${pointIndex}`);
      }
    });
  });
  
  return true;
};
