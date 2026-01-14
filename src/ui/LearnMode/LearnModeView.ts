// src/ui/LearnMode/LearnModeView.ts
export class LearnModeView {
    private container: HTMLElement;
    private viewElement: HTMLElement;

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

        // Placeholder content
        const content = document.createElement('div');
        content.className = 'learn-content';
        content.textContent = 'Select a sign to practice';
        this.viewElement.appendChild(content);
    }

    public show() {
        this.viewElement.classList.remove('hidden');
    }

    public hide() {
        this.viewElement.classList.add('hidden');
    }
}
