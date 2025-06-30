import React from 'react';

// Constants
const COLORS = {
  ACTIVE_BLUE: '#3B82F6',
  INACTIVE_GRAY: '#9CA3AF',
  WHITE: '#FFFFFF'
};

const SHAPE_STYLES = {
  FILL_OPACITY: '0.5',
  STROKE_WIDTH: '2',
  POINT_RADIUS: '4'
};

const MIN_POINTS_FOR_SHAPE = 3;

function ShapeOverlay({ shapes, onToggleShapeActive }) {
  const renderShape = (shape) => {
    if (shape.points.length < MIN_POINTS_FOR_SHAPE) return null;

    const pathData = shape.points.reduce((path, point, index) => {
      const command = index === 0 ? 'M' : 'L';
      return `${path} ${command} ${point.x} ${point.y}`;
    }, '') + ' Z';

    const fillColor = shape.active ? COLORS.ACTIVE_BLUE : COLORS.INACTIVE_GRAY;
    const strokeColor = shape.active ? COLORS.ACTIVE_BLUE : COLORS.INACTIVE_GRAY;

    return (
      <g key={shape.id}>
        <path
          d={pathData}
          fill={fillColor}
          fillOpacity={SHAPE_STYLES.FILL_OPACITY}
          stroke={strokeColor}
          strokeWidth={SHAPE_STYLES.STROKE_WIDTH}
          onClick={() => onToggleShapeActive(shape.id)}
          className="cursor-pointer"
        />
        {shape.active && shape.points.map((point, index) => (
          <circle
            key={`${shape.id}-point-${index}`}
            cx={point.x}
            cy={point.y}
            r={SHAPE_STYLES.POINT_RADIUS}
            fill={COLORS.WHITE}
            stroke={COLORS.ACTIVE_BLUE}
            strokeWidth={SHAPE_STYLES.STROKE_WIDTH}
          />
        ))}
      </g>
    );
  };

  return (
    <svg
      className="absolute inset-0 w-full h-full pointer-events-none"
      viewBox="0 0 100 100"
      preserveAspectRatio="none"
    >
      {shapes.map(renderShape)}
    </svg>
  );
}

export default ShapeOverlay;
