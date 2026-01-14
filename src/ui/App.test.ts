// src/ui/App.test.ts
// @vitest-environment jsdom
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { App } from './App';

// Mock dependencies
vi.mock('../camera/Webcam', () => ({
    Webcam: class {
        videoElement = document.createElement('video');
        start = vi.fn().mockResolvedValue(undefined);
    }
}));

vi.mock('../tracking/MediaPipeHands', () => ({
    MediaPipeHands: class {
        start = vi.fn();
        setCallback = vi.fn();
    }
}));

vi.mock('../capture/DatasetStore', () => ({
    DatasetStore: class {
        getSamples = vi.fn().mockReturnValue([]);
    }
}));

vi.mock('../capture/CaptureController', () => ({
    CaptureController: class {
        processFrame = vi.fn();
        stop = vi.fn();
        start = vi.fn();
    }
}));

vi.mock('../tracking/Smoothing', () => ({
    LandmarkSmoother: class {}
}));

vi.mock('../recognition/Recognizer', () => ({
    Recognizer: class {}
}));

vi.mock('../render/ThreeOverlay', () => ({
    ThreeOverlay: class {
        update = vi.fn();
        render = vi.fn();
        setCalibration = vi.fn();
    }
}));

vi.mock('../tracking/Calibration', () => ({
    Calibrator: class {
        isActive = false;
        calibrationData = null;
        process = vi.fn();
    }
}));

vi.mock('./LearnMode/LearnModeView', () => ({
    LearnModeView: class {
        show = vi.fn();
        hide = vi.fn();
    }
}));

describe('App', () => {
    let container: HTMLElement;
    let app: any; // Using any to access private members for testing

    beforeEach(() => {
        document.body.innerHTML = ''; // Clear body
        container = document.createElement('div');
        container.id = 'app-container';
        document.body.appendChild(container);
    });

    it('should initialize successfully', () => {
        app = new App('app-container');
        expect(app).toBeDefined();
    });

    it('should include "Learn" mode button', () => {
        app = new App('app-container');
        const modeSwitch = container.querySelector('.mode-switch');
        const buttons = modeSwitch?.querySelectorAll('button');
        // Originally: Interpret, Capture. We want to add Learn.
        // So we expect 3 buttons.
        expect(buttons?.length).toBe(3);
        expect(buttons?.[1].textContent).toBe('Learn');
    });

    it('should switch to learn mode', () => {
        app = new App('app-container');
        // Access private learnModeView if possible or check side effects
        // Since we mocked LearnModeView, we can check if constructor was called
        // But better, let's trigger the button click
        
        const modeSwitch = container.querySelector('.mode-switch');
        const learnBtn = modeSwitch?.querySelectorAll('button')[1]; // Assuming Learn is 2nd
        
        learnBtn?.click();
        
        // We expect App.mode to be 'learn'
        // And LearnModeView.show() to be called.
        // Since we can't easily access the instance of LearnModeView created inside App without more complex mocking,
        // we might verify the class state if we spy on prototype, but let's just check the App state if exposed
        // or the active class on button.
        expect(learnBtn?.classList.contains('active')).toBe(true);
    });
});