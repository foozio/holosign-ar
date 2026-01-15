from ultralytics import YOLO
import os
import argparse

def main():
    parser = argparse.ArgumentParser(description='Train YOLOv8 for ASL')
    parser.add_argument('--data', type=str, default='yolo_dataset/dataset.yaml', help='Path to dataset.yaml')
    parser.add_argument('--epochs', type=int, default=10, help='Number of epochs')
    args = parser.parse_args()

    # Load pre-trained model
    model = YOLO('yolov8n.pt')

    # Train
    print(f"Starting training on {args.data} for {args.epochs} epochs...")
    results = model.train(data=args.data, epochs=args.epochs, imgsz=640)
    
    print("Training complete.")
    
    # Save the best model to the project's model directory
    best_model_path = os.path.join('runs', 'detect', 'train', 'weights', 'best.pt')
    if os.path.exists(best_model_path):
        target_path = os.path.join(os.path.dirname(__file__), 'yolo_model', 'best.pt')
        import shutil
        shutil.copy(best_model_path, target_path)
        print(f"Best model saved to {target_path}")

if __name__ == '__main__':
    main()
