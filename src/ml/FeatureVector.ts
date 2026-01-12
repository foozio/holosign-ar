import type { HandFeaturesData } from '../features/HandFeatures';

/**
 * Converts HandFeaturesData into a flat number array for ML model input.
 * 
 * Vector Layout (Total Size: 63):
 * [0-62]: Normalized Landmarks (x, y, z) * 21
 * 
 * Future expansions can include:
 * - Finger states (one-hot encoded)
 * - Angles
 * - Palm normal
 */
export class FeatureVector {
    static readonly VECTOR_SIZE = 63;

    static extract(features: HandFeaturesData): number[] {
        const vector: number[] = [];

        // 1. Flatten Normalized Landmarks (21 * 3 = 63)
        for (const lm of features.normalizedLandmarks) {
            vector.push(lm.x, lm.y, lm.z);
        }

        // TODO: Add other features if model requires them
        // e.g., finger states, angles

        return vector;
    }
}
