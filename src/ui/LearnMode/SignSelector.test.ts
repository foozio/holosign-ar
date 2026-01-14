// src/ui/LearnMode/SignSelector.test.ts
// @vitest-environment jsdom
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { SignSelector } from './SignSelector';

describe('SignSelector', () => {
    let container: HTMLElement;
    let selector: SignSelector;
    let onSelect: any;

    beforeEach(() => {
        container = document.createElement('div');
        onSelect = vi.fn();
        selector = new SignSelector(container, onSelect);
    });

    it('should be created', () => {
        expect(selector).toBeDefined();
    });

    it('should render buttons for all signs', () => {
        const buttons = container.querySelectorAll('.sign-btn');
        // A-E (5) + 1-3 (3) + HELLO (1) = 9 signs
        expect(buttons.length).toBeGreaterThanOrEqual(9);
        expect(container.textContent).toContain('A');
        expect(container.textContent).toContain('HELLO');
    });

    it('should trigger onSelect when a sign is clicked', () => {
        const buttons = container.querySelectorAll('.sign-btn');
        const btnA = Array.from(buttons).find(b => b.textContent === 'A') as HTMLButtonElement;
        
        btnA.click();
        expect(onSelect).toHaveBeenCalledWith('A');
    });

    it('should mark the selected sign as active', () => {
        let buttons = container.querySelectorAll('.sign-btn');
        let btnB = Array.from(buttons).find(b => b.textContent === 'B') as HTMLButtonElement;
        
        btnB.click();
        
        // Re-query because render replaces elements
        buttons = container.querySelectorAll('.sign-btn');
        btnB = Array.from(buttons).find(b => b.textContent === 'B') as HTMLButtonElement;
        
        expect(btnB.classList.contains('active')).toBe(true);
    });
});
