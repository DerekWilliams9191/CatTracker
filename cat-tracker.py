import cv2
import numpy as np
import os
import json
import time

def write_to_queue(data, queue_file="position_queue.txt"):
    try:
        data['timestamp'] = time.time()
        line = json.dumps(data) + '\n'
        
        # Simple append - atomic on most systems
        with open(queue_file, 'a') as f:
            f.write(line)
            
    except Exception as e:
        print(f"Error writing to queue: {e}")

def detect_cats(cap, use_queue=False):
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
            continue
            
        if config['config'] and not os.path.exists(config['config']):
            continue
            
        try:
            if config['config'] is None:
                net = cv2.dnn.readNetFromONNX(config['weights'])
            else:
                net = cv2.dnn.readNet(config['weights'], config['config'])
            
            test_blob = cv2.dnn.blobFromImage(
                np.zeros((640, 640, 3), dtype=np.uint8),
                config['scale'],
                config['input_size'],
                config['mean'],
                config['swap_rb'],
                crop=False
            )
            net.setInput(test_blob)
            
            layer_names = net.getLayerNames()
            unconnected = net.getUnconnectedOutLayers()
            if len(unconnected.shape) == 1:
                output_layers = [layer_names[i - 1] for i in unconnected]
            else:
                output_layers = [layer_names[i[0] - 1] for i in unconnected]
            
            _ = net.forward(output_layers)
            model_params = config
            break
            
        except Exception:
            net = None
            continue
    
    if net is None:
        print("No YOLO model could be loaded")
        return
    
    classes = []
    if os.path.exists('coco.names'):
        try:
            with open('coco.names', 'r') as f:
                classes = [line.strip() for line in f.readlines()]
        except Exception:
            pass
    
    if not classes:
        classes = [
            'person', 'bicycle', 'car', 'motorcycle', 'airplane', 'bus', 'train', 'truck', 'boat',
            'traffic light', 'fire hydrant', 'stop sign', 'parking meter', 'bench', 'bird', 'cat',
            'dog', 'horse', 'sheep', 'cow', 'elephant', 'bear', 'zebra', 'giraffe', 'backpack'
        ]
    
    layer_names = net.getLayerNames()
    unconnected = net.getUnconnectedOutLayers()
    if len(unconnected.shape) == 1:
        output_layers = [layer_names[i - 1] for i in unconnected]
    else:
        output_layers = [layer_names[i[0] - 1] for i in unconnected]
    
    last_queue_write = 0  # Throttle queue writes
    
    while True:
        ret, frame = cap.read()
        if not ret:
            break
            
        height, width, channels = frame.shape
        
        try:
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
            
            boxes = []
            confidences = []
            class_ids = []
            
            for output in outputs:
                if len(output.shape) == 3:
                    output = output[0]
                
                for detection in output:
                    if len(detection) < 6:
                        continue
                        
                    confidence = detection[4]
                    if confidence < 0.3:
                        continue
                        
                    scores = detection[5:]
                    class_id = np.argmax(scores)
                    class_confidence = scores[class_id]
                    
                    final_confidence = confidence * class_confidence
                    
                    if class_id == 15 and final_confidence > 0.3:
                        center_x = int(detection[0] * width)
                        center_y = int(detection[1] * height)
                        w = int(detection[2] * width)
                        h = int(detection[3] * height)
                        
                        x = int(center_x - w / 2)
                        y = int(center_y - h / 2)
                        
                        x = max(0, x)
                        y = max(0, y)
                        w = min(w, width - x)
                        h = min(h, height - y)
                        
                        if w > 0 and h > 0:
                            boxes.append([x, y, w, h])
                            confidences.append(float(final_confidence))
                            class_ids.append(class_id)
            
            indexes = cv2.dnn.NMSBoxes(boxes, confidences, 0.3, 0.4)
            
            if len(indexes) > 0:
                for i in indexes.flatten():
                    x, y, w, h = boxes[i]
                    center_x = x + w//2
                    center_y = y + h//2
                    
                    print(f"Cat detected at x={center_x}, y={center_y}, confidence={confidences[i]:.2f}")
                    
                    # Throttle queue writes to avoid overwhelming
                    current_time = time.time()
                    if use_queue and (current_time - last_queue_write) > 0.1:  # Max 10 writes per second
                        write_to_queue({
                            'type': 'cat',
                            'x': center_x,
                            'y': center_y,
                            'confidence': confidences[i],
                            'bbox': [x, y, w, h]
                        })
                        last_queue_write = current_time
                    
                    color = (0, 255, 0)
                    cv2.rectangle(frame, (x, y), (x + w, y + h), color, 2)
                    
                    label = f'Cat {confidences[i]:.2f}'
                    label_size = cv2.getTextSize(label, cv2.FONT_HERSHEY_SIMPLEX, 0.5, 2)[0]
                    cv2.rectangle(frame, (x, y - label_size[1] - 10), (x + label_size[0], y), color, -1)
                    cv2.putText(frame, label, (x, y - 5), cv2.FONT_HERSHEY_SIMPLEX, 0.5, (0, 0, 0), 1)
            
            cv2.imshow('Cat Detection', frame)
            
            if cv2.waitKey(1) & 0xFF == ord('q'):
                break
            
        except Exception as e:
            print(f"Error processing frame: {str(e)}")
            continue

def detect_motion(cap, use_queue=False):
    backSub = cv2.createBackgroundSubtractorMOG2(detectShadows=True)
    last_queue_write = 0  # Throttle queue writes
    
    while True:
        ret, frame = cap.read()
        if not ret:
            break
        
        fgMask = backSub.apply(frame)
        
        contours, _ = cv2.findContours(fgMask, cv2.RETR_EXTERNAL, cv2.CHAIN_APPROX_SIMPLE)
        
        for contour in contours:
            area = cv2.contourArea(contour)
            
            if 500 < area < 10000:
                x, y, w, h = cv2.boundingRect(contour)
                center_x = x + w//2
                center_y = y + h//2
                
                print(f"Moving object at x={center_x}, y={center_y}, area={area}")
                
                # Throttle queue writes to avoid overwhelming
                current_time = time.time()
                if use_queue and (current_time - last_queue_write) > 0.1:  # Max 10 writes per second
                    write_to_queue({
                        'type': 'motion',
                        'x': center_x,
                        'y': center_y,
                        'area': area,
                        'bbox': [x, y, w, h]
                    })
                    last_queue_write = current_time
                
                cv2.rectangle(frame, (x, y), (x + w, y + h), (0, 255, 0), 2)
                cv2.putText(frame, f'Moving Object', 
                           (x, y - 10), cv2.FONT_HERSHEY_SIMPLEX, 0.5, (0, 255, 0), 2)
        
        cv2.imshow('Motion Detection', frame)
        cv2.imshow('Foreground Mask', fgMask)
        
        if cv2.waitKey(1) & 0xFF == ord('q'):
            break

if __name__ == "__main__":
    print("Initializing, this may take a few seconds...")
    
    cap = cv2.VideoCapture(0)
    if not cap.isOpened():
        exit("Error: Could not open camera")

    print("\nCat Detection Options:")
    print("1. YOLO-based detection (most accurate, requires model files)")
    print("2. Motion-based detection (no files needed, detects moving objects)")
    
    choice = input("Enter choice (1 for YOLO, 2 for motion): ").strip()
    
    if choice == '1':
        detect_cats(cap, use_queue=True)
    else:
        detect_motion(cap, use_queue=True)

    cap.release()
    cv2.destroyAllWindows()