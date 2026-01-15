# Implementation Plan: Learn Mode

## Phase 1: Architecture and State [x]
- [x] Task: Update `App.ts` and `App` class to support `learn` mode. (0bbe909)
- [x] Task: Create `LearnController.ts` to manage target signs and evaluation state. (122cf5e)
- [x] Task: Conductor - User Manual Verification 'Architecture and State' (Protocol in workflow.md) (417b2e9)

## Phase 2: User Interface [ ]
- [ ] Task: Implement the Learn Mode UI panel in `App.ts`.
- [ ] Task: Add the reference image display logic for target signs.
- [ ] Task: Conductor - User Manual Verification 'User Interface'

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
