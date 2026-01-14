// src/ui/LearnMode/SignSelector.ts
export class SignSelector {
    private container: HTMLElement;
    private element: HTMLElement;
    private onSelect: (sign: string) => void;
    private signs = ['A', 'B', 'C', 'D', 'E', '1', '2', '3', 'HELLO'];
    private activeSign: string | null = null;

    constructor(container: HTMLElement, onSelect: (sign: string) => void) {
        this.container = container;
        this.onSelect = onSelect;
        this.element = document.createElement('div');
        this.element.className = 'sign-selector';
        this.render();
        this.container.appendChild(this.element);
    }

    private render() {
        this.element.innerHTML = '';
        this.signs.forEach(sign => {
            const btn = document.createElement('button');
            btn.className = 'sign-btn';
            if (this.activeSign === sign) {
                btn.classList.add('active');
            }
            btn.textContent = sign;
            btn.onclick = () => {
                this.select(sign);
            };
            this.element.appendChild(btn);
        });
    }

    private select(sign: string) {
        this.activeSign = sign;
        this.render(); // Re-render to update active class
        this.onSelect(sign);
    }
}
