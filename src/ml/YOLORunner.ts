import * as tf from '@tensorflow/tfjs';

export class YOLORunner {
    private model: tf.GraphModel | null = null;
    private classNames: string[] = [];

    constructor(model?: tf.GraphModel, classNames: string[] = []) {
        if (model) this.model = model;
        if (classNames.length > 0) this.classNames = classNames;
    }

    setModel(model: tf.GraphModel, classNames: string[]) {
        this.model = model;
        this.classNames = classNames;
    }

    /**
     * Executes YOLOv8 inference on an image tensor.
     * @param input HTMLVideoElement, HTMLImageElement, or Tensor
     */
    async predict(input: HTMLVideoElement | HTMLImageElement | tf.Tensor): Promise<{ label: string, confidence: number, box: number[] } | null> {
        if (!this.model) return null;

        const [results, classId, score] = tf.tidy(() => {
            let imgTensor: tf.Tensor;
            if (input instanceof tf.Tensor) {
                imgTensor = input;
            } else {
                imgTensor = tf.browser.fromPixels(input);
            }

            // Pre-process: Resize to 640x640 (standard YOLOv8) and normalize to [0, 1]
            const resized = tf.image.resizeBilinear(imgTensor as tf.Tensor3D, [640, 640]);
            const normalized = resized.div(255.0).expandDims(0); // [1, 640, 640, 3]

            // Inference
            // Note: YOLOv8 TFJS output is typically [1, num_classes + 4, 8400]
            const output = this.model!.predict(normalized) as tf.Tensor;
            
            // Post-processing would go here (NMS, etc.)
            // For now, let's assume a simplified output or use a helper library if needed
            // Standard YOLOv8 post-processing in JS can be complex.
            
            return [null, -1, 0]; // Placeholder for now
        });

        return null;
    }
}
