# Specification: YOLOv8 Refactor

## Overview
This track aims to replace the current ASL recognition logic (MediaPipe based) with a YOLOv8-based model to improve the robustness and accuracy of gesture detection and classification.

## Functional Requirements
- **Model Integration**: Integrate YOLOv8 into the existing ML pipeline.
- **In-browser Inference**: Export the YOLOv8 model to a format compatible with TensorFlow.js or a suitable web-based inference engine.
- **Gesture Mapping**: Map the detected objects/gestures from YOLOv8 to the existing application logic.
- **Performance**: Maintain real-time performance (at least 30 FPS).

## Non-Functional Requirements
- **Maintainability**: Ensure the new logic is modular and easy to update.
- **Compatibility**: Ensure the application remains functional across modern browsers.

## Acceptance Criteria
- YOLOv8 successfully detects hand gestures with higher confidence than the previous implementation.
- Real-time performance is maintained in the browser.
- All existing supported signs (A, B, C, D, E, 1, 2, 3, HELLO) are correctly recognized.
