// src/ui/App.ts
import { Webcam } from '../camera/Webcam';
import { MediaPipeHands } from '../tracking/MediaPipeHands';
import type { TrackingResult, HandResult } from '../tracking/MediaPipeHands';
import { LandmarkSmoother } from '../tracking/Smoothing';
import { Recognizer } from '../recognition/Recognizer';
import type { RecognitionResult } from '../recognition/Recognizer';
import { ThreeOverlay } from '../render/ThreeOverlay';
import { DatasetStore } from '../capture/DatasetStore';
import { CaptureController } from '../capture/CaptureController';
import type { CaptureConfig } from '../capture/CaptureController';
import type { SampleType, Handedness } from '../capture/DatasetTypes';

export class App {
    private container: HTMLElement;
    private videoWrapper: HTMLElement;
    private uiWrapper: HTMLElement;
    private webcam: Webcam;
    private hands: MediaPipeHands;
    private smoother: LandmarkSmoother;
    private recognizer: Recognizer;
    private overlay: ThreeOverlay;

    // UI Elements
    private captionElement!: HTMLElement;
    private debugPanel!: HTMLElement;
    private modeElement!: HTMLElement;
    private capturePanel!: HTMLElement;

    // State
    private mode: 'interpret' | 'learn' | 'capture' = 'interpret';
    private debugMode: boolean = false;

    // Capture State
    private datasetStore: DatasetStore;
    private captureController: CaptureController;
    private captureLabel: string = 'A';
    private captureType: SampleType = 'static';
    private captureHandedness: Handedness = 'Right';

    constructor(containerId: string) {
        const root = document.getElementById(containerId);
        if (!root) throw new Error(`Container #${containerId} not found`);
        this.container = root;

        // wrapper
        this.videoWrapper = document.createElement('div');
        this.videoWrapper.className = 'video-container';
        this.container.appendChild(this.videoWrapper);

        this.uiWrapper = document.createElement('div');
        this.uiWrapper.className = 'ui-container';
        this.container.appendChild(this.uiWrapper);

        // Init modules
        this.webcam = new Webcam();
        this.videoWrapper.appendChild(this.webcam.videoElement);

        this.hands = new MediaPipeHands();

        // Capture modules
        this.datasetStore = new DatasetStore();
        this.captureController = new CaptureController(this.datasetStore);

        this.smoother = new LandmarkSmoother();
        this.recognizer = new Recognizer();
        this.overlay = new ThreeOverlay(this.videoWrapper);

        // Setup UI
        this.setupUI();
        this.setupCaptureCallbacks();

        // Start loop
        this.webcam.start().then(() => {
            this.hands.start(this.webcam.videoElement);
            this.loop();
        });

        // Tracking callback
        this.hands.setCallback((result: TrackingResult) => {
            // 1. Smooth landmarks
            const smoothedHands = result.hands.map((hand: HandResult) => {
                const smoothedLandmarks = this.smoother.smooth(result.timestamp, hand.landmarks);
                return { ...hand, landmarks: smoothedLandmarks };
            });

            const smoothedResult = { ...result, hands: smoothedHands };

            // 2. Process based on mode
            if (this.mode === 'interpret') {
                // Recognition
                // Check if we have hands
                if (smoothedHands.length > 0) {
                    // Prefer right hand or first hand
                    const hand = smoothedHands[0];
                    const recognition = this.recognizer.process(result.timestamp, hand.landmarks);
                    if (recognition) {
                        this.updateCaption(recognition);
                        if (this.debugMode) this.updateDebug(recognition);
                    }
                } else {
                    this.captionElement.innerText = "No hands detected";
                }
            } else if (this.mode === 'capture') {
                // Capture logic
                this.captureController.processFrame(smoothedResult);
            }

            // 3. Render
            this.overlay.update(smoothedResult);
            this.overlay.render();
        });
    }

    private setupUI() {
        // Header
        const header = document.createElement('header');
        header.innerHTML = '<h1>HoloSign AR</h1>';
        this.uiWrapper.appendChild(header);

        // Mode Switcher
        this.modeElement = document.createElement('div');
        this.modeElement.className = 'mode-switch';
        ['interpret', 'capture'].forEach(m => {
            const btn = document.createElement('button');
            btn.innerText = m.toUpperCase();
            btn.onclick = () => this.setMode(m as any);
            this.modeElement.appendChild(btn);
        });
        this.uiWrapper.appendChild(this.modeElement);

        // Caption Display
        this.captionElement = document.createElement('div');
        this.captionElement.className = 'caption-display';
        this.captionElement.innerText = "Waiting for hands...";
        this.uiWrapper.appendChild(this.captionElement);

        // Debug Panel
        this.debugPanel = document.createElement('div');
        this.debugPanel.className = 'debug-panel';
        this.debugPanel.style.display = 'none';
        this.uiWrapper.appendChild(this.debugPanel);

        // Toggle Debug
        const debugBtn = document.createElement('button');
        debugBtn.className = 'debug-toggle';
        debugBtn.innerText = '🐞';
        debugBtn.onclick = () => {
            this.debugMode = !this.debugMode;
            this.debugPanel.style.display = this.debugMode ? 'block' : 'none';
        };
        this.uiWrapper.appendChild(debugBtn);

        // Capture Panel (Hidden by default)
        this.createCapturePanel();

        // Countdown Overlay
        const countdown = document.createElement('div');
        countdown.id = 'countdown-display';
        countdown.className = 'countdown-overlay';
        this.uiWrapper.appendChild(countdown);
    }

    private createCapturePanel() {
        this.capturePanel = document.createElement('div');
        this.capturePanel.className = 'capture-controls';
        this.capturePanel.style.display = 'none';

        // Label selection
        const row1 = document.createElement('div');
        row1.className = 'capture-row';
        const labelSelect = document.createElement('select');
        ['A', 'B', 'C', 'D', 'E', '1', '2', '3', 'HELLO', 'IDLE_OPEN', 'IDLE_FIST'].forEach(l => {
            const opt = document.createElement('option');
            opt.value = l;
            opt.text = l;
            labelSelect.appendChild(opt);
        });
        labelSelect.onchange = (e) => this.captureLabel = (e.target as HTMLSelectElement).value;
        row1.appendChild(labelSelect);

        // Type Toggle
        const typeSelect = document.createElement('select');
        ['static', 'dynamic'].forEach(t => {
            const opt = document.createElement('option');
            opt.value = t;
            opt.text = t;
            typeSelect.appendChild(opt);
        });
        typeSelect.onchange = (e) => this.captureType = (e.target as HTMLSelectElement).value as SampleType;
        row1.appendChild(typeSelect);

        // Handedness
        const handSelect = document.createElement('select');
        ['Right', 'Left'].forEach(h => {
            const opt = document.createElement('option');
            opt.value = h;
            opt.text = h;
            handSelect.appendChild(opt);
        });
        handSelect.onchange = (e) => this.captureHandedness = (e.target as HTMLSelectElement).value as Handedness;
        row1.appendChild(handSelect);
        this.capturePanel.appendChild(row1);

        // Info / Stats
        const stats = document.createElement('div');
        stats.className = 'capture-info';
        stats.id = 'capture-stats';
        stats.innerText = 'Samples: 0 | Frames: 0';
        this.capturePanel.appendChild(stats);

        // Buttons
        const row2 = document.createElement('div');
        row2.className = 'capture-row';

        const recBtn = document.createElement('button');
        recBtn.className = 'capture-btn';
        recBtn.innerText = 'Record';
        recBtn.id = 'btn-record';
        recBtn.onclick = () => this.toggleRecord();
        row2.appendChild(recBtn);

        this.capturePanel.appendChild(row2);

        // Export Row
        const row3 = document.createElement('div');
        row3.className = 'capture-row';
        const dlBtn = document.createElement('button');
        dlBtn.className = 'capture-btn';
        dlBtn.innerText = 'Download JSON';
        dlBtn.onclick = () => this.datasetStore.download();
        row3.appendChild(dlBtn);

        const clearBtn = document.createElement('button');
        clearBtn.className = 'capture-btn danger';
        clearBtn.innerText = 'Clear';
        clearBtn.onclick = () => {
            this.datasetStore.clear();
            this.updateCaptureStats(0, 0, 0); // Reset UI stats
        };
        row3.appendChild(clearBtn);

        this.capturePanel.appendChild(row3);

        this.uiWrapper.appendChild(this.capturePanel);
    }

    private setupCaptureCallbacks() {
        this.captureController.onCountdown = (count) => {
            const el = document.getElementById('countdown-display');
            if (el) {
                el.style.display = 'block';
                el.innerText = count.toString();
            }
        };

        this.captureController.onRecordingStart = () => {
            const el = document.getElementById('countdown-display');
            if (el) el.style.display = 'none';
            const btn = document.getElementById('btn-record');
            if (btn) {
                btn.innerText = 'Stop';
                btn.classList.add('danger');
            }
        };

        this.captureController.onRecordingStop = (sample) => {
            const btn = document.getElementById('btn-record');
            if (btn) {
                btn.innerText = 'Record';
                btn.classList.remove('danger');
            }
            if (sample) {
                console.log('Saved sample', sample.id);
            }
            // Update stats
            this.updateCaptureStats(this.datasetStore.getSamples().length, 0, 0);
        };

        this.captureController.onProgress = (_count, accepted, rejected) => {
            this.updateCaptureStats(this.datasetStore.getSamples().length, accepted, rejected);
        };

        this.captureController.onQualityWarning = (msg) => {
            // Flash warning?
            console.warn(msg);
        };
    }

    private updateCaptureStats(samples: number, frames: number, rejected: number) {
        const el = document.getElementById('capture-stats');
        if (el) {
            el.innerText = `Samples: ${samples} | Frames: ${frames} (Rej: ${rejected})`;
        }
    }

    private toggleRecord() {
        const btn = document.getElementById('btn-record');
        if (btn?.innerText === 'Stop') {
            this.captureController.stop();
        } else {
            const config: CaptureConfig = {
                label: this.captureLabel,
                type: this.captureType,
                handedness: this.captureHandedness,
                targetFrameCount: this.captureType === 'static' ? 30 : undefined,
                targetDurationMs: this.captureType === 'dynamic' ? 2000 : undefined
            };
            this.captureController.start(config);
        }
    }

    private setMode(mode: 'interpret' | 'learn' | 'capture') {
        this.mode = mode;
        if (this.capturePanel) {
            this.capturePanel.style.display = mode === 'capture' ? 'flex' : 'none';
        }
        if (this.captionElement) {
            this.captionElement.style.display = mode === 'interpret' ? 'block' : 'none';
        }
    }

    private updateCaption(result: RecognitionResult) {
        this.captionElement.innerText = `${result.label} (${(result.confidence * 100).toFixed(0)}%)`;
    }

    private updateDebug(result: RecognitionResult) {
        this.debugPanel.innerHTML = `
            <h3>Debug Info</h3>
            <p>Label: ${result.label}</p>
            <p>Confidence: ${result.confidence.toFixed(2)}</p>
            <pre>${JSON.stringify(result.debugInfo, null, 2)}</pre>
        `;
    }

    private loop = () => {
        requestAnimationFrame(this.loop);
        // Rendering is event-driven via MediaPipe callbacks
    }
}
