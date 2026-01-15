# Tech Stack

## Core Technologies
- **TypeScript:** Primary programming language for type-safety and modern development features.
- **Vite:** Next-generation frontend tool for fast development and optimized production builds.
- **Three.js:** 3D library for rendering the hand skeletons and AR overlays in the browser.

## Machine Learning & Computer Vision
- **MediaPipe Hands:** Google's high-fidelity hand and finger tracking solution, providing 21 3D landmarks.
- **TensorFlow.js:** Library for machine learning in JavaScript, likely used for custom gesture classification layers beyond raw tracking.
- **Ultralytics YOLO (v26 compatible):** Used for training state-of-the-art gesture recognition models, supporting the latest YOLOv26 architecture and exported to TF.js for high-performance browser inference.

## Utilities & Libraries
- **@mediapipe/camera_utils:** Helper for managing the webcam feed.
- **UUID:** Used for generating unique identifiers (likely for session or dataset management).

## Development Tools
- **TSConfig:** Standard TypeScript configuration for a module-based project.
- **Vitest:** Blazing fast unit test framework powered by Vite.
- **JSDOM:** A JavaScript implementation of various web standards, for use with Node.js.
