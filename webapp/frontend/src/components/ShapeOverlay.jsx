import React, { useRef, useState } from 'react';

// Constants
const COLORS = {
  ACTIVE_BLUE: '#3B82F6',
  INACTIVE_GRAY: '#9CA3AF',
  WHITE: '#FFFFFF'
};

const SHAPE_STYLES = {
  FILL_OPACITY: '0.5',
  STROKE_WIDTH: '2',
  POINT_RADIUS: '3', // Smaller point size
  DRAG_THRESHOLD: 5 // Pixels to drag before moving vs removing
};

const MIN_POINTS_FOR_SHAPE = 3;

function ShapeOverlay({ 
  shapes, 
  activeShapeId,
  onToggleShapeActive, 
  onShapePointDrag, 
  onShapePointClick 
}) {
  const [dragState, setDragState] = useState({
    isDragging: false,
    shapeId: null,
    pointIndex: null,
    startPos: null,
    hasMoved: false
  });
  const svgRef = useRef(null);

  const getPointPosition = (event) => {
    if (!svgRef.current) return null;
    
    const svg = svgRef.current;
    const rect = svg.getBoundingClientRect();
    const x = ((event.clientX - rect.left) / rect.width) * 100;
    const y = ((event.clientY - rect.top) / rect.height) * 100;
    
    return { x, y };
  };

  const handleShapeClick = (event, shapeId) => {
    event.stopPropagation();
    onToggleShapeActive(shapeId);
  };

  const handlePointMouseDown = (event, shapeId, pointIndex) => {
    event.stopPropagation();
    
    const pos = getPointPosition(event);
    if (!pos) return;
    
    setDragState({
      isDragging: true,
      shapeId,
      pointIndex,
      startPos: pos,
      hasMoved: false
    });
  };

  const handleMouseMove = (event) => {
    if (!dragState.isDragging) return;
    
    const currentPos = getPointPosition(event);
    if (!currentPos || !dragState.startPos) return;
    
    const deltaX = Math.abs(currentPos.x - dragState.startPos.x);
    const deltaY = Math.abs(currentPos.y - dragState.startPos.y);
    const distance = Math.sqrt(deltaX * deltaX + deltaY * deltaY);
    
    // Convert SVG coordinates to pixel distance for threshold check
    const svgRect = svgRef.current.getBoundingClientRect();
    const pixelDistance = distance * Math.min(svgRect.width, svgRect.height) / 100;
    
    if (pixelDistance > SHAPE_STYLES.DRAG_THRESHOLD) {
      setDragState(prev => ({ ...prev, hasMoved: true }));
      
      // Call drag handler to move the point
      if (onShapePointDrag) {
        onShapePointDrag(dragState.shapeId, dragState.pointIndex, currentPos);
      }
    }
  };

  const handleMouseUp = (event) => {
    if (!dragState.isDragging) return;
    
    // If we haven't moved beyond threshold, treat as a click (remove point)
    if (!dragState.hasMoved && onShapePointClick) {
      onShapePointClick(dragState.shapeId, dragState.pointIndex);
    }
    
    setDragState({
      isDragging: false,
      shapeId: null,
      pointIndex: null,
      startPos: null,
      hasMoved: false
    });
  };

  const renderShape = (shape) => {
    if (shape.points.length < MIN_POINTS_FOR_SHAPE) return null;

    const pathData = shape.points.reduce((path, point, index) => {
      const command = index === 0 ? 'M' : 'L';
      return `${path} ${command} ${point.x} ${point.y}`;
    }, '') + ' Z';

    const isActive = shape.id === activeShapeId;
    const fillColor = isActive ? COLORS.ACTIVE_BLUE : COLORS.INACTIVE_GRAY;
    const strokeColor = isActive ? COLORS.ACTIVE_BLUE : COLORS.INACTIVE_GRAY;

    return (
      <g key={shape.id}>
        <path
          d={pathData}
          fill={fillColor}
          fillOpacity={SHAPE_STYLES.FILL_OPACITY}
          stroke={strokeColor}
          strokeWidth={SHAPE_STYLES.STROKE_WIDTH}
          onClick={(e) => handleShapeClick(e, shape.id)}
          className="cursor-pointer"
        />
        {isActive && shape.points.map((point, index) => (
          <circle
            key={`${shape.id}-point-${index}`}
            cx={point.x}
            cy={point.y}
            r={SHAPE_STYLES.POINT_RADIUS}
            fill={COLORS.WHITE}
            stroke={COLORS.ACTIVE_BLUE}
            strokeWidth={SHAPE_STYLES.STROKE_WIDTH}
            className="cursor-pointer"
            onMouseDown={(e) => handlePointMouseDown(e, shape.id, index)}
          />
        ))}
      </g>
    );
  };

  // Render incomplete shapes (less than 3 points) for the active shape
  const renderIncompleteShape = (shape) => {
    if (shape.points.length === 0) return null;
    
    return (
      <g key={`${shape.id}-incomplete`}>
        {/* Draw lines between points */}
        {shape.points.length > 1 && (
          <polyline
            points={shape.points.map(p => `${p.x},${p.y}`).join(' ')}
            fill="none"
            stroke={COLORS.ACTIVE_BLUE}
            strokeWidth={SHAPE_STYLES.STROKE_WIDTH}
            strokeDasharray="5,5"
          />
        )}
        
        {/* Draw points */}
        {shape.points.map((point, index) => (
          <circle
            key={`${shape.id}-incomplete-point-${index}`}
            cx={point.x}
            cy={point.y}
            r={SHAPE_STYLES.POINT_RADIUS}
            fill={COLORS.WHITE}
            stroke={COLORS.ACTIVE_BLUE}
            strokeWidth={SHAPE_STYLES.STROKE_WIDTH}
            className="cursor-pointer"
            onMouseDown={(e) => handlePointMouseDown(e, shape.id, index)}
          />
        ))}
      </g>
    );
  };

  return (
    <svg
      ref={svgRef}
      className="absolute inset-0 w-full h-full pointer-events-none"
      viewBox="0 0 100 100"
      preserveAspectRatio="none"
      onMouseMove={handleMouseMove}
      onMouseUp={handleMouseUp}
      style={{ pointerEvents: 'all' }}
    >
      {shapes.map(shape => {
        if (shape.points.length >= MIN_POINTS_FOR_SHAPE) {
          return renderShape(shape);
        } else if (shape.id === activeShapeId) {
          return renderIncompleteShape(shape);
        }
        return null;
      })}
    </svg>
  );
}

export default ShapeOverlay;
