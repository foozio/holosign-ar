# Implementation Plan - Learn Mode

## Phase 1: Core UI & Navigation
- [x] Task: Create Learn Mode Container Component d72eb46
    - [ ] Create `src/ui/LearnMode/LearnModeView.ts` (or similar structure).
    - [ ] Implement basic layout matching the Cyberpunk HUD style.
    - [ ] Add navigation to switch between "Interpret Mode" and "Learn Mode" in `src/ui/App.ts`.
- [x] Task: Implement Sign Selector bc96908
    - [ ] Create `src/ui/LearnMode/SignSelector.ts`.
    - [ ] Populate with list of supported signs (A-E, 1-3, HELLO).
    - [ ] Handle selection events to update the active sign state.
- [ ] Task: Conductor - User Manual Verification 'Core UI & Navigation' (Protocol in workflow.md)

## Phase 2: Logic & Feedback Integration
- [ ] Task: Connect Recognition Logic
    - [ ] In `LearnModeView`, subscribe to `Recognizer` output.
    - [ ] Implement logic to compare the `Recognizer`'s predicted sign with the *selected* sign.
- [ ] Task: Implement Visual Feedback
    - [ ] Create `src/ui/LearnMode/FeedbackOverlay.ts`.
    - [ ] specific visual cues:
        - Red/Neutral border: No match.
        - Yellow/Glowing border: Partial/Low confidence match.
        - Green/Bright border + Sound/Effect: High confidence match (Success).
- [ ] Task: Conductor - User Manual Verification 'Logic & Feedback Integration' (Protocol in workflow.md)

## Phase 3: Polish & Assets
- [ ] Task: Add Reference Images
    - [ ] Ensure `public/assets/reference/` contains images for all supported signs.
    - [ ] Integrate `ReferenceDisplay` to show the correct image for the selected sign.
- [ ] Task: Refine Styles
    - [ ] Apply final CSS polish for the holographic/neon look.
    - [ ] Ensure responsiveness on different screen sizes.
- [ ] Task: Conductor - User Manual Verification 'Polish & Assets' (Protocol in workflow.md)
