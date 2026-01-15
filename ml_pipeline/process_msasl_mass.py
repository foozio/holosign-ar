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
SHARDED_DIR = 'sharded_data'
TEMP_DIR = 'temp_videos_mass'

def get_shard_path(label):
    safe_label = "".join([c for c in label if c.isalnum() or c in (' ', '_')]).strip().replace(' ', '_')
    return os.path.join(SHARDED_DIR, safe_label)

def download_video_segment(url, start_time, end_time, output_path):
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

def process_video_to_shard(video_path, label, sample_id, detector):
    """
    Extract landmarks/yolo labels and save to shard.
    """
    cap = cv2.VideoCapture(video_path)
    frames_data = []
    yolo_labels = []
    frame_idx = 0
    
    shard_dir = get_shard_path(label)
    img_dir = os.path.join(shard_dir, 'images')
    os.makedirs(img_dir, exist_ok=True)

    while cap.isOpened():
        success, image = cap.read()
        if not success:
            break

        # Extract landmarks every 3rd frame for balance
        if frame_idx % 3 != 0:
            frame_idx += 1
            continue

        image_rgb = cv2.cvtColor(image, cv2.COLOR_BGR2RGB)
        mp_image = mp.Image(image_format=mp.ImageFormat.SRGB, data=image_rgb)
        detection_result = detector.detect(mp_image)

        if detection_result.hand_landmarks:
            hand_landmarks = detection_result.hand_landmarks[0]
            landmarks = [{'x': lm.x, 'y': lm.y, 'z': lm.z} for lm in hand_landmarks]
            
            # 1. Landmark Data
            frames_data.append({
                "t": frame_idx * 33,
                "landmarks": landmarks
            })
            
            # 2. YOLO Data (images + labels)
            # Use label ID 0 for all since we shard by folder?
            # Actually, YOLO training usually needs global IDs.
            # But sharded landmarks are the primary goal for train_dynamic.
            # For YOLO we will stick to the sharded structure for now.
            yolo_label = convert_to_yolo_format(landmarks, 0) # Mock ID 0
            if yolo_label:
                img_name = f"{sample_id}_{len(yolo_labels)}.jpg"
                cv2.imwrite(os.path.join(img_dir, img_name), image)
                yolo_labels.append(yolo_label)
            
        frame_idx += 1

    cap.release()
    
    if not frames_data:
        return False

    # Save sharded landmarks JSON for this sample
    sample_json = {
        "id": sample_id,
        "label": label,
        "frames": frames_data,
        "yolo_labels": yolo_labels
    }
    
    sample_path = os.path.join(shard_dir, f"{sample_id}.json")
    with open(sample_path, 'w') as f:
        json.dump(sample_json, f, indent=2)
        
    return True

def main():
    parser = argparse.ArgumentParser(description='Mass process MS-ASL Top 100')
    parser.add_argument('--limit_signs', type=int, default=5, help='Limit number of signs to process')
    parser.add_argument('--samples_per_sign', type=int, default=10, help='Limit samples per sign')
    args = parser.parse_args()

    # Load targets
    signs_path = os.path.join(os.path.dirname(__file__), 'top_100_signs.json')
    with open(signs_path, 'r') as f:
        target_signs = json.load(f)[:args.limit_signs]

    # Load MS-ASL metadata
    msasl_path = os.path.join(os.path.dirname(__file__), MSASL_DIR, 'MSASL_train.json')
    with open(msasl_path, 'r') as f:
        all_samples = json.load(f)

    # Initialize Detector
    model_path = os.path.join(os.path.dirname(__file__), 'hand_landmarker.task')
    base_options = python.BaseOptions(model_asset_path=model_path)
    options = vision.HandLandmarkerOptions(
        base_options=base_options,
        num_hands=1,
        min_hand_detection_confidence=0.5,
        min_hand_presence_confidence=0.5,
        min_tracking_confidence=0.5)
    detector = vision.HandLandmarker.create_from_options(options)

    print(f"Starting mass processing for {len(target_signs)} signs...")

    for sign in target_signs:
        print(f"\n--- Sign: {sign} ---")
        shard_dir = get_shard_path(sign)
        os.makedirs(shard_dir, exist_ok=True)
        
        # Filter samples for this sign
        sign_samples = [s for s in all_samples if s['clean_text'] == sign]
        print(f"Found {len(sign_samples)} total samples. Processing up to {args.samples_per_sign}...")
        
        count = 0
        for item in sign_samples:
            if count >= args.samples_per_sign:
                break
                
            sample_id = str(uuid.uuid4())[:8]
            url = item['url']
            
            if not os.path.exists(TEMP_DIR):
                os.makedirs(TEMP_DIR)
            temp_vid = os.path.join(TEMP_DIR, f"{sample_id}.mp4")
            
            if download_video_segment(url, item['start_time'], item['end_time'], temp_vid):
                if process_video_to_shard(temp_vid, sign, sample_id, detector):
                    print(f"  [{count+1}] Processed {sample_id}")
                    count += 1
                else:
                    print(f"  [{count+1}] No hands in {sample_id}")
                
                if os.path.exists(temp_vid):
                    os.remove(temp_vid)
            else:
                print(f"  [{count+1}] Failed to download {url}")

    detector.close()
    if os.path.exists(TEMP_DIR):
        shutil.rmtree(TEMP_DIR)
    print("\nMass processing complete.")

if __name__ == '__main__':
    main()
