import * as tf from '@tensorflow/tfjs';

export class ModelLoader {
    static async loadLayersModel(path: string): Promise<tf.LayersModel> {
        try {
            const model = await tf.loadLayersModel(path);
            console.log(`LayersModel loaded from ${path}`);
            return model;
        } catch (error) {
            console.error(`Failed to load LayersModel from ${path}:`, error);
            throw error;
        }
    }

    static async loadGraphModel(path: string): Promise<tf.GraphModel> {
        try {
            const model = await tf.loadGraphModel(path);
            console.log(`GraphModel loaded from ${path}`);
            return model;
        } catch (error) {
            console.error(`Failed to load GraphModel from ${path}:`, error);
            throw error;
        }
    }
}