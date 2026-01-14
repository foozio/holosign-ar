from ultralytics import YOLO
import os
import sys

def export_model(weights_path, format="tfjs"):
    """
    Exports a trained YOLO model to the specified format.
    """
    if not os.path.exists(weights_path):
        print(f"Error: Weights file not found at {weights_path}")
        sys.exit(1)

    try:
        model = YOLO(weights_path)
        export_path = model.export(format=format)
        print(f"Model exported successfully to: {export_path}")
        return export_path
    except Exception as e:
        print(f"Error exporting model: {e}")
        sys.exit(1)

if __name__ == "__main__":
    WEIGHTS = os.getenv("WEIGHTS_PATH", "runs/detect/asl_yolo_model/weights/best.pt")
    FORMAT = os.getenv("EXPORT_FORMAT", "tfjs")

    export_model(WEIGHTS, FORMAT)
