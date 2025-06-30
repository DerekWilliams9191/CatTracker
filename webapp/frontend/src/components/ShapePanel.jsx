import React from 'react';
import ShapeItem from './ShapeItem';

// Constants
const SECTION_TITLE = 'Shapes';
const ADD_SHAPE_BUTTON_TEXT = 'Add Shape';
const PANEL_WIDTH = 'w-80';

function ShapePanel({ 
  shapes, 
  onAddShape, 
  onToggleActive, 
  onDelete, 
  onRename 
}) {
  return (
    <div className={PANEL_WIDTH}>
      <h2 className="font-jacquard-12 text-2xl text-text-gray mb-4">
        {SECTION_TITLE}
      </h2>
      
      <div className="space-y-4">
        {shapes.map((shape) => (
          <ShapeItem
            key={shape.id}
            shape={shape}
            onToggleActive={() => onToggleActive(shape.id)}
            onDelete={() => onDelete(shape.id)}
            onRename={(name) => onRename(shape.id, name)}
          />
        ))}
        
        <button
          onClick={onAddShape}
          className="w-full py-2 font-jacquard-24 text-text-gray hover:text-gray-600 underline text-left"
        >
          {ADD_SHAPE_BUTTON_TEXT}
        </button>
      </div>
    </div>
  );
}

export default ShapePanel;
