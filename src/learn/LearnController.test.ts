import { describe, it, expect, beforeEach, vi } from 'vitest';
import { LearnController } from './LearnController';

describe('LearnController', () => {
    let controller: LearnController;

    beforeEach(() => {
        controller = new LearnController();
        vi.useFakeTimers();
    });

    it('should start with the first sign (A)', () => {
        expect(controller.getTarget()).toBe('A');
    });

    it('should track progress when matching label is provided', () => {
        const state = controller.processDetection('A', 0.9);
        expect(state.targetLabel).toBe('A');
        expect(state.matchProgress).toBe(0); // First frame
        
        vi.advanceTimersByTime(750);
        const middleState = controller.processDetection('A', 0.9);
        expect(middleState.matchProgress).toBe(0.5); // 750 / 1500
        expect(middleState.isMatched).toBe(false);

        vi.advanceTimersByTime(750);
        const finalState = controller.processDetection('A', 0.9);
        expect(finalState.matchProgress).toBe(1);
        expect(finalState.isMatched).toBe(true);
    });

    it('should reset progress when label stops matching', () => {
        controller.processDetection('A', 0.9);
        vi.advanceTimersByTime(750);
        
        const state = controller.processDetection('B', 0.9); // Wrong sign
        expect(state.matchProgress).toBe(0);
        expect(state.isMatched).toBe(false);
    });

    it('should not progress if confidence is below threshold', () => {
        controller.processDetection('A', 0.55); // Below 0.6
        vi.advanceTimersByTime(750);
        const state = controller.processDetection('A', 0.55);
        expect(state.matchProgress).toBe(0);
    });

    it('should handle "NONE" label correctly', () => {
        controller.processDetection('A', 0.9);
        vi.advanceTimersByTime(750);
        const state = controller.processDetection('NONE', 0);
        expect(state.matchProgress).toBe(0);
    });

    it('should maintain progress if called multiple times with matching label', () => {
        controller.processDetection('A', 0.9);
        vi.advanceTimersByTime(500);
        controller.processDetection('A', 0.9);
        vi.advanceTimersByTime(500);
        const state = controller.processDetection('A', 0.9);
        expect(state.matchProgress).toBeCloseTo(1000 / 1500);
    });

    it('should advance to next sign', () => {
        expect(controller.getTarget()).toBe('A');
        controller.nextSign();
        expect(controller.getTarget()).toBe('B');
    });
});
