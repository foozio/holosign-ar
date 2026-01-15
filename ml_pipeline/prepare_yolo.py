from ultralytics import YOLO
import os

def main():
    print("Downloading pre-trained YOLOv8n model...")
    # This will download yolov8n.pt to the current directory if it doesn't exist
    model = YOLO('yolov8n.pt')
    
    # Verify it works
    print(f"Model loaded: {model.task}")
    
    # Create directory for YOLO models if it doesn't exist
    yolo_dir = os.path.join(os.path.dirname(__file__), 'yolo_model')
    if not os.path.exists(yolo_dir):
        os.makedirs(yolo_dir)
        print(f"Created directory: {yolo_dir}")

if __name__ == '__main__':
    main()
