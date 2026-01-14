import type { Landmark } from '@mediapipe/hands';

export interface NormalizedLandmark {
    x: number;
    y: number;
    z: number;
}

export interface FingerState {
    name: 'Thumb' | 'Index' | 'Middle' | 'Ring' | 'Pinky';
    isExtended: boolean;
    isCurled: boolean;
    curlScore: number; // 0 (extended) to 1 (curled)
}

export interface HandFeaturesData {
    normalizedLandmarks: NormalizedLandmark[];
    fingerStates: FingerState[];
    palmNormal: { x: number; y: number; z: number };
    handScale: number; // Distance from wrist to middle finger MCP
}

export class HandFeatures {
    static readonly WRIST = 0;
    static readonly THUMB_CMC = 1;
    static readonly THUMB_MCP = 2;
    static readonly THUMB_IP = 3;
    static readonly THUMB_TIP = 4;
    static readonly INDEX_MCP = 5;
    static readonly INDEX_PIP = 6;
    static readonly INDEX_DIP = 7;
    static readonly INDEX_TIP = 8;
    static readonly MIDDLE_MCP = 9;
    static readonly MIDDLE_PIP = 10;
    static readonly MIDDLE_DIP = 11;
    static readonly MIDDLE_TIP = 12;
    static readonly RING_MCP = 13;
    static readonly RING_PIP = 14;
    static readonly RING_DIP = 15;
    static readonly RING_TIP = 16;
    static readonly PINKY_MCP = 17;
    static readonly PINKY_PIP = 18;
    static readonly PINKY_DIP = 19;
    static readonly PINKY_TIP = 20;

    static extract(landmarks: Landmark[]): HandFeaturesData {
        const wrist = landmarks[this.WRIST];
        const middleMcp = landmarks[this.MIDDLE_MCP];

        // 1. Compute Hand Scale (Wrist to Middle MCP)
        const handScale = this.distance(wrist, middleMcp);

        // 2. Normalize Landmarks: Center at wrist, scale by handScale
        // Note: We invert Z because MediaPipe Z is normalized by image width (sort of) but we want consistent 3D
        const normalizedLandmarks = landmarks.map(lm => ({
            x: (lm.x - wrist.x) / handScale,
            y: (lm.y - wrist.y) / handScale,
            z: (lm.z - wrist.z) / handScale
        }));

        // 3. Compute Finger States
        const fingerStates = this.computeFingerStates(normalizedLandmarks);

        // 4. Compute Palm Normal (using Wrist, Index MCP, Pinky MCP)
        const palmNormal = this.computePalmNormal(normalizedLandmarks);

        return {
            normalizedLandmarks,
            fingerStates,
            palmNormal,
            handScale
        };
    }

    private static computeFingerStates(landmarks: NormalizedLandmark[]): FingerState[] {
        const states: FingerState[] = [];
        const fingers = [
            { name: 'Thumb', tip: this.THUMB_TIP, ip: this.THUMB_IP, mcp: this.THUMB_MCP, cmc: this.THUMB_CMC }, // Thumb logic is different usually
            { name: 'Index', tip: this.INDEX_TIP, pip: this.INDEX_PIP, mcp: this.INDEX_MCP },
            { name: 'Middle', tip: this.MIDDLE_TIP, pip: this.MIDDLE_PIP, mcp: this.MIDDLE_MCP },
            { name: 'Ring', tip: this.RING_TIP, pip: this.RING_PIP, mcp: this.RING_MCP },
            { name: 'Pinky', tip: this.PINKY_TIP, pip: this.PINKY_PIP, mcp: this.PINKY_MCP },
        ] as const;

        for (const finger of fingers) {
            // Simple heuristic for extended/curled based on distance of tip to wrist vs mcp to wrist
            // Or distance tip-to-palm center.
            // Better: Angle check.

            let isExtended = false;
            let curlScore = 0;

            if (finger.name === 'Thumb') {
                // Thumb is extended if TIP is far from Pinky MCP? Or angle at IP?
                // Helper: Dot product of thumb vector vs index finger vector?
                // Simple Check 1: Thumb tip x-coord relative to MCP (handedness dependent) - pass for now
                // Simple Check 2: Angle at IP.
                const angle = this.angle(landmarks[finger.mcp], landmarks[finger.ip], landmarks[finger.tip]);
                isExtended = angle > 150; // Straight thumb
                curlScore = 1 - (Math.min(angle, 180) / 180);
            } else {
                // For Index, Middle, Ring, Pinky:
                // Extended if Tip is further from Wrist than PIP is.
                // Also check angle at PIP. 
                // Just check distance to wrist logic below
                // Actually normalized space: X right, Y down (standard image coords).
                // So if fingers point UP (-Y), Tip Y < PIP Y. 
                // But hand can be rotated.

                // Robust way: Distance to wrist.
                // Robust way: Distance to wrist.
                const dTip = this.norm(landmarks[finger.tip]); // Dist to wrist (0,0,0)
                const dPip = this.norm(landmarks[finger.pip]);

                isExtended = dTip > dPip;

                // Continuous Curl Score based on PIP angle
                // 180 degrees (straight) -> 0.0
                // 50 degrees (fully curled) -> 1.0
                const angle = this.angle(landmarks[finger.mcp], landmarks[finger.pip], landmarks[finger.tip]);

                // Map 180..50 to 0..1
                const rawScore = (180 - angle) / 130;
                curlScore = Math.max(0, Math.min(1, rawScore));

                // Override extension if curled enough
                if (curlScore > 0.4) {
                    isExtended = false;
                } else if (curlScore < 0.3) {
                    isExtended = true;
                }
            }

            states.push({
                name: finger.name as any,
                isExtended,
                isCurled: !isExtended,
                curlScore
            });
        }

        return states;
    }

    private static computePalmNormal(landmarks: NormalizedLandmark[]): { x: number, y: number, z: number } {
        const wrist = landmarks[this.WRIST];
        const indexMcp = landmarks[this.INDEX_MCP];
        const pinkyMcp = landmarks[this.PINKY_MCP];

        const v1 = { x: indexMcp.x - wrist.x, y: indexMcp.y - wrist.y, z: indexMcp.z - wrist.z };
        const v2 = { x: pinkyMcp.x - wrist.x, y: pinkyMcp.y - wrist.y, z: pinkyMcp.z - wrist.z };

        // Cross product v1 x v2
        const nx = v1.y * v2.z - v1.z * v2.y;
        const ny = v1.z * v2.x - v1.x * v2.z;
        const nz = v1.x * v2.y - v1.y * v2.x;

        const mag = Math.sqrt(nx * nx + ny * ny + nz * nz);
        return { x: nx / mag, y: ny / mag, z: nz / mag };
    }

    static distance(p1: Landmark, p2: Landmark): number {
        return Math.sqrt(
            Math.pow(p1.x - p2.x, 2) +
            Math.pow(p1.y - p2.y, 2) +
            Math.pow(p1.z - p2.z, 2)
        );
    }

    private static norm(p: NormalizedLandmark): number {
        return Math.sqrt(p.x * p.x + p.y * p.y + p.z * p.z);
    }

    private static angle(a: NormalizedLandmark, b: NormalizedLandmark, c: NormalizedLandmark): number {
        const v1 = { x: a.x - b.x, y: a.y - b.y, z: a.z - b.z };
        const v2 = { x: c.x - b.x, y: c.y - b.y, z: c.z - b.z };

        const dot = v1.x * v2.x + v1.y * v2.y + v1.z * v2.z;
        const mag1 = Math.sqrt(v1.x * v1.x + v1.y * v1.y + v1.z * v1.z);
        const mag2 = Math.sqrt(v2.x * v2.x + v2.y * v2.y + v2.z * v2.z);

        const cosAngle = Math.max(-1, Math.min(1, dot / (mag1 * mag2)));
        return Math.acos(cosAngle) * (180 / Math.PI);
    }
}
