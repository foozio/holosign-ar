# Actionable Tasks

## Refactoring
- [ ] **Refactor `App.ts`:** Split UI creation logic into a separate `UIManager` class.
- [ ] **Constants:** Move magic numbers from `StaticASLClassifier` to a `RecognitionConfig.ts` file.
- [ ] **Types:** Ensure strict typing is consistent (remove `any` casts in `MediaPipeHands`).

## Features
- [ ] **Model Loading:** Implement the actual file loading for TFJS models in `ModelLoader.ts` and ensure paths are correct.
- [ ] **Visual Feedback:** Add a visual indicator when a gesture is recognized (e.g., flash the text or play a sound).
- [ ] **Dynamic Mode:** Implement the logic for `DynamicASLDetector` (currently a placeholder).

## Pipeline / ML
- [ ] **Export Script:** Create a script to run `tensorflowjs_converter` automatically after training.
- [ ] **Data Validation:** Add a script to validate captured JSON data before training.

## Documentation & Testing
- [ ] **Unit Tests:** Write Jest tests for `StaticASLClassifier`.
- [ ] **Readme:** Update README with instructions on how to capture data and train the model.