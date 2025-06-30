# Cat Detector Motion Setup - Complete Instructions

##  Quick Start

### 1. Frontend Setup
```bash
# Create Next.js project
npx create-next-app@latest motion-detector --typescript --tailwind --eslint --app --src-dir --import-alias "@/*"
cd motion-detector

# Install dependencies
npm install lucide-react
npm install --save-dev concurrently
```

### 2. Backend Setup
```bash
# Create backend directory (from project root)
mkdir backend
cd backend

# Create virtual environment
python -m venv venv

# Activate virtual environment
# Windows:
venv\Scripts\activate
# Mac/Linux:
source venv/bin/activate

# Install dependencies
pip install fastapi uvicorn pydantic python-multipart

# Save requirements
pip freeze > requirements.txt
```

### 3. File Structure
After creating all files, your structure should look like:
```
motion-detector/
├── src/
│   ├── app/
│   │   ├── globals.css              # Update with fonts
│   │   ├── layout.tsx               # Default Next.js
│   │   ├── page.tsx                 # Default Next.js  
│   │   └── motion/
│   │       └── page.tsx             # Created
│   ├── components/
│   │   ├── MotionDetector.tsx       # Created
│   │   ├── CameraView.tsx           # Created
│   │   ├── ShapesList.tsx           # Created
│   │   └── SaveControls.tsx         # Created
│   ├── hooks/
│   │   ├── useShapes.ts             # Created
│   │   └── useAutosave.ts           # Created
│   ├── types/
│   │   └── shapes.ts                # Created
│   └── utils/
│       └── api.ts                   # Created
├── backend/
│   ├── main.py                      # Created
│   ├── models.py                    # Created
│   ├── database.py                  # Created
│   ├── requirements.txt             # Created
│   └── shapes.json                  # Auto-created
├── next.config.js                   # Update needed
├── tailwind.config.js               # Update needed
└── package.json                     # Update scripts
```

### 4. Configuration Updates

#### Update `next.config.js`:
```js
/** @type {import('next').NextConfig} */
const nextConfig = {
  async rewrites() {
    return [
      {
        source: '/api/:path*',
        destination: 'http://localhost:8000/api/:path*',
      },
    ]
  },
}

module.exports = nextConfig
```

#### Update `tailwind.config.js`:
```js
/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
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

#### Update `src/app/globals.css`:
```css
@import url('https://fonts.googleapis.com/css2?family=Jacquard+12&family=Jacquard+24&display=swap');
@tailwind base;
@tailwind components;
@tailwind utilities;
```

#### Update `package.json` scripts:
```json
{
  "scripts": {
    "dev": "next dev",
    "build": "next build", 
    "start": "next start",
    "lint": "next lint",
    "backend": "cd backend && uvicorn main:app --reload --port 8000",
    "full-dev": "concurrently \"npm run dev\" \"npm run backend\""
  }
}
```

## Running the Application

### Option 1: Run Separately
```bash
# Terminal 1 - Frontend
npm run dev

# Terminal 2 - Backend  
cd backend
source venv/bin/activate  # or venv\Scripts\activate on Windows
uvicorn main:app --reload --port 8000
```

### Option 2: Run Together
```bash
npm run full-dev
```

## Access Points
- **Frontend**: http://localhost:3000/motion
- **Backend API**: http://localhost:8000
- **API Docs**: http://localhost:8000/docs

## Features Implemented

### Complete Motion Detection Interface
- **Shape Drawing**: Click camera to place points
- **Shape Management**: Add, delete, rename, activate shapes  
- **Visual States**: Blue active shapes with white points, gray inactive shapes
- **Auto-save**: Every 5 seconds with status indicator
- **Local Save/Upload**: Download/upload JSON files
- **Server Sync**: Auto-load on startup, save to server

### Modern Tech Stack
- **Frontend**: Next.js 14, TypeScript, Tailwind CSS
- **Backend**: FastAPI, Pydantic, JSON file storage
- **Architecture**: Clean separation, custom hooks, component modularity

### Production Ready Features
- Error handling and validation
- TypeScript type safety
- CORS configuration
- File backups
- Logging
- API documentation

## Customization

### Camera Integration
Replace the placeholder in `backend/main.py` camera endpoint with your actual camera feed.

### Styling
All visual constants are defined at the top of each file for easy customization.

### Database
Currently uses JSON file storage. Easy