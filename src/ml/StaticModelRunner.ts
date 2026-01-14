import * as tf from '@tensorflow/tfjs';
import { FeatureVector } from './FeatureVector';
import type { HandFeaturesData } from '../features/HandFeatures';

export class StaticModelRunner {
    private model: tf.LayersModel | tf.GraphModel | null = null;
    private labels: string[] = ['A', 'B', 'C', 'D', 'E', '1', '2', '3', 'NONE'];

    constructor(model?: tf.LayersModel | tf.GraphModel) {
        if (model) this.model = model;
    }

    setModel(model: tf.LayersModel | tf.GraphModel) {
        this.model = model;
    }

    predict(features: HandFeaturesData): { label: string, confidence: number } | null {
        if (!this.model) return null;

        const probabilities = tf.tidy(() => {
            const vector = FeatureVector.extract(features);
            const input = tf.tensor2d([vector]);
            
            let output: tf.Tensor;
            if (this.model instanceof tf.LayersModel) {
                output = this.model.predict(input) as tf.Tensor;
            } else {
                // GraphModel - execute method
                output = this.model.execute(input) as tf.Tensor;
            }
            
            // Standardize output to 1D array of probabilities
            return Array.from(output.squeeze().dataSync());
        });

        const maxIdx = probabilities.indexOf(Math.max(...probabilities));

        // Threshold
        if (probabilities[maxIdx] > 0.7) {
            return {
                label: this.labels[maxIdx] || 'UNKNOWN',
                confidence: probabilities[maxIdx]
            };
        }
        return null;
    }
}