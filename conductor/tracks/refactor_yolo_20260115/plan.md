# Implementation Plan - Ultralytics YOLO Integration

## Phase 1: Data & Pipeline Setup [checkpoint: 2911b04]
- [x] Task: Configure Python Environment 9757f5b
    - [ ] Add `ultralytics` and `roboflow` to a new `ml_pipeline/requirements.txt`.
    - [ ] Create a setup script for the ML environment.
- [x] Task: Create Dataset Download Script 56d55f5
    - [ ] Implement `ml_pipeline/download_dataset.py` using the Roboflow API.
    - [ ] Verify dataset structure matches Ultralytics YOLO requirements.
- [x] Task: Conductor - User Manual Verification 'Data & Pipeline Setup' (Protocol in workflow.md)

## Phase 2: Model Training & Export [checkpoint: dd9d7d6]
- [x] Task: Implement Training Script 74f94af
    - [ ] Create `ml_pipeline/train_yolo.py` using the Ultralytics API.
    - [ ] Define hyperparameters and model configuration.
- [x] Task: Export to Browser-Compatible Format 077979b
    - [ ] Implement export logic (e.g., `model.export(format='tfjs')`).
    - [ ] Optimize the model for web performance (quantization).
- [x] Task: Conductor - User Manual Verification 'Model Training & Export' (Protocol in workflow.md)

## Phase 3: Frontend Refactoring
- [x] Task: Update Model Loading 68492f2
    - [ ] Refactor `src/ml/ModelLoader.ts` to support the new exported format.
- [ ] Task: Refactor Static Recognition Logic
    - [ ] Update `src/ml/StaticModelRunner.ts` to use the YOLO model output.
    - [ ] Update `Recognizer.ts` to handle the new detection/classification flow.
- [ ] Task: Conductor - User Manual Verification 'Frontend Refactoring' (Protocol in workflow.md)
