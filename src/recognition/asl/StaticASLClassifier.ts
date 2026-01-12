import type { HandFeaturesData } from '../../features/HandFeatures';

export interface ClassificationResult {
    label: string;
    confidence: number;
    debugReasons: string[];
}

export class StaticASLClassifier {
    static classify(features: HandFeaturesData): ClassificationResult | null {
        // Check constraints for each letter/number
        // Return the best match or null

        // Priority list or iterate all
        const candidates: ClassificationResult[] = [];

        candidates.push(this.checkA(features));
        candidates.push(this.checkB(features));
        candidates.push(this.checkC(features));
        candidates.push(this.checkD(features));
        candidates.push(this.checkE(features));
        candidates.push(this.check1(features));
        candidates.push(this.check2(features));
        candidates.push(this.check3(features));

        // Sort by confidence
        candidates.sort((a, b) => b.confidence - a.confidence);

        if (candidates.length > 0 && candidates[0].confidence > 0.7) {
            return candidates[0];
        }

        return null;
    }

    private static checkA(features: HandFeaturesData): ClassificationResult {
        let confidence = 1.0;
        const reasons: string[] = [];
        const { fingerStates } = features;

        // A: All fingers curled, Thumb extended/up along index check
        // Actually A: Thumb is straight up, other fingers curled.
        // WAIT, ASL 'A': FINGERS CURLED, THUMB UP AGAINST SIDE OF HAND (INDEX).
        // It's a fist with thumb ALONG the side. Thumb is NOT extended UP like 'thumbs up'.

        // Check curled fingers
        if (!fingerStates[1].isCurled) { confidence -= 0.3; reasons.push("Index not curled"); } // Index
        if (!fingerStates[2].isCurled) { confidence -= 0.2; reasons.push("Middle not curled"); }
        if (!fingerStates[3].isCurled) { confidence -= 0.2; reasons.push("Ring not curled"); }
        if (!fingerStates[4].isCurled) { confidence -= 0.2; reasons.push("Pinky not curled"); }

        // Thumb should be sticking up/straight? No, for A, thumb is usually vertical adjacent to index.
        if (!fingerStates[0].isExtended) { confidence -= 0.2; reasons.push("Thumb not extended"); }

        return { label: 'A', confidence, debugReasons: reasons };
    }

    private static checkB(features: HandFeaturesData): ClassificationResult {
        let confidence = 1.0;
        const reasons: string[] = [];
        const { fingerStates } = features;

        // B: 4 fingers extended, Thumb tucked across palm
        if (!fingerStates[1].isExtended) { confidence -= 0.2; reasons.push("Index not extended"); }
        if (!fingerStates[2].isExtended) { confidence -= 0.2; reasons.push("Middle not extended"); }
        if (!fingerStates[3].isExtended) { confidence -= 0.2; reasons.push("Ring not extended"); }
        if (!fingerStates[4].isExtended) { confidence -= 0.2; reasons.push("Pinky not extended"); }

        if (fingerStates[0].isExtended) { confidence -= 0.3; reasons.push("Thumb should be tucked"); }

        return { label: 'B', confidence, debugReasons: reasons };
    }

    private static checkC(_features: HandFeaturesData): ClassificationResult {
        // C: Curved hand. All fingers kinda semi-curled/extended in arc.
        // let confidence = 1.0;
        // const reasons: string[] = [];
        // Hard to distinguish from O or claw.
        // Thumb and fingers form C shape.
        // Fingers should be partially curled (not fully fist, not fully straight).

        // For simplicity: Check Thumb extended, Fingers partially curled (or extended but curved)
        // C usually has fingers technically extended but "curved" at knuckles?
        // Let's rely on hand being "OPEN" but fingertips arranged.
        return { label: 'C', confidence: 0.5, debugReasons: ["Not fully implemented"] }; // Placeholder
    }

    private static checkD(features: HandFeaturesData): ClassificationResult {
        // D: Index Up, others curled, Thumb touches middle tip
        let confidence = 1.0;
        const reasons: string[] = [];
        const { fingerStates } = features;

        if (!fingerStates[1].isExtended) { confidence -= 0.5; reasons.push("Index not UP"); }
        if (fingerStates[2].isExtended) { confidence -= 0.3; reasons.push("Middle should be curled"); }
        if (fingerStates[3].isExtended) { confidence -= 0.2; reasons.push("Ring should be curled"); }
        if (fingerStates[4].isExtended) { confidence -= 0.2; reasons.push("Pinky should be curled"); }

        // Check thumb touching middle/ring?
        // Hard to detect touch precisely.

        return { label: 'D', confidence, debugReasons: reasons };
    }

    private static checkE(features: HandFeaturesData): ClassificationResult {
        // E: All fingers curled, tips touching thumb? Or just tight fist?
        // E: Fingers curled, fingertips resting on THUMB (in palm).
        // Distinct from S (Fist with thumb across).
        let confidence = 1.0;
        const reasons: string[] = [];
        const { fingerStates } = features;

        if (!fingerStates[1].isCurled) confidence -= 0.2;
        if (!fingerStates[2].isCurled) confidence -= 0.2;
        if (!fingerStates[3].isCurled) confidence -= 0.2;
        if (!fingerStates[4].isCurled) confidence -= 0.2;

        // Thumb should be curled/tucked?
        if (fingerStates[0].isExtended) confidence -= 0.3;

        return { label: 'E', confidence, debugReasons: reasons };
    }

    private static check1(features: HandFeaturesData): ClassificationResult {
        // 1: Index extended, others curled. (Same as D basically, but D has O-shape with thumb/middle).
        // 1 usually Palm facing out. D is also palm out.
        // Distinguishing 1 vs D is tricky logic.
        // D: Thumb touches Middle. 1: Thumb crosses over Middle/Ring knuckles.
        let confidence = 1.0;
        const reasons: string[] = [];
        const { fingerStates } = features;

        if (!fingerStates[1].isExtended) confidence -= 0.5;
        if (fingerStates[2].isExtended) confidence -= 0.3;
        if (fingerStates[3].isExtended) confidence -= 0.2;
        if (fingerStates[4].isExtended) confidence -= 0.2;

        return { label: '1', confidence, debugReasons: reasons };
    }

    private static check2(features: HandFeaturesData): ClassificationResult {
        // 2: Index + Middle extended. (V sign)
        let confidence = 1.0;
        const reasons: string[] = [];
        const { fingerStates } = features;

        if (!fingerStates[1].isExtended) confidence -= 0.3;
        if (!fingerStates[2].isExtended) confidence -= 0.3;
        if (fingerStates[3].isExtended) confidence -= 0.3;
        if (fingerStates[4].isExtended) confidence -= 0.3;

        return { label: '2', confidence, debugReasons: reasons };
    }

    private static check3(features: HandFeaturesData): ClassificationResult {
        // 3: Thumb, Index, Middle extended.
        let confidence = 1.0;
        const reasons: string[] = [];
        const { fingerStates } = features;

        if (!fingerStates[0].isExtended) confidence -= 0.3;
        if (!fingerStates[1].isExtended) confidence -= 0.2;
        if (!fingerStates[2].isExtended) confidence -= 0.2;

        // Ring/Pinky curled
        if (fingerStates[3].isExtended) confidence -= 0.3;
        if (fingerStates[4].isExtended) confidence -= 0.3;

        return { label: '3', confidence, debugReasons: reasons };
    }
}
