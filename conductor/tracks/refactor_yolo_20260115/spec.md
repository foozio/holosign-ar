# Track Specification: Ultralytics YOLO Integration

## Overview
This track involves refactoring the existing ASL recognition system to utilize Ultralytics YOLO (potentially YOLOv11 or a future version like "yolo26" as specified) for hand detection and gesture classification. It also includes setting up a pipeline to fetch and process datasets from Roboflow.

## Goals
- Integrate the `ultralytics` Python package into the `ml_pipeline`.
- Implement a script to download and format datasets from Roboflow.
- Train a custom YOLO model optimized for hand gestures.
- Export the trained model to a format compatible with the browser (e.g., TF.js or ONNX).
- Refactor `src/ml/StaticModelRunner.ts` (and potentially others) to support the new model format.

## Technical Requirements
- **Python Environment:** Update `ml_pipeline` with `ultralytics` and `roboflow` dependencies.
- **Model Architecture:** YOLO-based object detection or classification.
- **Data Pipeline:** Scripts for automated dataset preparation.
- **Browser Runtime:** Integration with `tensorflow.js` or `onnxruntime-web`.

## Success Criteria
- Improved classification accuracy compared to the current rule-based/static model.
- Robustness against different lighting conditions and backgrounds.
- Real-time performance (at least 30 FPS) maintained in the browser.
