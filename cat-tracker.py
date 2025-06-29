import cv2
import numpy as np

def detect_cats():
    # Initialize camera
    cap = cv2.VideoCapture(0)
    
    # Try different YOLO versions in order of preference
    model_configs = [
        ('yolov4.weights', 'yolov4.cfg'),
        ('yolov5s.onnx', None),  # ONNX format works better
        ('yolov3.weights', 'yolov3.cfg')
    ]
    
    net = None
    for weights, cfg in model_configs:
        try:
            if cfg is None:  # ONNX format
                net = cv2.dnn.readNetFromONNX(weights)
            else:
                net = cv2.dnn.readNet(weights, cfg)
            print(f"Successfully loaded model: {weights}")
            break
        except Exception as e:
            continue
    
    if net is None:
        print("No YOLO model could be loaded. Please download:")
        print("- YOLOv4: yolov4.weights and yolov4.cfg")
        print("- Or YOLOv5: yolov5s.onnx (recommended)")
        print("- Or try the simple detection method")
        return []
    
    # Load class names
    try:
        with open('coco.names', 'r') as f:
            classes = [line.strip() for line in f.readlines()]
    except FileNotFoundError:
        print("coco.names not found. Using default classes.")
        classes = ['cat']  # Simplified for cat detection
    
    # Get output layer names
    layer_names = net.getLayerNames()
    output_layers = [layer_names[i - 1] for i in net.getUnconnectedOutLayers()]
    
    cat_coordinates = []
    
    while True:
        ret, frame = cap.read()
        if not ret:
            break
            
        height, width, channels = frame.shape
        
        # Prepare image for YOLO
        blob = cv2.dnn.blobFromImage(frame, 0.00392, (416, 416), (0, 0, 0), True, crop=False)
        net.setInput(blob)
        outputs = net.forward(output_layers)
        
        # Process detections
        boxes = []
        confidences = []
        class_ids = []
        
        for output in outputs:
            for detection in output:
                scores = detection[5:]
                class_id = np.argmax(scores)
                confidence = scores[class_id]
                
                # Cat class ID in COCO dataset is 15
                if class_id == 15 and confidence > 0.5:
                    center_x = int(detection[0] * width)
                    center_y = int(detection[1] * height)
                    w = int(detection[2] * width)
                    h = int(detection[3] * height)
                    
                    x = int(center_x - w / 2)
                    y = int(center_y - h / 2)
                    
                    boxes.append([x, y, w, h])
                    confidences.append(float(confidence))
                    class_ids.append(class_id)
        
        # Apply Non-Maximum Suppression
        indexes = cv2.dnn.NMSBoxes(boxes, confidences, 0.5, 0.4)
        
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
                cv2.rectangle(frame, (x, y), (x + w, y + h), (0, 255, 0), 2)
                cv2.putText(frame, f'Cat {confidences[i]:.2f}', 
                           (x, y - 10), cv2.FONT_HERSHEY_SIMPLEX, 0.5, (0, 255, 0), 2)
        
        cat_coordinates = current_cats
        
        # Display frame
        cv2.imshow('Cat Detection', frame)
        
        # Print coordinates in real-time
        if current_cats:
            for i, cat in enumerate(current_cats):
                x, y = cat['center']
                print(f"Cat {i+1} at coordinates: x={x}, y={y}")
        
        # Press 'q' to quit
        if cv2.waitKey(1) & 0xFF == ord('q'):
            break
    
    cap.release()
    cv2.destroyAllWindows()
    return cat_coordinates


# Simplified background subtraction method (works without any model files)
def detect_motion():
    cap = cv2.VideoCapture(0)
    
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
        
        if cv2.waitKey(1) & 0xFF == ord('q'):
            break
    
    cap.release()
    cv2.destroyAllWindows()
    return cat_coordinates

if __name__ == "__main__":
    print("Cat Detection Options:")
    print("1. YOLO-based detection (most accurate, requires model files)")
    print("2. Motion-based detection (no files needed, detects moving objects)")
    
    choice = input("Enter choice (1/2) or press Enter for motion detection: ").strip()
    
    print("Starting detection...")
    if choice == '1':
        coordinates = detect_cats()
    elif choice == '2':
        coordinates = detect_motion()