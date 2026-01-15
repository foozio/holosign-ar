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

            // Inference: [1, 4 + num_classes, 8400]
            const output = this.model!.predict(normalized) as tf.Tensor;
            
            // Transpose and squeeze: [8400, 4 + num_classes]
            const predictions = output.transpose([0, 2, 1]).squeeze([0]);
            
            // Extract boxes and scores
            // YOLOv8 format: [x_center, y_center, width, height, class0, class1, ...]
            const [boxes, scores] = tf.tidy(() => {
                const b = predictions.slice([0, 0], [-1, 4]);
                const s = predictions.slice([0, 4], [-1, -1]).max(1);
                return [b, s];
            });

            const classIndices = predictions.slice([0, 4], [-1, -1]).argMax(1);

            return { boxes, scores, classIndices };
        });

        // Perform Non-Maximum Suppression
        const nmsIndices = await tf.image.nonMaxSuppressionAsync(
            result.boxes as tf.Tensor2D,
            result.scores as tf.Tensor1D,
            1, // maxOutputSize
            0.5, // iouThreshold
            0.5 // scoreThreshold
        );

        let finalResult: { classId: number, score: number } | null = null;
        
        if (nmsIndices.shape[0] > 0) {
            const index = (await nmsIndices.data())[0];
            const score = (await result.scores.data())[index];
            const classId = (await result.classIndices.data())[index];
            
            finalResult = {
                classId,
                score
            };
        }

        // Cleanup tensors
        result.boxes.dispose();
        result.scores.dispose();
        result.classIndices.dispose();
        nmsIndices.dispose();

        if (finalResult && finalResult.classId !== -1 && this.classNames.length > 0) {
            return {
                label: this.classNames[finalResult.classId],
                confidence: finalResult.score,
                box: [0, 0, 0, 0]
            };
        }

        return null;
    }
}
