import React, { useRef, useEffect, useState } from 'react';
import ShapeOverlay from './ShapeOverlay';

// Constants
const SECTION_TITLE = 'Camera';
const CAMERA_SNAPSHOT_URL = '/api/camera/snapshot';
const CAMERA_STATUS_URL = '/api/camera/status';
const REFRESH_INTERVAL = 200; // Refresh every 200ms

function Camera({ 
  shapes, 
  activeShapeId, 
  isCreatingShape, 
  onCanvasClick,
  onShapePointDrag,
  onShapePointClick,
  onToggleShapeActive 
}) {
  const canvasRef = useRef(null);
  const imgRef = useRef(null);
  const containerRef = useRef(null);
  const [streamError, setStreamError] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [cameraDimensions, setCameraDimensions] = useState({ width: 640, height: 480 });
  const intervalRef = useRef(null);

  useEffect(() => {
    getCameraDimensions();
    startSnapshotLoop();
    
    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, []);

  const getCameraDimensions = async () => {
    try {
      const response = await fetch(CAMERA_STATUS_URL);
      const status = await response.json();
      if (status.available) {
        setCameraDimensions({
          width: status.width,
          height: status.height
        });
      }
    } catch (error) {
      console.error('Failed to get camera dimensions:', error);
    }
  };

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
    
    // Update dimensions from the actual loaded image
    if (imgRef.current) {
      setCameraDimensions({
        width: imgRef.current.naturalWidth,
        height: imgRef.current.naturalHeight
      });
    }
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
    getCameraDimensions();
    startSnapshotLoop();
  };

  return (
    <>
      <h2 className="font-jacquard-12 text-2xl text-text-gray mb-4">
        {SECTION_TITLE}
      </h2>
      
      <div 
        ref={containerRef}
        className="relative bg-black rounded-lg overflow-hidden"
        style={{ 
          width: `${cameraDimensions.width}px`, 
          height: `${cameraDimensions.height}px`,
          maxWidth: '100%'
        }}
      >
        <canvas
          ref={canvasRef}
          width={cameraDimensions.width}
          height={cameraDimensions.height}
          className="absolute inset-0 z-10 cursor-crosshair"
          onClick={handleCanvasClick}
          style={{ 
            backgroundColor: 'transparent',
            width: '100%',
            height: '100%'
          }}
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
          className="w-full h-full block"
          onLoad={handleImageLoad}
          onError={handleImageError}
          style={{ 
            width: '100%', 
            height: '100%',
            display: 'block'
          }}
        />
        
        <ShapeOverlay
          shapes={shapes}
          activeShapeId={activeShapeId}
          onToggleShapeActive={onToggleShapeActive}
          onShapePointDrag={onShapePointDrag}
          onShapePointClick={onShapePointClick}
        />
      </div>
    </>
  );
}

export default Camera;
