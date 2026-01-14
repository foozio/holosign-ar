import * as THREE from 'three';
import type { TrackingResult } from '../tracking/MediaPipeHands';
import { HAND_CONNECTIONS } from '@mediapipe/hands';

export class ThreeOverlay {
    private scene: THREE.Scene;
    private camera: THREE.PerspectiveCamera;
    private renderer: THREE.WebGLRenderer;
    private handGroup: THREE.Group;
    private spheres: THREE.Mesh[] = [];
    private cylinders: THREE.Mesh[] = [];
    private calibratedPalmSize: number | null = null;
    private readonly REFERENCE_DEPTH = 5.0; // Distance where calibration happens

    constructor(container: HTMLElement) {
        this.scene = new THREE.Scene();

        // Camera setup to correct Aspect Ratio matching the video
        // We assume 1280x720 (16:9) initially
        const width = 1280;
        const height = 720;
        const aspect = width / height;

        // We want to map Normalized Coordinates [0, 1] to 3D space directly?
        // Or we place camera such that plane at z=0 covers the view.
        // Normalized coords: x: 0..1, y: 0..1 (0 top).
        // Let's use an Orthographic camera or perspective with fixed distance.
        // Docs say: MediaPipe x,y are normalized. z is roughly scale-relative.

        // Easy approach: Orthographic camera covering 0..1, 0..1
        // But we want 3D perspective effect for the hand model itself? 
        // Maybe hybrid. Let's use Perspective.
        // If we place camera at z=1, and look at z=0.

        this.camera = new THREE.PerspectiveCamera(75, aspect, 0.1, 1000);
        this.camera.position.z = 2; // Arbitrary start
        this.camera.position.x = 0;
        this.camera.position.y = 0;

        this.renderer = new THREE.WebGLRenderer({ alpha: true, antialias: true });
        this.renderer.setSize(container.clientWidth, container.clientHeight);
        this.renderer.setPixelRatio(window.devicePixelRatio); // Default high quality
        this.renderer.setClearColor(0x000000, 0); // Transparent

        // Ensure canvas overlays correctly
        this.renderer.domElement.style.position = 'absolute';
        this.renderer.domElement.style.top = '0';
        this.renderer.domElement.style.left = '0';
        this.renderer.domElement.style.width = '100%';
        this.renderer.domElement.style.height = '100%';
        this.renderer.domElement.style.pointerEvents = 'none'; // Let clicks pass through

        container.appendChild(this.renderer.domElement);

        const light = new THREE.DirectionalLight(0xffffff, 1);
        light.position.set(0, 1, 2);
        this.scene.add(light);
        this.scene.add(new THREE.AmbientLight(0x404040));

        this.handGroup = new THREE.Group();
        this.scene.add(this.handGroup);

        // Initialize pools
        const sphereGeo = new THREE.SphereGeometry(0.02, 16, 16);

        const sphereMat = new THREE.MeshBasicMaterial({
            color: 0xff0000,
            transparent: true,
            opacity: 1.0
        });

        for (let i = 0; i < 21; i++) {
            const mesh = new THREE.Mesh(sphereGeo, sphereMat);
            this.spheres.push(mesh);
            this.handGroup.add(mesh);
        }

        const cylGeo = new THREE.CylinderGeometry(0.01, 0.01, 1, 8);

        const cylMat = new THREE.MeshBasicMaterial({
            color: 0x39ff14, // Neon Green
            transparent: true,
            opacity: 1.0
        });

        for (let i = 0; i < HAND_CONNECTIONS.length; i++) {
            const mesh = new THREE.Mesh(cylGeo, cylMat);
            this.cylinders.push(mesh);
            this.handGroup.add(mesh);
        }

        window.addEventListener('resize', this.onResize.bind(this, container));
        this.onResize(container); // Init size
    }

    onResize(container: HTMLElement) {
        if (!container) return;
        const w = container.clientWidth;
        const h = container.clientHeight;
        this.renderer.setSize(w, h);
        this.camera.aspect = w / h;
        this.camera.updateProjectionMatrix();
    }

    setCalibration(size: number) {
        this.calibratedPalmSize = size;
    }

    setQuality(quality: 'high' | 'low') {
        if (quality === 'low') {
            this.renderer.setPixelRatio(1);
        } else {
            this.renderer.setPixelRatio(window.devicePixelRatio);
        }
    }

    update(result: TrackingResult) {
        if (result.hands.length === 0) {
            // Hide everything if no hands
            this.handGroup.visible = false;
            return;
        }
        this.handGroup.visible = true;
        const hand = result.hands[0];
        const landmarks = hand.landmarks;
        const score = hand.score || 1.0;

        // Occlusion Handling (Fade Overlay)
        // If confidence is low, hand might be occluded or exiting frame.
        // Fade out to avoid "ghosting" or snapping.
        let targetOpacity = 1.0;
        if (score < 0.3) targetOpacity = 0.2;
        else if (score < 0.6) targetOpacity = 0.5;

        // Apply opacity to all children
        this.handGroup.children.forEach((child: any) => {
            if (child.material) {
                child.material.opacity = targetOpacity;
            }
        });

        // Map normalized landmarks 0..1 to Screen Space world coords.
        // We need to know the visible plane at z=0.
        // For PerspectiveCamera(75, aspect, 0.1, ...distance=5)
        // To match alignment, it's easier to use specific calculations.

        // Simply: We scale normalized (-0.5 to 0.5) to a specific World Frame size.
        // Let's assume view width at z=0 is approx 2.0 (arbitrary).
        // x: (v.x - 0.5) * 2 * aspect
        // y: -(v.y - 0.5) * 2  (flip Y)
        // z: -v.z * ?

        // Better: Update sphere positions
        // We treat Landmarks array as [Wrist, ...] 

        // Scale factor to make hand visible
        // const scaleX = -10; 
        // const scaleY = -6; 
        // const scaleZ = 20; 

        // Center offset
        // const offsetX = 5;
        // const offsetY = 3;

        // Actually, let's just project MP coordinates (0-1) to logic coordinates (-1 to 1).
        // MP: x [0..1], y [0..1]. (0,0) is Top-Left.
        // ThreeJS: (0,0) is Center. Y Up.
        // x_three = (x_mp - 0.5) * Width

        // For exact overlay, we need to know the z-distance. 
        // Standard approach: Use a fixed z for the hand centroid, and relative z for joints.

        // Let's try fitting to camera basics:
        const fov = this.camera.fov * (Math.PI / 180);

        let dynamicDistance = this.REFERENCE_DEPTH;
        if (this.calibratedPalmSize) {
            // Estimate depth based on ratio
            // currentSize / calibratedSize = calibratedDepth / currentDepth
            // currentDepth = calibratedDepth * (calibratedSize / currentSize)

            const wrist = landmarks[0];
            const middleMcp = landmarks[9];
            const dx = wrist.x - middleMcp.x;
            const dy = wrist.y - middleMcp.y;
            const currentSize = Math.sqrt(dx * dx + dy * dy);

            if (currentSize > 0) {
                dynamicDistance = this.REFERENCE_DEPTH * (this.calibratedPalmSize / currentSize);
            }
        }

        // Clamp distance to avoid extreme close/far
        dynamicDistance = Math.max(1, Math.min(dynamicDistance, 10));

        this.camera.position.z = 0;

        // Recompute projection plane at this distance
        const heightAtDist = 2 * Math.tan(fov / 2) * dynamicDistance;
        const widthAtDist = heightAtDist * this.camera.aspect;

        landmarks.forEach((lm, i) => {
            const x = (lm.x - 0.5) * widthAtDist;
            const y = -(lm.y - 0.5) * heightAtDist; // Flip Y
            // z is relative to the hand center, which is at -dynamicDistance
            const z = -dynamicDistance - (lm.z * 1); // Z is usually small relative value.

            this.spheres[i].position.set(x, y, z);
        });

        // Update bones
        HAND_CONNECTIONS.forEach((conn, i) => {
            const idxA = conn[0];
            const idxB = conn[1];
            const pA = this.spheres[idxA].position;
            const pB = this.spheres[idxB].position;

            const mesh = this.cylinders[i];
            const vec = new THREE.Vector3().subVectors(pB, pA);
            const len = vec.length();

            mesh.position.copy(pA);
            mesh.position.lerp(pB, 0.5);
            mesh.scale.set(1, len, 1);
            mesh.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), vec.normalize());
        });
    }

    render() {
        this.renderer.render(this.scene, this.camera);
    }
}
