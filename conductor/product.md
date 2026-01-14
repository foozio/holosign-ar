# Product Definition

## Initial Concept
A browser-based augmented reality 3D ASL hand-gesture interpreter using MediaPipe Hands and Three.js. The application provides real-time hand tracking, 3D skeleton visualization, and translation of static and dynamic American Sign Language (ASL) gestures into text, all running locally in the browser for privacy.

## Target Users
- **ASL Learners:** Individuals wanting to practice and receive real-time visual feedback on their signing accuracy.
- **Communication Support:** Tools for bridging communication gaps using real-time interpretation.
- **Tech Enthusiasts:** Developers and users interested in the capabilities of Web based AR and ML.

## Core Value Proposition
- **Accessibility:** Runs directly in a web browser without complex installations or specialized hardware.
- **Privacy:** All processing happens on-device; no video feeds are sent to the cloud.
- **Interactivity:** Provides immediate visual confirmation of hand tracking and gesture recognition via 3D overlays.

## Key Features
- **Real-time Hand Tracking:** robust detection of one or two hands using MediaPipe.
- **3D Skeleton Overlay:** Visual representation of hand joints and connections rendered with Three.js.
- **ASL Recognition:**
    - **Static Signs:** Alphabet (A-E) and Numbers (1-3).
    - **Dynamic Signs:** Gestures like "HELLO" (Wave).
- **Interpret Mode:** Live captioning of detected signs with confidence scores.
- **Learn Mode:** A dedicated mode for users to practice specific signs (currently in development).
