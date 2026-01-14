// src/ui/LearnMode/LearnModeView.ts
import { SignSelector } from './SignSelector';
import type { RecognitionResult } from '../../recognition/Recognizer';

export class LearnModeView {
    private container: HTMLElement;
    private viewElement: HTMLElement;
    private signSelector!: SignSelector; // Initialized in setupLayout
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
    }

    public updateRecognition(result: RecognitionResult | null) {
        if (!this.selectedSign) return;

        if (!result || result.label === '...') {
            this.statusElement.textContent = `Target: ${this.selectedSign}. Waiting for gesture...`;
            this.statusElement.className = 'status-message';
            return;
        }

        if (result.label === this.selectedSign) {
            if (result.confidence > 0.8) {
                this.statusElement.textContent = `Success! Perfect ${this.selectedSign}`;
                this.statusElement.className = 'status-message success';
            } else if (result.confidence > 0.3) {
                this.statusElement.textContent = `Matching ${this.selectedSign}... Keep holding!`;
                this.statusElement.className = 'status-message matching';
            }
        } else {
            this.statusElement.textContent = `Detected: ${result.label}. Try ${this.selectedSign}`;
            this.statusElement.className = 'status-message mismatch';
        }
    }

    public show() {
        this.viewElement.classList.remove('hidden');
    }

    public hide() {
        this.viewElement.classList.add('hidden');
    }
}
