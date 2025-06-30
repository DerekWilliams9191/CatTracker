import React from 'react';
import ReactDOM from 'react-dom/client';
import './index.css';
import App from './App';

// Constants
const ROOT_ELEMENT_ID = 'root';

// Get the root element
const container = document.getElementById(ROOT_ELEMENT_ID);

if (!container) {
  throw new Error(`Root element with id '${ROOT_ELEMENT_ID}' not found`);
}

// Create root and render app
const root = ReactDOM.createRoot(container);

root.render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);