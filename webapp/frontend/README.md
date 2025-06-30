# Frontend Structure

This directory contains the frontend files for the Camera Shape Drawing application, organized in a modular structure for better maintainability.

## Files

### `index.html`
- Main HTML structure
- Contains the UI layout with toolbar, camera container, and sidebar
- Links to external CSS and JavaScript files
- Uses ES6 modules for JavaScript imports

### `styles.css`
- All CSS styles for the application
- Includes styling for:
  - Layout and containers
  - Buttons and toolbar
  - Camera feed and canvas
  - Sidebar and shape list
  - Toast notifications and tooltips
  - Responsive design elements

### `app.js`
- Main application logic
- Contains the `ShapeDrawingApp` class with all core functionality:
  - Canvas setup and rendering
  - Event handling (mouse, keyboard, file upload)
  - Shape creation, editing, and deletion
  - Remote and local file operations
  - UI updates and state management
- Imports utility functions from `utils.js`
- Initializes the application and sets up global event listeners

### `utils.js`
- Utility functions used throughout the application
- Includes:
  - `isPointInPolygon()` - Ray casting algorithm for point-in-polygon detection
  - `getPointAt()` - Find point index at given coordinates
  - `calculateDistance()` - Calculate distance between two points
  - `generateShapeId()` - Generate unique IDs for shapes
  - `validateShape()` - Validate shape data structure
  - `downloadFile()` - Create file download links
  - `getFormattedDate()` - Format date for filenames

## Benefits of This Structure

1. **Separation of Concerns**: HTML, CSS, and JavaScript are separated into different files
2. **Modularity**: Utility functions are isolated and reusable
3. **Maintainability**: Easier to find and modify specific functionality
4. **Readability**: Each file has a focused purpose
5. **Reusability**: Utility functions can be easily imported and used elsewhere
6. **Testing**: Individual modules can be tested in isolation

## Usage

To use this frontend:

1. Ensure all files are in the same directory
2. Serve the files through a web server (due to ES6 module requirements)
3. The application will automatically initialize when `index.html` is loaded

## Dependencies

- Modern browser with ES6 module support
- Backend server running on `http://localhost:5001` for camera feed and shape saving 