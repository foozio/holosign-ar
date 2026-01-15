# Product Requirements Document: HoloSign AR

## 1. Introduction
**HoloSign AR** is a web-based Augmented Reality application designed to interpret and teach American Sign Language (ASL) in real-time. By leveraging computer vision (MediaPipe) and machine learning (TensorFlow.js), it translates hand gestures into text and provides visual feedback to the user.

## 2. Goals & Objectives
*   **Accessibility:** Bridge the communication gap by translating basic ASL gestures to text.
*   **Education:** Provide an interactive tool for users to learn and practice ASL.
*   **Performance:** Run efficiently in the browser on consumer-grade hardware without backend dependencies.

## 3. Target Audience
*   ASL Learners
*   Educators
*   Developers experimenting with WebAR and ML

## 4. Key Features

### 4.1. Real-time Recognition (Interpret Mode)
*   **Hand Tracking:** Detects hand landmarks using MediaPipe.
*   **Hybrid Recognition:** Combines heuristic rule-based checks with Machine Learning models.
*   **Feedback:** Displays recognized text ("A", "B", etc.) and confidence levels.
*   **Visual Overlay:** Renders skeleton/joints on the video feed.

### 4.2. Data Capture (Capture Mode)
*   **Dataset Creation:** Allows users to record gesture samples.
*   **Labeling:** Users can select labels (A-Z, 1-10) and handedness.
*   **Export:** Download captured datasets as JSON for model training.

### 4.3. User Interface
*   **HUD:** Shows recognition results and confidence.
*   **Controls:** Toggle mirror mode, hand lock (Left/Right/Auto), and debug views.
*   **Guide:** Displays reference images for selected gestures during capture.

## 5. Technical Requirements
*   **Platform:** Modern Web Browser (Chrome, Firefox, Safari) with WebGL and Camera access.
*   **Stack:** TypeScript, Vite, Three.js, TensorFlow.js, MediaPipe.
*   **Privacy:** All processing must happen locally on the client device.

## 6. User Flows
*   **Interpret:** Open App -> Grant Camera -> Perform Sign -> See Text.
*   **Capture:** Switch Mode -> Select Label -> Align Hand -> Record -> Download Data.

## 7. Future Scope
*   Dynamic gesture recognition (movement-based signs).
*   Sentence construction.
*   Gamified learning modules.