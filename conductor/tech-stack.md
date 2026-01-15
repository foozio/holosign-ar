# Technology Stack

## Core Technologies
- **TypeScript**: Primary programming language for the web application.
- **Python 3.12**: Language used for the machine learning training and processing pipeline.

## Frontend
- **Vite**: Modern build tool and development server.
- **Three.js**: 3D library for rendering hand skeletons and AR overlays.
- **MediaPipe Hands (Tasks API)**: For real-time 3D hand landmark detection.
- **TensorFlow.js**: For executing machine learning models directly in the browser.

## ML Pipeline
- **TensorFlow**: Core machine learning framework for model training.
- **OpenCV**: Library for video processing and frame extraction.
- **yt-dlp**: For downloading and processing datasets from external sources.

## Architecture
- **Client-Side SPA**: The main application is a single-page application focused on high performance and low latency.
- **Off-line Training**: The machine learning models are trained using a Python-based pipeline and then exported to TensorFlow.js for client-side use.
