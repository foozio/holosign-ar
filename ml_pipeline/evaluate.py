import numpy as np
import tensorflow as tf
import json
import os
from sklearn.metrics import classification_report, confusion_matrix
try:
    import seaborn as sns
    import matplotlib.pyplot as plt
    HAS_PLOT = True
except ImportError:
    HAS_PLOT = False

import argparse

# Config
DEFAULT_DATASET_PATH = '../capture_data.json'
STATIC_MODEL_PATH = 'static_model/model.h5'
DYNAMIC_MODEL_PATH = 'dynamic_model/model.h5'
VECTOR_SIZE = 63
WINDOW_SIZE = 30

def pad_sequence(seq, max_len):
    if len(seq) > max_len:
        return seq[:max_len]
    pad_len = max_len - len(seq)
    padding = [seq[-1]] * pad_len if seq else [[0]*VECTOR_SIZE] * pad_len
    return seq + padding

def load_dataset(path):
    if not os.path.exists(path):
        return None
    with open(path, 'r') as f:
        return json.load(f)

def evaluate_static(data):
    if not os.path.exists(STATIC_MODEL_PATH):
        print("Static model not found at", STATIC_MODEL_PATH)
        return

    print("\n--- Evaluating Static Model ---")
    model = tf.keras.models.load_model(STATIC_MODEL_PATH)
    
    X = []
    y_true = []
    
    for sample in data['samples']:
        if sample['type'] != 'static': continue
        
        # Eval on every frame? Or average?
        # Let's eval on every 5th frame to speed up
        for frame in sample['frames'][::5]:
             landmarks = frame['features']['norm']
             vector = []
             for lm in landmarks:
                 vector.extend([lm['x'], lm['y'], lm['z']])
             if len(vector) == VECTOR_SIZE:
                 X.append(vector)
                 y_true.append(sample['label'])

    if not X:
        print("No static data samples found in dataset.")
        return

    X = np.array(X)
    y_pred_probs = model.predict(X)
    y_pred = np.argmax(y_pred_probs, axis=1)
    
    unique_labels = sorted(list(set(y_true)))
    label_to_int = {l: i for i, l in enumerate(unique_labels)}
    y_true_int = [label_to_int[l] for l in y_true]
    
    print(classification_report(y_true_int, y_pred, target_names=unique_labels))
    
    if HAS_PLOT:
        cm = confusion_matrix(y_true_int, y_pred)
        plt.figure(figsize=(10,8))
        sns.heatmap(cm, annot=True, fmt='d', xticklabels=unique_labels, yticklabels=unique_labels)
        plt.title('Static Confusion Matrix')
        plt.ylabel('Actual')
        plt.xlabel('Predicted')
        plt.savefig('static_confusion_matrix.png')
        print("Saved static_confusion_matrix.png")

def evaluate_dynamic(data):
    if not os.path.exists(DYNAMIC_MODEL_PATH):
        print("Dynamic model not found at", DYNAMIC_MODEL_PATH)
        return

    print("\n--- Evaluating Dynamic Model ---")
    model = tf.keras.models.load_model(DYNAMIC_MODEL_PATH)
    
    X = []
    y_true = []
    
    for sample in data['samples']:
        if sample['type'] != 'dynamic': continue
        
        sequence = []
        for frame in sample['frames']:
            landmarks = frame['features']['norm']
            vector = []
            for lm in landmarks:
                vector.extend([lm['x'], lm['y'], lm['z']])
            sequence.append(vector)
            
        # Pad using the same logic as training
        padded_seq = pad_sequence(sequence, WINDOW_SIZE)
            
        if len(padded_seq) == WINDOW_SIZE:
            X.append(padded_seq)
            y_true.append(sample['label'])
            
    if not X:
        print("No dynamic data samples found in dataset.")
        return

    X = np.array(X)
    y_pred_probs = model.predict(X)
    y_pred = np.argmax(y_pred_probs, axis=1)
    
    unique_labels = sorted(list(set(y_true)))
    label_to_int = {l: i for i, l in enumerate(unique_labels)}
    y_true_int = [label_to_int[l] for l in y_true]
    
    print(classification_report(y_true_int, y_pred, target_names=unique_labels))

def main():
    parser = argparse.ArgumentParser(description='Evaluate ASL models')
    parser.add_argument('--data', type=str, default=DEFAULT_DATASET_PATH, help='Path to dataset JSON')
    args = parser.parse_args()

    data = load_dataset(args.data)
    if not data:
        print(f"Dataset not found at {args.data}")
        return
        
    evaluate_static(data)
    evaluate_dynamic(data)

if __name__ == '__main__':
    main()
