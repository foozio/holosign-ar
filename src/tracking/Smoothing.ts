/**
 * Simple 1D OneEuroFilter implementation for smoothing
 * Reference: https://hal.inria.fr/hal-01676925/document
 */
export class OneEuroFilter {
    private minCutoff: number;
    private beta: number;
    private dCutoff: number;
    private xPrev: number | null = null;
    private dxPrev: number | null = null;
    private tPrev: number | null = null;

    constructor(minCutoff: number = 1.0, beta: number = 0.0, dCutoff: number = 1.0) {
        this.minCutoff = minCutoff;
        this.beta = beta;
        this.dCutoff = dCutoff;
    }

    setParams(minCutoff: number, beta: number) {
        this.minCutoff = minCutoff;
        this.beta = beta;
    }

    filter(t: number, x: number): number {
        if (this.tPrev === null) {
            this.tPrev = t;
            this.xPrev = x;
            this.dxPrev = 0;
            return x;
        }

        const dt = (t - this.tPrev) / 1000.0; // Convert to seconds
        this.tPrev = t;

        // Compute alpha for the derivative
        const aD = this.smoothingFactor(dt, this.dCutoff);
        const dx = (x - (this.xPrev as number)) / dt;
        const dxHat = this.exponentialSmoothing(aD, dx, (this.dxPrev as number));

        // Compute alpha for the signal
        const cutoff = this.minCutoff + this.beta * Math.abs(dxHat);
        const a = this.smoothingFactor(dt, cutoff);
        const xHat = this.exponentialSmoothing(a, x, (this.xPrev as number));

        this.xPrev = xHat;
        this.dxPrev = dxHat;

        return xHat;
    }

    private smoothingFactor(dt: number, cutoff: number): number {
        const r = 2 * Math.PI * cutoff * dt;
        return r / (r + 1);
    }

    private exponentialSmoothing(a: number, x: number, xPrev: number): number {
        return a * x + (1 - a) * xPrev;
    }
}

// Wrapper for 3D landmarks
export class LandmarkSmoother {
    private filters: OneEuroFilter[][] = [];
    private numLandmarks = 21;
    // Filters for x, y, z

    constructor() {
        // Initialize filters lazily or resets
    }

    // smooths a single hand's landmarks
    // landmarks: array of {x, y, z}
    smooth(timestamp: number, landmarks: { x: number, y: number, z: number }[], confidence: number): { x: number, y: number, z: number }[] {
        if (this.filters.length !== this.numLandmarks) {
            this.filters = [];
            for (let i = 0; i < this.numLandmarks; i++) {
                // Initial params
                this.filters.push([
                    new OneEuroFilter(1.0, 1.0), // x
                    new OneEuroFilter(1.0, 1.0), // y
                    new OneEuroFilter(1.0, 1.0)  // z
                ]);
            }
        }

        // Adaptive Smoothing Logic
        // High confidence (>0.8) -> Low smoothing (Responsive) -> beta=10.0, minCutoff=1.0
        // Low confidence (<0.5) -> High smoothing (Stable)     -> beta=0.001, minCutoff=0.1

        let targetBeta = 0.001;
        let targetCutoff = 0.1;

        if (confidence > 0.8) {
            targetBeta = 10.0;
            targetCutoff = 1.0;
        } else if (confidence > 0.5) {
            // Linear interpolation or mid-tier
            targetBeta = 1.0;
            targetCutoff = 0.5;
        }

        return landmarks.map((lm, i) => {
            // Update params for all axes
            this.filters[i][0].setParams(targetCutoff, targetBeta);
            this.filters[i][1].setParams(targetCutoff, targetBeta);
            this.filters[i][2].setParams(targetCutoff, targetBeta);

            return {
                x: this.filters[i][0].filter(timestamp, lm.x),
                y: this.filters[i][1].filter(timestamp, lm.y),
                z: this.filters[i][2].filter(timestamp, lm.z),
            };
        });
    }

    reset() {
        this.filters = [];
    }
}
