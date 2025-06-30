import React, { useState } from 'react';

// Constants
const COLORS = {
  ACTIVE_BLUE: '#3B82F6'
};

const CIRCLE_SIZE = 'w-4 h-4';
const DELETE_BUTTON_TEXT = '×';
const KEYBOARD_KEYS = {
  ENTER: 'Enter',
  ESCAPE: 'Escape'
};

function ShapeItem({ shape, onToggleActive, onDelete, onRename }) {
  const [isEditing, setIsEditing] = useState(false);
  const [editName, setEditName] = useState(shape.name);

  const handleNameSubmit = () => {
    if (editName.trim()) {
      onRename(editName.trim());
    }
    setIsEditing(false);
  };

  const handleKeyPress = (e) => {
    if (e.key === KEYBOARD_KEYS.ENTER) {
      handleNameSubmit();
    } else if (e.key === KEYBOARD_KEYS.ESCAPE) {
      setEditName(shape.name);
      setIsEditing(false);
    }
  };

  const handleEditStart = () => {
    setIsEditing(true);
    setEditName(shape.name);
  };

  const getCircleStyle = () => ({
    backgroundColor: shape.active ? COLORS.ACTIVE_BLUE : 'transparent'
  });

  return (
    <div className="flex items-center gap-3 py-2">
      <button
        onClick={onToggleActive}
        className={`${CIRCLE_SIZE} rounded-full border-2 border-text-gray flex-shrink-0`}
        style={getCircleStyle()}
        aria-label={`Toggle ${shape.name} active state`}
      />
      
      {isEditing ? (
        <input
          type="text"
          value={editName}
          onChange={(e) => setEditName(e.target.value)}
          onBlur={handleNameSubmit}
          onKeyDown={handleKeyPress}
          className="flex-1 bg-transparent border-b border-text-gray text-text-gray font-jacquard-24 focus:outline-none"
          autoFocus
        />
      ) : (
        <span
          onClick={handleEditStart}
          className="flex-1 font-jacquard-24 text-text-gray cursor-pointer hover:text-gray-600"
        >
          {shape.name}
        </span>
      )}
      
      <button
        onClick={onDelete}
        className="text-text-gray hover:text-gray-600 font-jacquard-24 text-sm"
        aria-label={`Delete ${shape.name}`}
      >
        {DELETE_BUTTON_TEXT}
      </button>
    </div>
  );
}

export default ShapeItem;
