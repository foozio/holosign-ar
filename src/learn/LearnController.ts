export interface LearnState {
    targetLabel: string;
    isMatched: boolean;
    matchProgress: number; // 0 to 1
}

export class LearnController {
    private signs: string[] = ['A', 'B', 'C', 'D', 'E'];
    private currentIndex: number = 0;
    
    private matchStartTime: number | null = null;
    private readonly REQUIRED_MATCH_TIME_MS = 1500; // Hold for 1.5s

    constructor() {}

    setSigns(signs: string[]) {
        if (signs && signs.length > 0) {
            this.signs = signs;
            this.currentIndex = 0;
            this.resetMatch();
        }
    }

    getTarget(): string {
        return this.signs[this.currentIndex];
    }

    nextSign(): string {
        this.currentIndex = (this.currentIndex + 1) % this.signs.length;
        this.resetMatch();
        return this.getTarget();
    }

    processDetection(label: string, confidence: number): LearnState {
        const target = this.getTarget();
        const isCurrentlyMatching = label === target && confidence > 0.6;

        if (isCurrentlyMatching) {
            if (this.matchStartTime === null) {
                this.matchStartTime = Date.now();
            }
        } else {
            this.matchStartTime = null;
        }

        const elapsed = this.matchStartTime ? Date.now() - this.matchStartTime : 0;
        const progress = Math.min(elapsed / this.REQUIRED_MATCH_TIME_MS, 1);
        const isMatched = progress >= 1;

        return {
            targetLabel: target,
            isMatched,
            matchProgress: progress
        };
    }

    private resetMatch() {
        this.matchStartTime = null;
    }
}
