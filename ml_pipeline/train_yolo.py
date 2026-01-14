from ultralytics import YOLO
import os
import sys

def train_model(data_path, model_variant="yolo11n.pt", epochs=100, imgsz=640):
    """
    Trains a YOLO model on the specified dataset.
    """
    # Load a pretrained model
    model = YOLO(model_variant)

    # Train the model
    results = model.train(
        data=data_path,
        epochs=epochs,
        imgsz=imgsz,
        plots=True,
        save=True,
        name="asl_yolo_model"
    )
    
    print(f"Training complete. Results saved to: {results.save_dir}")
    return model

if __name__ == "__main__":
    DATA_YAML = os.getenv("DATA_YAML", "dataset/data.yaml")
    MODEL_VARIANT = os.getenv("MODEL_VARIANT", "yolo11n.pt") # Default to Nano for speed
    EPOCHS = int(os.getenv("EPOCHS", 50))
    IMGSZ = int(os.getenv("IMGSZ", 640))

    if not os.path.exists(DATA_YAML):
        print(f"Error: Dataset YAML file not found at {DATA_YAML}")
        sys.exit(1)

    train_model(DATA_YAML, MODEL_VARIANT, EPOCHS, IMGSZ)
