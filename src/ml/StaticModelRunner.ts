import * as tf from '@tensorflow/tfjs';
import { FeatureVector } from './FeatureVector';
import type { HandFeaturesData } from '../features/HandFeatures';

export class StaticModelRunner {
    private model: tf.LayersModel | null = null;
    private labels: string[] = ['A', 'B', 'C', 'D', 'E', '1', '2', '3', 'NONE'];
    // TODO: Load labels dynamically or from config

    constructor(model?: tf.LayersModel) {
        if (model) this.model = model;
    }

    setModel(model: tf.LayersModel) {
        this.model = model;
    }

    predict(features: HandFeaturesData): { label: string, confidence: number } | null {
        if (!this.model) return null;

        const probabilities = tf.tidy(() => {
            const vector = FeatureVector.extract(features);
            const input = tf.tensor2d([vector]);
            const output = this.model!.predict(input) as tf.Tensor;
            return Array.from(output.dataSync());
        });

        const maxIdx = probabilities.indexOf(Math.max(...probabilities));

        // Threshold
        if (probabilities[maxIdx] > 0.7) {
            return {
                label: this.labels[maxIdx],
                confidence: probabilities[maxIdx]
            };
        }
        return null;
    }
}
