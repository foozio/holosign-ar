import json
import os
import argparse
import math
import uuid
import time
import shutil
import cv2
import numpy as np

# Try importing dependencies
try:
    import mediapipe as mp
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
OUTPUT_FILE = '../msasl_processed_data.json'
TEMP_DIR = 'temp_videos'

def normalize_landmarks(landmarks):
    """
    Replicates the normalization logic from src/features/HandFeatures.ts
    Scale based on Wrist (0) to Middle MCP (9) distance.
    Origin at Wrist.
    """
    wrist = landmarks[0]
    middle_mcp = landmarks[9]
    
    dist = math.sqrt((wrist['x'] - middle_mcp['x'])**2 + 
                     (wrist['y'] - middle_mcp['y'])**2 + 
                     (wrist['z'] - middle_mcp['z'])**2)
                     
    if dist == 0: 
        return landmarks 
    
    norm_landmarks = []
    for lm in landmarks:
        norm_landmarks.append({
            'x': (lm['x'] - wrist['x']) / dist,
            'y': (lm['y'] - wrist['y']) / dist,
            'z': (lm['z'] - wrist['z']) / dist
        })
    return norm_landmarks

def download_video_segment(url, start_time, end_time, output_path):
    """
    Downloads a specific segment of a YouTube video using yt-dlp.
    """
    # Create temp dir if not exists
    if not os.path.exists(TEMP_DIR):
        os.makedirs(TEMP_DIR)
        
    ydl_opts = {
        'format': 'best[ext=mp4]',
        'outtmpl': output_path,
        'quiet': True,
        'download_ranges': lambda info, ydl: [{'start_time': start_time, 'end_time': end_time}],
        'force_keyframes_at_cuts': True, # Re-encode to ensure precise cuts
    }
    
    try:
        with yt_dlp.YoutubeDL(ydl_opts) as ydl:
            ydl.download([url])
        return True
    except Exception as e:
        print(f"Failed to download {url}: {e}")
        return False

def process_video(video_path, label):
    """
    Process video with MediaPipe Tasks API and return sample object.
    """
    import mediapipe as mp
    from mediapipe.tasks import python
    from mediapipe.tasks.python import vision

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
    frames_data = []
    frame_idx = 0
    
    while cap.isOpened():
        success, image = cap.read()
        if not success:
            break

        # Convert BGR to RGB
        image_rgb = cv2.cvtColor(image, cv2.COLOR_BGR2RGB)
        
        # Convert to MediaPipe Image
        mp_image = mp.Image(image_format=mp.ImageFormat.SRGB, data=image_rgb)
        
        # Detect
        detection_result = detector.detect(mp_image)

        if detection_result.hand_landmarks:
            # Take the first hand found
            hand_landmarks = detection_result.hand_landmarks[0]
            
            # Convert to list of dicts
            landmarks = []
            for lm in hand_landmarks:
                landmarks.append({'x': lm.x, 'y': lm.y, 'z': lm.z})
            
            # Normalize
            norm_landmarks = normalize_landmarks(landmarks)
            
            frames_data.append({
                "t": frame_idx * 33, # Assume ~30fps
                "landmarks": landmarks, # Raw
                "features": {
                    "norm": norm_landmarks
                }
            })
            
        frame_idx += 1

    cap.release()
    detector.close()
    
    if len(frames_data) == 0:
        return None
        
    return {
        "id": str(uuid.uuid4()),
        "label": label, # String label
        "type": "dynamic", # MS-ASL is dynamic
        "handedness": "Unknown",
        "frames": frames_data,
        "summary": {
            "durationMs": frame_idx * 33
        },
        "timestamp": int(time.time() * 1000)
    }

def main():
    parser = argparse.ArgumentParser(description='Process MS-ASL data')
    parser.add_argument('--limit', type=int, default=10, help='Limit number of samples to process')
    parser.add_argument('--subset', type=str, default='train', choices=['train', 'val', 'test'], help='Subset to process')
    args = parser.parse_args()
    
    input_file = os.path.join(MSASL_DIR, f'MSASL_{args.subset}.json')
    
    if not os.path.exists(input_file):
        print(f"Input file not found: {input_file}")
        return

    print(f"Loading {input_file}...")
    with open(input_file, 'r') as f:
        data = json.load(f)
        
    print(f"Found {len(data)} samples. Processing first {args.limit}...")
    
    processed_samples = []
    
    # Load existing if file exists?
    # For now, overwrite or append? Let's just create new list.
    
    count = 0
    for item in data:
        if count >= args.limit:
            break
            
        url = item['url']
        start = item['start_time']
        end = item['end_time']
        label_text = item['clean_text'] # Use clean text as label
        
        # Clean up URL
        if 'youtube.com' not in url and 'youtu.be' not in url:
             url = f"https://www.youtube.com/watch?v={url}" if 'www' not in url else f"https://{url}"

        print(f"Processing [{count+1}/{args.limit}]: {label_text} ({url})")
        
        temp_vid_path = os.path.join(TEMP_DIR, f"{item['file']}.mp4")
        
        # Download
        if download_video_segment(url, start, end, temp_vid_path):
            # Process
            sample = process_video(temp_vid_path, label_text)
            if sample:
                processed_samples.append(sample)
                print(f"  -> Success: {len(sample['frames'])} frames")
            else:
                print("  -> No hands detected")
            
            # Clean up temp file
            if os.path.exists(temp_vid_path):
                os.remove(temp_vid_path)
        
        count += 1

    # Save output
    output_data = {
        "meta": {
            "dataset": "msasl-processed",
            "version": "1.0",
            "createdAt": "2026-01-15T00:00:00.000Z",
            "fps": 30,
            "notes": f"Processed from {input_file}"
        },
        "samples": processed_samples
    }
    
    with open(OUTPUT_FILE, 'w') as f:
        json.dump(output_data, f, indent=2)
        
    print(f"Saved {len(processed_samples)} samples to {OUTPUT_FILE}")
    
    # Clean up temp dir
    if os.path.exists(TEMP_DIR):
        shutil.rmtree(TEMP_DIR)

if __name__ == '__main__':
    main()
