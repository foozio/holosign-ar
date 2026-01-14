// src/ui/LearnMode/FeedbackOverlay.test.ts
// @vitest-environment jsdom
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { FeedbackOverlay } from './FeedbackOverlay';

describe('FeedbackOverlay', () => {
    let container: HTMLElement;
    let overlay: FeedbackOverlay;

    beforeEach(() => {
        container = document.createElement('div');
        overlay = new FeedbackOverlay(container);
    });

    it('should be created', () => {
        expect(overlay).toBeDefined();
    });

    it('should set status to neutral by default', () => {
        const el = container.querySelector('.feedback-overlay') as HTMLElement;
        expect(el.classList.contains('neutral')).toBe(true);
    });

    it('should update to success status', () => {
        overlay.setStatus('success');
        const el = container.querySelector('.feedback-overlay') as HTMLElement;
        expect(el.classList.contains('success')).toBe(true);
        expect(el.classList.contains('neutral')).toBe(false);
    });

    it('should update to matching status', () => {
        overlay.setStatus('matching');
        const el = container.querySelector('.feedback-overlay') as HTMLElement;
        expect(el.classList.contains('matching')).toBe(true);
    });

    it('should update to mismatch status', () => {
        overlay.setStatus('mismatch');
        const el = container.querySelector('.feedback-overlay') as HTMLElement;
        expect(el.classList.contains('mismatch')).toBe(true);
    });
});
