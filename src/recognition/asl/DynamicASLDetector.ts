import type { HandFeaturesData } from '../../features/HandFeatures';

export interface DynamicDetectionResult {
    label: string;
    confidence: number;
}

export class DynamicASLDetector {
    private history: { timestamp: number, wristX: number, wristY: number, indexTipX: number, indexTipY: number }[] = [];
    private readonly maxWindowSize = 60; // frames
    private readonly timeWindow = 1500; // ms

    // Wave
    private readonly minWaveCycles = 3;

    // Z trace
    // Z pattern: Right -> Down-Left -> Right
    // Simplified: Horizontal + Diagonal + Horizontal

    // J trace
    // J pattern: Down -> Curve Left (or Right for left hand... assuming right hand standard for now or mirror agnostic?)
    // J is usually "I" handshape moving Down then curving "In" (towards thumb side).

    detect(timestamp: number, features: HandFeaturesData): DynamicDetectionResult | null {
        const wrist = features.normalizedLandmarks[0];
        const indexTip = features.normalizedLandmarks[8];
        // const thumbTip = features.normalizedLandmarks[4];

        // Update History
        this.history.push({
            timestamp,
            wristX: wrist.x, wristY: wrist.y,
            indexTipX: indexTip.x, indexTipY: indexTip.y
        });

        // Prune
        if (this.history.length > this.maxWindowSize) this.history.shift();
        this.history = this.history.filter(h => timestamp - h.timestamp < this.timeWindow);

        if (this.history.length < 10) return null;

        // CHECK 1: WAVE (HELLO)
        // Gated by "Open Hand" (4 fingers extended)
        if (this.checkHandshapeOpen(features)) {
            if (this.detectWave()) return { label: 'HELLO', confidence: 0.9 };
        }

        // CHECK 2: J
        // Gated by "I" (Pinky only extended)
        if (this.checkHandshapeI(features)) {
            // Check motion of WRIST or PINKY TIP?
            // Usually wrist moves too. Let's check wrist for J curve.
            if (this.detectJ()) return { label: 'J', confidence: 0.9 };
        }

        // CHECK 3: Z
        // Gated by "D/1" (Index only extended)
        if (this.checkHandshapeD(features)) {
            // Track Index Tip
            if (this.detectZ()) return { label: 'Z', confidence: 0.9 };
        }

        return null;
    }

    private checkHandshapeOpen(features: HandFeaturesData): boolean {
        // Index, Mid, Ring, Pinky extended
        return features.fingerStates.slice(1).every(f => f.isExtended);
    }

    private checkHandshapeI(features: HandFeaturesData): boolean {
        // Pinky extended, Index/Mid/Ring curled.
        const f = features.fingerStates;
        return f[4].isExtended && !f[1].isExtended && !f[2].isExtended && !f[3].isExtended;
    }

    private checkHandshapeD(features: HandFeaturesData): boolean {
        // Index extended, others curled.
        const f = features.fingerStates;
        return f[1].isExtended && !f[2].isExtended && !f[3].isExtended && !f[4].isExtended;
    }

    private detectWave(): boolean {
        let directionChanges = 0;
        let lastDir = 0;

        // Analyze Index Tip X oscillation
        for (let i = 1; i < this.history.length; i++) {
            const delta = this.history[i].indexTipX - this.history[i - 1].indexTipX;
            if (Math.abs(delta) < 0.005) continue;
            const currentDir = delta > 0 ? 1 : -1;
            if (lastDir !== 0 && currentDir !== lastDir) directionChanges++;
            lastDir = currentDir;
        }
        return directionChanges >= this.minWaveCycles;
    }

    private detectJ(): boolean {
        // J Trace: Down (-Y in screen? Y increase) then Curve (X change).
        // Simple heuristic: Total Y displacement is "Down" (positive Y delta).
        // And significant X curve at the end.

        const start = this.history[0];
        const end = this.history[this.history.length - 1];

        const dy = end.wristY - start.wristY; // + is down
        // const dx = end.wristX - start.wristX;

        // Needs significant Down movement
        if (dy < 0.05) return false;

        // Needs curve?
        // Let's keep it simple: "Moving Down" while holding "I" is "J" enough for now.
        // Or "Swoop"?
        // Let's rely on "I" shape + Downward motion > threshold.
        // This distinguishes static "I" from "J".

        return dy > 0.08;
    }

    private detectZ(): boolean {
        // Z Trace: Right, Diagonal Down-Left, Right.
        // Requires segmentation of path or simpler bounding box aspect ratio?
        // Or detecting "Zig Zag" X direction changes?
        // Right (+X), Left (-X), Right (+X).
        // That is 2 direction changes in X, coupled with net Down (+Y).

        const start = this.history[0];
        const end = this.history[this.history.length - 1];
        const dy = end.indexTipY - start.indexTipY;

        // Z moves down overall?
        // Top stroke, Diag stroke, Bottom stroke. Top is high Y, Bottom is low Y.
        if (dy < 0.05) return false; // Net down movement

        // Check X direction changes
        let directionChanges = 0;
        let lastDir = 0;
        for (let i = 1; i < this.history.length; i++) {
            const delta = this.history[i].indexTipX - this.history[i - 1].indexTipX;
            if (Math.abs(delta) < 0.005) continue;
            const currentDir = delta > 0 ? 1 : -1;
            // Z sequence: Right (+), Left (-), Right (+).
            // Changes: + to -, - to +. (2 changes).
            if (lastDir !== 0 && currentDir !== lastDir) directionChanges++;
            lastDir = currentDir;
        }

        return directionChanges >= 2;
    }
}
