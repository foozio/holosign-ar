import * as tf from '@tensorflow/tfjs';

export class ModelLoader {
    static async loadModel(path: string): Promise<tf.LayersModel> {
        try {
            const model = await tf.loadLayersModel(path);
            console.log(`Model loaded from ${path}`);
            return model;
        } catch (error) {
            console.error(`Failed to load model from ${path}:`, error);
            throw error;
        }
    }
}
