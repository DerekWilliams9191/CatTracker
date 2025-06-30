# Motion Detector - React App

A React application for defining motion detection regions with an intuitive drawing interface.


### 3. Configure Tailwind CSS

Update `tailwind.config.js`:
```javascript
/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      fontFamily: {
        'jacquard-12': ['Jacquard 12', 'serif'],
        'jacquard-24': ['Jacquard 24', 'serif'],
      },
    },
  },
  plugins: [],
}
```

Update `src/index.css`:
```css
@import url('https://fonts.googleapis.com/css2?family=Jacquard+12&family=Jacquard+24&display=swap');
@tailwind base;
@tailwind components;
@tailwind utilities;
```

### 4. Project Structure
```
src/
├── components/
│   ├── Camera.jsx           # Main camera view with shape drawing
│   ├── ShapesList.jsx       # Sidebar with shapes list
│   ├── Header.jsx           # Navigation header
│   └── SaveStatus.jsx       # Autosave status indicator
├── hooks/
│   ├── useShapes.js         # Shape management logic
│   ├── useAutosave.js       # Autosave functionality
│   └── useAPI.js           # API calls for backend
├── utils/
│   ├── shapeUtils.js        # Shape calculation utilities
│   └── fileUtils.js         # File download/upload utilities
├── App.jsx
├── main.jsx
└── index.css
```

### 5. Key Features Implemented

- **Shape Drawing**: Click to add points, automatically close polygons
- **Shape Management**: Add, rename, delete, and activate shapes
- **Visual Feedback**: Active shapes in blue with control points, inactive in gray
- **Autosave**: Every 5 seconds with status indicator
- **File Operations**: Download JSON locally, upload to overwrite
- **Responsive Design**: Clean, professional interface matching the design

### 6. Run the Development Server
```bash
npm run dev
```

### 7. Backend API Endpoints Expected

The frontend expects these endpoints:
- `GET /api/shapes` - Fetch current shapes
- `POST /api/shapes` - Save shapes (autosave)
- `PUT /api/shapes` - Upload/overwrite shapes

### 8. Shape Data Format
```json
{
  "shapes": [
    {
      "id": "unique-id",
      "name": "Shape 1",
      "points": [[x1, y1], [x2, y2], ...],
      "isActive": false
    }
  ]
}
```

## Development Notes

- Uses modern React hooks and functional components
- Tailwind CSS for styling with custom fonts
- Modular architecture with custom hooks for state management
- Constants defined at the top of each file
- Clean separation of concerns between UI and logic
- Responsive design that works on desktop and mobile

## Next Steps

3. Build your backend to match the expected API endpoints
4. Test the drawing and save functionality
5. Deploy both frontend and backend

The application will automatically load shapes from the server on startup and provide a seamless motion detection region configuration experience.