export type Handedness = 'Left' | 'Right' | 'Unknown';
export type SampleType = 'static' | 'dynamic';

export interface NormalizedLandmark {
    x: number;
    y: number;
    z: number;
}

export interface FrameFeatures {
    norm: NormalizedLandmark[];
    // Store angles per finger? 
    // We can just store the raw fingerStates or angles if we computed them.
    // The plan mentioned "angles: per finger arrays" and "fingerState"
    angles?: Record<string, number[]>;
    fingerState?: Record<string, string>;
}

export interface Frame {
    t: number; // ms since capture start
    score: number;
    landmarks: NormalizedLandmark[]; // Raw landmarks (we can just store x,y,z objects)
    features: FrameFeatures;
}

export interface Sample {
    id: string;
    label: string;
    type: SampleType;
    handedness: Handedness;
    frames: Frame[];
    summary: {
        medianNorm?: NormalizedLandmark[];
        meanAngles?: Record<string, number[]>;
        durationMs?: number;
    };
    timestamp: number;
}

export interface DatasetMeta {
    dataset: string;
    version: string;
    createdAt: string;
    fps: number;
    notes: string;
}

export interface Dataset {
    meta: DatasetMeta;
    samples: Sample[];
}
