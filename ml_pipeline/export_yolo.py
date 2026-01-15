from ultralytics import YOLO
import os
import shutil
import json

def main():
    # Paths
    model_path = 'yolo_model/best.pt'
    if not os.path.exists(model_path):
        # Try finding it in runs directory if it hasn't been moved yet
        alt_path = os.path.join('..', 'runs', 'detect', 'train', 'weights', 'best.pt')
        if os.path.exists(alt_path):
            model_path = alt_path
        else:
            print(f"Error: Trained model not found at {model_path} or {alt_path}")
            return

    print(f"Loading model from {model_path}...")
    model = YOLO(model_path)

    # Export to TF.js
    # imgsz=640 is standard
    print("Exporting to TensorFlow.js...")
    export_path = model.export(format='tfjs', imgsz=640)
    
    # Organize into public directory
    # The export creates a directory with the model.json and bin files
    target_dir = os.path.join('..', 'public', 'models', 'yolo_model')
    os.makedirs(target_dir, exist_ok=True)
    
    # The export_path usually points to the created folder
    # We copy everything from that folder to target_dir
    print(f"Copying exported files from {export_path} to {target_dir}...")
    for item in os.listdir(export_path):
        s = os.path.join(export_path, item)
        d = os.path.join(target_dir, item)
        if os.path.isdir(s):
            if os.path.exists(d):
                shutil.rmtree(d)
            shutil.copytree(s, d)
        else:
            shutil.copy2(s, d)
            
    # Update classes.json
    classes_src = 'top_100_signs.json'
    classes_target = os.path.join(target_dir, 'classes.json')
    if os.path.exists(classes_src):
        with open(classes_src, 'r') as f:
            classes = json.load(f)
        with open(classes_target, 'w') as f:
            json.dump(classes, f, indent=2)
        print(f"Updated {classes_target} with {len(classes)} signs.")

    print("\nExport and organization complete!")
    print(f"Web application is now ready to use the new model at: public/models/yolo_model/model.json")

if __name__ == '__main__':
    main()
