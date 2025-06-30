#!/usr/bin/env python3
"""
Motion Detector Backend API
Handles shape configuration storage and camera streaming
"""

import json
import os
import cv2
import time
from datetime import datetime
from flask import Flask, jsonify, request, Response
from flask_cors import CORS

# Constants
SHAPES_FILE = 'shapes.json'
DEFAULT_SHAPES = {'shapes': []}
API_VERSION = 'v1'
PORT = 5002
DEBUG = True

# Camera constants
CAMERA_INDEX = 0  # Default camera (usually 0 for built-in webcam)
CAMERA_WIDTH = 800
CAMERA_HEIGHT = 600
CAMERA_FPS = 30
JPEG_QUALITY = 80

# Initialize Flask app
app = Flask(__name__)
CORS(app)  # Enable CORS for React frontend

# Global camera object
camera = None

def initialize_camera():
    """Initialize the camera"""
    global camera
    try:
        camera = cv2.VideoCapture(CAMERA_INDEX)
        if camera.isOpened():
            camera.set(cv2.CAP_PROP_FRAME_WIDTH, CAMERA_WIDTH)
            camera.set(cv2.CAP_PROP_FRAME_HEIGHT, CAMERA_HEIGHT)
            camera.set(cv2.CAP_PROP_FPS, CAMERA_FPS)
            print(f"Camera initialized successfully on index {CAMERA_INDEX}")
            return True
        else:
            print(f"Failed to open camera on index {CAMERA_INDEX}")
            return False
    except Exception as e:
        print(f"Camera initialization error: {e}")
        return False

def get_camera_frame():
    """Get a single frame from the camera"""
    global camera
    if camera is None or not camera.isOpened():
        if not initialize_camera():
            return None
    
    try:
        ret, frame = camera.read()
        if ret:
            # Resize frame to match our canvas dimensions
            frame = cv2.resize(frame, (CAMERA_WIDTH, CAMERA_HEIGHT))
            return frame
        else:
            print("Failed to read frame from camera")
            return None
    except Exception as e:
        print(f"Error reading camera frame: {e}")
        return None

def generate_camera_stream():
    """Generate camera frames for streaming"""
    while True:
        frame = get_camera_frame()
        if frame is not None:
            # Encode frame as JPEG
            ret, jpeg = cv2.imencode('.jpg', frame, [cv2.IMWRITE_JPEG_QUALITY, JPEG_QUALITY])
            if ret:
                yield (b'--frame\r\n'
                       b'Content-Type: image/jpeg\r\n\r\n' + jpeg.tobytes() + b'\r\n')
        else:
            # Send a black frame if camera is not available
            black_frame = create_black_frame()
            ret, jpeg = cv2.imencode('.jpg', black_frame, [cv2.IMWRITE_JPEG_QUALITY, JPEG_QUALITY])
            if ret:
                yield (b'--frame\r\n'
                       b'Content-Type: image/jpeg\r\n\r\n' + jpeg.tobytes() + b'\r\n')
        
        time.sleep(1.0 / CAMERA_FPS)  # Control frame rate

def create_black_frame():
    """Create a black frame with error message"""
    import numpy as np
    frame = np.zeros((CAMERA_HEIGHT, CAMERA_WIDTH, 3), dtype=np.uint8)
    
    # Add text to indicate camera error
    font = cv2.FONT_HERSHEY_SIMPLEX
    text = "Camera not available"
    text_size = cv2.getTextSize(text, font, 1, 2)[0]
    text_x = (CAMERA_WIDTH - text_size[0]) // 2
    text_y = (CAMERA_HEIGHT + text_size[1]) // 2
    
    cv2.putText(frame, text, (text_x, text_y), font, 1, (255, 255, 255), 2)
    return frame

def load_shapes():
    """Load shapes from JSON file"""
    try:
        if os.path.exists(SHAPES_FILE):
            with open(SHAPES_FILE, 'r') as f:
                return json.load(f)
        else:
            return DEFAULT_SHAPES
    except Exception as e:
        print(f"Error loading shapes: {e}")
        return DEFAULT_SHAPES

def save_shapes(shapes_data):
    """Save shapes to JSON file"""
    try:
        # Add timestamp to the data
        shapes_data['last_updated'] = datetime.now().isoformat()
        
        with open(SHAPES_FILE, 'w') as f:
            json.dump(shapes_data, f, indent=2)
        return True
    except Exception as e:
        print(f"Error saving shapes: {e}")
        return False

@app.route('/api/camera/stream')
def camera_stream():
    """Camera streaming endpoint"""
    return Response(generate_camera_stream(),
                    mimetype='multipart/x-mixed-replace; boundary=frame')

@app.route('/api/camera/snapshot')
def camera_snapshot():
    """Get a single camera snapshot"""
    frame = get_camera_frame()
    if frame is not None:
        ret, jpeg = cv2.imencode('.jpg', frame, [cv2.IMWRITE_JPEG_QUALITY, JPEG_QUALITY])
        if ret:
            return Response(jpeg.tobytes(), mimetype='image/jpeg')
    
    # Return black frame if camera not available
    black_frame = create_black_frame()
    ret, jpeg = cv2.imencode('.jpg', black_frame, [cv2.IMWRITE_JPEG_QUALITY, JPEG_QUALITY])
    return Response(jpeg.tobytes(), mimetype='image/jpeg')

@app.route('/api/camera/status')
def camera_status():
    """Get camera status"""
    global camera
    is_available = camera is not None and camera.isOpened()
    
    return jsonify({
        'available': is_available,
        'width': CAMERA_WIDTH,
        'height': CAMERA_HEIGHT,
        'fps': CAMERA_FPS
    })

@app.route('/api/shapes', methods=['GET'])
def get_shapes():
    """Get all motion detection shapes"""
    try:
        shapes_data = load_shapes()
        return jsonify(shapes_data), 200
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@app.route('/api/shapes', methods=['POST'])
def save_shapes_endpoint():
    """Save motion detection shapes"""
    try:
        data = request.get_json()
        
        if not data or 'shapes' not in data:
            return jsonify({'error': 'Invalid data format'}), 400
        
        # Validate shapes data
        shapes = data['shapes']
        if not isinstance(shapes, list):
            return jsonify({'error': 'Shapes must be a list'}), 400
        
        # Validate each shape
        for shape in shapes:
            required_fields = ['id', 'name', 'points', 'active']
            if not all(field in shape for field in required_fields):
                return jsonify({'error': f'Shape missing required fields: {required_fields}'}), 400
            
            # Validate points
            if not isinstance(shape['points'], list):
                return jsonify({'error': 'Shape points must be a list'}), 400
            
            for point in shape['points']:
                if not isinstance(point, dict) or 'x' not in point or 'y' not in point:
                    return jsonify({'error': 'Invalid point format'}), 400
        
        # Save the shapes
        if save_shapes(data):
            return jsonify({'message': 'Shapes saved successfully'}), 200
        else:
            return jsonify({'error': 'Failed to save shapes'}), 500
            
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@app.route('/api/health', methods=['GET'])
def health_check():
    """Health check endpoint"""
    global camera
    camera_status = camera is not None and camera.isOpened()
    
    return jsonify({
        'status': 'healthy',
        'timestamp': datetime.now().isoformat(),
        'version': API_VERSION,
        'camera_available': camera_status
    }), 200

@app.errorhandler(404)
def not_found(error):
    """Handle 404 errors"""
    return jsonify({'error': 'Endpoint not found'}), 404

@app.errorhandler(500)
def internal_error(error):
    """Handle 500 errors"""
    return jsonify({'error': 'Internal server error'}), 500

if __name__ == '__main__':
    print(f"Starting Motion Detector API server...")
    print(f"Shapes file: {SHAPES_FILE}")
    print(f"Port: {PORT}")
    print(f"Debug mode: {DEBUG}")
    
    # Initialize camera
    print("Initializing camera...")
    if initialize_camera():
        print("Camera initialized successfully")
    else:
        print("Warning: Camera initialization failed - will show placeholder")
    
    # Create initial shapes file if it doesn't exist
    if not os.path.exists(SHAPES_FILE):
        save_shapes(DEFAULT_SHAPES)
        print(f"Created initial shapes file: {SHAPES_FILE}")
    
    try:
        app.run(host='0.0.0.0', port=PORT, debug=DEBUG)
    finally:
        # Cleanup camera on shutdown
        if camera is not None:
            camera.release()
            print("Camera released")