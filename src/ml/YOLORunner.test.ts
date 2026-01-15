import { describe, it, expect, vi, beforeEach } from 'vitest';
import { YOLORunner } from './YOLORunner';
import * as tf from '@tensorflow/tfjs';

vi.mock('@tensorflow/tfjs', async () => {
    const actual = await vi.importActual('@tensorflow/tfjs') as any;
    return {
        ...actual,
        browser: {
            ...actual.browser,
            fromPixels: vi.fn(() => actual.zeros([480, 640, 3])),
        },
    };
});

describe('YOLORunner', () => {
    let mockModel: any;
    let runner: YOLORunner;
    const classNames = ['A', 'B', 'C'];

    beforeEach(() => {
        vi.clearAllMocks();
        mockModel = {
            predict: vi.fn(),
            shape: [1, 84, 8400] // Standard YOLOv8 output shape [batch, 4+num_classes, boxes]
        };
        runner = new YOLORunner(mockModel, classNames);
    });

    it('should return null if model is not set', async () => {
        const emptyRunner = new YOLORunner();
        const result = await emptyRunner.predict({} as any);
        expect(result).toBeNull();
    });

    it('should perform inference and return detection if successful', async () => {
        // Mocking a successful detection
        // Shape: [1, 4 (coords) + 3 (classes), 1 (box)] = [1, 7, 1]
        // Coords: [0.5, 0.5, 0.1, 0.1]
        // Classes: [0.9, 0.1, 0.1] -> Class 0 ('A') with 0.9 confidence
        const mockOutput = tf.tensor3d([[[0.5], [0.5], [0.1], [0.1], [0.9], [0.1], [0.1]]], [1, 7, 1]);
        mockModel.predict.mockReturnValue(mockOutput);

        const result = await runner.predict({} as any);
        
        expect(result).not.toBeNull();
        expect(result?.label).toBe('A');
        expect(result?.confidence).toBeCloseTo(0.9);
    });
});
