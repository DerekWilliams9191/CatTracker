import cv2
import numpy as np
import os
import json
import time

# Adjusted sensitivity parameters
MOTION_THRESHOLD = 50  # Higher = less sensitive to small movements
PROXIMITY_THRESHOLD = 100  # Distance threshold for merging boxes
PROXIMITY = 15  # Morphological closing kernel size (smaller = less aggressive merging)
HISTORY = 200  # Number of frames to build background model
MIN_CONTOUR_AREA = 2000  # Minimum area for valid detection (increased)

def convert_numpy_types(obj):
    """Convert numpy types to native Python types for JSON serialization"""
    if isinstance(obj, np.integer):
        return int(obj)
    elif isinstance(obj, np.floating):
        return float(obj)
    elif isinstance(obj, np.ndarray):
        return obj.tolist()
    elif isinstance(obj, dict):
        return {key: convert_numpy_types(value) for key, value in obj.items()}
    elif isinstance(obj, list):
        return [convert_numpy_types(item) for item in obj]
    return obj

def write_to_queue(data, queue_file="position_queue.txt"):
    try:
        data['timestamp'] = time.time()
        # Convert numpy types to native Python types
        data = convert_numpy_types(data)
        line = json.dumps(data) + '\n'
        
        # Simple append - atomic on most systems
        with open(queue_file, 'a') as f:
            f.write(line)
            
    except Exception as e:
        print(f"Error writing to queue: {e}")

def merge_nearby_boxes(boxes, distance_threshold=PROXIMITY_THRESHOLD):
    """Improved merging of bounding boxes that are close to each other"""
    if not boxes:
        return []
    
    # Convert to numpy array for easier manipulation
    boxes = np.array(boxes)
    merged = []
    used = [False] * len(boxes)
    
    for i, box1 in enumerate(boxes):
        if used[i]:
            continue
            
        x1, y1, x2, y2 = box1
        group = [box1]
        used[i] = True
        
        # Find all boxes that should be merged with this one
        changed = True
        while changed:
            changed = False
            current_group_boxes = np.array(group)
            
            # Get bounding box of current group
            group_x1 = np.min(current_group_boxes[:, 0])
            group_y1 = np.min(current_group_boxes[:, 1])
            group_x2 = np.max(current_group_boxes[:, 2])
            group_y2 = np.max(current_group_boxes[:, 3])
            
            for j, box2 in enumerate(boxes):
                if used[j]:
                    continue
                    
                bx1, by1, bx2, by2 = box2
                
                # Calculate distance between group center and box center
                group_center_x = (group_x1 + group_x2) // 2
                group_center_y = (group_y1 + group_y2) // 2
                box_center_x = (bx1 + bx2) // 2
                box_center_y = (by1 + by2) // 2
                
                distance = ((group_center_x - box_center_x) ** 2 + (group_center_y - box_center_y) ** 2) ** 0.5
                
                # Check if boxes overlap or are very close
                overlap_x = max(0, min(group_x2, bx2) - max(group_x1, bx1))
                overlap_y = max(0, min(group_y2, by2) - max(group_y1, by1))
                has_overlap = overlap_x > 0 and overlap_y > 0
                
                # More aggressive merging criteria
                x_gap = max(0, max(group_x1, bx1) - min(group_x2, bx2))
                y_gap = max(0, max(group_y1, by1) - min(group_y2, by2))
                
                if (distance < distance_threshold or 
                    has_overlap or 
                    (x_gap < distance_threshold//2 and y_gap < distance_threshold//2)):
                    group.append(box2)
                    used[j] = True
                    changed = True
        
        # Create merged box from the group
        if group:
            group_boxes = np.array(group)
            min_x = np.min(group_boxes[:, 0])
            min_y = np.min(group_boxes[:, 1])
            max_x = np.max(group_boxes[:, 2])
            max_y = np.max(group_boxes[:, 3])
            merged.append([min_x, min_y, max_x, max_y])
    
    return merged

def detect_motion(cap, use_queue=False):
    # Create background subtractor with adjusted parameters
    backSub = cv2.createBackgroundSubtractorMOG2(
        detectShadows=True,
        varThreshold=MOTION_THRESHOLD,  # Higher = less sensitive
        history=HISTORY
    )
    
    last_queue_write = 0
    
    # Morphological operations kernels - adjusted sizes
    kernel_open = cv2.getStructuringElement(cv2.MORPH_ELLIPSE, (5, 5))  # Slightly larger for better noise removal
    kernel_close = cv2.getStructuringElement(cv2.MORPH_ELLIPSE, (PROXIMITY, PROXIMITY))
    
    # Additional kernel for more aggressive closing if needed
    kernel_close_large = cv2.getStructuringElement(cv2.MORPH_ELLIPSE, (25, 25))
    
    while True:
        ret, frame = cap.read()
        if not ret:
            break
        
        # Apply background subtraction
        fgMask = backSub.apply(frame)
        
        # More aggressive morphological operations
        # Opening removes noise (small white spots)
        fgMask = cv2.morphologyEx(fgMask, cv2.MORPH_OPEN, kernel_open)
        
        # Multiple closing operations with different kernel sizes
        fgMask = cv2.morphologyEx(fgMask, cv2.MORPH_CLOSE, kernel_close)
        fgMask = cv2.morphologyEx(fgMask, cv2.MORPH_CLOSE, kernel_close_large)  # Additional aggressive closing
        
        # Gaussian blur for smoothing
        fgMask = cv2.GaussianBlur(fgMask, (9, 9), 0)  # Increased blur kernel
        
        # Re-threshold with higher threshold for stricter detection
        _, fgMask = cv2.threshold(fgMask, 200, 255, cv2.THRESH_BINARY)  # Higher threshold
        
        # Find contours
        contours, _ = cv2.findContours(fgMask, cv2.RETR_EXTERNAL, cv2.CHAIN_APPROX_SIMPLE)
        
        # Filter contours by area with higher threshold
        valid_contours = []
        for contour in contours:
            area = cv2.contourArea(contour)
            if area > MIN_CONTOUR_AREA:  # Much higher minimum area
                valid_contours.append(contour)
        
        # Create bounding boxes and merge them
        if valid_contours:
            bounding_boxes = []
            for contour in valid_contours:
                x, y, w, h = cv2.boundingRect(contour)
                # Additional filtering based on aspect ratio and size
                aspect_ratio = w / h if h > 0 else 0
                if w > 30 and h > 30 and 0.2 < aspect_ratio < 5.0:  # Filter unrealistic shapes
                    bounding_boxes.append([x, y, x + w, y + h])
            
            # Merge nearby boxes with improved algorithm
            merged_boxes = merge_nearby_boxes(bounding_boxes, distance_threshold=PROXIMITY_THRESHOLD)
            
            # Process merged boxes
            for box in merged_boxes:
                x1, y1, x2, y2 = box
                x, y, w, h = x1, y1, x2 - x1, y2 - y1
                center_x = x + w // 2
                center_y = y + h // 2
                area = w * h
                
                # Additional size filter after merging
                if area > MIN_CONTOUR_AREA:
                    print(f"Moving object at x={center_x}, y={center_y}, area={area}")
                    
                    # Throttle queue writes
                    current_time = time.time()
                    if use_queue and (current_time - last_queue_write) > 0.1:
                        write_to_queue({
                            'type': 'motion',
                            'x': center_x,
                            'y': center_y,
                            'area': area,
                            'bbox': [x, y, w, h]
                        })
                        last_queue_write = current_time
        
        # Only show the foreground mask window (removed the main frame display)
        cv2.imshow('Foreground Mask', fgMask)
        
        if cv2.waitKey(1) & 0xFF == ord('q'):
            break

if __name__ == "__main__":
    print("Initializing motion detector, this may take a few seconds...")
    
    cap = cv2.VideoCapture(0)
    if not cap.isOpened():
        exit("Error: Could not open camera")

    detect_motion(cap, use_queue=True)

    cap.release()
    cv2.destroyAllWindows()