
## Weight Download Links

# COCO class names (required for all YOLO versions)
curl -O https://raw.githubusercontent.com/pjreddie/darknet/master/data/coco.names

# Option 1: YOLOv4 (Recommended - works well with newer OpenCV)
curl -O https://github.com/AlexeyAB/darknet/releases/download/darknet_yolo_v3_optimal/yolov4.weights
curl -O https://raw.githubusercontent.com/AlexeyAB/darknet/master/cfg/yolov4.cfg

# Option 2: YOLOv5 ONNX (Best compatibility with OpenCV)
curl -L -o yolov5s.onnx https://github.com/ultralytics/yolov5/releases/download/v7.0/yolov5s.onnx

# Option 3: YOLOv3 (Original, may have compatibility issues with newer OpenCV)
curl -O https://pjreddie.com/media/files/yolov3.weights
curl -O https://raw.githubusercontent.com/pjreddie/darknet/master/cfg/yolov3.cfg

# Alternative: Haar Cascade for cat faces (lightweight option)
curl -O https://raw.githubusercontent.com/opencv/opencv/master/data/haarcascades/haarcascade_frontalcatface.xml
