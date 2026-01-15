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

        const result = tf.tidy(() => {
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
            const output = this.model!.predict(normalized) as tf.Tensor;
            
            // Placeholder: Return the output shape or some dummy data for now
            // To be replaced with actual NMS logic when model is fully exported
            console.debug('YOLO Output Shape:', output.shape);
            
            return { classId: -1, score: 0 };
        });

        if (result.classId !== -1 && this.classNames.length > 0) {
            return {
                label: this.classNames[result.classId],
                confidence: result.score,
                box: [0, 0, 0, 0]
            };
        }

        return null;
    }
}
