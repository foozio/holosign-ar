export class Webcam {
  public videoElement: HTMLVideoElement;
  private stream: MediaStream | null = null;

  constructor() {
    this.videoElement = document.createElement('video');
    this.videoElement.autoplay = true;
    this.videoElement.playsInline = true;
    // Hide the video element by default, we'll likely render it to a canvas or behind one
    this.videoElement.style.display = 'none'; 
    document.body.appendChild(this.videoElement);
  }

  async start(constraints: MediaStreamConstraints = { video: { facingMode: 'user', width: 1280, height: 720 } }): Promise<void> {
    try {
      this.stream = await navigator.mediaDevices.getUserMedia(constraints);
      this.videoElement.srcObject = this.stream;
      await new Promise<void>((resolve) => {
        this.videoElement.onloadedmetadata = () => {
          this.videoElement.play();
          resolve();
        };
      });
    } catch (error) {
      console.error('Error accessing webcam:', error);
      throw error;
    }
  }

  stop(): void {
    if (this.stream) {
      this.stream.getTracks().forEach(track => track.stop());
      this.stream = null;
    }
  }

  get video(): HTMLVideoElement {
    return this.videoElement;
  }
}
