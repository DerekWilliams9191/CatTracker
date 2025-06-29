from flask import Flask, Response, request, jsonify
from flask_cors import CORS
import cv2
import json
import os
from datetime import datetime
import uuid

import socket

def is_port_in_use(port):
    with socket.socket(socket.AF_INET, socket.SOCK_STREAM) as s:
        return s.connect_ex(('localhost', port)) == 0

app = Flask(__name__)
CORS(app)  # Enable CORS for all domains

# Ensure shapes directory exists
SHAPES_DIR = 'shapes'
if not os.path.exists(SHAPES_DIR):
    os.makedirs(SHAPES_DIR)

class VideoCamera:
    def __init__(self):
        self.video = cv2.VideoCapture(0)
        # Set camera properties for better performance
        self.video.set(cv2.CAP_PROP_FRAME_WIDTH, 640)
        self.video.set(cv2.CAP_PROP_FRAME_HEIGHT, 480)
        self.video.set(cv2.CAP_PROP_FPS, 30)
    
    def __del__(self):
        self.video.release()
    
    def get_frame(self):
        success, image = self.video.read()
        if not success:
            return None
        
        # Encode frame to JPEG
        ret, jpeg = cv2.imencode('.jpg', image, [cv2.IMWRITE_JPEG_QUALITY, 85])
        return jpeg.tobytes()

def gen_frames():
    """Generate frames for video streaming"""
    camera = VideoCamera()
    try:
        while True:
            frame = camera.get_frame()
            if frame is None:
                break
            yield (b'--frame\r\n'
                   b'Content-Type: image/jpeg\r\n\r\n' + frame + b'\r\n')
    finally:
        del camera

@app.route('/video_feed')
def video_feed():
    """Video streaming route"""
    return Response(gen_frames(),
                    mimetype='multipart/x-mixed-replace; boundary=frame')

@app.route('/save_shapes', methods=['POST'])
def save_shapes():
    """Save shapes data to JSON file"""
    try:
        shapes_data = request.get_json()
        if not shapes_data:
            return jsonify({'error': 'No data provided'}), 400
        
        # Generate filename with timestamp
        timestamp = datetime.now().strftime('%Y%m%d_%H%M%S')
        filename = f'shapes_{timestamp}.json'
        filepath = os.path.join(SHAPES_DIR, filename)
        
        # Add metadata
        shapes_data['saved_at'] = datetime.now().isoformat()
        shapes_data['id'] = str(uuid.uuid4())
        
        # Save to file
        with open(filepath, 'w') as f:
            json.dump(shapes_data, f, indent=2)
        
        return jsonify({
            'success': True, 
            'filename': filename,
            'message': f'Shapes saved successfully as {filename}'
        })
    
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@app.route('/shapes', methods=['GET'])
def get_shapes():
    """Get list of saved shape files"""
    try:
        files = []
        for filename in os.listdir(SHAPES_DIR):
            if filename.endswith('.json'):
                filepath = os.path.join(SHAPES_DIR, filename)
                with open(filepath, 'r') as f:
                    data = json.load(f)
                    files.append({
                        'filename': filename,
                        'saved_at': data.get('saved_at', 'Unknown'),
                        'shape_count': len(data.get('shapes', []))
                    })
        
        return jsonify({'files': sorted(files, key=lambda x: x['saved_at'], reverse=True)})
    
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@app.route('/shapes/<filename>', methods=['GET'])
def get_shape_file(filename):
    """Get specific shape file content"""
    try:
        filepath = os.path.join(SHAPES_DIR, filename)
        if not os.path.exists(filepath):
            return jsonify({'error': 'File not found'}), 404
        
        with open(filepath, 'r') as f:
            data = json.load(f)
        
        return jsonify(data)
    
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@app.route('/health', methods=['GET'])
def health_check():
    """Health check endpoint"""
    return jsonify({'status': 'healthy', 'timestamp': datetime.now().isoformat()})



if __name__ == '__main__':
    port = 5000
    while is_port_in_use(port):
        port += 1

    print("Starting Camera Shape Drawing Backend...")
    print(f"Camera stream will be available at: http://localhost:{port}/video_feed")
    print("API endpoints:")
    print("  POST /save_shapes - Save shapes data")
    print("  GET /shapes - List saved files")
    print("  GET /shapes/<filename> - Get specific file")
    print("  GET /health - Health check")
        
    app.run(debug=True, host='0.0.0.0', port=port, threaded=True)
