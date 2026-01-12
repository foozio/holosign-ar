# HoloSign AR — ASL Mode

A browser-based augmented reality 3D ASL hand-gesture interpreter using MediaPipe Hands and Three.js.

## Features

- **Real-time Hand Tracking**: Detects one or two hands via webcam.
- **3D Skeleton Overlay**: Visualizes hand joints and connections in 3D.
- **ASL Recognition**:
  - **Static Signs**: A, B, C, D, E, 1, 2, 3.
  - **Dynamic Signs**: "HELLO" (Wave).
- **Interpret Mode**: Live captioning of detected signs with confidence scores.
- **Learn Mode**: Placeholder for practicing specific signs (Implementation pending full UI).

## Tech Stack

- **TypeScript**
- **Vite**
- **Three.js**
- **MediaPipe Hands** (`@mediapipe/hands`, `@mediapipe/camera_utils`)

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

## ASL Gestures Supported

| Sign | Description |
|------|-------------|
| **A** | Fist, thumb vertical against index finger. |
| **B** | Open hand, fingers together, thumb tucked across palm. |
| **C** | Hand forms a C shape. |
| **D** | Index finger up, others curled, thumb touches middle. |
| **E** | All fingers curled into palm, thumb tucked. |
| **1** | Index finger up. |
| **2** | Index and Middle fingers up (V sign). |
| **3** | Thumb, Index, Middle extended (ASL '3'). |
| **HELLO** | Open hand waving side-to-side. |

## Privacy Note

All processing is done **on-device** within the browser. No video feed is sent to any server.
