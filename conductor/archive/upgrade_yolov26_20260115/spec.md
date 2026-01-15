# Track Specification: Upgrade to YOLOv26

## Overview
This track focuses on upgrading the machine learning model from the standard YOLO version (likely v8 or v11 currently referenced) to the cutting-edge "YOLOv26" architecture (assuming availability or a specific configuration provided by the user). This involves updating the training pipeline, retraining the model, and verifying the export process.

## Goals
- Update `ml_pipeline/train_yolo.py` to target the YOLOv26 model variant.
- Retrain the model on the existing or new dataset.
- Export the YOLOv26 model to TF.js format.
- Verify integration with the frontend.

## Technical Requirements
- **Model Architecture:** YOLOv26 (e.g., `yolov26n.pt` or equivalent).
- **Training Script:** Modification of `model_variant` parameter.
- **Export:** Ensure TF.js export compatibility with the new architecture.

## Success Criteria
- Training script successfully runs with YOLOv26.
- Model exports to TF.js without errors.
- Frontend loads and runs the new model (fallback logic handles errors if model file missing).
