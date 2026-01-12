import { Hands } from '@mediapipe/hands';
import type { Results, Landmark } from '@mediapipe/hands';
import { Camera } from '@mediapipe/camera_utils';

export interface HandResult {
    landmarks: Landmark[];
    worldLandmarks: Landmark[];
    handedness: 'Left' | 'Right';
    score: number;
}

export interface TrackingResult {
    timestamp: number;
    hands: HandResult[];
    image: HTMLVideoElement | HTMLCanvasElement;
}

export type OnTrackingResults = (result: TrackingResult) => void;

export class MediaPipeHands {
    private hands: Hands;
    private onResultsCallback: OnTrackingResults | null = null;
    private camera: Camera | null = null;

    constructor() {
        this.hands = new Hands({
            locateFile: (file) => {
                return `https://cdn.jsdelivr.net/npm/@mediapipe/hands/${file}`;
            }
        });

        this.hands.setOptions({
            maxNumHands: 2,
            modelComplexity: 1, // 0=lite, 1=full
            minDetectionConfidence: 0.5,
            minTrackingConfidence: 0.5
        });

        this.hands.onResults(this.handleResults.bind(this));
    }

    setCallback(callback: OnTrackingResults) {
        this.onResultsCallback = callback;
    }

    async start(videoElement: HTMLVideoElement) {
        if (this.camera) {
            await this.camera.stop();
        }

        this.camera = new Camera(videoElement, {
            onFrame: async () => {
                await this.hands.send({ image: videoElement });
            },
            width: 1280,
            height: 720
        });

        await this.camera.start();
    }

    async send(image: HTMLVideoElement) {
        await this.hands.send({ image });
    }

    stop() {
        if (this.camera) {
            this.camera.stop();
            this.camera = null;
        }
        this.hands.close();
    }

    private handleResults(results: Results) {
        if (!this.onResultsCallback) return;

        const hands: HandResult[] = [];

        if (results.multiHandLandmarks) {
            for (let i = 0; i < results.multiHandLandmarks.length; i++) {
                const landmarks = results.multiHandLandmarks[i];
                const worldLandmarks = results.multiHandWorldLandmarks ? results.multiHandWorldLandmarks[i] : [];
                const handednessInfo = results.multiHandedness[i];
                const label = handednessInfo.label === 'Left' ? 'Left' : 'Right';
                const score = handednessInfo.score;

                hands.push({
                    landmarks,
                    worldLandmarks,
                    handedness: label,
                    score
                });
            }
        }

        this.onResultsCallback({
            timestamp: performance.now(),
            hands,
            image: results.image as any
        });
    }
}
