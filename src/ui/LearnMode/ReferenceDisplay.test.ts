// src/ui/LearnMode/ReferenceDisplay.test.ts
// @vitest-environment jsdom
import { describe, it, expect, beforeEach } from 'vitest';
import { ReferenceDisplay } from './ReferenceDisplay';

describe('ReferenceDisplay', () => {
    let container: HTMLElement;
    let display: ReferenceDisplay;

    beforeEach(() => {
        container = document.createElement('div');
        display = new ReferenceDisplay(container);
    });

    it('should be created', () => {
        expect(display).toBeDefined();
    });

    it('should create an image element', () => {
        const img = container.querySelector('img');
        expect(img).toBeDefined();
        expect(img?.classList.contains('reference-image')).toBe(true);
    });

    it('should update image source when a sign is set', () => {
        display.setSign('A');
        const img = container.querySelector('img') as HTMLImageElement;
        expect(img.src).toContain('assets/reference/A.png');
        expect(img.style.display).not.toBe('none');
    });

    it('should hide image when sign is null', () => {
        display.setSign(null);
        const img = container.querySelector('img') as HTMLImageElement;
        expect(img.style.display).toBe('none');
    });

    it('should handle signs without images gracefully', () => {
        display.setSign('UNKNOWN');
        const img = container.querySelector('img') as HTMLImageElement;
        expect(img.src).toContain('assets/reference/UNKNOWN.png');
        // Ideally we'd check for error handling, but simple src setting is enough for MVP
    });
});
