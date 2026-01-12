import { HandFeatures } from '../features/HandFeatures';
import type { HandFeaturesData } from '../features/HandFeatures';
import { StaticASLClassifier } from './asl/StaticASLClassifier';
import { DynamicASLDetector } from './asl/DynamicASLDetector';
import type { Landmark } from '@mediapipe/hands';
// import { ModelLoader } from '../ml/ModelLoader';
import { StaticModelRunner } from '../ml/StaticModelRunner';
import { DynamicModelRunner } from '../ml/DynamicModelRunner';

export interface RecognitionResult {
    label: string;
    confidence: number;
    type: 'static' | 'dynamic';
    debugInfo?: string[];
}

export class Recognizer {
    // Rule-based systems
    private dynamicDetector: DynamicASLDetector;

    // ML systems
    private staticRunner: StaticModelRunner;
    private dynamicRunner: DynamicModelRunner;
    private useML = false;

    // State
    // private lastResult: RecognitionResult | null = null;
    private frameCount = 0;
    private staticHistory: { label: string; confidence: number }[] = [];
    private readonly historySize = 5;
    private readonly debounceThreshold = 4;
    private lastLandmarks: Landmark[] | null = null;
    private readonly motionThreshold = 0.05; // 5% screen width/height per frame

    constructor() {
        this.dynamicDetector = new DynamicASLDetector();
        this.staticRunner = new StaticModelRunner();
        this.dynamicRunner = new DynamicModelRunner();

        // Try load models (async)
        this.loadModels();
    }

    private async loadModels() {
        try {
            // Placeholder paths - these files don't exist yet
            // const staticModel = await ModelLoader.loadModel('/models/static_model/model.json');
            // this.staticRunner.setModel(staticModel);

            // const dynamicModel = await ModelLoader.loadModel('/models/dynamic_model/model.json');
            // this.dynamicRunner.setModel(dynamicModel);

            // console.log('ML Models loaded');
            // this.useML = true; // Enable ML when loaded
        } catch (e) {
            console.warn('Could not load ML models, falling back to rules', e);
        }
    }

    process(timestamp: number, landmarks: Landmark[]): RecognitionResult | null {
        this.frameCount++;

        // Motion Gating
        if (this.isMoving(landmarks)) {
            this.staticHistory = []; // Reset history on fast motion
            this.lastLandmarks = landmarks;
            return { label: '...', confidence: 0, type: 'static' };
        }
        this.lastLandmarks = landmarks;

        const features: HandFeaturesData = HandFeatures.extract(landmarks);

        if (this.useML) {
            return this.processML(features);
        } else {
            return this.processRules(timestamp, features);
        }
    }

    private isMoving(current: Landmark[]): boolean {
        if (!this.lastLandmarks) return false;

        // Track key points: Wrist(0), IndexTip(8), ThumbTip(4)
        const indices = [0, 4, 8, 12, 16, 20];
        let totalDist = 0;

        for (const idx of indices) {
            const dx = current[idx].x - this.lastLandmarks[idx].x;
            const dy = current[idx].y - this.lastLandmarks[idx].y;
            totalDist += Math.sqrt(dx * dx + dy * dy);
        }

        const avgDist = totalDist / indices.length;
        return avgDist > this.motionThreshold;
    }

    private processML(features: HandFeaturesData): RecognitionResult | null {
        // Dynamic ML
        const dynRes = this.dynamicRunner.process(features);
        if (dynRes) {
            this.staticHistory = [];
            return { ...dynRes, type: 'dynamic' };
        }

        // Static ML
        const staticRes = this.staticRunner.predict(features);

        // Smoothing
        if (staticRes) {
            this.staticHistory.push({ label: staticRes.label, confidence: staticRes.confidence });
        } else {
            this.staticHistory.push({ label: 'NONE', confidence: 0 });
        }
        if (this.staticHistory.length > this.historySize) this.staticHistory.shift();

        // Consensus
        return this.getConsensus();
    }

    private processRules(timestamp: number, features: HandFeaturesData): RecognitionResult | null {
        // Dynamic Rule
        const dynamicRes = this.dynamicDetector.detect(timestamp, features);
        if (dynamicRes) {
            this.staticHistory = [];
            return { ...dynamicRes, type: 'dynamic' };
        }

        // Static Rule
        const staticRes = StaticASLClassifier.classify(features);

        // Smoothing
        if (staticRes) {
            this.staticHistory.push({ label: staticRes.label, confidence: staticRes.confidence });
        } else {
            this.staticHistory.push({ label: 'NONE', confidence: 0 });
        }
        if (this.staticHistory.length > this.historySize) this.staticHistory.shift();

        // Consensus
        return this.getConsensus(staticRes?.debugReasons);
    }

    private getConsensus(debugInfo?: string[]): RecognitionResult | null {
        const counts: Record<string, number> = {};
        const confSums: Record<string, number> = {};

        let maxCount = 0;
        let winner = 'NONE';

        for (const entry of this.staticHistory) {
            const { label, confidence } = entry;
            counts[label] = (counts[label] || 0) + 1;
            confSums[label] = (confSums[label] || 0) + confidence;

            if (counts[label] > maxCount) {
                maxCount = counts[label];
                winner = label;
            }
        }

        if (winner !== 'NONE' && maxCount >= this.debounceThreshold) {
            const avgConf = confSums[winner] / counts[winner];
            return {
                label: winner,
                confidence: avgConf,
                type: 'static',
                debugInfo
            };
        }
        return null;
    }
}
