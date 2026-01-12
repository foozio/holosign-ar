import type { HandFeaturesData } from '../../features/HandFeatures';

export interface DynamicDetectionResult {
    label: string;
    confidence: number;
}

export class DynamicASLDetector {
    private history: { timestamp: number, wristX: number, indexTipX: number }[] = [];
    private readonly maxWindowSize = 60; // frames
    private readonly minWaveCycles = 3; // Number of direction changes
    private readonly timeWindow = 1500; // ms

    detect(timestamp: number, features: HandFeaturesData): DynamicDetectionResult | null {
        // 1. Gate: Hand must be open (Paper/B-like) for Hello
        // Simple check: All fingers extended
        // const allExtended = features.fingerStates.every(f => f.isExtended);
        // Allow thumb to be whatever? Usually Hello is open palm.
        // Let's require Index, Middle, Ring, Pinky extended.
        const fourFingersExtended = features.fingerStates.slice(1).every(f => f.isExtended);

        if (!fourFingersExtended) {
            this.history = []; // Reset if hand shape invalid
            return null;
        }

        const wrist = features.normalizedLandmarks[0];
        const indexTip = features.normalizedLandmarks[8];

        // Push new point
        this.history.push({ timestamp, wristX: wrist.x, indexTipX: indexTip.x });
        if (this.history.length > this.maxWindowSize) {
            this.history.shift();
        }

        // Prune old
        this.history = this.history.filter(h => timestamp - h.timestamp < this.timeWindow);

        // Analyze oscillation on Index Tip X
        // We look for direction changes (peaks/valleys)
        if (this.history.length < 10) return null;

        let directionChanges = 0;
        let lastDir = 0; // 0=init, 1=pos, -1=neg

        for (let i = 1; i < this.history.length; i++) {
            const delta = this.history[i].indexTipX - this.history[i - 1].indexTipX;
            if (Math.abs(delta) < 0.005) continue; // Noise threshold

            const currentDir = delta > 0 ? 1 : -1;
            if (lastDir !== 0 && currentDir !== lastDir) {
                directionChanges++;
            }
            lastDir = currentDir;
        }

        if (directionChanges >= this.minWaveCycles) {
            // Trigger
            // Should debounce or cooldown?
            return { label: 'HELLO', confidence: 0.9 };
        }

        return null;
    }
}
