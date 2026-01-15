import json
import numpy as np
import tensorflow as tf
from sklearn.model_selection import train_test_split
from sklearn.preprocessing import LabelEncoder
import os

# Configuration
DATASET_PATH = '../capture_data.json' # Placeholder
MODEL_SAVE_PATH = 'static_model'
VECTOR_SIZE = 63

def load_data(path):
    if not os.path.exists(path):
        print(f"Dataset not found at {path}")
        return np.array([]), np.array([])
        
    with open(path, 'r') as f:
        data = json.load(f)
    
    X = []
    y = []
    
    for sample in data['samples']:
        if sample['type'] != 'static':
            continue
            
        label = sample['label']
        # For static, we might use the summary median, or all frames?
        # Let's use all frames to increase data size
        for frame in sample['frames']:
            #Flatten normalized landmarks
            landmarks = frame['features']['norm']
            vector = []
            for lm in landmarks:
                vector.extend([lm['x'], lm['y'], lm['z']])
            
            if len(vector) == VECTOR_SIZE:
                X.append(vector)
                y.append(label)
                
    return np.array(X), np.array(y)

def create_model(num_classes):
    model = tf.keras.Sequential([
        tf.keras.layers.Dense(128, activation='relu', input_shape=(VECTOR_SIZE,)),
        tf.keras.layers.Dropout(0.2),
        tf.keras.layers.Dense(64, activation='relu'),
        tf.keras.layers.Dropout(0.2),
        tf.keras.layers.Dense(num_classes, activation='softmax')
    ])
    
    model.compile(optimizer='adam',
                  loss='sparse_categorical_crossentropy',
                  metrics=['accuracy'])
    return model

def main():
    print("Loading data...")
    X, y = load_data(DATASET_PATH)
    
    if len(X) == 0:
        print("No data found. Please capture data first.")
        return

    print(f"Loaded {len(X)} samples.")
    
    # Encode labels
    le = LabelEncoder()
    y_enc = le.fit_transform(y)
    classes = le.classes_
    print("Classes:", classes)
    
    # Split
    X_train, X_test, y_train, y_test = train_test_split(X, y_enc, test_size=0.2, random_state=42)
    
    # Train
    model = create_model(len(classes))
    model.fit(X_train, y_train, epochs=50, batch_size=32, validation_data=(X_test, y_test))
    
    # Evaluate
    loss, acc = model.evaluate(X_test, y_test)
    print(f"Test Accuracy: {acc*100:.2f}%")
    
    # Save
    if not os.path.exists(MODEL_SAVE_PATH):
        os.makedirs(MODEL_SAVE_PATH)
        
    model.save(f"{MODEL_SAVE_PATH}/model.h5")
    
    # Save classes
    with open(f"{MODEL_SAVE_PATH}/classes.json", 'w') as f:
        json.dump(list(classes), f)
    
    # Export to TFJS
    # Note: Requires tensorflowjs pip package
    # tensorflowjs_converter --input_format=keras static_model/model.h5 ../public/models/static_model
    print("To export for web: tensorflowjs_converter --input_format=keras static_model/model.h5 ../public/models/static_model")

if __name__ == '__main__':
    main()
