import type { Dataset, Sample, DatasetMeta } from './DatasetTypes';

export class DatasetStore {
    private samples: Sample[] = [];
    private meta: DatasetMeta;

    constructor() {
        this.meta = {
            dataset: 'holosign-asl',
            version: '1.0',
            createdAt: new Date().toISOString(),
            fps: 30, // Approx
            notes: 'On-device capture. No images stored.'
        };
    }

    addSample(sample: Sample) {
        this.samples.push(sample);
        console.log(`Sample added: ${sample.label} (${sample.type}), Total: ${this.samples.length}`);
    }

    getSamples(): Sample[] {
        return this.samples;
    }

    getCounts(): Record<string, number> {
        const counts: Record<string, number> = {};
        for (const s of this.samples) {
            const key = `${s.label}_${s.type}_${s.handedness}`;
            counts[key] = (counts[key] || 0) + 1;
        }
        return counts;
    }

    clear() {
        this.samples = [];
    }

    exportJSON(): string {
        const dataset: Dataset = {
            meta: { ...this.meta, createdAt: new Date().toISOString() },
            samples: this.samples
        };
        return JSON.stringify(dataset, null, 2);
    }

    download() {
        const json = this.exportJSON();
        const blob = new Blob([json], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `holosign-dataset-${new Date().toISOString().split('T')[0]}.json`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
    }
}
