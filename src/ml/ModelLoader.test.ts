import { describe, it, expect, vi, beforeEach } from 'vitest';
import { ModelLoader } from './ModelLoader';
import * as tf from '@tensorflow/tfjs';

// Mock tfjs
vi.mock('@tensorflow/tfjs', () => ({
    loadLayersModel: vi.fn(),
    loadGraphModel: vi.fn(),
}));

describe('ModelLoader', () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    it('should load a LayersModel from a given path', async () => {
        const mockModel = { id: 'mock-layers-model' } as any;
        (tf.loadLayersModel as any).mockResolvedValue(mockModel);

        const model = await ModelLoader.loadLayersModel('path/to/model.json');
        
        expect(tf.loadLayersModel).toHaveBeenCalledWith('path/to/model.json');
        expect(model).toBe(mockModel);
    });

    it('should load a GraphModel from a given path', async () => {
        const mockModel = { id: 'mock-graph-model' } as any;
        (tf.loadGraphModel as any).mockResolvedValue(mockModel);

        const model = await ModelLoader.loadGraphModel('path/to/graph-model.json');
        
        expect(tf.loadGraphModel).toHaveBeenCalledWith('path/to/graph-model.json');
        expect(model).toBe(mockModel);
    });

    it('should throw an error if loading fails', async () => {
        (tf.loadLayersModel as any).mockRejectedValue(new Error('Load failed'));

        await expect(ModelLoader.loadLayersModel('invalid/path')).rejects.toThrow('Load failed');
    });
});
