# Specification: Learn Mode

## Goal
To provide an interactive environment where users can learn ASL signs by attempting to mimic a target sign and receiving immediate feedback based on YOLOv8 detection.

## Requirements
1. **Target Display**: UI must show a reference image/animation of the target sign.
2. **Real-time Evaluation**: The system must compare the user's current gesture (via YOLO) against the target sign.
3. **Feedback Loop**: Provide clear visual cues when the user is correct (e.g., green highlight, progress bar fill).
4. **Progression**: Allow users to move through a sequence of signs (e.g., A -> B -> C).

## UI/UX
- A new "Learn" tab in the mode switcher.
- A central area for the "Target" sign reference.
- A "Match" indicator that lights up when the user holds the correct pose.
- A "Next" button or automatic transition upon success.
