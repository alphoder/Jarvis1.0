import * as THREE from 'three';
import { config } from '../config.js';

const SMOOTHING_ALPHA = config.handTracker.smoothingAlpha;
const MAX_HANDS = 2;

class HandTracker {
  constructor({ onResults }) {
    this.onResults = onResults;
    this.hands = null;
    this.video = null;
    this.smoothLandmarks = [null, null];
    this.prevLandmarks = [null, null];
    this.prevTime = performance.now();
    this.handVelocities = [null, null];
    this.init();
  }

  async init() {
    try {
      this.video = document.getElementById('videoElement'); // Use shared video element
      // Wait for MediaPipe Hands to be loaded via CDN
      await this.loadMediaPipeHands();

      // Wait for the video element to have a stream (set by main.js startWebcam)
      if (!this.video.srcObject) {
        await new Promise((resolve) => {
          const check = () => {
            if (this.video.srcObject) resolve();
            else setTimeout(check, 100);
          };
          check();
        });
      }

      this.hands = new window.Hands({
        locateFile: (file) => `https://cdn.jsdelivr.net/npm/@mediapipe/hands/${file}`,
      });
      this.hands.setOptions({
        maxNumHands: MAX_HANDS,
        modelComplexity: 1,
        minDetectionConfidence: 0.7,
        minTrackingConfidence: 0.7,
      });
      this.hands.onResults(this.handleResults.bind(this));

      this.startProcessing();
    } catch (err) {
      console.error('HandTracker initialization failed:', err);
      this.showError('Webcam or MediaPipe Hands failed to initialize. Please check permissions and reload.');
    }
  }

  async loadMediaPipeHands() {
    if (!window.Hands) {
      await new Promise((resolve, reject) => {
        const script = document.createElement('script');
        script.src = 'https://cdn.jsdelivr.net/npm/@mediapipe/hands/hands.js';
        script.onload = resolve;
        script.onerror = reject;
        document.head.appendChild(script);
      });
    }
  }

  showError(message) {
    const errorDiv = document.getElementById('error-message');
    errorDiv.textContent = message;
    errorDiv.style.display = 'block';
  }

  startProcessing() {
    const processFrame = async () => {
      if (this.video.readyState >= 2) {
        await this.hands.send({ image: this.video });
      }
      requestAnimationFrame(processFrame);
    };
    processFrame();
  }

  handleResults(results) {
    const now = performance.now();
    const dt = (now - this.prevTime) / 1000;
    this.prevTime = now;

    const hands = results.multiHandLandmarks || [];
    const smoothed = [];
    const velocities = [];

    for (let i = 0; i < MAX_HANDS; i++) {
      const raw = hands[i] || null;
      if (!raw) {
        smoothed[i] = null;
        velocities[i] = null;
        this.smoothLandmarks[i] = null;
        this.prevLandmarks[i] = null;
        continue;
      }
      // Direct assignment (no smoothing)
      smoothed[i] = raw.map((lm) => ({ ...lm }));

      // Velocity calculation
      if (this.prevLandmarks[i]) {
        const v = [];
        for (let j = 0; j < raw.length; j++) {
          v.push({
            x: (smoothed[i][j].x - this.prevLandmarks[i][j].x) / dt,
            y: (smoothed[i][j].y - this.prevLandmarks[i][j].y) / dt,
            z: (smoothed[i][j].z - this.prevLandmarks[i][j].z) / dt,
          });
        }
        velocities[i] = v;
      } else {
        velocities[i] = Array(raw.length).fill({ x: 0, y: 0, z: 0 });
      }
      this.prevLandmarks[i] = smoothed[i].map((lm) => ({ ...lm }));
    }

    this.onResults({
      landmarks: smoothed,
      velocities,
      dt,
    });
  }

  // Map normalized MediaPipe coordinates to Three.js world space
  static mapToWorld(lm, camera, width, height) {
    // MediaPipe: x/y normalized [0,1], z is relative depth
    // Map to [-1,1] for x/y, scale z
    const x = (lm.x - 0.5) * width / 20;
    const y = -(lm.y - 0.5) * height / 20;
    const z = -lm.z * 10;
    return new THREE.Vector3(x, y, z);
  }
}

export default HandTracker;
