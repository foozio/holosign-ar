import json
import os
import shutil
import cv2
from utils_yolo import convert_to_yolo_format

# Configuration
SHARDED_DIR = 'ml_pipeline/sharded_data'
YOLO_DATA_DIR = 'ml_pipeline/yolo_dataset'
CLASSES_FILE = 'ml_pipeline/top_100_signs.json'

def main():
    if not os.path.exists(CLASSES_FILE):
        print(f"Classes file not found: {CLASSES_FILE}")
        return

    with open(CLASSES_FILE, 'r') as f:
        classes = json.load(f)
    
    class_to_id = {name: i for i, name in enumerate(classes)}
    
    # Prepare YOLO directories
    images_train_dir = os.path.join(YOLO_DATA_DIR, 'images', 'train')
    labels_train_dir = os.path.join(YOLO_DATA_DIR, 'labels', 'train')
    
    # Clear existing data to start fresh
    if os.path.exists(YOLO_DATA_DIR):
        print(f"Clearing existing YOLO dataset at {YOLO_DATA_DIR}...")
        shutil.rmtree(YOLO_DATA_DIR)
        
    os.makedirs(images_train_dir, exist_ok=True)
    os.makedirs(labels_train_dir, exist_ok=True)

    print(f"Processing 100 classes from {SHARDED_DIR}...")
    
    total_frames = 0
    processed_classes = 0

    for class_name in classes:
        class_path = os.path.join(SHARDED_DIR, class_name)
        if not os.path.exists(class_path):
            print(f"  [!] Skipping {class_name}: Sharded data not found.")
            continue
        
        class_id = class_to_id[class_name]
        images_src_dir = os.path.join(class_path, 'images')
        
        # Iterate through JSON files in the class folder
        for file_name in os.listdir(class_path):
            if file_name.endswith('.json'):
                sample_id = file_name.replace('.json', '')
                with open(os.path.join(class_path, file_name), 'r') as f:
                    sample_data = json.load(f)
                
                # Check if it's sharded data from MS-ASL
                # Usually it has 'frames' or is just a list of frames
                frames = sample_data if isinstance(sample_data, list) else sample_data.get('frames', [])
                
                for i, frame in enumerate(frames):
                    landmarks = frame.get('landmarks')
                    if not landmarks:
                        continue
                    
                    yolo_label = convert_to_yolo_format(landmarks, class_id)
                    if not yolo_label:
                        continue
                    
                    # Copy image and write label
                    frame_name = f"{sample_id}_{i}"
                    src_img_path = os.path.join(images_src_dir, f"{frame_name}.jpg")
                    
                    if os.path.exists(src_img_path):
                        target_img_path = os.path.join(images_train_dir, f"{frame_name}.jpg")
                        target_lbl_path = os.path.join(labels_train_dir, f"{frame_name}.txt")
                        
                        shutil.copy(src_img_path, target_img_path)
                        with open(target_lbl_path, 'w') as f_lbl:
                            f_lbl.write(yolo_label)
                        
                        total_frames += 1
        
        processed_classes += 1
        if processed_classes % 10 == 0:
            print(f"  -> Processed {processed_classes}/100 classes ({total_frames} frames so far)")

    # Create dataset.yaml
    yaml_content = f"""
path: {os.path.abspath(YOLO_DATA_DIR)}
train: images/train
val: images/train # Placeholder

names:
"""
    for i, name in enumerate(classes):
        yaml_content += f"  {i}: {name}\n"
        
    with open(os.path.join(YOLO_DATA_DIR, 'dataset.yaml'), 'w') as f:
        f.write(yaml_content)

    print(f"\nConversion complete!")
    print(f"Total classes processed: {processed_classes}")
    print(f"Total frames in YOLO dataset: {total_frames}")
    print(f"Dataset YAML: {os.path.join(YOLO_DATA_DIR, 'dataset.yaml')}")

if __name__ == '__main__':
    main()
