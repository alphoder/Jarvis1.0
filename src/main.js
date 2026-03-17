import * as THREE from 'three';
import Renderer from './core/renderer.js';
import SceneManager from './core/scene.js';
import HandTracker from './hand/handTracker.js';
import GestureDetector, { GestureState } from './hand/gestureDetector.js';
import ParticleSystem from './particles/particleSystem.js';
import SpeechController from './voice/speechController.js';

// Setup canvas
const canvas = document.getElementById('canvas');

// Setup webcam for both background and hand tracking
const videoElement = document.getElementById('videoElement');
async function startWebcam() {
  try {
    const stream = await navigator.mediaDevices.getUserMedia({ video: true });
    videoElement.srcObject = stream;
    document.getElementById('loading').style.display = 'none';
  } catch (err) {
    document.getElementById('error-message').style.display = 'block';
    document.getElementById('error-message').textContent = 'Webcam access denied or unavailable.';
  }
}

// Core engine
const renderer = new Renderer(canvas);
const sceneManager = new SceneManager(renderer);

// UI elements
const fpsLabel = document.getElementById('fps');
const objectCountLabel = document.getElementById('object-count');
const gravityLabel = document.getElementById('gravity-value');

// Button handlers
const btnCube = document.getElementById('btn-cube');
const btnSphere = document.getElementById('btn-sphere');
const btnDelete = document.getElementById('btn-delete');
const btnToggleGravity = document.getElementById('btn-toggle-gravity');
const btnGravityUp = document.getElementById('btn-gravity-up');
const btnGravityDown = document.getElementById('btn-gravity-down');
const btnVoice = document.getElementById('btn-voice');

function createObject(type) {
  const position = { x: (Math.random() - 0.5) * 10, y: 15, z: (Math.random() - 0.5) * 10 };
  const mass = 1 + Math.random() * 2;
  const friction = 0.4;
  const restitution = 0.4;

  if (type === 'cube') {
    sceneManager.createCube({
      size: 2,
      position,
      mass,
      friction,
      restitution,
      color: 0x90caf9,
    });
  } else if (type === 'sphere') {
    sceneManager.createSphere({
      radius: 1 + Math.random(),
      position,
      mass,
      friction,
      restitution,
      color: 0xffb300,
    });
  }
  updateStats();
}

btnCube.onclick = () => createObject('cube');
btnSphere.onclick = () => createObject('sphere');

btnDelete.onclick = () => {
  sceneManager.deleteLastObject();
  updateStats();
};

btnToggleGravity.onclick = () => {
  sceneManager.toggleGravity();
  updateStats();
};

btnGravityUp.onclick = () => {
  sceneManager.increaseGravity(1);
  updateStats();
};

btnGravityDown.onclick = () => {
  sceneManager.decreaseGravity(1);
  updateStats();
};

function updateStats() {
  objectCountLabel.textContent = sceneManager.getObjectCount();
  gravityLabel.textContent = Math.abs(sceneManager.getGravity()).toFixed(1);
}

// Hand tracking and gesture system
let handTracker, gestureDetector;
let handInteraction = {
  attachedObject: null,
  attachedHand: null,
  lastVelocity: null,
  lastAngular: null,
  trackingStable: true,
};

// Hand visual feedback
const handMeshes = [[], []]; // 2 hands, array of meshes for landmarks
const handMaterial = new THREE.MeshBasicMaterial({ color: 0x00ff00 });
for (let h = 0; h < 2; h++) {
  for (let i = 0; i < 21; i++) {
    const mesh = new THREE.Mesh(new THREE.SphereGeometry(0.2, 16, 16), handMaterial);
    mesh.visible = false;
    sceneManager.scene.add(mesh);
    handMeshes[h].push(mesh);
  }
}

// Particle system setup
let particleSystem;
let shockwave = null;
let shockwaveActive = false;
let shockwaveStart = 0;

function getFingerWorldPos(landmarks, handIdx = 0) {
  if (!landmarks[handIdx]) return new THREE.Vector3(0, 0, 0);
  const indexTip = landmarks[handIdx][8];
  return HandTracker.mapToWorld(indexTip, renderer.camera, window.innerWidth, window.innerHeight);
}

function getFingerVelocity(velocities, handIdx = 0) {
  if (!velocities[handIdx]) return { x: 0, y: 0, z: 0 };
  return velocities[handIdx][8];
}

function attachObjectToHand(handIdx, handPos) {
  // Find nearest object to hand
  let minDist = Infinity;
  let nearestIdx = -1;
  for (let i = 0; i < sceneManager.objects.length; i++) {
    const obj = sceneManager.objects[i];
    const mesh = obj.mesh;
    const dist = mesh.position.distanceTo(handPos);
    if (dist < minDist && dist < 3.5) {
      minDist = dist;
      nearestIdx = i;
    }
  }
  if (nearestIdx !== -1) {
    handInteraction.attachedObject = sceneManager.objects[nearestIdx];
    handInteraction.attachedHand = handIdx;
    // Zero velocities
    handInteraction.attachedObject.body.velocity.set(0, 0, 0);
    handInteraction.attachedObject.body.angularVelocity.set(0, 0, 0);
  }
}

function releaseObjectFromHand(handIdx, velocity, angular) {
  if (handInteraction.attachedObject && handInteraction.attachedHand === handIdx) {
    // Clamp velocity
    const v = velocity;
    const maxV = 8;
    const impulse = {
      x: Math.max(Math.min(v.x * 20, maxV), -maxV),
      y: Math.max(Math.min(v.y * 20, maxV), -maxV),
      z: Math.max(Math.min(v.z * 20, maxV), -maxV),
    };
    handInteraction.attachedObject.body.velocity.set(impulse.x, impulse.y, impulse.z);
    // Clamp angular
    const maxA = 6;
    handInteraction.attachedObject.body.angularVelocity.set(
      Math.max(Math.min(angular.x * 10, maxA), -maxA),
      Math.max(Math.min(angular.y * 10, maxA), -maxA),
      Math.max(Math.min(angular.z * 10, maxA), -maxA),
    );
    handInteraction.attachedObject = null;
    handInteraction.attachedHand = null;
  }
}

function updateHandInteraction(landmarks, velocities) {
  // If tracking unstable, freeze interaction
  if (!landmarks[0] && !landmarks[1]) {
    handInteraction.trackingStable = false;
    handInteraction.attachedObject = null;
    handInteraction.attachedHand = null;
    return;
  }
  handInteraction.trackingStable = true;

  // Map hand positions to world
  for (let i = 0; i < 2; i++) {
    if (!landmarks[i]) continue;
    const palm = landmarks[i][0];
    const palmWorld = HandTracker.mapToWorld(palm, renderer.camera, window.innerWidth, window.innerHeight);
    // Gesture logic
    const gesture = gestureDetector.handStates[i];
    if (gesture === GestureState.GRABBING) {
      if (!handInteraction.attachedObject) {
        attachObjectToHand(i, palmWorld);
      } else if (handInteraction.attachedHand === i) {
        // Follow hand
        handInteraction.attachedObject.body.position.copy(palmWorld);
        handInteraction.attachedObject.body.velocity.set(0, 0, 0);
        handInteraction.attachedObject.body.angularVelocity.set(0, 0, 0);
      }
    } else if (gesture === GestureState.RELEASED) {
      if (handInteraction.attachedObject && handInteraction.attachedHand === i) {
        // Use palm velocity
        const v = velocities[i][0];
        releaseObjectFromHand(i, v, { x: 0, y: 0, z: 0 });
      }
    }
  }

  // Update visual hand meshes
  for (let i = 0; i < 2; i++) {
    for (let j = 0; j < 21; j++) {
      if (landmarks[i] && landmarks[i][j]) {
        const pos = HandTracker.mapToWorld(landmarks[i][j], renderer.camera, window.innerWidth, window.innerHeight);
        handMeshes[i][j].position.copy(pos);
        handMeshes[i][j].visible = true;
      } else {
        handMeshes[i][j].visible = false;
      }
    }
  }
}

// Initialize particle system after renderer/scene
particleSystem = new ParticleSystem(renderer.getScene());

// Voice command integration
let speechController;
function handleVoiceCommand(cmd) {
  switch (cmd) {
    case 'createCube':
      createObject('cube');
      break;
    case 'createSphere':
      createObject('sphere');
      break;
    case 'deleteObject':
      sceneManager.deleteLastObject();
      updateStats();
      break;
    case 'turnOffGravity':
      sceneManager.toggleGravity();
      updateStats();
      break;
    case 'increaseGravity':
      sceneManager.increaseGravity(1);
      updateStats();
      break;
    case 'scatterParticles':
      particleSystem.uniforms.uGlobalMode.value = 1;
      particleSystem.uniforms.uBlend.value = 1.0;
      break;
    case 'reassembleParticles':
      particleSystem.uniforms.uGlobalMode.value = 2;
      particleSystem.uniforms.uBlend.value = 1.0;
      break;
  }
}

btnVoice.onclick = () => {
  if (!speechController) {
    speechController = new SpeechController({ onCommand: handleVoiceCommand });
    btnVoice.textContent = 'Voice Active';
    btnVoice.style.backgroundColor = 'rgba(0, 255, 0, 0.2)';
  }
};

// Initialize gesture detector BEFORE hand tracker (hand tracker callback uses it)
gestureDetector = new GestureDetector();

// Initialize hand tracking
handTracker = new HandTracker({
  onResults: ({ landmarks, velocities, dt }) => {
    const gestureState = gestureDetector.update(landmarks, velocities);
    updateHandInteraction(landmarks, velocities);

    // Particle system gesture logic
    let globalMode = 0;
    let blend = 0;
    if (gestureState === GestureState.GLOBAL_SCATTER) {
      globalMode = 1;
      blend = 1.0;
    } else if (gestureState === GestureState.GLOBAL_REASSEMBLE) {
      globalMode = 2;
      blend = 1.0;
    }
    // Local finger repulsion
    const fingerPos = getFingerWorldPos(landmarks, 0);
    // Shockwave detection
    const fingerVel = getFingerVelocity(velocities, 0);
    const shockwaveThreshold = 2.5;
    if (!shockwaveActive && Math.sqrt(fingerVel.x ** 2 + fingerVel.y ** 2 + fingerVel.z ** 2) > shockwaveThreshold) {
      shockwaveActive = true;
      shockwaveStart = performance.now();
      shockwave = {
        time: 0.01,
        center: fingerPos.clone(),
        radius: 0.1,
        strength: 2.5,
      };
    }
    if (shockwaveActive) {
      const elapsed = (performance.now() - shockwaveStart) / 1000;
      shockwave.time = Math.min(elapsed / 1.2, 1.0);
      shockwave.radius = 2.5 + 12 * shockwave.time;
      if (shockwave.time >= 1.0) {
        shockwaveActive = false;
        shockwave = null;
      }
    }
    particleSystem.update({
      time: performance.now() / 1000,
      globalMode,
      blend,
      forceCenter: new THREE.Vector3(0, 0, 0),
      fingerPos,
      shockwave,
    });
  },
});

// Clamp blend factor for smooth transitions
function smoothBlend(current, target, speed = 0.08) {
  return current + (target - current) * speed;
}

let lastGlobalMode = 0;
let lastBlend = 0;
let lastTime = performance.now();
let frames = 0;
let fps = 60;
let fpsUpdateTime = lastTime;

function animate() {
  const now = performance.now();
  const deltaTime = (now - lastTime) / 1000;
  lastTime = now;

  // Smooth particle blend transitions
  if (particleSystem) {
    let targetBlend = particleSystem.uniforms.uBlend.value;
    let targetMode = particleSystem.uniforms.uGlobalMode.value;
    lastBlend = smoothBlend(lastBlend, targetBlend, 0.08);
    lastGlobalMode = targetMode;
    particleSystem.uniforms.uBlend.value = lastBlend;
    particleSystem.uniforms.uGlobalMode.value = lastGlobalMode;
  }

  sceneManager.update(deltaTime);
  renderer.render();

  // FPS calculation
  frames++;
  if (now - fpsUpdateTime > 500) {
    fps = Math.round((frames * 1000) / (now - fpsUpdateTime));
    fpsLabel.textContent = fps;
    frames = 0;
    fpsUpdateTime = now;
  }

  requestAnimationFrame(animate);
}

// Ensure webcam starts before rendering
async function ensureWebcamAndStart() {
  await startWebcam();
  updateStats();
  animate();
}
ensureWebcamAndStart();
