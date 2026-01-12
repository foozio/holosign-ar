import type { Landmark } from '@mediapipe/hands';

export interface CalibrationConfig {
    targetDurationMs: number;
}

export class Calibrator {
    private isCalibrating: boolean = false;
    private startTime: number = 0;
    private samples: number[] = [];
    private _calibrationData: number | null = null; // The calibrated palm size

    constructor() { }

    start() {
        this.isCalibrating = true;
        this.startTime = performance.now();
        this.samples = [];
        this._calibrationData = null;
        console.log("Calibration started...");
    }

    stop() {
        this.isCalibrating = false;
        if (this.samples.length > 0) {
            // Average the samples
            const avgSize = this.samples.reduce((a, b) => a + b, 0) / this.samples.length;
            this._calibrationData = avgSize;
            console.log(`Calibration complete. Reference Palm Size: ${avgSize.toFixed(4)}`);
        } else {
            console.warn("Calibration failed: No samples collected.");
        }
    }

    process(landmarks: Landmark[]) {
        if (!this.isCalibrating) return;

        // Wrist is 0, Middle Finger MCP is 9
        const wrist = landmarks[0];
        const middleMcp = landmarks[9];

        // Euclidean distance in 2D (normalized)
        // We ignore Z for size estimation usually, or use it if trustworthy.
        // MP Z is relative to Wrist, so it's not absolute distance.
        // Let's verify using 2D projection size.
        const dx = wrist.x - middleMcp.x;
        const dy = wrist.y - middleMcp.y;
        const dist = Math.sqrt(dx * dx + dy * dy);

        this.samples.push(dist);

        // Auto-stop after 3 seconds for now
        if (performance.now() - this.startTime > 3000) {
            this.stop();
        }
    }

    get isActive(): boolean {
        return this.isCalibrating;
    }

    get calibrationData(): number | null {
        return this._calibrationData;
    }
}
