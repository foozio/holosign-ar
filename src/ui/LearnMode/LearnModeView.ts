// src/ui/LearnMode/LearnModeView.ts
import { SignSelector } from './SignSelector';

export class LearnModeView {
    private container: HTMLElement;
    private viewElement: HTMLElement;
    private signSelector!: SignSelector; // Initialized in setupLayout
    private selectedSign: string | null = null;

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

        // Placeholder content
        const content = document.createElement('div');
        content.className = 'learn-content';
        content.textContent = 'Select a sign to practice';
        this.viewElement.appendChild(content);
    }

    private handleSignSelect(sign: string) {
        this.selectedSign = sign;
        const content = this.viewElement.querySelector('.learn-content');
        if (content) content.textContent = `Practice sign: ${sign}`;
    }

    public show() {
        this.viewElement.classList.remove('hidden');
    }

    public hide() {
        this.viewElement.classList.add('hidden');
    }
}
