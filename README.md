# HoloSign AR — ASL Interpreter

A browser-based augmented reality 3D ASL hand-gesture interpreter using MediaPipe Hands, YOLOv8, and Three.js.

## Features

- **Real-time Hand Tracking**: High-precision hand joint detection via MediaPipe.
- **Top 100 ASL Signs**: Supports a wide vocabulary of 100 glosses from the MS-ASL dataset.
- **Interpret Mode**: Live, on-device translation of ASL gestures with real-time confidence feedback.
- **Learn Mode**: Interactive sign practice with visual guides, success feedback, and automatic progression.
- **Data Capture Tool**: Integrated pipeline for recording custom gesture datasets.
- **3D HUD Overlay**: Modern AR interface with depth calibration and performance auto-scaling.
- **On-Device Privacy**: All processing occurs locally in the browser; no video data is ever transmitted.

## Tech Stack

- **Frontend**: TypeScript, Vite, CSS3 (Modern HUD Styles)
- **3D Rendering**: Three.js
- **Machine Learning**: 
  - MediaPipe Hands (Tracking & Smoothing)
  - YOLOv8 (Classification & Localization)
- **ML Pipeline**: Python, PyTorch (Training & Export)

## Setup & Running

1. **Install dependencies**:
   ```bash
   npm install
   ```

2. **Start Development Server**:
   ```bash
   npm run dev
   ```
   Open the link (usually http://localhost:5173).

3. **Build for Production**:
   ```bash
   npm run build
   ```

## Supported Signs (Top 100)

The application supports 100 signs including common words like:
*eat, nice, want, teacher, orange, like, white, what, friend, fish, deaf, milk, where, yes, no, school, drink, mother, sister, water, learn, write, help, blue, please, happy, thank you, home, work, and 70+ others.*

See `public/models/yolo_model/classes.json` for the full list.

## Usage Guide

- **Interpret Mode**: Default mode for live sign translation. Watch the HUD for real-time captions.
- **Learn Mode**: Select a sign to practice. Hold the gesture for 1.5s to succeed and advance.
- **Depth Calibration**: Click the 📏 icon and hold your hand steady to calibrate AR skeleton scaling.
- **Debug View**: Click the 🐞 icon to see raw model output and confidence scores.

## Credits

ASL recognition is trained on the [MS-ASL Dataset](https://www.microsoft.com/en-us/research/project/ms-asl/).
