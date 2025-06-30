// src/components/Camera.jsx - Snapshot Mode Alternative
import React, { useRef, useEffect, useState } from 'react';
import ShapeOverlay from './ShapeOverlay';

// Constants
const CANVAS_DIMENSIONS = {
  WIDTH: 800,
  HEIGHT: 600
};

const SECTION_TITLE = 'Camera';
const CAMERA_SNAPSHOT_URL = '/api/camera/snapshot';
const REFRESH_INTERVAL = 200; // Refresh every 200ms

function Camera({ 
  shapes, 
  activeShapeId, 
  isCreatingShape, 
  onCanvasClick, 
  onToggleShapeActive 
}) {
  const canvasRef = useRef(null);
  const imgRef = useRef(null);
  const [streamError, setStreamError] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const intervalRef = useRef(null);

  useEffect(() => {
    startSnapshotLoop();
    
    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, []);

  const startSnapshotLoop = () => {
    // Initial load
    updateSnapshot();
    
    // Set up interval for continuous updates
    intervalRef.current = setInterval(() => {
      updateSnapshot();
    }, REFRESH_INTERVAL);
  };

  const updateSnapshot = async () => {
    if (imgRef.current) {
      const timestamp = Date.now();
      imgRef.current.src = `${CAMERA_SNAPSHOT_URL}?t=${timestamp}`;
    }
  };

  const handleImageLoad = () => {
    setIsLoading(false);
    setStreamError(null);
  };

  const handleImageError = () => {
    console.error('Failed to load camera snapshot');
    setStreamError('Camera connection failed');
  };

  const handleCanvasClick = (event) => {
    if (!isCreatingShape) return;

    const canvas = canvasRef.current;
    const rect = canvas.getBoundingClientRect();
    const x = ((event.clientX - rect.left) / rect.width) * 100;
    const y = ((event.clientY - rect.top) / rect.height) * 100;

    onCanvasClick({ x, y });
  };

  const retryConnection = () => {
    setIsLoading(true);
    setStreamError(null);
    startSnapshotLoop();
  };

  return (
    <>
      <h2 className="font-jacquard-12 text-2xl text-text-gray mb-4">
        {SECTION_TITLE} (Snapshot Mode)
      </h2>
      
      <div className="relative bg-black rounded-lg overflow-hidden">
        <canvas
          ref={canvasRef}
          width={CANVAS_DIMENSIONS.WIDTH}
          height={CANVAS_DIMENSIONS.HEIGHT}
          className="w-full h-auto cursor-crosshair absolute inset-0 z-10"
          onClick={handleCanvasClick}
          style={{ backgroundColor: 'transparent' }}
        />
        
        {isLoading && (
          <div className="absolute inset-0 flex items-center justify-center bg-black text-white">
            <span className="font-jacquard-24">Loading camera...</span>
          </div>
        )}
        
        {streamError && (
          <div className="absolute inset-0 flex flex-col items-center justify-center bg-black text-white">
            <span className="font-jacquard-24 mb-4">{streamError}</span>
            <button
              onClick={retryConnection}
              className="font-jacquard-24 text-blue-400 hover:text-blue-300 underline"
            >
              Retry
            </button>
          </div>
        )}
        
        <img
          ref={imgRef}
          alt="Camera Feed"
          className="w-full h-full object-cover"
          onLoad={handleImageLoad}
          onError={handleImageError}
          style={{ 
            width: '100%', 
            height: '100%',
            objectFit: 'cover'
          }}
        />
        
        <ShapeOverlay
          shapes={shapes}
          onToggleShapeActive={onToggleShapeActive}
        />
      </div>
    </>
  );
}

export default Camera;
