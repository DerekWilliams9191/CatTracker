# Camera Shape Drawing App

A web application that streams live camera feed and allows users to draw and edit shapes on top of the video stream.

## Features

- Live camera feed streaming
- Interactive shape drawing (polygons)
- Shape editing with draggable points
- Shape management (rename, delete)
- Save shapes as JSON (remote and local)
- Upload existing shape files
- Responsive design with accessibility features

## File Structure

```
camera-shape-app/
├── backend/
│   ├── app.py              # Flask server with camera streaming
│   ├── requirements.txt    # Python dependencies
│   └── shapes/            # Directory for saved shape files
├── frontend/
│   └── index.html         # Complete web application
└── README.md              # This file
```

## Installation & Setup

The backend will start on `http://localhost:5000`

### Frontend Setup

1. Open the `frontend/index.html` file in a modern web browser
2. Or serve it using a simple HTTP server:
```bash
cd frontend
python -m http.server 8080
```
Then visit `http://localhost:8080`

## Usage

### Drawing Shapes
1. Click "New Shape" to start drawing
2. Click on the camera feed to add points:
   - 1st click: Creates a point
   - 2nd click: Creates a line
   - 3rd click: Creates a polygon
   - Additional clicks: Add more points to the polygon

### Editing Shapes
- Click on a shape name in the sidebar to make it active
- Drag the circular points to reshape
- Click on a point (without dragging) to delete it
- Only the active shape shows its edit points

### Shape Management
- Double-click shape names to rename them
- Click the delete button (×) to remove shapes
- Use the sidebar to switch between shapes

### Saving & Loading
- **Save (Remote)**: Saves to the backend server
- **Save (Device)**: Downloads JSON file to your device
- **Upload**: Load shapes from a JSON file

## Technical Details

### Backend API Endpoints
- `GET /video_feed` - Camera stream endpoint
- `POST /save_shapes` - Save shapes to server
- `GET /shapes` - Retrieve saved shapes

### Shape Data Format
Shapes are stored as JSON with the following structure:
```json
{
  "shapes": [
    {
      "id": "unique-id",
      "name": "Shape Name",
      "points": [
        {"x": 100, "y": 150},
        {"x": 200, "y": 150},
        {"x": 150, "y": 250}
      ]
    }
  ]
}
```

## Troubleshooting

### Camera Not Working
- Ensure your camera is not being used by another application
- Check browser permissions for camera access
- Try refreshing the page

### Backend Connection Issues
- Verify the Flask server is running on port 5000
- Check that no firewall is blocking the connection
- Ensure the backend URL in the frontend matches your setup

### CORS Issues
- The backend includes CORS headers for development
- For production, configure CORS properly for your domain

## Browser Compatibility
- Chrome/Chromium 60+
- Firefox 55+
- Safari 11+
- Edge 79+

## License
This project is provided as-is for educational and development purposes.