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
import { Calibrator } from '../tracking/Calibration';
import type { SampleType, Handedness } from '../capture/DatasetTypes';
import { LearnController } from '../learn/LearnController';
import type { LearnState } from '../learn/LearnController';

export class App {
    private container: HTMLElement;
    private videoWrapper: HTMLElement;
    private uiWrapper: HTMLElement;
    private webcam: Webcam;
    private hands: MediaPipeHands;
    private smoother: LandmarkSmoother;
    private recognizer: Recognizer;
    private overlay: ThreeOverlay;
    private calibrator: Calibrator;
    private learnController: LearnController;

    // UI Elements
    private captionElement!: HTMLElement;
    private confidenceElement!: HTMLElement;
    private debugPanel!: HTMLElement;
    private modeElement!: HTMLElement;
    private capturePanel!: HTMLElement;
    private learnPanel!: HTMLElement;

    // State
    private mode: 'interpret' | 'learn' | 'capture' = 'interpret';
    private debugMode: boolean = false;
    private isTransitioning: boolean = false;

    // Capture State
    private datasetStore: DatasetStore;
    private captureController: CaptureController;
    private captureLabel: string = 'A';
    private captureType: SampleType = 'static';
    private captureHandedness: Handedness = 'Right';

    // Tracking Config
    private mirrorVideo: boolean = true;
    private handednessLock: 'Auto' | 'Right' | 'Left' = 'Auto';

    // Performance
    private lastFrameTime: number = 0;
    private frameCount: number = 0;
    private lowFpsCount: number = 0;
    private currentQuality: 'high' | 'low' = 'high';
    private lastHandCount: number = 0;

    // Recovery
    private lastTrackingDate: number = Date.now();
    private isRecovering: boolean = false;
    private readonly WATCHDOG_THRESHOLD_MS = 2000;

    constructor(containerId: string) {
        const root = document.getElementById(containerId);
        if (!root) throw new Error(`Container #${containerId} not found`);
        this.container = root;

        // Wrapper for video background
        this.videoWrapper = document.createElement('div');
        this.videoWrapper.className = 'video-container';
        this.container.appendChild(this.videoWrapper);

        // Wrapper for UI Overlay
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
        this.calibrator = new Calibrator();
        this.learnController = new LearnController();

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
            this.lastTrackingDate = Date.now();

            // Filter by Handedness Lock
            let filteredHands = result.hands;
            if (this.handednessLock !== 'Auto') {
                filteredHands = filteredHands.filter(h => h.handedness === this.handednessLock);
            }

            // Reset smoothing if hands were lost and just returned
            if (filteredHands.length > 0 && this.lastHandCount === 0) {
                console.log("Hands re-entered, resetting smoother");
                this.smoother.reset();
            }
            this.lastHandCount = filteredHands.length;

            // 1. Smooth landmarks
            const smoothedHands = filteredHands.map((hand: HandResult) => {
                const smoothedLandmarks = this.smoother.smooth(result.timestamp, hand.landmarks, hand.score);

                // Safety: Check for NaNs
                if (Number.isNaN(smoothedLandmarks[0].x)) {
                    console.warn("Smoother returned NaNs! Resetting.");
                    this.smoother.reset();
                    return { ...hand, landmarks: hand.landmarks, score: 0 }; // Fallback to raw or discard
                }

                return { ...hand, landmarks: smoothedLandmarks };
            }).filter(h => h.score > 0); // Filter out invalidated hands

            const smoothedResult = { ...result, hands: smoothedHands };

            // Process Calibration
            if (this.calibrator.isActive && smoothedHands.length > 0) {
                this.calibrator.process(smoothedHands[0].landmarks);
            }
            // Update overlay with calibration data
            const calibData = this.calibrator.calibrationData;
            if (calibData) {
                this.overlay.setCalibration(calibData);
            }

            // 2. Process based on mode
            if (this.mode === 'interpret') {
                // Recognition
                // Check if we have hands
                if (smoothedHands.length > 0) {
                    // Prefer right hand or first hand
                    const hand = smoothedHands[0];

                    // Filter low confidence hands to prevent "Stuck on E" (Ghosting)
                    if (hand.score < 0.6) {
                        this.captionElement.innerText = "...";
                        this.confidenceElement.style.width = '0%';
                        if (this.debugMode) {
                            this.debugPanel.innerHTML = `<h3>Low Confidence: ${(hand.score * 100).toFixed(0)}%</h3>`;
                        }
                    } else {
                        // Use the video element as source for YOLO
                        this.recognizer.process(result.timestamp, hand.landmarks, this.webcam.videoElement).then(recognition => {
                            if (recognition && this.mode === 'interpret') {
                                // For YOLO results, we might want a slightly different threshold or feedback
                                const confidenceThreshold = recognition.type === 'yolo' ? 0.5 : 0.6;
                                
                                if (recognition.confidence < confidenceThreshold) {
                                    this.captionElement.innerText = "...";
                                    this.confidenceElement.style.width = '0%';
                                } else {
                                    this.updateCaption(recognition);
                                }
                                
                                if (this.debugMode) this.updateDebug(recognition);
                            }
                        });
                    }
                } else {
                    this.captionElement.innerText = "...";
                    this.confidenceElement.style.width = '0%';
                }
            } else if (this.mode === 'learn') {
                if (smoothedHands.length > 0) {
                    const hand = smoothedHands[0];
                    if (hand.score > 0.6) {
                        this.recognizer.process(result.timestamp, hand.landmarks, this.webcam.videoElement).then(recognition => {
                            if (recognition && this.mode === 'learn') {
                                const learnState = this.learnController.processDetection(recognition.label, recognition.confidence);
                                this.updateLearnUI(learnState);
                                if (this.debugMode) this.updateDebug(recognition);
                            }
                        });
                    }
                } else {
                    const learnState = this.learnController.processDetection('NONE', 0);
                    this.updateLearnUI(learnState);
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
        // --- Header (Top HUD) ---
        const header = document.createElement('header');
        header.innerHTML = '<h1>HoloSign AR</h1>';

        // Mode Switcher
        this.modeElement = document.createElement('div');
        this.modeElement.className = 'mode-switch';
        ['interpret', 'learn', 'capture'].forEach(m => {
            const btn = document.createElement('button');
            btn.className = `mode-btn ${this.mode === m ? 'active' : ''}`;
            btn.innerText = m.charAt(0).toUpperCase() + m.slice(1);
            btn.onclick = () => {
                this.setMode(m as any);
                // Update active state
                Array.from(this.modeElement.children).forEach(c => c.classList.remove('active'));
                btn.classList.add('active');
            };
            this.modeElement.appendChild(btn);
        });
        header.appendChild(this.modeElement);
        this.uiWrapper.appendChild(header);

        // --- Main Display Area (Center) ---
        const displayArea = document.createElement('div');
        displayArea.className = 'display-area';

        // Caption
        this.captionElement = document.createElement('div');
        this.captionElement.className = 'caption-display';
        this.captionElement.innerText = "...";
        displayArea.appendChild(this.captionElement);

        // Confidence Bar
        const barContainer = document.createElement('div');
        barContainer.className = 'confidence-bar';
        this.confidenceElement = document.createElement('div');
        this.confidenceElement.className = 'confidence-fill';
        barContainer.appendChild(this.confidenceElement);
        displayArea.appendChild(barContainer);

        this.uiWrapper.appendChild(displayArea);

        // --- Debug Panel ---
        this.debugPanel = document.createElement('div');
        this.debugPanel.className = 'debug-panel hidden'; // Hidden by default
        this.uiWrapper.appendChild(this.debugPanel);

        // --- Footer Controls (Bottom HUD) ---
        const footer = document.createElement('div');
        footer.className = 'footer-controls';

        // Quick Controls Panel
        const quickPanel = document.createElement('div');
        quickPanel.className = 'panel quick-controls';

        // Mirror Toggle
        const mirrorBtn = document.createElement('button');
        mirrorBtn.className = 'icon-btn';
        mirrorBtn.innerHTML = '↔️';
        mirrorBtn.title = 'Toggle Mirror';
        mirrorBtn.onclick = () => {
            this.mirrorVideo = !this.mirrorVideo;
            mirrorBtn.classList.toggle('active');
            if (this.mirrorVideo) this.webcam.videoElement.classList.remove('unmirrored');
            else this.webcam.videoElement.classList.add('unmirrored');
        };
        quickPanel.appendChild(mirrorBtn);

        // Hand Lock
        const lockSel = document.createElement('select');
        ['Auto', 'Right', 'Left'].forEach(opt => {
            const o = document.createElement('option');
            o.value = opt;
            o.text = opt;
            lockSel.appendChild(o);
        });
        lockSel.onchange = (e) => this.handednessLock = (e.target as HTMLSelectElement).value as any;
        quickPanel.appendChild(lockSel);

        // Calibrate Button
        const calibBtn = document.createElement('button');
        calibBtn.className = 'icon-btn';
        calibBtn.innerHTML = '📏';
        calibBtn.title = 'Calibrate Depth (Hold hand up for 3s)';
        calibBtn.onclick = () => {
            if (!this.calibrator.isActive) {
                this.calibrator.start();
                calibBtn.classList.add('active');
                setTimeout(() => calibBtn.classList.remove('active'), 3000);
            }
        };
        quickPanel.appendChild(calibBtn);

        // Debug Toggle
        const debugBtn = document.createElement('button');
        debugBtn.className = 'icon-btn';
        debugBtn.innerText = '🐞';
        debugBtn.onclick = () => {
            this.debugMode = !this.debugMode;
            debugBtn.classList.toggle('active');
            this.debugPanel.classList.toggle('hidden');
        };
        quickPanel.appendChild(debugBtn);

        footer.appendChild(quickPanel);
        this.uiWrapper.appendChild(footer);

        // --- Learn Panel ---
        this.createLearnPanel();
        footer.appendChild(this.learnPanel);

        // --- Capture Panel (Hidden by default, appended to footer when active) ---
        this.createCapturePanel();
        // Initially attached but hidden via CSS or state logic
        footer.appendChild(this.capturePanel);

        // Countdown Overlay
        const countdown = document.createElement('div');
        countdown.id = 'countdown-display';
        countdown.className = 'countdown-overlay';
        this.uiWrapper.appendChild(countdown);

        // Initial State
        this.setMode('interpret');
    }

    private createLearnPanel() {
        this.learnPanel = document.createElement('div');
        this.learnPanel.className = 'panel learn-controls hidden';

        // Header
        const header = document.createElement('div');
        header.className = 'capture-header';
        header.innerHTML = '<h3>Learn Mode</h3>';
        this.learnPanel.appendChild(header);

        // Target Display
        const targetContainer = document.createElement('div');
        targetContainer.className = 'learn-target-container';
        targetContainer.innerHTML = `
            <div class="target-label">Practice: <span id="learn-target-val">A</span></div>
        `;
        this.learnPanel.appendChild(targetContainer);

        // Guide Image (Reuse guide-container style)
        const guideContainer = document.createElement('div');
        guideContainer.className = 'guide-container';
        const guideImg = document.createElement('img');
        guideImg.id = 'learn-guide-image';
        guideImg.className = 'guide-image';
        guideImg.alt = 'Target Gesture';
        guideContainer.appendChild(guideImg);
        this.learnPanel.appendChild(guideContainer);

        // Progress Bar (Visual feedback for hold time)
        const progressContainer = document.createElement('div');
        progressContainer.className = 'learn-progress-container';
        progressContainer.innerHTML = `
            <div class="learn-progress-track">
                <div id="learn-progress-fill" class="learn-progress-fill"></div>
            </div>
            <div id="learn-status-msg" class="learn-status-msg">Hold the pose...</div>
        `;
        this.learnPanel.appendChild(progressContainer);

        // Controls
        const controls = document.createElement('div');
        controls.className = 'capture-row';
        controls.style.marginTop = '10px';

        const nextBtn = document.createElement('button');
        nextBtn.className = 'secondary-btn';
        nextBtn.innerText = 'Skip / Next';
        nextBtn.onclick = () => {
            const next = this.learnController.nextSign();
            this.updateLearnTarget(next);
        };
        controls.appendChild(nextBtn);

        this.learnPanel.appendChild(controls);
    }

    private createCapturePanel() {
        this.capturePanel = document.createElement('div');
        this.capturePanel.className = 'panel capture-controls hidden';

        // Header
        const header = document.createElement('div');
        header.className = 'capture-header';

        // Label Select
        const labelSelect = document.createElement('select');
        ['A', 'B', 'C', 'D', 'E', '1', '2', '3', 'HELLO', 'IDLE_OPEN', 'IDLE_FIST'].forEach(l => {
            const opt = document.createElement('option');
            opt.value = l;
            opt.text = l;
            labelSelect.appendChild(opt);
        });
        labelSelect.onchange = (e) => {
            this.captureLabel = (e.target as HTMLSelectElement).value;
            this.updateGuideImage(this.captureLabel);
        };
        header.appendChild(labelSelect);

        // Type & Hand Select
        const typeSelect = document.createElement('select');
        ['static', 'dynamic'].forEach(t => {
            const opt = document.createElement('option');
            opt.value = t;
            opt.text = t;
            typeSelect.appendChild(opt);
        });
        typeSelect.onchange = (e) => this.captureType = (e.target as HTMLSelectElement).value as SampleType;
        header.appendChild(typeSelect);

        const handSelect = document.createElement('select');
        ['Right', 'Left'].forEach(h => {
            const opt = document.createElement('option');
            opt.value = h;
            opt.text = h;
            handSelect.appendChild(opt);
        });
        handSelect.onchange = (e) => this.captureHandedness = (e.target as HTMLSelectElement).value as Handedness;
        header.appendChild(handSelect);

        this.capturePanel.appendChild(header);

        // Guide Image
        const guideContainer = document.createElement('div');
        guideContainer.className = 'guide-container';
        const guideImg = document.createElement('img');
        guideImg.id = 'guide-image';
        guideImg.className = 'guide-image';
        guideImg.alt = 'Gesture Guide';
        guideContainer.appendChild(guideImg);
        this.capturePanel.appendChild(guideContainer);

        // Init guide
        this.updateGuideImage('A');

        // Stats
        const stats = document.createElement('div');
        stats.className = 'stats-grid';
        stats.innerHTML = `
            <div class="stat-item"><span id="stat-samples-val">0</span><span>Samples</span></div>
            <div class="stat-item"><span id="stat-frames-val">0</span><span>Frames</span></div>
            <div class="stat-item"><span id="stat-rej-val">0</span><span>Rejected</span></div>
        `;
        this.capturePanel.appendChild(stats);

        // Controls
        const controls = document.createElement('div');
        controls.className = 'capture-row';
        controls.style.marginTop = '10px';

        const recBtn = document.createElement('button');
        recBtn.className = 'primary-btn';
        recBtn.innerText = 'Record';
        recBtn.id = 'btn-record';
        recBtn.onclick = () => this.toggleRecord();
        recBtn.onclick = () => this.toggleRecord();
        controls.appendChild(recBtn);

        const cancelBtn = document.createElement('button');
        cancelBtn.className = 'secondary-btn hidden'; // Hidden by default
        cancelBtn.innerText = 'Cancel';
        cancelBtn.id = 'btn-cancel';
        cancelBtn.style.marginTop = '8px';
        cancelBtn.style.color = 'var(--color-danger)';
        cancelBtn.onclick = () => this.captureController.stop(false);
        controls.appendChild(cancelBtn);

        this.capturePanel.appendChild(controls);

        // Action Row
        const actions = document.createElement('div');
        actions.className = 'capture-row';

        const dlBtn = document.createElement('button');
        dlBtn.className = 'secondary-btn';
        dlBtn.innerText = 'Download JSON';
        dlBtn.onclick = () => this.datasetStore.download();
        actions.appendChild(dlBtn);

        const clearBtn = document.createElement('button');
        clearBtn.className = 'secondary-btn';
        clearBtn.innerText = 'Clear Data';
        clearBtn.style.color = 'var(--color-danger)';
        clearBtn.style.borderColor = 'rgba(255, 71, 87, 0.3)';
        clearBtn.onclick = () => {
            if (confirm('Clear all recorded samples?')) {
                this.datasetStore.clear();
                this.updateCaptureStats(0, 0, 0);
            }
        };
        actions.appendChild(clearBtn);

        this.capturePanel.appendChild(actions);
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
                btn.innerText = 'Stop (Save)';
                btn.classList.add('danger');
            }
            const cancelBtn = document.getElementById('btn-cancel');
            if (cancelBtn) cancelBtn.classList.remove('hidden');
        };

        this.captureController.onRecordingStop = (sample) => {
            const btn = document.getElementById('btn-record');
            if (btn) {
                btn.innerText = 'Record';
                btn.classList.remove('danger');
            }
            const cancelBtn = document.getElementById('btn-cancel');
            if (cancelBtn) cancelBtn.classList.add('hidden');
            if (sample) {
                console.log('Saved sample', sample.id);
            }
            this.updateCaptureStats(this.datasetStore.getSamples().length, 0, 0);
        };

        this.captureController.onProgress = (_count, accepted, rejected) => {
            this.updateCaptureStats(this.datasetStore.getSamples().length, accepted, rejected);
        };

        this.captureController.onQualityWarning = (msg) => {
            console.warn(msg);
        };
    }

    private updateCaptureStats(samples: number, frames: number, rejected: number) {
        document.getElementById('stat-samples-val')!.innerText = samples.toString();
        document.getElementById('stat-frames-val')!.innerText = frames.toString();
        document.getElementById('stat-rej-val')!.innerText = rejected.toString();
    }

    private toggleRecord() {
        const btn = document.getElementById('btn-record');
        if (btn?.innerText.includes('Stop')) {
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
        this.isTransitioning = false; // Reset any pending transitions
        if (this.capturePanel) {
            if (mode === 'capture') this.capturePanel.classList.remove('hidden');
            else this.capturePanel.classList.add('hidden');
        }
        if (this.learnPanel) {
            if (mode === 'learn') {
                this.learnPanel.classList.remove('hidden');
                this.updateLearnTarget(this.learnController.getTarget());
            }
            else this.learnPanel.classList.add('hidden');
        }
        if (this.captionElement) {
            this.captionElement.style.display = (mode === 'interpret' || mode === 'learn') ? 'block' : 'none';
        }
    }

    private updateLearnTarget(label: string) {
        const targetEl = document.getElementById('learn-target-val');
        if (targetEl) targetEl.innerText = label;

        const guideImg = document.getElementById('learn-guide-image') as HTMLImageElement;
        if (guideImg && ['A', 'B', 'C', 'D', 'E'].includes(label)) {
            guideImg.src = `./assets/reference/${label}.png`;
        }
    }

    private updateCaption(result: RecognitionResult) {
        this.captionElement.innerText = result.label;
        if (this.confidenceElement) {
            this.confidenceElement.style.width = `${result.confidence * 100}%`;
        }
    }

    private updateLearnUI(state: LearnState) {
        this.captionElement.innerText = `Match: ${state.targetLabel}`;
        
        const fill = document.getElementById('learn-progress-fill');
        const msg = document.getElementById('learn-status-msg');

        if (fill) {
            fill.style.width = `${state.matchProgress * 100}%`;
            if (state.isMatched && !this.isTransitioning) {
                this.isTransitioning = true;
                fill.classList.add('success');
                this.captionElement.classList.add('success-match');
                if (msg) {
                    msg.innerText = "Perfect! Success!";
                    msg.style.color = 'var(--color-success)';
                    msg.classList.add('success-pulse');
                }
                
                // Auto-advance after a short delay
                setTimeout(() => {
                    if (this.mode === 'learn') {
                        const next = this.learnController.nextSign();
                        this.updateLearnTarget(next);
                        // Reset classes
                        fill.classList.remove('success');
                        this.captionElement.classList.remove('success-match');
                        if (msg) {
                            msg.classList.remove('success-pulse');
                        }
                    }
                    this.isTransitioning = false;
                }, 1500);
            } else if (!state.isMatched && !this.isTransitioning) {
                fill.classList.remove('success');
                this.captionElement.classList.remove('success-match');
                fill.style.backgroundColor = 'var(--color-primary)';
                if (msg) {
                    msg.classList.remove('success-pulse');
                    if (state.matchProgress > 0) {
                        msg.innerText = "Hold it...";
                        msg.style.color = 'var(--color-primary)';
                    } else {
                        msg.innerText = "Match the sign to continue";
                        msg.style.color = 'var(--color-text-muted)';
                    }
                }
            }
        }

        if (this.confidenceElement) {
            this.confidenceElement.style.width = '0%'; // Hide main confidence bar in learn mode
        }
    }

    private updateDebug(result: RecognitionResult) {
        this.debugPanel.innerHTML = `
            <h3>Debug Info</h3>
            <p><strong>Label:</strong> ${result.label}</p>
            <p><strong>Confidence:</strong> ${result.confidence.toFixed(2)}</p>
            <p><strong>Type:</strong> ${result.type.toUpperCase()}</p>
            <hr style="border: 0; border-top: 1px solid rgba(255,255,255,0.1); margin: 8px 0;">
            <pre>${JSON.stringify(result.debugInfo, null, 2)}</pre>
        `;
    }

    private loop = () => {
        const now = performance.now();
        const delta = now - this.lastFrameTime;

        if (delta >= 1000) {
            const fps = this.frameCount;
            if (fps < 25) this.lowFpsCount++;
            else this.lowFpsCount = 0;

            if (this.lowFpsCount > 2 && this.currentQuality === 'high') {
                console.log("Downgrading quality");
                this.overlay.setQuality('low');
                this.currentQuality = 'low';
            } else if (fps > 50 && this.currentQuality === 'low') {
                console.log("Upgrading quality");
                this.overlay.setQuality('high');
                this.currentQuality = 'high';
            }

            this.frameCount = 0;
            this.lastFrameTime = now;
            this.lastFrameTime = now;
        }

        // Watchdog: Check if tracking has stalled
        if (!this.isRecovering && (Date.now() - this.lastTrackingDate > this.WATCHDOG_THRESHOLD_MS)) {
            console.warn("Tracking stalled! Attempting recovery...");
            this.isRecovering = true;
            this.recoverTracking();
        }

        this.frameCount++;
        requestAnimationFrame(this.loop);
    }

    private async recoverTracking() {
        try {
            this.captionElement.innerText = "Recovering...";
            await this.hands.start(this.webcam.videoElement);
            this.lastTrackingDate = Date.now(); // Reset timer
            console.log("Tracking recovery successful");
        } catch (e) {
            console.error("Recovery failed", e);
        } finally {
            this.isRecovering = false;
        }
    }

    private updateGuideImage(label: string) {
        const img = document.getElementById('guide-image') as HTMLImageElement;
        if (img) {
            // Check if we have an asset for this label
            // In a real app we might check existence, here we know we have A-E
            if (['A', 'B', 'C', 'D', 'E'].includes(label)) {
                img.src = `./assets/reference/${label}.png`;
                img.style.display = 'block';
                (img.parentElement as HTMLElement).style.display = 'flex';
            } else {
                img.style.display = 'none';
                (img.parentElement as HTMLElement).style.display = 'none';
            }
        }
    }
}

