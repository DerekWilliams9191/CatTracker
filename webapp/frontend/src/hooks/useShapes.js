import { useState, useEffect } from 'react';
import { loadShapes } from '../utils/api';

// Constants
const DEFAULT_SHAPE_NAME = 'Shape';
const FILE_DOWNLOAD_NAME = 'motion_shapes.json';

export function useShapes() {
  const [shapes, setShapes] = useState([]);
  const [activeShapeId, setActiveShapeId] = useState(null);
  const [isCreatingShape, setIsCreatingShape] = useState(false);

  // Load shapes on mount
  useEffect(() => {
    const initializeShapes = async () => {
      try {
        const data = await loadShapes();
        setShapes(data.shapes || []);
      } catch (error) {
        console.error('Failed to load shapes:', error);
      }
    };

    initializeShapes();
  }, []);

  const addNewShape = () => {
    const newShape = {
      id: `shape_${Date.now()}`,
      name: `${DEFAULT_SHAPE_NAME} ${shapes.length + 1}`,
      points: [],
      active: true
    };
    
    setShapes(prev => [...prev.map(s => ({ ...s, active: false })), newShape]);
    setActiveShapeId(newShape.id);
    setIsCreatingShape(true);
  };

  const toggleShapeActive = (shapeId) => {
    setShapes(prev => prev.map(shape => ({
      ...shape,
      active: shape.id === shapeId
    })));
    setActiveShapeId(shapeId);
    setIsCreatingShape(false);
  };

  const deleteShape = (shapeId) => {
    setShapes(prev => prev.filter(shape => shape.id !== shapeId));
    if (activeShapeId === shapeId) {
      setActiveShapeId(null);
      setIsCreatingShape(false);
    }
  };

  const renameShape = (shapeId, newName) => {
    setShapes(prev => prev.map(shape => 
      shape.id === shapeId 
        ? { ...shape, name: newName }
        : shape
    ));
  };

  const handleCanvasClick = (point) => {
    if (!activeShapeId) return;

    setShapes(prev => prev.map(shape => 
      shape.id === activeShapeId 
        ? { ...shape, points: [...shape.points, point] }
        : shape
    ));
  };

  const downloadShapes = () => {
    const dataStr = JSON.stringify({ shapes }, null, 2);
    const dataBlob = new Blob([dataStr], { type: 'application/json' });
    const url = URL.createObjectURL(dataBlob);
    const link = document.createElement('a');
    link.href = url;
    link.download = FILE_DOWNLOAD_NAME;
    link.click();
    URL.revokeObjectURL(url);
  };

  const uploadShapes = (file) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const data = JSON.parse(e.target.result);
        if (data.shapes && Array.isArray(data.shapes)) {
          setShapes(data.shapes);
          setActiveShapeId(null);
          setIsCreatingShape(false);
        } else {
          throw new Error('Invalid file format');
        }
      } catch (error) {
        console.error('Failed to parse uploaded file:', error);
        alert('Failed to parse uploaded file. Please ensure it\'s a valid JSON file.');
      }
    };
    reader.readAsText(file);
  };

  return {
    shapes,
    activeShapeId,
    isCreatingShape,
    addNewShape,
    toggleShapeActive,
    deleteShape,
    renameShape,
    handleCanvasClick,
    downloadShapes,
    uploadShapes
  };
}
