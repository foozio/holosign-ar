import * as tf from '@tensorflow/tfjs';

export async function setupTFJS() {
    // Try to use WebGL or WebGPU if available
    try {
        // Force WebGL for stability if WebGPU is too experimental
        // Or just let it pick the best
        await tf.ready();
        console.log(`TFJS Backend: ${tf.getBackend()}`);
        
        // Optional: WebGL specific optimizations
        if (tf.getBackend() === 'webgl') {
            tf.env().set('WEBGL_FORCE_F16_PIPELINE', true);
            console.log('WebGL F16 pipeline enabled');
        }
    } catch (e) {
        console.error('Failed to initialize TFJS backend', e);
    }
}
