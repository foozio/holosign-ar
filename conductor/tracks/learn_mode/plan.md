# Implementation Plan: Learn Mode

## Phase 1: Architecture and State [checkpoint: 2a084cc]
- [x] Task: Update `App.ts` and `App` class to support `learn` mode. (2a084cc)
- [x] Task: Create `LearnController.ts` to manage target signs and evaluation state. (2a084cc)
- [x] Task: Conductor - User Manual Verification 'Architecture and State' (Protocol in workflow.md) (2a084cc)

## Phase 2: User Interface [checkpoint: 5be812f]
- [x] Task: Implement the Learn Mode UI panel in `App.ts`. (5be812f)
- [x] Task: Add the reference image display logic for target signs. (5be812f)
- [x] Task: Conductor - User Manual Verification 'User Interface' (Protocol in workflow.md) (5be812f)

## Phase 3: Logic and Feedback [ ]
- [ ] Task: Implement the "Match" logic in `LearnController`.
    - [ ] Write Tests: Create unit tests for matching detection results to targets.
    - [ ] Implement: Add comparison logic with confidence thresholds.
- [ ] Task: Integrate visual feedback (e.g., success animations/colors) into the UI.
- [ ] Task: Conductor - User Manual Verification 'Logic and Feedback'

## Phase 4: Finalization [ ]
- [ ] Task: Implement sign progression (Next sign logic).
- [ ] Task: Final end-to-end testing with all available reference signs (A-E).
- [ ] Task: Conductor - User Manual Verification 'Finalization'
