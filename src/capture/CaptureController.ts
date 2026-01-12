import type { HandResult, TrackingResult } from '../tracking/MediaPipeHands';
import { HandFeatures } from '../features/HandFeatures';
import type { HandFeaturesData } from '../features/HandFeatures';
import type { Sample, Frame, SampleType, Handedness, FrameFeatures } from './DatasetTypes';
import { DatasetStore } from './DatasetStore';
import { v4 as uuidv4 } from 'uuid';

export interface CaptureConfig {
    label: string;
    type: SampleType;
    handedness: Handedness;
    targetDurationMs?: number;
    targetFrameCount?: number;
}

export type CaptureState = 'idle' | 'countdown' | 'recording';

export class CaptureController {
    private state: CaptureState = 'idle';
    private config: CaptureConfig | null = null;
    private frames: Frame[] = [];
    private startTime: number = 0;
    private countdownTimer: number | null = null;
    private currentCountdown: number = 0;

    // Callbacks
    public onCountdown: ((count: number) => void) | null = null;
    public onRecordingStart: (() => void) | null = null;
    public onProgress: ((count: number, accepted: number, rejected: number) => void) | null = null;
    public onRecordingStop: ((sample: Sample | null) => void) | null = null;
    public onQualityWarning: ((msg: string) => void) | null = null;

    private acceptedFrames = 0;
    private rejectedFrames = 0;
    private store: DatasetStore;

    constructor(store: DatasetStore) {
        this.store = store;
    }

    start(config: CaptureConfig) {
        if (this.state !== 'idle') return;
        this.config = config;
        this.state = 'countdown';
        this.currentCountdown = 3;

        if (this.onCountdown) this.onCountdown(this.currentCountdown);

        this.countdownTimer = window.setInterval(() => {
            this.currentCountdown--;
            if (this.onCountdown) this.onCountdown(this.currentCountdown);

            if (this.currentCountdown <= 0) {
                this.beginRecording();
            }
        }, 1000);
    }

    private beginRecording() {
        if (this.countdownTimer) clearInterval(this.countdownTimer);
        this.state = 'recording';
        this.frames = [];
        this.startTime = performance.now();
        this.acceptedFrames = 0;
        this.rejectedFrames = 0;
        if (this.onRecordingStart) this.onRecordingStart();
    }

    stop(save: boolean = true) {
        if (this.countdownTimer) clearInterval(this.countdownTimer);

        if (this.state === 'recording' && save && this.config) {
            const sample = this.compileSample();
            if (sample && sample.frames.length > 0) {
                this.store.addSample(sample);
                if (this.onRecordingStop) this.onRecordingStop(sample);
            } else {
                if (this.onRecordingStop) this.onRecordingStop(null);
            }
        } else {
            if (this.onRecordingStop) this.onRecordingStop(null);
        }

        this.state = 'idle';
        this.config = null;
        this.frames = [];
    }

    processFrame(result: TrackingResult) {
        if (this.state !== 'recording' || !this.config) return;

        const { hands, timestamp } = result;

        // Filter by handedness
        let targetHand: HandResult | undefined;
        if (this.config && this.config.handedness === 'Unknown') {
            targetHand = hands[0]; // Take first available
        } else if (this.config) {
            targetHand = hands.find(h => h.handedness === this.config!.handedness);
        }

        if (!targetHand) {
            this.rejectedFrames++;
            // Only warn occasionally or if persistent? For now, just track stats.
            return;
        }

        // Validation
        if (targetHand.score < 0.7) {
            this.rejectedFrames++;
            if (this.onQualityWarning) this.onQualityWarning('Low tracking confidence');
            return;
        }

        // Extract features
        const features = HandFeatures.extract(targetHand.landmarks);

        const t = timestamp - this.startTime;

        const frame: Frame = {
            t,
            score: targetHand.score,
            landmarks: targetHand.landmarks.map(l => ({ x: l.x, y: l.y, z: l.z })),
            features: this.serializeFeatures(features)
        };

        this.frames.push(frame);
        this.acceptedFrames++;

        if (this.onProgress) {
            this.onProgress(this.frames.length, this.acceptedFrames, this.rejectedFrames);
        }

        this.checkCompletion();
    }

    private serializeFeatures(data: HandFeaturesData): FrameFeatures {
        return {
            norm: data.normalizedLandmarks,
            fingerState: data.fingerStates.reduce((acc, fs) => ({ ...acc, [fs.name]: fs.isCurled ? 'curled' : 'extended' }), {}),
            // Mapped fingerStates to Record<string, string> as expected by FrameFeatures
        };
    }

    private checkCompletion() {
        if (!this.config) return;

        if (this.config.type === 'static' && this.config.targetFrameCount) {
            if (this.acceptedFrames >= this.config.targetFrameCount) {
                this.stop(true);
            }
        } else if (this.config.type === 'dynamic' && this.config.targetDurationMs) {
            const elapsed = performance.now() - this.startTime;
            if (elapsed >= this.config.targetDurationMs) {
                this.stop(true);
            }
        }
    }

    private compileSample(): Sample | null {
        if (!this.config) return null;

        // Compute summary
        const summary: any = {};
        if (this.config.type === 'static' && this.frames.length > 0) {
            // Simple median of normalized landmarks
            // This is expensive to do perfectly, so let's do median of each coord independently
            const numLandmarks = 21;
            const medianNorm: any[] = [];
            for (let i = 0; i < numLandmarks; i++) {
                const xs = this.frames.map(f => f.features.norm[i].x).sort((a, b) => a - b);
                const ys = this.frames.map(f => f.features.norm[i].y).sort((a, b) => a - b);
                const zs = this.frames.map(f => f.features.norm[i].z).sort((a, b) => a - b);
                const mid = Math.floor(this.frames.length / 2);
                medianNorm.push({ x: xs[mid], y: ys[mid], z: zs[mid] });
            }
            summary.medianNorm = medianNorm;
        } else if (this.config.type === 'dynamic') {
            summary.durationMs = performance.now() - this.startTime;
        }

        return {
            id: uuidv4(),
            label: this.config.label,
            type: this.config.type,
            handedness: this.config.handedness,
            frames: this.frames,
            summary,
            timestamp: Date.now()
        };
    }
}
