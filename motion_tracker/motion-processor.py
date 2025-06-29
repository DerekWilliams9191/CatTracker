import cv2
import json
import time
import os
from collections import deque

CROSSHAIR_LIFE = 0.5
BOUNDING_BOX_LIFE = 0.5

def draw_crosshair(frame, x, y, color=(0, 0, 255), size=20, thickness=2):
    """Draw a crosshair marker at the specified position"""
    # Horizontal line
    cv2.line(frame, (x - size, y), (x + size, y), color, thickness)
    # Vertical line
    cv2.line(frame, (x, y - size), (x, y + size), color, thickness)
    # Optional: Add a small circle at the center
    cv2.circle(frame, (x, y), 3, color, -1)

def read_queue(queue_file="position_queue.txt"):
    """Read motion data from the queue file and return recent positions"""
    positions = []
    current_time = time.time()
    
    try:
        if os.path.exists(queue_file):
            with open(queue_file, 'r') as f:
                lines = f.readlines()
            
            # Process lines from most recent backwards
            for line in reversed(lines[-100:]):  # Only check last 100 lines for efficiency
                try:
                    data = json.loads(line.strip())
                    if data.get('type') == 'motion':
                        timestamp = data.get('timestamp', 0)
                        # Only include recent positions (within BOUNDING_BOX_LIFE)
                        if current_time - timestamp <= BOUNDING_BOX_LIFE:
                            positions.append(data)
                        else:
                            # Since we're going backwards in time, we can break here
                            break
                except json.JSONDecodeError:
                    continue
                    
    except Exception as e:
        print(f"Error reading queue: {e}")
    
    return positions

def display_markers():
    """Display camera feed with motion markers from the queue"""
    cap = cv2.VideoCapture(0)
    if not cap.isOpened():
        exit("Error: Could not open camera")
    
    print("Starting marker display. Press 'q' to quit, 'c' to clear queue.")
    
    # Store recent positions for trail effect
    position_history = deque(maxlen=10)
    
    while True:
        ret, frame = cap.read()
        if not ret:
            break
        
        # Read recent positions from queue
        positions = read_queue()
        
        # Update position history
        if positions:
            # Get the most recent position
            latest_position = positions[0]  # positions are already sorted by recency
            position_history.append((latest_position['x'], latest_position['y']))
        
        # Draw trail of recent positions
        for i, (x, y) in enumerate(position_history):
            # Fade older positions
            alpha = (i + 1) / len(position_history)
            color_intensity = int(255 * alpha)
            color = (0, 0, color_intensity)  # Red color with varying intensity
            size = int(15 + 15 * alpha)  # Larger size for more recent positions
            thickness = max(1, int(3 * alpha))
            
            draw_crosshair(frame, x, y, color=color, size=size, thickness=thickness)
        
        # Display current position info
        if position_history:
            latest_x, latest_y = position_history[-1]
            pos_text = f"Position: ({latest_x}, {latest_y})"
            cv2.putText(frame, pos_text, (10, 30), cv2.FONT_HERSHEY_SIMPLEX, 0.7, (0, 0, 255), 2)
            
            # Show number of recent detections
            detection_text = f"Recent detections: {len(positions)}"
            cv2.putText(frame, detection_text, (10, 60), cv2.FONT_HERSHEY_SIMPLEX, 0.6, (0, 255, 0), 2)
        
        # Draw all recent positions as smaller markers
        for i, pos_data in enumerate(positions):
            x, y = pos_data['x'], pos_data['y']
            area = pos_data.get('area', 0)
            
            # Draw bounding box if available
            if 'bbox' in pos_data:
                bbox_x, bbox_y, bbox_w, bbox_h = pos_data['bbox']
                cv2.rectangle(frame, (bbox_x, bbox_y), (bbox_x + bbox_w, bbox_y + bbox_h), (0, 255, 0), 1)
                cv2.putText(frame, f'Area: {area}', 
                           (bbox_x, bbox_y - 10), cv2.FONT_HERSHEY_SIMPLEX, 0.5, (0, 255, 0), 1)
        
        cv2.imshow('Motion Markers', frame)
        
        key = cv2.waitKey(1) & 0xFF
        if key == ord('q'):
            break
        elif key == ord('c'):
            # Clear the queue file
            try:
                with open("position_queue.txt", 'w') as f:
                    f.write('')
                position_history.clear()
                print("Queue cleared")
            except Exception as e:
                print(f"Error clearing queue: {e}")
    
    cap.release()
    cv2.destroyAllWindows()

if __name__ == "__main__":
    display_markers()