// src/ui/LearnMode/FeedbackOverlay.ts
export type FeedbackStatus = 'neutral' | 'matching' | 'success' | 'mismatch';

export class FeedbackOverlay {
    private container: HTMLElement;
    private element: HTMLElement;
    private currentStatus: FeedbackStatus = 'neutral';

    constructor(container: HTMLElement) {
        this.container = container;
        this.element = document.createElement('div');
        this.element.className = 'feedback-overlay neutral';
        this.container.appendChild(this.element);
    }

    public setStatus(status: FeedbackStatus) {
        if (this.currentStatus === status) return;

        this.element.classList.remove(this.currentStatus);
        this.currentStatus = status;
        this.element.classList.add(this.currentStatus);

        if (status === 'success') {
            this.triggerSuccessEffect();
        }
    }

    private triggerSuccessEffect() {
        // Visual flash or similar
        this.element.classList.add('flash');
        setTimeout(() => this.element.classList.remove('flash'), 500);
    }
}
