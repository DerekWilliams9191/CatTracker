import { useState, useEffect, useRef } from 'react';
import { saveShapes } from '../utils/api';

// Constants
const SAVE_STATUSES = {
  SAVED: 'saved',
  PENDING: 'pending',
  SAVING: 'saving',
  ERROR: 'error'
};

const CHECK_INTERVAL = 1000; // Check every second

export function useAutosave(shapes, autosaveInterval) {
  const [saveStatus, setSaveStatus] = useState(SAVE_STATUSES.SAVED);
  const [lastSaveTime, setLastSaveTime] = useState(Date.now());
  const intervalRef = useRef(null);
  const isInitialLoad = useRef(true);

  // Setup autosave interval
  useEffect(() => {
    intervalRef.current = setInterval(() => {
      if (saveStatus === SAVE_STATUSES.PENDING && 
          Date.now() - lastSaveTime >= autosaveInterval) {
        performAutosave();
      }
    }, CHECK_INTERVAL);

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, [saveStatus, lastSaveTime, autosaveInterval]);

  // Mark as needing save when shapes change (but not on initial load)
  useEffect(() => {
    if (isInitialLoad.current) {
      isInitialLoad.current = false;
      return;
    }

    if (shapes.length >= 0) {
      setSaveStatus(SAVE_STATUSES.PENDING);
      setLastSaveTime(Date.now());
    }
  }, [shapes]);

  const performAutosave = async () => {
    setSaveStatus(SAVE_STATUSES.SAVING);
    
    try {
      await saveShapes({ shapes });
      setSaveStatus(SAVE_STATUSES.SAVED);
    } catch (error) {
      console.error('Autosave failed:', error);
      setSaveStatus(SAVE_STATUSES.ERROR);
      
      // Retry failed saves after a delay
      setTimeout(() => {
        setSaveStatus(SAVE_STATUSES.PENDING);
        setLastSaveTime(Date.now());
      }, 5000);
    }
  };

  return {
    saveStatus,
    performAutosave
  };
}
