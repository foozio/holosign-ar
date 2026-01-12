import * as tf from '@tensorflow/tfjs';
import { FeatureVector } from './FeatureVector';
import type { HandFeaturesData } from '../features/HandFeatures';

export class DynamicModelRunner {
    private model: tf.LayersModel | null = null;
    private buffer: number[][] = [];
    private readonly WINDOW_SIZE = 30; // Must match training sequence length
    private readonly LABELS = ['HELLO', 'IDLE_OPEN', 'IDLE_FIST'];

    constructor(model?: tf.LayersModel) {
        if (model) this.model = model;
    }

    setModel(model: tf.LayersModel) {
        this.model = model;
    }

    /**
     * Adds a frame and attempts prediction.
     * Returns a result if a gesture is detected with high confidence at the end of a window.
     */
    process(features: HandFeaturesData): { label: string, confidence: number } | null {
        // 1. Extract vector
        const vector = FeatureVector.extract(features);

        // 2. Add to buffer
        this.buffer.push(vector);
        if (this.buffer.length > this.WINDOW_SIZE) {
            this.buffer.shift();
        }

        // 3. Predict if buffer full
        if (this.buffer.length === this.WINDOW_SIZE && this.model) {
            const probabilities = tf.tidy(() => {
                // Shape: [1, WINDOW_SIZE, FEATURES]
                const input = tf.tensor3d([this.buffer]);
                const output = this.model!.predict(input) as tf.Tensor;
                return Array.from(output.dataSync());
            });

            const maxIdx = probabilities.indexOf(Math.max(...probabilities));

            if (probabilities[maxIdx] > 0.8) {
                const label = this.LABELS[maxIdx];
                // Filter out IDLE classes
                if (label.startsWith('IDLE')) return null;

                return {
                    label: label,
                    confidence: probabilities[maxIdx]
                };
            }
        }

        return null;
    }

    reset() {
        this.buffer = [];
    }
}
