// src/ui/LearnMode/ReferenceDisplay.ts
export class ReferenceDisplay {
    private container: HTMLElement;
    private element: HTMLElement;
    private imgElement: HTMLImageElement;

    constructor(container: HTMLElement) {
        this.container = container;
        this.element = document.createElement('div');
        this.element.className = 'reference-display';
        
        this.imgElement = document.createElement('img');
        this.imgElement.className = 'reference-image';
        this.imgElement.style.display = 'none'; // Hidden by default
        
        this.element.appendChild(this.imgElement);
        this.container.appendChild(this.element);
    }

    public setSign(sign: string | null) {
        if (sign) {
            this.imgElement.src = `assets/reference/${sign}.png`;
            this.imgElement.alt = `Reference for sign ${sign}`;
            this.imgElement.style.display = 'block';
        } else {
            this.imgElement.style.display = 'none';
        }
    }
}
