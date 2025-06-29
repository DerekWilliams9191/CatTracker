import cv2
import numpy as np
import os

def detect_cats(cap):
    # Try different YOLO configurations with proper parameters
    model_configs = [
        {
            'weights': 'yolov4.weights',
            'config': 'yolov4.cfg',
            'input_size': (416, 416),
            'scale': 1/255.0,
            'mean': [0, 0, 0],
            'swap_rb': True
        },
        {
            'weights': 'yolov5s.onnx',
            'config': None,
            'input_size': (640, 640),
            'scale': 1/255.0,
            'mean': [0, 0, 0],
            'swap_rb': True
        },
        {
            'weights': 'yolov3.weights',
            'config': 'yolov3.cfg',
            'input_size': (416, 416),
            'scale': 1/255.0,
            'mean': [0, 0, 0],
            'swap_rb': True
        }
    ]
    
    net = None
    model_params = None
    
    for config in model_configs:
        if not os.path.exists(config['weights']):
            print(f"Model file not found: {config['weights']}")
            continue
            
        if config['config'] and not os.path.exists(config['config']):
            print(f"Config file not found: {config['config']}")
            continue
            
        try:
            if config['config'] is None:  # ONNX format
                net = cv2.dnn.readNetFromONNX(config['weights'])
            else:
                net = cv2.dnn.readNet(config['weights'], config['config'])
            
            # Test the network with a dummy input to verify it works
            test_blob = cv2.dnn.blobFromImage(
                np.zeros((640, 640, 3), dtype=np.uint8),
                config['scale'],
                config['input_size'],
                config['mean'],
                config['swap_rb'],
                crop=False
            )
            net.setInput(test_blob)
            
            # Get output layer names
            layer_names = net.getLayerNames()
            unconnected = net.getUnconnectedOutLayers()
            if len(unconnected.shape) == 1:
                output_layers = [layer_names[i - 1] for i in unconnected]
            else:
                output_layers = [layer_names[i[0] - 1] for i in unconnected]
            
            # Try a forward pass
            _ = net.forward(output_layers)
            
            print(f"Successfully loaded and tested model: {config['weights']}")
            model_params = config
            break
            
        except Exception as e:
            print(f"Failed to load {config['weights']}: {str(e)}")
            net = None
            continue
    
    if net is None:
        print("No YOLO model could be loaded. Please download:")
        cap.release()
        return []
    
    # Load class names
    classes = []
    if os.path.exists('coco.names'):
        try:
            with open('coco.names', 'r') as f:
                classes = [line.strip() for line in f.readlines()]
        except Exception as e:
            print(f"Error reading coco.names: {e}")
    
    if not classes:
        # Default COCO classes (simplified list with cat at index 15)
        classes = [
            'person', 'bicycle', 'car', 'motorcycle', 'airplane', 'bus', 'train', 'truck', 'boat',
            'traffic light', 'fire hydrant', 'stop sign', 'parking meter', 'bench', 'bird', 'cat',
            'dog', 'horse', 'sheep', 'cow', 'elephant', 'bear', 'zebra', 'giraffe', 'backpack'
        ]
    
    # Get output layer names
    layer_names = net.getLayerNames()
    unconnected = net.getUnconnectedOutLayers()
    if len(unconnected.shape) == 1:
        output_layers = [layer_names[i - 1] for i in unconnected]
    else:
        output_layers = [layer_names[i[0] - 1] for i in unconnected]
    
    cat_coordinates = []
    frame_count = 0
    
    while True:
        ret, frame = cap.read()
        if not ret:
            print("Failed to read frame from camera")
            break
            
        frame_count += 1
        height, width, channels = frame.shape
        
        try:
            # Prepare image for YOLO with model-specific parameters
            blob = cv2.dnn.blobFromImage(
                frame,
                model_params['scale'],
                model_params['input_size'],
                model_params['mean'],
                model_params['swap_rb'],
                crop=False
            )
            
            net.setInput(blob)
            outputs = net.forward(output_layers)
            
            # Process detections
            boxes = []
            confidences = []
            class_ids = []
            
            for output in outputs:
                # Handle different output shapes
                if len(output.shape) == 3:
                    output = output[0]  # Remove batch dimension
                
                for detection in output:
                    # Ensure detection has minimum required elements
                    if len(detection) < 6:
                        continue
                        
                    # Extract confidence and class scores
                    confidence = detection[4]  # Objectness score
                    if confidence < 0.3:
                        continue
                        
                    scores = detection[5:]
                    class_id = np.argmax(scores)
                    class_confidence = scores[class_id]
                    
                    # Final confidence is objectness * class confidence
                    final_confidence = confidence * class_confidence
                    
                    # Cat class ID in COCO dataset is 15
                    if class_id == 15 and final_confidence > 0.3:
                        center_x = int(detection[0] * width)
                        center_y = int(detection[1] * height)
                        w = int(detection[2] * width)
                        h = int(detection[3] * height)
                        
                        x = int(center_x - w / 2)
                        y = int(center_y - h / 2)
                        
                        # Ensure bounding box is within frame
                        x = max(0, x)
                        y = max(0, y)
                        w = min(w, width - x)
                        h = min(h, height - y)
                        
                        if w > 0 and h > 0:  # Valid box
                            boxes.append([x, y, w, h])
                            confidences.append(float(final_confidence))
                            class_ids.append(class_id)
            
            # Apply Non-Maximum Suppression
            indexes = cv2.dnn.NMSBoxes(boxes, confidences, 0.3, 0.4)
            
            current_cats = []
            if len(indexes) > 0:
                for i in indexes.flatten():
                    x, y, w, h = boxes[i]
                    current_cats.append({
                        'bbox': (x, y, w, h),
                        'center': (x + w//2, y + h//2),
                        'confidence': confidences[i]
                    })
                    
                    # Draw bounding box
                    color = (0, 255, 0)  # Green for cats
                    cv2.rectangle(frame, (x, y), (x + w, y + h), color, 2)
                    
                    # Add label with confidence
                    label = f'Cat {confidences[i]:.2f}'
                    label_size = cv2.getTextSize(label, cv2.FONT_HERSHEY_SIMPLEX, 0.5, 2)[0]
                    cv2.rectangle(frame, (x, y - label_size[1] - 10), (x + label_size[0], y), color, -1)
                    cv2.putText(frame, label, (x, y - 5), cv2.FONT_HERSHEY_SIMPLEX, 0.5, (0, 0, 0), 1)
            
            cat_coordinates = current_cats
            
            # Display frame
            cv2.imshow('Cat Detection', frame)
            
            # Print coordinates every 30 frames to avoid spam
            if frame_count % 30 == 0 and current_cats:
                print(f"\nFrame {frame_count}:")
                for i, cat in enumerate(current_cats):
                    x, y = cat['center']
                    conf = cat['confidence']
                    print(f"Cat {i+1}: x={x}, y={y}, confidence={conf:.2f}")
            
        except Exception as e:
            print(f"Error processing frame {frame_count}: {str(e)}")
            continue
        
    return cat_coordinates


# Simplified background subtraction method (works without any model files)
def detect_motion(cap):
    
    # Initialize background subtractor
    backSub = cv2.createBackgroundSubtractorMOG2(detectShadows=True)
    
    cat_coordinates = []
    
    while True:
        ret, frame = cap.read()
        if not ret:
            break
        
        # Apply background subtraction
        fgMask = backSub.apply(frame)
        
        # Find contours
        contours, _ = cv2.findContours(fgMask, cv2.RETR_EXTERNAL, cv2.CHAIN_APPROX_SIMPLE)
        
        current_objects = []
        
        for contour in contours:
            area = cv2.contourArea(contour)
            
            # Filter by area (assuming cats are medium-sized objects)
            if 500 < area < 10000:
                x, y, w, h = cv2.boundingRect(contour)
                
                current_objects.append({
                    'bbox': (x, y, w, h),
                    'center': (x + w//2, y + h//2),
                    'area': area
                })
                
                cv2.rectangle(frame, (x, y), (x + w, y + h), (0, 255, 0), 2)
                cv2.putText(frame, f'Moving Object', 
                           (x, y - 10), cv2.FONT_HERSHEY_SIMPLEX, 0.5, (0, 255, 0), 2)
        
        cat_coordinates = current_objects
        
        # Show both original and mask
        cv2.imshow('Motion Detection', frame)
        cv2.imshow('Foreground Mask', fgMask)
        
        # Print coordinates in real-time
        if current_objects:
            for i, obj in enumerate(current_objects):
                x, y = obj['center']
                print(f"Moving object {i+1} at coordinates: x={x}, y={y}")

    return cat_coordinates

if __name__ == "__main__":
    print("Cat Detection Options:")
    print("1. YOLO-based detection (most accurate, requires model files)")
    print("2. Motion-based detection (no files needed, detects moving objects)")
    
    choice = input("Enter choice (1/2) or press Enter for motion detection: ").strip()
    
    print("Starting detection...")

    cap = cv2.VideoCapture(0)
    if not cap.isOpened():
        exit("Error: Could not open camera")
    
    if choice == '1':
        coordinates = detect_cats(cap)
    elif choice == '2':
        coordinates = detect_motion(cap)

    cap.release()
    cv2.destroyAllWindows()