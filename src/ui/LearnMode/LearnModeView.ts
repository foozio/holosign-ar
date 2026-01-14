// src/ui/LearnMode/LearnModeView.ts
import { SignSelector } from './SignSelector';
import type { RecognitionResult } from '../../recognition/Recognizer';
import { FeedbackOverlay } from './FeedbackOverlay';

export class LearnModeView {
    private container: HTMLElement;
    private viewElement: HTMLElement;
    private signSelector!: SignSelector; // Initialized in setupLayout
    private feedbackOverlay!: FeedbackOverlay;
    private selectedSign: string | null = null;
    private statusElement!: HTMLElement;

    constructor(container: HTMLElement) {
        this.container = container;
        this.viewElement = document.createElement('div');
        this.viewElement.className = 'learn-mode-view hidden'; // Start hidden
        
        this.setupLayout();
        this.container.appendChild(this.viewElement);
    }

    private setupLayout() {
        // Feedback Overlay as the background/border of the view or app?
        // Actually, the plan says it's a HUD element. 
        // Let's attach it to the viewElement so it borders the Learn Mode window.
        this.feedbackOverlay = new FeedbackOverlay(this.viewElement);

        const header = document.createElement('h2');
        header.textContent = 'LEARN MODE';
        this.viewElement.appendChild(header);

        // Sign Selector
        const selectorContainer = document.createElement('div');
        selectorContainer.style.width = '100%';
        this.viewElement.appendChild(selectorContainer);

        this.signSelector = new SignSelector(selectorContainer, (sign) => {
            this.handleSignSelect(sign);
        });

        // Status / Feedback area
        this.statusElement = document.createElement('div');
        this.statusElement.className = 'status-message';
        this.statusElement.textContent = 'Select a sign to practice';
        this.viewElement.appendChild(this.statusElement);

        // Placeholder for reference display (Phase 3)
        const content = document.createElement('div');
        content.className = 'learn-content';
        this.viewElement.appendChild(content);
    }

    private handleSignSelect(sign: string) {
        this.selectedSign = sign;
        this.statusElement.textContent = `Target: ${sign}. Waiting for gesture...`;
        this.statusElement.className = 'status-message';
        this.feedbackOverlay.setStatus('neutral');
    }

    public updateRecognition(result: RecognitionResult | null) {
        if (!this.selectedSign) return;

        if (!result || result.label === '...') {
            this.statusElement.textContent = `Target: ${this.selectedSign}. Waiting for gesture...`;
            this.statusElement.className = 'status-message';
            this.feedbackOverlay.setStatus('neutral');
            return;
        }

        if (result.label === this.selectedSign) {
            if (result.confidence > 0.8) {
                this.statusElement.textContent = `Success! Perfect ${this.selectedSign}`;
                this.statusElement.className = 'status-message success';
                this.feedbackOverlay.setStatus('success');
            } else if (result.confidence > 0.3) {
                this.statusElement.textContent = `Matching ${this.selectedSign}... Keep holding!`;
                this.statusElement.className = 'status-message matching';
                this.feedbackOverlay.setStatus('matching');
            }
        } else {
            this.statusElement.textContent = `Detected: ${result.label}. Try ${this.selectedSign}`;
            this.statusElement.className = 'status-message mismatch';
            this.feedbackOverlay.setStatus('mismatch');
        }
    }

    public show() {
        this.viewElement.classList.remove('hidden');
    }

    public hide() {
        this.viewElement.classList.add('hidden');
    }
}
