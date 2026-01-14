import type { HandFeaturesData } from '../../features/HandFeatures';
// import type { NormalizedLandmark } from '../../features/HandFeatures';

export interface ClassificationResult {
    label: string;
    confidence: number;
    debugReasons: string[];
}

export class StaticASLClassifier {
    static classify(features: HandFeaturesData): ClassificationResult | null {
        const { fingerStates } = features;
        const extendedIndices = [1, 2, 3, 4].filter(i => fingerStates[i].isExtended);
        const extCount = extendedIndices.length;

        const candidates: ClassificationResult[] = [];

        if (extCount === 0) {
            candidates.push(this.checkA(features));
            candidates.push(this.checkE(features));
            candidates.push(this.checkS(features));
            candidates.push(this.checkC(features)); // C can appear as 0 extensions if fingers are curved
        } else if (extCount === 1) {
            const extIdx = extendedIndices[0];
            if (extIdx === 1) {
                candidates.push(this.checkD(features));
                candidates.push(this.check1(features));
                candidates.push(this.checkL(features));
                candidates.push(this.checkG(features)); // G is Horizontal Index
            } else if (extIdx === 4) {
                candidates.push(this.checkI(features));
            }
        } else if (extCount === 2) {
            // V FAMILY: V, 2, U, R, K, H, P
            if (fingerStates[1].isExtended && fingerStates[2].isExtended) {
                candidates.push(this.checkV(features));
                candidates.push(this.check2(features));
                candidates.push(this.checkU(features));
                candidates.push(this.checkH(features));
                candidates.push(this.checkR(features));
                candidates.push(this.checkK(features));
                candidates.push(this.checkP(features));
            }
            if (fingerStates[0].isExtended && fingerStates[4].isExtended && !fingerStates[1].isExtended) {
                candidates.push(this.checkY(features));
            }
        } else if (extCount === 3) {
            if (!fingerStates[1].isExtended) candidates.push(this.checkF(features));
            if (!fingerStates[4].isExtended) candidates.push(this.checkW(features));
        } else if (extCount === 4) {
            candidates.push(this.checkB(features));
            candidates.push(this.check4(features));
            candidates.push(this.check5(features));
            candidates.push(this.checkC(features));
        }

        candidates.sort((a, b) => b.confidence - a.confidence);

        if (candidates.length > 0 && candidates[0].confidence > 0.6) {
            return candidates[0];
        }

        return null;
    }

    // --- HELPERS ---
    private static isVertical(features: HandFeaturesData, fingerIdx: number): boolean {
        const tip = features.normalizedLandmarks[fingerIdx * 4 + 4];
        const mcp = features.normalizedLandmarks[fingerIdx * 4 + 1];
        return (Math.abs(tip.x - mcp.x) < Math.abs(tip.y - mcp.y));
    }

    private static isHorizontal(features: HandFeaturesData, fingerIdx: number): boolean {
        const tip = features.normalizedLandmarks[fingerIdx * 4 + 4];
        const mcp = features.normalizedLandmarks[fingerIdx * 4 + 1];
        return (Math.abs(tip.x - mcp.x) > Math.abs(tip.y - mcp.y));
    }

    private static isPointingDown(features: HandFeaturesData, fingerIdx: number): boolean {
        const tip = features.normalizedLandmarks[fingerIdx * 4 + 4];
        const mcp = features.normalizedLandmarks[fingerIdx * 4 + 1];
        // Screen Y grows down. if tip.y > mcp.y, it's pointing down.
        return tip.y > mcp.y;
    }

    // --- CHECKERS ---

    private static checkA(features: HandFeaturesData): ClassificationResult {
        let confidence = 1.0;
        const reasons: string[] = [];
        const { fingerStates } = features;
        [1, 2, 3, 4].forEach(i => {
            if (fingerStates[i].curlScore < 0.8) {
                confidence -= (0.8 - fingerStates[i].curlScore) * 0.5;
            }
        });
        if (!fingerStates[0].isExtended) confidence -= 0.2;
        return { label: 'A', confidence, debugReasons: reasons };
    }

    private static checkB(features: HandFeaturesData): ClassificationResult {
        let confidence = 1.0;
        const { fingerStates } = features;
        [1, 2, 3, 4].forEach(i => {
            if (fingerStates[i].curlScore > 0.2) confidence -= fingerStates[i].curlScore * 0.5;
        });
        if (fingerStates[0].isExtended) confidence -= 0.3;
        return { label: 'B', confidence, debugReasons: [] };
    }

    private static checkC(features: HandFeaturesData): ClassificationResult {
        let confidence = 0.8; // Base confidence
        const { fingerStates } = features;

        // C Shape: Fingers curved but not closed (Curl 0.3 - 0.8)
        [1, 2, 3, 4].forEach(i => {
            const curl = fingerStates[i].curlScore;
            if (curl < 0.2) confidence -= 0.2; // Too straight
            if (curl > 0.85) confidence -= 0.3; // Too closed (looks like E/S)
        });

        // Thumb should be somewhat curved/opposed
        // Simple check: Thumb index distance > 0 (it is always >0), but "C" gap
        const { normalizedLandmarks } = features;
        const thumbTip = normalizedLandmarks[4];
        const indexTip = normalizedLandmarks[8];
        const gap = Math.sqrt(Math.pow(thumbTip.x - indexTip.x, 2) + Math.pow(thumbTip.y - indexTip.y, 2));

        // If gap is too small, it's 'O'. If huge, it's 'L' (sort of)
        if (gap < 0.05) confidence -= 0.4; // O penalty

        // C is usually sideways or diagonal, but can be upright. 
        // We focus on finger curvature.

        return { label: 'C', confidence, debugReasons: [] };
    }

    private static checkD(features: HandFeaturesData): ClassificationResult {
        let confidence = 1.0;
        const { fingerStates } = features;

        // D is Vertical
        if (!this.isVertical(features, 1)) confidence -= 0.5;

        if (fingerStates[1].curlScore > 0.3) confidence -= 0.5;
        [2, 3, 4].forEach(i => {
            if (fingerStates[i].curlScore < 0.8) confidence -= 0.3;
        });
        return { label: 'D', confidence, debugReasons: [] };
    }

    private static checkE(features: HandFeaturesData): ClassificationResult {
        let confidence = 1.0;
        const { fingerStates } = features;
        [1, 2, 3, 4].forEach(i => {
            if (fingerStates[i].curlScore < 0.9) confidence -= 0.3;
        });
        if (fingerStates[0].isExtended) confidence -= 0.3;
        return { label: 'E', confidence, debugReasons: [] };
    }

    private static check1(features: HandFeaturesData): ClassificationResult {
        let confidence = 1.0;
        const { fingerStates } = features;

        // 1 is Vertical
        if (!this.isVertical(features, 1)) confidence -= 0.5;

        if (fingerStates[1].curlScore > 0.2) confidence -= 0.5;
        if (fingerStates[2].curlScore < 0.8) confidence -= 0.2;
        if (fingerStates[3].curlScore < 0.8) confidence -= 0.2;
        if (fingerStates[4].curlScore < 0.8) confidence -= 0.2;
        return { label: '1', confidence, debugReasons: [] };
    }

    private static checkG(features: HandFeaturesData): ClassificationResult {
        let confidence = 1.0;

        // G is Horizontal
        if (!this.isHorizontal(features, 1)) confidence -= 0.6;

        // Other fingers curled (already checked by extCount=1)

        return { label: 'G', confidence, debugReasons: [] };
    }

    private static check2(features: HandFeaturesData): ClassificationResult {
        return this.checkV(features);
    }

    private static checkS(features: HandFeaturesData): ClassificationResult {
        let confidence = 1.0;
        const { fingerStates } = features;
        [1, 2, 3, 4].forEach(i => {
            if (fingerStates[i].curlScore < 0.8) confidence -= 0.3;
        });
        if (fingerStates[0].isExtended) confidence -= 0.5;
        return { label: 'S', confidence, debugReasons: [] };
    }

    private static checkL(features: HandFeaturesData): ClassificationResult {
        let confidence = 1.0;
        const { fingerStates } = features;
        if (fingerStates[1].curlScore > 0.2) confidence -= 0.5;
        if (!fingerStates[0].isExtended) confidence -= 0.5;
        return { label: 'L', confidence, debugReasons: [] };
    }

    private static checkI(features: HandFeaturesData): ClassificationResult {
        const { fingerStates } = features;
        let confidence = 1.0;
        if (fingerStates[4].curlScore > 0.2) confidence -= 0.5;
        if (fingerStates[0].isExtended) confidence -= 0.6;
        return { label: 'I', confidence, debugReasons: [] };
    }

    private static checkV(features: HandFeaturesData): ClassificationResult {
        let confidence = 1.0;

        // Orientation check (Should be Vertical and Up)
        if (!this.isVertical(features, 1)) confidence -= 0.2;
        if (this.isPointingDown(features, 1)) confidence -= 0.5; // Heavy penalty if pointing down (P)

        const { normalizedLandmarks } = features;
        const iTip = normalizedLandmarks[8];
        const mTip = normalizedLandmarks[12];
        const dist = Math.sqrt(Math.pow(iTip.x - mTip.x, 2) + Math.pow(iTip.y - mTip.y, 2));

        if (dist < 0.25) confidence -= 0.4;

        return { label: 'V', confidence, debugReasons: [] };
    }

    private static checkK(features: HandFeaturesData): ClassificationResult {
        // K: Like V (Index/Middle up) but Thumb is UP/Between them.
        let confidence = 1.0;

        // Check Upright V shape
        if (this.isPointingDown(features, 1)) confidence -= 0.5; // K is Up

        const { normalizedLandmarks } = features;
        const thumbTip = normalizedLandmarks[4];
        const midPIP = normalizedLandmarks[10];

        // Thumb should be close to Middle Finger PIP/MCP
        const dist = Math.sqrt(Math.pow(thumbTip.x - midPIP.x, 2) + Math.pow(thumbTip.y - midPIP.y, 2));

        // If thumb is far, it's V. If close, it's K.
        if (dist > 0.2) confidence -= 0.4;

        return { label: 'K', confidence, debugReasons: [] };
    }

    private static checkP(features: HandFeaturesData): ClassificationResult {
        // P: K Shape but Pointing DOWN.
        let confidence = 1.0;

        // Must be Pointing DOWN
        if (!this.isPointingDown(features, 1)) confidence -= 0.8;

        const { normalizedLandmarks } = features;
        const thumbTip = normalizedLandmarks[4];
        const midPIP = normalizedLandmarks[10];

        // Thumb check (like K)
        const dist = Math.sqrt(Math.pow(thumbTip.x - midPIP.x, 2) + Math.pow(thumbTip.y - midPIP.y, 2));
        if (dist > 0.2) confidence -= 0.2; // Less penalty, P orientation is strong signal

        return { label: 'P', confidence, debugReasons: [] };
    }

    private static checkU(features: HandFeaturesData): ClassificationResult {
        let confidence = 1.0;
        if (!this.isVertical(features, 1)) confidence -= 0.5;
        if (this.isPointingDown(features, 1)) confidence -= 0.5; // U is Up

        const { normalizedLandmarks } = features;
        const iTip = normalizedLandmarks[8];
        const mTip = normalizedLandmarks[12];
        const dist = Math.sqrt(Math.pow(iTip.x - mTip.x, 2) + Math.pow(iTip.y - mTip.y, 2));

        if (dist > 0.3) confidence -= 0.6;

        return { label: 'U', confidence, debugReasons: [] };
    }

    private static checkH(features: HandFeaturesData): ClassificationResult {
        let confidence = 1.0;
        if (!this.isHorizontal(features, 1)) confidence -= 0.6;

        const { normalizedLandmarks } = features;
        const iTip = normalizedLandmarks[8];
        const mTip = normalizedLandmarks[12];
        const dist = Math.sqrt(Math.pow(iTip.x - mTip.x, 2) + Math.pow(iTip.y - mTip.y, 2));

        if (dist > 0.3) confidence -= 0.6;

        return { label: 'H', confidence, debugReasons: [] };
    }

    private static checkR(features: HandFeaturesData): ClassificationResult {
        const { fingerStates } = features;
        if (fingerStates[1].curlScore > 0.3 || fingerStates[2].curlScore > 0.3) return { label: 'R', confidence: 0.0, debugReasons: [] };
        if (fingerStates[3].curlScore < 0.8) return { label: 'R', confidence: 0.5, debugReasons: [] };
        return { label: 'R', confidence: 0.5, debugReasons: ["Check cross"] };
    }

    private static checkY(features: HandFeaturesData): ClassificationResult {
        const { fingerStates } = features;
        let confidence = 1.0;
        [1, 2, 3].forEach(i => {
            if (fingerStates[i].curlScore < 0.8) confidence -= 0.3;
        });
        return { label: 'Y', confidence, debugReasons: [] };
    }

    private static check4(features: HandFeaturesData): ClassificationResult {
        const { fingerStates } = features;
        let confidence = 1.0;
        if (fingerStates[0].isExtended) confidence -= 0.5;
        return { label: '4', confidence, debugReasons: [] };
    }

    private static check5(features: HandFeaturesData): ClassificationResult {
        const { fingerStates } = features;
        let confidence = 1.0;
        if (!fingerStates[0].isExtended) confidence -= 0.5;
        return { label: '5', confidence, debugReasons: [] };
    }

    private static checkW(features: HandFeaturesData): ClassificationResult {
        const { fingerStates } = features;
        let confidence = 1.0;
        if (fingerStates[4].curlScore < 0.8) confidence -= 0.3;
        return { label: 'W', confidence, debugReasons: [] };
    }

    private static checkF(features: HandFeaturesData): ClassificationResult {
        const { fingerStates } = features;
        let confidence = 1.0;
        if (fingerStates[1].curlScore < 0.5) confidence -= 0.2;
        return { label: 'F', confidence, debugReasons: [] };
    }
}
