import json
import numpy as np
import tensorflow as tf
from sklearn.model_selection import train_test_split
from sklearn.preprocessing import LabelEncoder
import os

# Configuration
DATASET_PATH = '../capture_data.json'
MODEL_SAVE_PATH = 'dynamic_model'
VECTOR_SIZE = 63
WINDOW_SIZE = 30 # Must match runner

def pad_sequence(seq, max_len):
    # Pad with zeros or duplicate last frame?
    # Interactive capture enforces length approx, but let's be safe
    if len(seq) > max_len:
        return seq[:max_len]
    pad_len = max_len - len(seq)
    padding = [seq[-1]] * pad_len if seq else [[0]*VECTOR_SIZE] * pad_len
    return seq + padding

def load_data(path):
    if not os.path.exists(path):
        return np.array([]), np.array([])
        
    with open(path, 'r') as f:
        data = json.load(f)
    
    X = []
    y = []
    
    for sample in data['samples']:
        if sample['type'] != 'dynamic':
            continue
            
        label = sample['label']
        
        sequence = []
        for frame in sample['frames']:
            landmarks = frame['features']['norm']
            vector = []
            for lm in landmarks:
                vector.extend([lm['x'], lm['y'], lm['z']])
            sequence.append(vector)
            
        # Pad/Truncate
        padded_seq = pad_sequence(sequence, WINDOW_SIZE)
        
        if len(padded_seq) == WINDOW_SIZE:
            X.append(padded_seq)
            y.append(label)
                
    return np.array(X), np.array(y)

def create_model(num_classes):
    model = tf.keras.Sequential([
        tf.keras.layers.Input(shape=(WINDOW_SIZE, VECTOR_SIZE)),
        # 1D CNN + LSTM or just LSTM/GRU
        tf.keras.layers.Conv1D(filters=64, kernel_size=3, activation='relu'),
        tf.keras.layers.MaxPooling1D(pool_size=2),
        tf.keras.layers.LSTM(64, return_sequences=False),
        tf.keras.layers.Dropout(0.3),
        tf.keras.layers.Dense(32, activation='relu'),
        tf.keras.layers.Dense(num_classes, activation='softmax')
    ])
    
    model.compile(optimizer='adam',
                  loss='sparse_categorical_crossentropy',
                  metrics=['accuracy'])
    return model

def main():
    print("Loading dynamic data...")
    X, y = load_data(DATASET_PATH)
    
    if len(X) == 0:
        print("No dynamic data found.")
        return

    print(f"Loaded {len(X)} sequences.")
    
    # Encode labels
    le = LabelEncoder()
    y_enc = le.fit_transform(y)
    classes = le.classes_
    print("Classes:", classes)
    
    X_train, X_test, y_train, y_test = train_test_split(X, y_enc, test_size=0.2, random_state=42)
    
    model = create_model(len(classes))
    model.fit(X_train, y_train, epochs=50, batch_size=16, validation_data=(X_test, y_test))
    
    loss, acc = model.evaluate(X_test, y_test)
    print(f"Test Accuracy: {acc*100:.2f}%")
    
    if not os.path.exists(MODEL_SAVE_PATH):
        os.makedirs(MODEL_SAVE_PATH)
        
    model.save(f"{MODEL_SAVE_PATH}/model.h5")
    print("Export command: tensorflowjs_converter --input_format=keras dynamic_model/model.h5 ../public/models/dynamic_model")

if __name__ == '__main__':
    main()
