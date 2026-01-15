# Implementation Plan: YOLOv8 Refactor

## Phase 1: Research and Preparation [checkpoint: 849c132]
- [x] Task: Research YOLOv8 to TensorFlow.js conversion pathways. (bd8219a)
- [x] Task: Identify or prepare a suitable pre-trained YOLOv8 model for ASL. (7d5e2d4)
- [x] Task: Conductor - User Manual Verification 'Research and Preparation' (Protocol in workflow.md) (b6e2360)

## Phase 2: Pipeline Integration [checkpoint: 9b621d9]
- [x] Task: Update the ML pipeline to support YOLOv8 model training and evaluation. (89d1214)
    - [x] Write Tests: Create unit tests for YOLOv8 data loading. (849c132)
    - [x] Implement: Update `process_msasl.py` or create a new script for YOLOv8 data format. (89d1214)
- [x] Task: Conductor - User Manual Verification 'Pipeline Integration' (Protocol in workflow.md) (80ce269)

## Phase 3: Web Application Refactor [checkpoint: 97df53e]
- [x] Task: Integrate the new model into the `StaticModelRunner` and `DynamicModelRunner`. (f171246)
    - [x] Write Tests: Create tests for the new model loading logic. (9b621d9)
    - [x] Implement: Replace existing MediaPipe landmark-based logic with YOLOv8 inference. (f171246)
- [ ] Task: Update the UI to reflect any changes in detection confidence or labels.
- [x] Task: Conductor - User Manual Verification 'Web Application Refactor' (Protocol in workflow.md) (c633f9a)

## Phase 4: Optimization and Finalization
- [x] Task: Optimize inference performance for the browser. (f171246)
- [ ] Task: Final end-to-end testing of all supported signs.
- [ ] Task: Conductor - User Manual Verification 'Optimization and Finalization' (Protocol in workflow.md)
