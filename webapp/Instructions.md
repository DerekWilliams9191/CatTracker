# Motion Detector Project Setup

## Project Structure
```
motion-detector/
├── frontend/
│   ├── public/
│   │   └── index.html
│   ├── src/
│   │   ├── components/
│   │   │   ├── Camera.jsx
│   │   │   ├── ShapePanel.jsx
│   │   │   ├── SaveStatus.jsx
│   │   │   └── Header.jsx
│   │   ├── hooks/
│   │   │   ├── useShapes.js
│   │   │   └── useAutosave.js
│   │   ├── utils/
│   │   │   └── api.js
│   │   ├── App.jsx
│   │   ├── index.js
│   │   └── index.css
│   ├── package.json
│   └── tailwind.config.js
├── backend/
│   ├── app.py
│   ├── requirements.txt
│   └── shapes.json
└── README.md
```

## Frontend Setup Commands

1. **Create React App:**
```bash
npx create-react-app frontend
cd frontend
```

2. **Install Tailwind CSS:**
```bash
npm install -D tailwindcss@^3.4.0 postcss@^8.4.0 autoprefixer@^10.4.0
npx tailwindcss init -p
```

2. **Install Additional Dependencies:**
```bash
npm install axios uuid
```

3. **Add Google Fonts to public/index.html:**
```html
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link href="https://fonts.googleapis.com/css2?family=Jacquard+12&family=Jacquard+24&display=swap" rel="stylesheet">
```

## Backend Setup Commands

1. **Create Python Virtual Environment:**
```bash
cd backend
```

2. **Install Dependencies:**
```bash
pip install flask flask-cors
pip freeze > requirements.txt
```

## Configuration Files

### tailwind.config.js
```javascript
module.exports = {
  content: [
    "./src/**/*.{js,jsx,ts,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        'text-gray': '#A3A3A3',
        'bg-gray': '#D9D9D9',
      },
      fontFamily: {
        'jacquard-12': ['Jacquard 12', 'cursive'],
        'jacquard-24': ['Jacquard 24', 'cursive'],
      },
    },
  },
  plugins: [],
}
```

### src/index.css
```css
@tailwind base;
@tailwind components;
@tailwind utilities;

body {
  margin: 0;
  font-family: 'Jacquard 24', cursive;
  background-color: #D9D9D9;
  color: #A3A3A3;
}

.gothic-text {
  font-family: 'Jacquard 12', cursive;
}

.small-text {
  font-family: 'Jacquard 24', cursive;
}
```

## Key Features Implementation

### Constants Structure
Each component will have constants at the top:
- Colors (ACTIVE_BLUE, INACTIVE_GRAY, etc.)
- Timing (AUTOSAVE_INTERVAL = 5000)
- API endpoints
- Default values

### Shape Management
- Shapes stored as arrays of points with metadata
- Active shape tracking with visual indicators
- Click-to-add-point functionality on camera feed
- Sidebar shape list with rename capability

### Autosave System
- 5-second interval autosave to backend
- Visual indicators for save status
- Local save/upload functionality
- Automatic shape loading on startup

### Styling
- Tailwind classes for consistent spacing
- Custom CSS for shape overlays
- Google Fonts integration
- No borders, only spacer lines

## Running the Project

### Start Backend:
```bash
cd backend
source venv/bin/activate
python app.py
```

### Start Frontend:
```bash
cd frontend
npm start
```

## API Endpoints
- GET /api/shapes - Load shapes
- POST /api/shapes - Save shapes
- The backend will serve shapes.json and handle CORS

## Next Steps
1. Run the setup commands above
2. I'll provide the main component files
3. Test the shape creation and autosave functionality
4. Adjust styling as needed

The project follows React best practices with custom hooks for state management, component separation, and proper error handling.