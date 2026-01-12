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
    private staticHistory: string[] = [];
    private readonly historySize = 5;
    private readonly debounceThreshold = 4;

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
        const features: HandFeaturesData = HandFeatures.extract(landmarks);

        if (this.useML) {
            return this.processML(features);
        } else {
            return this.processRules(timestamp, features);
        }
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
            this.staticHistory.push(staticRes.label);
        } else {
            this.staticHistory.push('NONE');
        }
        if (this.staticHistory.length > this.historySize) this.staticHistory.shift();

        // Consensus
        return this.getConsensus(staticRes?.confidence || 0);
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
            this.staticHistory.push(staticRes.label);
        } else {
            this.staticHistory.push('NONE');
        }
        if (this.staticHistory.length > this.historySize) this.staticHistory.shift();

        // Consensus
        // Pass confidence from single frame, or average?
        return this.getConsensus(staticRes?.confidence || 0.8, staticRes?.debugReasons);
    }

    private getConsensus(currentConf: number, debugInfo?: string[]): RecognitionResult | null {
        const counts: Record<string, number> = {};
        let maxCount = 0;
        let winner = 'NONE';

        for (const lbl of this.staticHistory) {
            counts[lbl] = (counts[lbl] || 0) + 1;
            if (counts[lbl] > maxCount) {
                maxCount = counts[lbl];
                winner = lbl;
            }
        }

        if (winner !== 'NONE' && maxCount >= this.debounceThreshold) {
            return {
                label: winner,
                confidence: currentConf, // Simplified confidence
                type: 'static',
                debugInfo
            };
        }
        return null;
    }
}
