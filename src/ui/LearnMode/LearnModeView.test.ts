// src/ui/LearnMode/LearnModeView.test.ts
// @vitest-environment jsdom
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { LearnModeView } from './LearnModeView';

describe('LearnModeView', () => {
    let container: HTMLElement;
    let view: LearnModeView;

    beforeEach(() => {
        container = document.createElement('div');
        view = new LearnModeView(container);
    });

    it('should be created', () => {
        expect(view).toBeDefined();
    });

    it('should create a container element with correct class', () => {
        const viewEl = container.querySelector('.learn-mode-view');
        expect(viewEl).toBeDefined();
        expect(viewEl?.tagName).toBe('DIV');
    });

    it('should be hidden by default', () => {
        const viewEl = container.querySelector('.learn-mode-view') as HTMLElement;
        expect(viewEl.classList.contains('hidden')).toBe(true);
    });

    it('should show and hide', () => {
        const viewEl = container.querySelector('.learn-mode-view') as HTMLElement;
        
        view.show();
        expect(viewEl.classList.contains('hidden')).toBe(false);

        view.hide();
        expect(viewEl.classList.contains('hidden')).toBe(true);
    });

    it('should have a header with correct title', () => {
        const header = container.querySelector('h2');
        expect(header).toBeDefined();
        expect(header?.textContent).toBe('LEARN MODE');
    });

    it('should render the SignSelector', () => {
        const selector = container.querySelector('.sign-selector');
        expect(selector).toBeDefined();
        // Check if signs are rendered
        expect(selector?.textContent).toContain('A');
    });

    it('should update status message when a recognition result is received', () => {
        view.show();
        // Select 'A'
        const btnA = Array.from(container.querySelectorAll('.sign-btn')).find(b => b.textContent === 'A') as HTMLButtonElement;
        btnA.click();

        // Send matching recognition result
        view.updateRecognition({
            label: 'A',
            confidence: 0.9,
            type: 'static'
        });

        const status = container.querySelector('.status-message');
        expect(status?.textContent).toContain('Success');
    });

    it('should show matching status when recognition result matches selected sign but low confidence', () => {
        view.show();
        const btnB = Array.from(container.querySelectorAll('.sign-btn')).find(b => b.textContent === 'B') as HTMLButtonElement;
        btnB.click();

        view.updateRecognition({
            label: 'B',
            confidence: 0.4,
            type: 'static'
        });

        const status = container.querySelector('.status-message');
        expect(status?.textContent).toContain('Keep holding');
    });
});
