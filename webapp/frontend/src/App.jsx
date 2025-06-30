// src/App.jsx
import React from 'react';
import Header from './components/Header';
import Camera from './components/Camera';
import ShapePanel from './components/ShapePanel';
import SaveStatus from './components/SaveStatus';
import { useShapes } from './hooks/useShapes';
import { useAutosave } from './hooks/useAutosave';

// Constants
const TIMING = {
  AUTOSAVE_INTERVAL: 5000
};

function App() {
  const {
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
  } = useShapes();

  const { saveStatus } = useAutosave(shapes, TIMING.AUTOSAVE_INTERVAL);

  return (
    <div className="min-h-screen bg-bg-gray p-8">
      <Header />
      
      <div className="flex gap-8">
        <div className="flex-1">
          <Camera
            shapes={shapes}
            activeShapeId={activeShapeId}
            isCreatingShape={isCreatingShape}
            onCanvasClick={handleCanvasClick}
            onToggleShapeActive={toggleShapeActive}
          />
          
          <SaveStatus
            saveStatus={saveStatus}
            onDownload={downloadShapes}
            onUpload={uploadShapes}
          />
        </div>

        <ShapePanel
          shapes={shapes}
          onAddShape={addNewShape}
          onToggleActive={toggleShapeActive}
          onDelete={deleteShape}
          onRename={renameShape}
        />
      </div>
    </div>
  );
}

export default App;