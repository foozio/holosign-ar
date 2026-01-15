import json
import os
import argparse
import uuid
import time
import shutil
import cv2
import numpy as np
from utils_yolo import convert_to_yolo_format

# Try importing dependencies
try:
    import mediapipe as mp
    from mediapipe.tasks import python
    from mediapipe.tasks.python import vision
except ImportError:
    print("Error: mediapipe not found. Please run: pip install -r requirements.txt")
    exit(1)

try:
    import yt_dlp
except ImportError:
    print("Error: yt-dlp not found. Please run: pip install -r requirements.txt")
    exit(1)

# Configuration
MSASL_DIR = 'MS-ASL'
YOLO_DATA_DIR = 'yolo_dataset'
TEMP_DIR = 'temp_videos'

def download_video_segment(url, start_time, end_time, output_path):
    # Same as process_msasl.py
    ydl_opts = {
        'format': 'best[ext=mp4]',
        'outtmpl': output_path,
        'quiet': True,
        'download_ranges': lambda info, ydl: [{'start_time': start_time, 'end_time': end_time}],
        'force_keyframes_at_cuts': True,
    }
    try:
        with yt_dlp.YoutubeDL(ydl_opts) as ydl:
            ydl.download([url])
        return True
    except Exception as e:
        print(f"Failed to download {url}: {e}")
        return False

def process_video_to_yolo(video_path, label_id, sample_id):
    """
    Extract frames and save them with YOLO labels.
    """
    model_path = os.path.join(os.path.dirname(__file__), 'hand_landmarker.task')
    base_options = python.BaseOptions(model_asset_path=model_path)
    options = vision.HandLandmarkerOptions(
        base_options=base_options,
        num_hands=1,
        min_hand_detection_confidence=0.5,
        min_hand_presence_confidence=0.5,
        min_tracking_confidence=0.5)
    
    detector = vision.HandLandmarker.create_from_options(options)

    cap = cv2.VideoCapture(video_path)
    frame_count = 0
    saved_frames = 0
    
    # Create directories for this sample
    images_dir = os.path.join(YOLO_DATA_DIR, 'images', 'train')
    labels_dir = os.path.join(YOLO_DATA_DIR, 'labels', 'train')
    os.makedirs(images_dir, exist_ok=True)
    os.makedirs(labels_dir, exist_ok=True)

    while cap.isOpened():
        success, image = cap.read()
        if not success:
            break

        # Process every 5th frame to avoid redundancy
        if frame_count % 5 != 0:
            frame_count += 1
            continue

        image_rgb = cv2.cvtColor(image, cv2.COLOR_BGR2RGB)
        mp_image = mp.Image(image_format=mp.ImageFormat.SRGB, data=image_rgb)
        detection_result = detector.detect(mp_image)

        if detection_result.hand_landmarks:
            hand_landmarks = detection_result.hand_landmarks[0]
            landmarks = [{'x': lm.x, 'y': lm.y, 'z': lm.z} for lm in hand_landmarks]
            
            yolo_label = convert_to_yolo_format(landmarks, label_id)
            
            if yolo_label:
                frame_name = f"{sample_id}_{saved_frames}"
                img_path = os.path.join(images_dir, f"{frame_name}.jpg")
                lbl_path = os.path.join(labels_dir, f"{frame_name}.txt")
                
                cv2.imwrite(img_path, image)
                with open(lbl_path, 'w') as f:
                    f.write(yolo_label)
                
                saved_frames += 1
            
        frame_count += 1

    cap.release()
    detector.close()
    return saved_frames

def main():
    parser = argparse.ArgumentParser(description='Process MS-ASL data for YOLOv8')
    parser.add_argument('--limit', type=int, default=5, help='Limit number of samples to process')
    parser.add_argument('--subset', type=str, default='train', choices=['train', 'val', 'test'], help='Subset to process')
    args = parser.parse_args()
    
    input_file = os.path.join(os.path.dirname(__file__), MSASL_DIR, f'MSASL_{args.subset}.json')
    
    if not os.path.exists(input_file):
        print(f"Input file not found: {input_file}")
        return

    with open(input_file, 'r') as f:
        data = json.load(f)
        
    print(f"Processing {args.limit} samples for YOLO...")
    
    # Load classes to get IDs
    classes_file = os.path.join(os.path.dirname(__file__), MSASL_DIR, 'MSASL_classes.json')
    with open(classes_file, 'r') as f:
        classes = json.load(f)
    class_to_id = {name: i for i, name in enumerate(classes)}

    count = 0
    for item in data:
        if count >= args.limit:
            break
            
        url = item['url']
        start = item['start_time']
        end = item['end_time']
        label_text = item['clean_text']
        label_id = class_to_id.get(label_text, -1)
        
        if label_id == -1:
            print(f"Skipping unknown label: {label_text}")
            continue

        sample_id = str(uuid.uuid4())[:8]
        print(f"Processing [{count+1}/{args.limit}]: {label_text} (ID: {label_id})")
        
        if not os.path.exists(TEMP_DIR):
            os.makedirs(TEMP_DIR)
        temp_vid_path = os.path.join(TEMP_DIR, f"{sample_id}.mp4")
        
        if download_video_segment(url, start, end, temp_vid_path):
            frames = process_video_to_yolo(temp_vid_path, label_id, sample_id)
            print(f"  -> Success: {frames} frames saved")
            if os.path.exists(temp_vid_path):
                os.remove(temp_vid_path)
        
        count += 1

    # Create dataset.yaml for YOLOv8
    yaml_content = f"""
path: {os.path.abspath(YOLO_DATA_DIR)}
train: images/train
val: images/train # Use train for val in this small test

names:
"""
    for i, name in enumerate(classes):
        yaml_content += f"  {i}: {name}\n"
        
    with open(os.path.join(YOLO_DATA_DIR, 'dataset.yaml'), 'w') as f:
        f.write(yaml_content)
    
    print(f"Dataset ready at {YOLO_DATA_DIR}/dataset.yaml")
    
    if os.path.exists(TEMP_DIR):
        shutil.rmtree(TEMP_DIR)

if __name__ == '__main__':
    main()
