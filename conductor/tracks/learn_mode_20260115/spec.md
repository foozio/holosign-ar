# Track Specification: Learn Mode

## Overview
This track implements the "Learn Mode" feature for HoloSign AR. This mode allows users to select a specific ASL sign (from the supported alphabet and numbers) and receive targeted practice instructions. The user will see a reference image of the sign and real-time feedback on their own hand positioning.

## Goals
- Create a dedicated "Learn Mode" view in the UI.
- Implement a sign selection mechanism (e.g., a carousel or grid).
- Display a reference image for the selected sign.
- Use the existing `StaticModelRunner` or `DynamicModelRunner` to score the user's attempt against the selected sign.
- Provide visual feedback (e.g., color changes, progress bar) based on the confidence score.

## User Stories
- As a user, I want to enter "Learn Mode" from the main menu so I can practice specific signs.
- As a user, I want to scroll through a list of available signs and select one to practice.
- As a user, I want to see a clear reference image of how to perform the selected sign.
- As a user, I want to see a "Success" indicator when I correctly mimic the sign.

## Technical Requirements
- **UI Components:**
    - `LearnModeView`: Container for the learn mode interface.
    - `SignSelector`: Component to browse and pick signs.
    - `ReferenceDisplay`: Component to show the static image or animation of the target sign.
    - `FeedbackOverlay`: HUD element to show matching confidence/success.
- **State Management:**
    - Track the currently selected sign.
    - Track the current "match status" (e.g., matching, holding, success).
- **Integration:**
    - Utilize `Webcam` for input.
    - Utilize `MediaPipeHands` for tracking.
    - Utilize `StaticASLClassifier` (and potentially dynamic ones) for validation.

## Visual Style
- Adhere to the "Cyberpunk" aesthetic: neon accents, HUD-style borders, and a dark theme.
