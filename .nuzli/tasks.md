# Project Tasks & Roadmap

## Phase 1: Foundation (Completed)
- [x] **Project Setup**: Initialize Vite, TypeScript, and Git repository.
- [x] **Camera Access**: Implement `Webcam` class.
- [x] **Hand Tracking**: Integrate `MediaPipeHands`.
- [x] **Visuals**: Create `ThreeOverlay` for 3D skeleton rendering.
- [x] **Basic Recognition**: Implement heuristic classifiers for A-E, 1-3.

## Phase 2: Data & ML Infrastructure (Completed)
- [x] **Data Capture UI**: Implement recording panel in `App.ts`.
- [x] **Dataset Schema**: Define `DatasetTypes` and `DatasetStore`.
- [x] **Controller Logic**: specific `CaptureController` for validation and session management.
- [x] **Feature Vector**: Implement feature extraction consistent with training.
- [x] **Inference Runners**: Build `StaticModelRunner` and `DynamicModelRunner` for TFJS.
- [x] **Training Scripts**: Create Python pipeline (`train_static.py`, `train_dynamic.py`).

## Phase 3: Dataset Collection (Current)
- [ ] **Data Collection**: Record ~100 samples per gesture using Capture Mode.
- [ ] **Validation**: Verify JSON structure and data quality.
- [ ] **Training**: Run Python scripts to generate `model.json` artifacts.
- [ ] **Deployment**: Place models in `public/models` and enable ML flag in `Recognizer`.

## Phase 4: Refinement & Expansion (Future)
- [ ] **Mobile Optimization**: Optimize Three.js renderer for mobile browsers.
- [ ] **UI Polish**: Add onboarding guide and better feedback animations.
- [ ] **Two-Hand Support**: Update Capture/Recognition logic for simultaneous two-hand signs.
- [ ] **Cloud Storage**: Integrate S3/Supabase for cloud-based dataset storage (optional).
