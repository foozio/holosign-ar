# Product Requirements Document (PRD)
## Project: HoloSign AR - ASL Interpreter & Data Capture

### 1. Introduction
HoloSign AR is a web-based Augmented Reality application designed to teach and interpret American Sign Language (ASL) in real-time using computer vision. The current iteration focuses on a dual-purpose system:
1.  **Interpretation:** Real-time recognition of static (A-E, 1-3) and dynamic (HELLO) ASL gestures.
2.  **Data Capture & ML Training:** A robust pipeline for capturing labeled hand data to train custom Machine Learning models.

### 2. Goals & Objectives
*   **Accessibility:** Provide an easy-to-use, browser-based tool for ASL recognition without requiring specialized hardware.
*   **Privacy:** Perform all processing locally on the device (Edge AI) to ensure user privacy.
*   **Extensibility:** Enable developers and researchers to easily collect high-quality datasets for training new gesture models.

### 3. Key Features

#### 3.1. Hand Tracking & Visualization
*   **Real-time Tracking:** Uses MediaPipe Hands to detect 21 3D landmarks per hand.
*   **3D Overlay:** Renders a 3D skeletal overlay using Three.js mapped to the video feed.
*   **Smoothing:** Implements OneEuroFilter to reduce jitter in landmark tracking.

#### 3.2. interpretation Mode
*   **Hybrid Recognition Engine:**
    *   **Rule-Based:** Heuristic classifiers for immediate feedback (e.g., specific finger curls for numbers).
    *   **ML-Based:** Support for loading TensorFlow.js models for complex non-linear classification.
*   **Classification:**
    *   **Static:** A, B, C, D, E, 1, 2, 3, IDLE_OPEN, IDLE_FIST.
    *   **Dynamic:** "HELLO" wave detection.
*   **Feedback:** Visual caption overlay with confidence scores.

#### 3.3. Data Capture Mode
*   **Interactive UI:** Dedicated panel for labeling and recording gestures.
*   **Configuration:** Select Label, Sample Type (Static/Dynamic), and Handedness.
*   **Validation:** Automatic filtering of poor-quality frames (low confidence, wrong hand).
*   **Storage:** In-memory session management with JSON export.
*   **Format:** Structured JSON dataset containing raw landmarks and derived features.

#### 3.4. ML Infrastructure
*   **Feature Extraction:** Converts 3D landmarks into normalized feature vectors (63 dimensions).
*   **Model Runners:**
    *   `StaticModelRunner`: Logic for MLP-based static gesture recognition.
    *   `DynamicModelRunner`: Logic for Window-based (LSTM/CNN) dynamic gesture recognition.
*   **Training Pipeline:** Python scripts (`train_static.py`, `train_dynamic.py`) to train models on captured data and export to TFJS.

### 4. Technical Stack
*   **Frontend:** TypeScript, Vite
*   **Rendering:** Three.js
*   **Computer Vision:** MediaPipe Hands (@mediapipe/hands)
*   **Machine Learning:** TensorFlow.js (@tensorflow/tfjs), Python (libraries: tensorflow, sklearn, numpy)
*   **State Management:** Custom Store pattern (`DatasetStore`)

### 5. Future Roadmap
*   **Expanded Vocabulary:** Support full alphabet and common phrases.
*   **Two-Hand Support:** Recognize complex two-handed signs.
*   **Gamification:** Interactive lessons and quizzes.
*   **Mobile App:** Wrapper for iOS/Android native deployment.
