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
        if (data.shapes && data.shapes.length > 0) {
          setShapes(data.shapes);
          // Set the first active shape as active, or find an existing active shape
          const activeShape = data.shapes.find(s => s.active);
          if (activeShape) {
            setActiveShapeId(activeShape.id);
          }
        }
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
    
    // Deactivate all other shapes
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
    
    // If we're switching to a shape that already has points, we can continue adding to it
    const targetShape = shapes.find(s => s.id === shapeId);
    if (targetShape) {
      setIsCreatingShape(true); // Always allow adding more points
    }
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
    if (!activeShapeId || !isCreatingShape) return;

    setShapes(prev => prev.map(shape => 
      shape.id === activeShapeId 
        ? { ...shape, points: [...shape.points, point] }
        : shape
    ));
  };

  const handleShapePointDrag = (shapeId, pointIndex, newPosition) => {
    setShapes(prev => prev.map(shape => {
      if (shape.id !== shapeId) return shape;
      
      const newPoints = [...shape.points];
      newPoints[pointIndex] = newPosition;
      return { ...shape, points: newPoints };
    }));
  };

  const handleShapePointClick = (shapeId, pointIndex) => {
    setShapes(prev => prev.map(shape => {
      if (shape.id !== shapeId) return shape;
      
      const newPoints = shape.points.filter((_, index) => index !== pointIndex);
      return { ...shape, points: newPoints };
    }));
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
          
          // Find active shape or set first shape as active
          const activeShape = data.shapes.find(s => s.active);
          if (activeShape) {
            setActiveShapeId(activeShape.id);
            setIsCreatingShape(true);
          } else if (data.shapes.length > 0) {
            const firstShape = data.shapes[0];
            setShapes(prev => prev.map(s => ({
              ...s,
              active: s.id === firstShape.id
            })));
            setActiveShapeId(firstShape.id);
            setIsCreatingShape(true);
          } else {
            setActiveShapeId(null);
            setIsCreatingShape(false);
          }
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
    handleShapePointDrag,
    handleShapePointClick,
    downloadShapes,
    uploadShapes
  };
}
