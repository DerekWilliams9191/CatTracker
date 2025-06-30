import React from 'react';

// Constants
const STATUS_MESSAGES = {
  saved: 'autosave (saved)',
  pending: 'autosave in progress',
  saving: 'saving...',
  error: 'save error'
};

const BUTTON_LABELS = {
  SAVE_LOCAL: 'save (local)',
  UPLOAD: 'upload'
};

const FILE_ACCEPT_TYPE = '.json';

function SaveStatus({ saveStatus, onDownload, onUpload }) {
  const handleFileUpload = (event) => {
    const file = event.target.files[0];
    if (file) {
      onUpload(file);
      // Reset the input value to allow re-uploading the same file
      event.target.value = '';
    }
  };

  return (
    <div className="mt-4 flex items-center justify-between">
      <div className="flex items-center gap-2">
        <span className="font-jacquard-24 text-sm text-text-gray">
          {STATUS_MESSAGES[saveStatus] || STATUS_MESSAGES.error}
        </span>
      </div>
      
      <div className="flex gap-4">
        <button
          onClick={onDownload}
          className="font-jacquard-24 text-text-gray hover:text-gray-600 underline"
        >
          {BUTTON_LABELS.SAVE_LOCAL}
        </button>
        
        <label className="font-jacquard-24 text-text-gray hover:text-gray-600 underline cursor-pointer">
          {BUTTON_LABELS.UPLOAD}
          <input
            type="file"
            accept={FILE_ACCEPT_TYPE}
            onChange={handleFileUpload}
            className="hidden"
          />
        </label>
      </div>
    </div>
  );
}

export default SaveStatus;
