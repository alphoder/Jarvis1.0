import * as THREE from 'three';
import { EffectComposer } from 'three/examples/jsm/postprocessing/EffectComposer.js';
import { RenderPass } from 'three/examples/jsm/postprocessing/RenderPass.js';
import { UnrealBloomPass } from 'three/examples/jsm/postprocessing/UnrealBloomPass.js';
import DrawingSystem from './drawing/drawingSystem.js';
import SpeechController from './voice/speechController.js';

// ─── CONFIG ───
let PARTICLE_COUNT = 15000;
const LERP_SPEED = 0.045;
const BURST_FORCE = 25;
const BURST_DECAY = 0.96;

// ═══════════════════════════════════════════
//  SHAPE GENERATORS
// ═══════════════════════════════════════════
function getUniverse(count = PARTICLE_COUNT) {
  const pos = [];
  for (let i = 0; i < count; i++) {
    const r = 10 * Math.cbrt(Math.random());
    const theta = Math.random() * Math.PI * 2;
    const phi = Math.acos(2 * Math.random() - 1);
    pos.push(r * Math.sin(phi) * Math.cos(theta), r * Math.sin(phi) * Math.sin(theta), r * Math.cos(phi));
  }
  return pos;
}

function getSaturn(count = PARTICLE_COUNT) {
  const pos = [];
  for (let i = 0; i < count; i++) {
    if (i < count * 0.35) {
      const r = 3.5 * Math.cbrt(Math.random());
      const theta = Math.random() * Math.PI * 2;
      const phi = Math.acos(2 * Math.random() - 1);
      pos.push(r * Math.sin(phi) * Math.cos(theta), r * Math.sin(phi) * Math.sin(theta), r * Math.cos(phi));
    } else {
      const r = 5.5 + Math.random() * 4.5;
      const theta = Math.random() * Math.PI * 2;
      pos.push(r * Math.cos(theta), (Math.random() - 0.5) * 0.4, r * Math.sin(theta));
    }
  }
  return pos;
}

function getFireworks(count = PARTICLE_COUNT) {
  const pos = [];
  const burstCount = 5;
  for (let i = 0; i < count; i++) {
    const burst = Math.floor(Math.random() * burstCount);
    const cx = (burst - 2) * 5;
    const cy = (Math.random() - 0.3) * 8;
    const r = Math.random() * 5;
    const theta = Math.random() * Math.PI * 2;
    const phi = Math.acos(2 * Math.random() - 1);
    pos.push(cx + r * Math.sin(phi) * Math.cos(theta), cy + r * Math.sin(phi) * Math.sin(theta), r * Math.cos(phi));
  }
  return pos;
}

function getFace(count = PARTICLE_COUNT) {
  const pos = [];
  for (let i = 0; i < count; i++) {
    const u = Math.random();
    const v = Math.random();
    const theta = (u - 0.5) * Math.PI;
    const y = (v - 0.5) * 15;
    const r = 5 + Math.sin(v * Math.PI) * 2;
    let x = r * Math.sin(theta);
    let z = r * Math.cos(theta) - 5;
    if (y > -2 && y < 3 && Math.abs(x) < 2) z += 2;
    if (y > 2 && y < 5 && Math.abs(x) > 1.5 && Math.abs(x) < 4) z -= 1.5;
    pos.push(x, y, z);
  }
  return pos;
}

function getDNAHelix(count = PARTICLE_COUNT) {
  const pos = [];
  for (let i = 0; i < count; i++) {
    const t = (i / count) * Math.PI * 8;
    const y = (i / count - 0.5) * 20;
    const strand = i % 3;
    if (strand < 2) {
      const offset = strand * Math.PI;
      pos.push(3 * Math.cos(t + offset) + (Math.random() - 0.5) * 0.3, y + (Math.random() - 0.5) * 0.3, 3 * Math.sin(t + offset) + (Math.random() - 0.5) * 0.3);
    } else {
      const frac = Math.random();
      const x1 = 3 * Math.cos(t), z1 = 3 * Math.sin(t);
      const x2 = 3 * Math.cos(t + Math.PI), z2 = 3 * Math.sin(t + Math.PI);
      pos.push(x1 + (x2 - x1) * frac, y + (Math.random() - 0.5) * 0.2, z1 + (z2 - z1) * frac);
    }
  }
  return pos;
}

function getGalaxySpiral(count = PARTICLE_COUNT) {
  const pos = [];
  const arms = 4;
  for (let i = 0; i < count; i++) {
    const arm = i % arms;
    const armAngle = (arm / arms) * Math.PI * 2;
    const dist = Math.random() * 10;
    const spiralAngle = dist * 0.8 + armAngle;
    const spread = dist * 0.15;
    pos.push(dist * Math.cos(spiralAngle) + (Math.random() - 0.5) * spread, (Math.random() - 0.5) * (0.3 + dist * 0.05), dist * Math.sin(spiralAngle) + (Math.random() - 0.5) * spread);
  }
  return pos;
}

function getTorusKnot(count = PARTICLE_COUNT) {
  const pos = [];
  for (let i = 0; i < count; i++) {
    const t = Math.random() * Math.PI * 2;
    const phi = Math.random() * Math.PI * 2;
    const r2 = 5 + 1.5 * Math.cos(3 * t);
    pos.push(r2 * Math.cos(2 * t) + Math.cos(phi) * Math.random() * 0.5, r2 * Math.sin(2 * t) + Math.sin(phi) * Math.random() * 0.5, 1.5 * Math.sin(3 * t) + (Math.random() - 0.5) * 0.5);
  }
  return pos;
}

function getHeart(count = PARTICLE_COUNT) {
  const pos = [];
  for (let i = 0; i < count; i++) {
    const t = Math.random() * Math.PI * 2;
    const s = Math.random();
    let x = 16 * Math.pow(Math.sin(t), 3);
    let y = 13 * Math.cos(t) - 5 * Math.cos(2 * t) - 2 * Math.cos(3 * t) - Math.cos(4 * t);
    x *= s * 0.6;
    y *= s * 0.6;
    pos.push(x, y, (Math.random() - 0.5) * 2 * s);
  }
  return pos;
}

// ─── CHEAT-EXCLUSIVE SHAPES ───
function getMatrixRain(count = PARTICLE_COUNT) {
  const pos = [];
  const cols = 40;
  for (let i = 0; i < count; i++) {
    const col = i % cols;
    const x = (col / cols - 0.5) * 25;
    const y = (Math.random() - 0.5) * 30;
    const z = (Math.random() - 0.5) * 5;
    pos.push(x, y, z);
  }
  return pos;
}

function getBlackhole(count = PARTICLE_COUNT) {
  const pos = [];
  for (let i = 0; i < count; i++) {
    const angle = Math.random() * Math.PI * 2 * 5;
    const dist = Math.random() * 12;
    const spiral = angle + dist * 0.5;
    const y = (Math.random() - 0.5) * (0.2 + dist * 0.02);
    pos.push(dist * Math.cos(spiral), y, dist * Math.sin(spiral));
  }
  return pos;
}

function getEqualizer(count = PARTICLE_COUNT) {
  const pos = [];
  const bars = 32;
  const barWidth = 0.6;
  for (let i = 0; i < count; i++) {
    const bar = i % bars;
    const x = (bar - bars / 2) * barWidth;
    const maxH = 3 + Math.sin(bar / bars * Math.PI) * 7;
    const y = Math.random() * maxH;
    const z = (Math.random() - 0.5) * 0.4;
    pos.push(x, y - 5, z);
  }
  return pos;
}

// ═══════════════════════════════════════════
//  SHAPE DEFINITIONS
// ═══════════════════════════════════════════
const shapes = [
  { name: 'Universe', gen: getUniverse, color: new THREE.Color(0x88ccff), accent: new THREE.Color(0x4488ff) },
  { name: 'Saturn', gen: getSaturn, color: new THREE.Color(0xffaa55), accent: new THREE.Color(0xff6622) },
  { name: 'DNA Helix', gen: getDNAHelix, color: new THREE.Color(0x44ffaa), accent: new THREE.Color(0x00cc88) },
  { name: 'Galaxy', gen: getGalaxySpiral, color: new THREE.Color(0xcc88ff), accent: new THREE.Color(0x8844ff) },
  { name: 'Torus Knot', gen: getTorusKnot, color: new THREE.Color(0xff8866), accent: new THREE.Color(0xff4422) },
  { name: 'Heart', gen: getHeart, color: new THREE.Color(0xff4488), accent: new THREE.Color(0xff0044) },
  { name: 'Face', gen: getFace, color: new THREE.Color(0x55ff88), accent: new THREE.Color(0x22cc55) },
  { name: 'Fireworks', gen: getFireworks, color: new THREE.Color(0xff55aa), accent: new THREE.Color(0xff2288) },
];

let currentShapeIndex = 0;
let targetPositions = shapes[0].gen();
let targetColor = shapes[0].color;
let targetAccent = shapes[0].accent;
let particleExpansion = 1.0;

// ═══════════════════════════════════════════
//  BURST STATE
// ═══════════════════════════════════════════
const burstVelocities = new Float32Array(PARTICLE_COUNT * 3);
let burstActive = false;
let burstTimer = 0;

function triggerBurst(force = BURST_FORCE) {
  if (reforming) return; // locked during reform
  const pos = particleSystem.geometry.attributes.position.array;
  for (let i = 0; i < PARTICLE_COUNT; i++) {
    const i3 = i * 3;
    const dx = pos[i3], dy = pos[i3 + 1], dz = pos[i3 + 2];
    const len = Math.sqrt(dx * dx + dy * dy + dz * dz) || 1;
    const f = force * (0.5 + Math.random() * 0.5);
    burstVelocities[i3] = (dx / len) * f;
    burstVelocities[i3 + 1] = (dy / len) * f;
    burstVelocities[i3 + 2] = (dz / len) * f;
  }
  burstActive = true;
  burstTimer = 0;
}

function cycleShape(index) {
  if (reforming) return; // locked during reform
  if (index !== undefined) {
    currentShapeIndex = index % shapes.length;
  } else {
    currentShapeIndex = (currentShapeIndex + 1) % shapes.length;
  }
  const shape = shapes[currentShapeIndex];
  targetPositions = shape.gen();
  targetColor = shape.color;
  targetAccent = shape.accent;
  triggerBurst();
  updateHUD();
}

// ═══════════════════════════════════════════
//  THREE.JS SETUP
// ═══════════════════════════════════════════
const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
camera.position.z = 18;

const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
renderer.toneMapping = THREE.ACESFilmicToneMapping;
renderer.toneMappingExposure = 0.85;
document.body.appendChild(renderer.domElement);

// ─── POST-PROCESSING ───
const composer = new EffectComposer(renderer);
composer.addPass(new RenderPass(scene, camera));
const bloomPass = new UnrealBloomPass(
  new THREE.Vector2(window.innerWidth, window.innerHeight),
  0.8, 0.4, 0.3
);
composer.addPass(bloomPass);

// ═══════════════════════════════════════════
//  CUSTOM PARTICLE SHADER
// ═══════════════════════════════════════════
const vertexShader = `
  attribute float aSize;
  attribute float aRandom;
  varying vec3 vColor;
  varying float vAlpha;
  varying float vRandom;
  varying float vMouseProximity;
  uniform float uTime;
  uniform float uAudioBass;
  uniform float uAudioMid;
  uniform float uAudioHigh;
  uniform float uBeatPulse;
  uniform float uFreeze;
  uniform float uSpeedMult;
  uniform vec3 uMouseWorld;
  uniform float uMouseRadius;

  void main() {
    vColor = color;
    vRandom = aRandom;

    vec3 pos = position;

    float freeze = uFreeze;
    float speed = uSpeedMult;

    // Per-particle float (disabled when frozen)
    float floatAmt = (1.0 - freeze);
    pos.y += sin(uTime * 0.5 * speed + aRandom * 6.28) * 0.08 * floatAmt;
    pos.x += cos(uTime * 0.3 * speed + aRandom * 6.28) * 0.05 * floatAmt;

    // Bass-driven breathing
    float bassBreath = 1.0 + uAudioBass * 0.4 * sin(aRandom * 3.14 + uTime * 2.0);
    pos *= bassBreath;

    // Beat pulse — radial push
    pos += normalize(pos + vec3(0.001)) * uBeatPulse * 2.0 * (0.5 + aRandom);

    // Mouse proximity (in model space before transforms)
    vec3 worldPos = (modelMatrix * vec4(pos, 1.0)).xyz;
    float mouseDist = length(worldPos - uMouseWorld);
    vMouseProximity = 1.0 - smoothstep(0.0, uMouseRadius, mouseDist);

    vec4 mvPosition = modelViewMatrix * vec4(pos, 1.0);
    float dist = -mvPosition.z;

    // Audio-driven size: bass = big, highs = sparkle
    float audioPulse = 1.0 + uAudioBass * 1.2 * sin(aRandom * 6.28 + uTime * 3.0);
    float sparkle = 1.0 + uAudioHigh * 3.0 * step(0.92, sin(aRandom * 100.0 + uTime * 15.0));

    // Particles near cursor grow larger
    float hoverSize = 1.0 + vMouseProximity * 1.5;

    gl_PointSize = aSize * audioPulse * sparkle * hoverSize * (120.0 / dist);
    gl_Position = projectionMatrix * mvPosition;

    vAlpha = smoothstep(100.0, 5.0, dist) * (0.4 + 0.2 * sin(uTime * speed + aRandom * 10.0));
    // High freq → brighter
    vAlpha += uAudioHigh * 0.15;
    // Hover glow boost
    vAlpha += vMouseProximity * 0.4;
  }
`;

const fragmentShader = `
  varying vec3 vColor;
  varying float vAlpha;
  varying float vRandom;
  varying float vMouseProximity;
  uniform float uTime;
  uniform float uRainbow;
  uniform float uDisco;
  uniform float uAudioHigh;

  vec3 hsl2rgb(float h, float s, float l) {
    float c = (1.0 - abs(2.0 * l - 1.0)) * s;
    float x = c * (1.0 - abs(mod(h * 6.0, 2.0) - 1.0));
    float m = l - c * 0.5;
    vec3 rgb;
    float hh = h * 6.0;
    if (hh < 1.0) rgb = vec3(c, x, 0.0);
    else if (hh < 2.0) rgb = vec3(x, c, 0.0);
    else if (hh < 3.0) rgb = vec3(0.0, c, x);
    else if (hh < 4.0) rgb = vec3(0.0, x, c);
    else if (hh < 5.0) rgb = vec3(x, 0.0, c);
    else rgb = vec3(c, 0.0, x);
    return rgb + m;
  }

  void main() {
    float d = length(gl_PointCoord - vec2(0.5));
    if (d > 0.5) discard;

    float glow = 1.0 - smoothstep(0.0, 0.5, d);
    glow = pow(glow, 1.5);
    float core = 1.0 - smoothstep(0.0, 0.15, d);

    vec3 baseColor = vColor;

    // Rainbow override
    if (uRainbow > 0.01) {
      float hue = fract(vRandom + uTime * 0.1);
      vec3 rainbow = hsl2rgb(hue, 1.0, 0.55);
      baseColor = mix(baseColor, rainbow, uRainbow);
    }

    // Disco strobe
    if (uDisco > 0.01) {
      float strobe = step(0.5, fract(uTime * 8.0));
      float hue2 = fract(uTime * 0.5 + vRandom);
      vec3 discoColor = hsl2rgb(hue2, 1.0, 0.5 + strobe * 0.3);
      baseColor = mix(baseColor, discoColor, uDisco);
    }

    // High-freq sparkle flash
    float flash = uAudioHigh * step(0.95, sin(vRandom * 200.0 + uTime * 20.0)) * 0.6;

    // Mouse hover glow — brighten color and add hot-white core
    float hoverGlow = vMouseProximity * vMouseProximity;
    vec3 hoverColor = mix(baseColor, baseColor * 1.8 + vec3(0.3), hoverGlow);

    vec3 finalColor = hoverColor * glow + hoverColor * core * 0.4 + vec3(1.0) * (flash + hoverGlow * core * 0.5);
    float alpha = vAlpha * glow * 0.85;

    gl_FragColor = vec4(finalColor, alpha);
  }
`;

// ═══════════════════════════════════════════
//  PARTICLE GEOMETRY
// ═══════════════════════════════════════════
const geometry = new THREE.BufferGeometry();
const positions = new Float32Array(PARTICLE_COUNT * 3);
const colors = new Float32Array(PARTICLE_COUNT * 3);
const sizes = new Float32Array(PARTICLE_COUNT);
const randoms = new Float32Array(PARTICLE_COUNT);

for (let i = 0; i < PARTICLE_COUNT; i++) {
  positions[i * 3] = 0;
  positions[i * 3 + 1] = 0;
  positions[i * 3 + 2] = 0;
  colors[i * 3] = 0.53; colors[i * 3 + 1] = 0.8; colors[i * 3 + 2] = 1.0;
  sizes[i] = 1.0 + Math.random() * 3.0;
  randoms[i] = Math.random();
}

geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
geometry.setAttribute('color', new THREE.BufferAttribute(colors, 3));
geometry.setAttribute('aSize', new THREE.BufferAttribute(sizes, 1));
geometry.setAttribute('aRandom', new THREE.BufferAttribute(randoms, 1));

const shaderMaterial = new THREE.ShaderMaterial({
  vertexShader,
  fragmentShader,
  uniforms: {
    uTime: { value: 0 },
    uAudioBass: { value: 0 },
    uAudioMid: { value: 0 },
    uAudioHigh: { value: 0 },
    uBeatPulse: { value: 0 },
    uRainbow: { value: 0 },
    uDisco: { value: 0 },
    uFreeze: { value: 0 },
    uSpeedMult: { value: 1 },
    uMouseWorld: { value: new THREE.Vector3() },
    uMouseRadius: { value: 5.0 },
  },
  vertexColors: true,
  transparent: true,
  blending: THREE.AdditiveBlending,
  depthWrite: false,
});

const particleSystem = new THREE.Points(geometry, shaderMaterial);
scene.add(particleSystem);

// ─── 3D DRAWING SYSTEM ───
let drawingSystem = new DrawingSystem(scene);

// ═══════════════════════════════════════════
//  AUDIO ENGINE — Multi-Band + Beat Detection
// ═══════════════════════════════════════════
let audioCtx = null;
let analyser = null;
let audioData = null;
let audioEnabled = false;

// Smoothed band levels
const audio = { bass: 0, mid: 0, high: 0, level: 0 };

// Beat detection state
const beat = {
  threshold: 0.41,
  decay: 0.98,
  energy: 0,
  lastBeat: 0,
  cooldown: 200,
  pulse: 0,
  count: 0,
};

async function toggleAudio() {
  if (audioEnabled) {
    audioEnabled = false;
    if (audioCtx) { audioCtx.close(); audioCtx = null; }
    updateHUD();
    return;
  }
  try {
    const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
    audioCtx = new AudioContext();
    const source = audioCtx.createMediaStreamSource(stream);
    analyser = audioCtx.createAnalyser();
    analyser.fftSize = 512;
    analyser.smoothingTimeConstant = 0.8;
    source.connect(analyser);
    audioData = new Uint8Array(analyser.frequencyBinCount);
    audioEnabled = true;
    updateHUD();
  } catch (err) {
    console.warn('Microphone access denied');
  }
}

function processAudio() {
  if (!audioEnabled || !analyser) {
    audio.bass = audio.mid = audio.high = audio.level = 0;
    return;
  }
  analyser.getByteFrequencyData(audioData);
  const len = audioData.length;

  // Split into 3 bands
  let bassSum = 0, midSum = 0, highSum = 0;
  const bassEnd = Math.floor(len * 0.15);     // ~0-300Hz
  const midEnd = Math.floor(len * 0.5);        // ~300-2kHz
  for (let i = 0; i < len; i++) {
    const v = audioData[i] / 255;
    if (i < bassEnd) bassSum += v;
    else if (i < midEnd) midSum += v;
    else highSum += v;
  }

  const rawBass = bassSum / bassEnd;
  const rawMid = midSum / (midEnd - bassEnd);
  const rawHigh = highSum / (len - midEnd);
  const rawLevel = (rawBass + rawMid + rawHigh) / 3;

  // Smooth
  audio.bass += (rawBass - audio.bass) * 0.4;
  audio.mid += (rawMid - audio.mid) * 0.35;
  audio.high += (rawHigh - audio.high) * 0.5;
  audio.level += (rawLevel - audio.level) * 0.3;

  // Beat detection — energy spike in bass
  const now = performance.now();
  beat.energy *= beat.decay;
  if (rawBass > beat.energy && rawBass > beat.threshold && now - beat.lastBeat > beat.cooldown) {
    beat.pulse = 1.0;
    beat.lastBeat = now;
    beat.count++;

    // Auto-burst on every 8th beat
    if (cheats.autoBurst && beat.count % 8 === 0) {
      triggerBurst(15);
    }

    // Auto shape cycle on every 16th beat
    if (cheats.autoShape && beat.count % 16 === 0) {
      cycleShape();
    }
  }
  beat.energy = Math.max(beat.energy, rawBass);
  beat.pulse *= 0.88;
}

// ═══════════════════════════════════════════
//  CHEAT CODE SYSTEM
// ═══════════════════════════════════════════
const cheats = {
  godMode: false,
  rainbow: false,
  matrix: false,
  nuke: false,
  freeze: false,
  disco: false,
  blackhole: false,
  supernova: false,
  speed: false,
  autoBurst: false,
  autoShape: false,
  antigravity: false,
  equalizer: false,
};

let cheatBuffer = '';
let cheatTimeout = null;
const CHEAT_CODES = {
  // Classic codes
  'arrowuparrowuparrowdownarrowdownarrowleftarrowrightarrowleftarrowrightba': 'KONAMI',
  'iddqd': 'GODMODE',
  'matrix': 'MATRIX',
  'rainbow': 'RAINBOW',
  'nuke': 'NUKE',
  'freeze': 'FREEZE',
  'disco': 'DISCO',
  'blackhole': 'BLACKHOLE',
  'supernova': 'SUPERNOVA',
  'speed': 'SPEED',
  'beatdrop': 'BEATDROP',
  'equalizer': 'EQUALIZER',
  'antigravity': 'ANTIGRAVITY',
  'reset': 'RESET',
};

function showCheatNotification(name, description) {
  const el = document.getElementById('cheat-notification');
  const nameEl = document.getElementById('cheat-name');
  const descEl = document.getElementById('cheat-desc');
  if (!el) return;
  nameEl.textContent = name;
  descEl.textContent = description;
  el.classList.remove('hidden');
  el.classList.add('show');
  setTimeout(() => {
    el.classList.remove('show');
    el.classList.add('hidden');
  }, 2500);
}

function screenShake(intensity = 10, duration = 300) {
  const start = performance.now();
  const origX = camera.position.x;
  const origY = camera.position.y;
  function shake() {
    const elapsed = performance.now() - start;
    if (elapsed > duration) {
      camera.position.x = origX;
      camera.position.y = origY;
      return;
    }
    const decay = 1 - elapsed / duration;
    camera.position.x = origX + (Math.random() - 0.5) * intensity * decay;
    camera.position.y = origY + (Math.random() - 0.5) * intensity * decay;
    requestAnimationFrame(shake);
  }
  shake();
}

function activateCheat(code) {
  switch (code) {
    case 'KONAMI':
    case 'GODMODE':
      cheats.godMode = !cheats.godMode;
      if (cheats.godMode) {
        bloomPass.strength = 1.6;
        cheats.rainbow = true;
        cheats.autoBurst = true;
        cheats.autoShape = true;
        showCheatNotification('GOD MODE', 'Max bloom + Rainbow + Auto-burst');
      } else {
        bloomPass.strength = 0.8;
        cheats.rainbow = false;
        cheats.autoBurst = false;
        cheats.autoShape = false;
        showCheatNotification('GOD MODE', 'Deactivated');
      }
      break;

    case 'MATRIX':
      cheats.matrix = !cheats.matrix;
      if (cheats.matrix) {
        targetPositions = getMatrixRain();
        targetColor = new THREE.Color(0x00ff41);
        targetAccent = new THREE.Color(0x003b00);
        showCheatNotification('MATRIX', 'Follow the white rabbit');
      } else {
        cycleShape(currentShapeIndex);
        showCheatNotification('MATRIX', 'Unplugged');
      }
      break;

    case 'RAINBOW':
      cheats.rainbow = !cheats.rainbow;
      showCheatNotification('RAINBOW', cheats.rainbow ? 'Full spectrum activated' : 'Deactivated');
      break;

    case 'NUKE':
      triggerBurst(80);
      bloomPass.strength = 2.5;
      screenShake(20, 600);
      showCheatNotification('NUKE', 'DETONATED');
      setTimeout(() => { bloomPass.strength = cheats.godMode ? 1.6 : 0.8; }, 1000);
      break;

    case 'FREEZE':
      cheats.freeze = !cheats.freeze;
      showCheatNotification('FREEZE', cheats.freeze ? 'Time stopped' : 'Time resumed');
      break;

    case 'DISCO':
      cheats.disco = !cheats.disco;
      if (cheats.disco) {
        cheats.autoBurst = true;
        showCheatNotification('DISCO', 'Party mode engaged');
      } else {
        cheats.autoBurst = false;
        showCheatNotification('DISCO', 'Party over');
      }
      break;

    case 'BLACKHOLE':
      cheats.blackhole = !cheats.blackhole;
      if (cheats.blackhole) {
        targetPositions = getBlackhole();
        targetColor = new THREE.Color(0x6600cc);
        targetAccent = new THREE.Color(0x000000);
        showCheatNotification('BLACK HOLE', 'Event horizon forming');
      } else {
        cycleShape(currentShapeIndex);
        showCheatNotification('BLACK HOLE', 'Collapsed');
      }
      break;

    case 'SUPERNOVA':
      showCheatNotification('SUPERNOVA', 'Star death sequence initiated');
      // Phase 1: collapse
      for (let i = 0; i < PARTICLE_COUNT * 3; i++) {
        targetPositions[i] = (Math.random() - 0.5) * 0.5;
      }
      setTimeout(() => {
        triggerBurst(120);
        bloomPass.strength = 3.0;
        screenShake(30, 800);
        setTimeout(() => {
          bloomPass.strength = cheats.godMode ? 1.6 : 0.8;
          cycleShape(currentShapeIndex);
        }, 1500);
      }, 1500);
      break;

    case 'SPEED':
      cheats.speed = !cheats.speed;
      showCheatNotification('SPEED', cheats.speed ? '2X velocity engaged' : 'Normal speed');
      break;

    case 'BEATDROP':
      cheats.autoBurst = !cheats.autoBurst;
      cheats.autoShape = !cheats.autoShape;
      showCheatNotification('BEAT DROP', cheats.autoBurst ? 'Auto-sync to beats' : 'Manual mode');
      break;

    case 'EQUALIZER':
      cheats.equalizer = !cheats.equalizer;
      if (cheats.equalizer) {
        targetPositions = getEqualizer();
        targetColor = new THREE.Color(0x00ffcc);
        targetAccent = new THREE.Color(0xff00cc);
        showCheatNotification('EQUALIZER', 'Visualizer mode');
      } else {
        cycleShape(currentShapeIndex);
        showCheatNotification('EQUALIZER', 'Deactivated');
      }
      break;

    case 'ANTIGRAVITY':
      cheats.antigravity = !cheats.antigravity;
      showCheatNotification('ANTI-GRAVITY', cheats.antigravity ? 'Particles floating' : 'Gravity restored');
      break;

    case 'RESET':
      Object.keys(cheats).forEach(k => { cheats[k] = false; });
      bloomPass.strength = 0.8;
      cycleShape(0);
      showCheatNotification('SYSTEM RESET', 'All cheats deactivated');
      break;
  }
  updateHUD();
}

// ═══════════════════════════════════════════
//  MOUSE INTERACTION
// ═══════════════════════════════════════════
const mouse = { x: 0, y: 0, worldX: 0, worldY: 0, isDown: false };

document.addEventListener('mousemove', (e) => {
  mouse.x = (e.clientX / window.innerWidth) * 2 - 1;
  mouse.y = -(e.clientY / window.innerHeight) * 2 + 1;
  mouse.worldX = mouse.x * 15;
  mouse.worldY = mouse.y * 10;
});
document.addEventListener('mousedown', () => { mouse.isDown = true; });
document.addEventListener('mouseup', () => { mouse.isDown = false; });

// ═══════════════════════════════════════════
//  NEURAL INTERFACE (GUI)
// ═══════════════════════════════════════════
const niOverlay = document.getElementById('neural-interface');
const niClose = document.getElementById('ni-close');
const niBtnNav = document.getElementById('ni-btn-nav');

function toggleNeuralInterface(force) {
  const isActive = force !== undefined ? force : niOverlay?.classList.contains('active');
  if (isActive) {
    niOverlay?.classList.remove('active');
  } else {
    niOverlay?.classList.add('active');
    // Clear keyboard buffer when menu opens to prevent overlap
    cheatBuffer = ''; 
  }
}

niBtnNav?.addEventListener('click', () => toggleNeuralInterface(false));
niClose?.addEventListener('click', () => toggleNeuralInterface(true));

// Card interactions
document.querySelectorAll('.ni-card').forEach(card => {
  card.addEventListener('click', (e) => {
    e.stopPropagation();
    const cheat = card.getAttribute('data-cheat').toUpperCase();
    activateCheat(cheat);
    // Auto-close after short delay for effect
    setTimeout(() => toggleNeuralInterface(true), 200);
  });
});

// ═══════════════════════════════════════════
//  KEYBOARD — shapes + cheats
// ═══════════════════════════════════════════
document.addEventListener('keydown', (e) => {
  // Shape selection (1-8)
  const num = parseInt(e.key);
  if (num >= 1 && num <= shapes.length) {
    cycleShape(num - 1);
    return;
  }
  if (e.key === ' ' || e.code === 'Space') {
    e.preventDefault();
    triggerBurst();
    return;
  }
  if (e.key === 'm' || e.key === 'M') {
    toggleAudio();
    return;
  }
  if (e.key === 'd' || e.key === 'D') {
    drawMode = !drawMode;
    updateHUD();
    return;
  }
  if (e.key === 'c' || e.key === 'C') {
    toggleNeuralInterface();
    return;
  }
  if (e.key === 'Escape') {
    toggleNeuralInterface(true);
    return;
  }

  // Cheat code buffer
  const keyName = e.key.length === 1 ? e.key.toLowerCase() : e.key.toLowerCase();
  cheatBuffer += keyName;

  // Keep buffer manageable
  if (cheatBuffer.length > 80) cheatBuffer = cheatBuffer.slice(-80);

  // Check all codes
  for (const [pattern, name] of Object.entries(CHEAT_CODES)) {
    if (cheatBuffer.endsWith(pattern)) {
      activateCheat(name);
      cheatBuffer = '';
      break;
    }
  }

  // Clear after 3s of no typing
  clearTimeout(cheatTimeout);
  cheatTimeout = setTimeout(() => { cheatBuffer = ''; }, 3000);
});

// ═══════════════════════════════════════════
//  HAND TRACKING
// ═══════════════════════════════════════════
const videoElement = document.getElementById('videoElement');
let handX = 0, handY = 0, handDetected = false, lastPinchTime = 0;

// Two-hand resize state
let twoHandPinchActive = false;
let twoHandInitialDist = 0;
let twoHandBaseScale = 1.0;
let currentScale = 1.0;
const MIN_SCALE = 0.3, MAX_SCALE = 3.0;

// 3D Drawing state
let drawMode = false;

// Voice-controlled spin state
let voiceSpinActive = false;
let voiceSpinSpeed = 0.02;
let softMode = false; // softer lerp for particle movement

// Reusable vector for unprojection (avoid per-frame allocation)
const _unprojVec = new THREE.Vector3();
function fingertipToWorld(landmark) {
  _unprojVec.set((landmark.x - 0.5) * 2, -(landmark.y - 0.5) * 2, 0.5);
  _unprojVec.unproject(camera);
  const dir = _unprojVec.sub(camera.position).normalize();
  const distance = -camera.position.z / dir.z;
  return camera.position.clone().add(dir.multiplyScalar(distance));
}

function initHandTracking() {
  /* global Hands, Camera */
  const hands = new Hands({
    locateFile: (file) => `https://cdn.jsdelivr.net/npm/@mediapipe/hands/${file}`,
  });
  hands.setOptions({ maxNumHands: 2, modelComplexity: 1, minDetectionConfidence: 0.5, minTrackingConfidence: 0.5 });

  hands.onResults((results) => {
    document.getElementById('loading').style.display = 'none';
    if (results.multiHandLandmarks && results.multiHandLandmarks.length > 0) {
      handDetected = true;
      resetIdleTimer();
      const landmarks = results.multiHandLandmarks[0];
      handX = (landmarks[0].x - 0.5) * 2;
      handY = -(landmarks[0].y - 0.5) * 2;
      const minX = Math.min(...landmarks.map(l => l.x));
      const maxX = Math.max(...landmarks.map(l => l.x));
      particleExpansion = 1 + (maxX - minX) * 2;

      const thumb1 = landmarks[4], index1 = landmarks[8];
      const pinchDist1 = Math.hypot(thumb1.x - index1.x, thumb1.y - index1.y);

      if (results.multiHandLandmarks.length > 1) {
        // ─── TWO HANDS DETECTED ───
        const hand2 = results.multiHandLandmarks[1];
        const thumb2 = hand2[4], index2 = hand2[8];
        const pinchDist2 = Math.hypot(thumb2.x - index2.x, thumb2.y - index2.y);

        if (pinchDist1 < 0.05 && pinchDist2 < 0.05) {
          // Both hands pinching → RESIZE MODE
          const mid1x = (thumb1.x + index1.x) / 2;
          const mid1y = (thumb1.y + index1.y) / 2;
          const mid2x = (thumb2.x + index2.x) / 2;
          const mid2y = (thumb2.y + index2.y) / 2;
          const currentDist = Math.hypot(mid1x - mid2x, mid1y - mid2y);

          if (!twoHandPinchActive) {
            twoHandPinchActive = true;
            twoHandInitialDist = currentDist;
            twoHandBaseScale = currentScale;
          } else {
            const rawScale = twoHandBaseScale * (currentDist / twoHandInitialDist);
            currentScale = Math.max(MIN_SCALE, Math.min(MAX_SCALE, rawScale));
          }
        } else {
          twoHandPinchActive = false;
          // Two hands not pinching → ZOOM (increased sensitivity)
          const dist = Math.hypot(landmarks[0].x - hand2[0].x, landmarks[0].y - hand2[0].y);
          camera.position.z = 10 + (1 - dist) * 40;
        }
      } else {
        // ─── SINGLE HAND ───
        twoHandPinchActive = false;
        const now = Date.now();

        if (pinchDist1 < 0.05) {
          if (drawMode && drawingSystem) {
            // Draw mode: pinch = draw with index fingertip
            const worldPos = fingertipToWorld(index1);
            if (!drawingSystem.isDrawing) {
              drawingSystem.startStroke(worldPos);
            } else {
              drawingSystem.addPoint(worldPos);
            }
          } else {
            // Normal mode: pinch cycles shape
            if (now - lastPinchTime > 1000 && !reforming) {
              cycleShape();
              lastPinchTime = now;
            }
          }
        } else {
          // Pinch released — end any active stroke
          if (drawingSystem && drawingSystem.isDrawing) {
            drawingSystem.endStroke();
          }
        }
      }
    } else {
      handDetected = false;
      twoHandPinchActive = false;
      // End stroke if hand lost
      if (drawingSystem && drawingSystem.isDrawing) {
        drawingSystem.endStroke();
      }
    }
  });

  const cameraFeed = new Camera(videoElement, {
    onFrame: async () => { await hands.send({ image: videoElement }); },
    width: 640, height: 480,
  });
  cameraFeed.start();
}

// ═══════════════════════════════════════════
//  HUD
// ═══════════════════════════════════════════
function updateHUD() {
  const nameEl = document.getElementById('shape-name');
  const audioEl = document.getElementById('audio-status');
  if (nameEl) nameEl.textContent = shapes[currentShapeIndex].name;
  if (audioEl) audioEl.textContent = audioEnabled ? 'ON' : 'OFF';

  const dots = document.querySelectorAll('.shape-dot');
  dots.forEach((dot, i) => { dot.classList.toggle('active', i === currentShapeIndex); });

  const audioDot = document.getElementById('audio-dot');
  if (audioDot) audioDot.classList.toggle('active', audioEnabled);

  // Active cheats badge
  const activeList = Object.entries(cheats).filter(([, v]) => v).map(([k]) => k.toUpperCase());
  const cheatEl = document.getElementById('active-cheats');
  const badge = document.getElementById('cheat-badge');
  if (cheatEl && badge) {
    if (activeList.length > 0) {
      cheatEl.textContent = activeList.join(' + ');
      badge.classList.remove('hidden');
      badge.classList.add('show');
    } else {
      badge.classList.remove('show');
      badge.classList.add('hidden');
    }
  }
}

function updateInputIndicators() {
  const handDot = document.getElementById('hand-dot');
  const mouseDot = document.getElementById('mouse-dot');
  if (handDot) handDot.classList.toggle('active', handDetected);
  if (mouseDot) mouseDot.classList.toggle('active', !handDetected);
}

function updateDrawHUD() {
  const drawDot = document.getElementById('draw-dot');
  const drawStatus = document.getElementById('draw-mode-status');
  const strokeCount = document.getElementById('stroke-count');
  const strokeIndicator = document.getElementById('stroke-count-indicator');
  const scaleEl = document.getElementById('scale-value');
  const scaleIndicator = document.getElementById('scale-indicator');

  if (drawDot) drawDot.classList.toggle('active', drawMode);
  if (drawStatus) drawStatus.textContent = drawMode ? 'ON' : 'OFF';
  if (strokeCount && drawingSystem) strokeCount.textContent = drawingSystem.getStrokeCount();
  if (strokeIndicator) strokeIndicator.style.display = drawMode ? 'flex' : 'none';
  if (scaleEl) scaleEl.textContent = currentScale.toFixed(1) + 'x';
  if (scaleIndicator) scaleIndicator.style.display = twoHandPinchActive ? 'flex' : 'none';
}

let fpsFrames = 0, fpsTime = performance.now();
function updateFPS() {
  fpsFrames++;
  const now = performance.now();
  if (now - fpsTime > 500) {
    const fps = Math.round((fpsFrames * 1000) / (now - fpsTime));
    const el = document.getElementById('fps-value');
    if (el) el.textContent = fps;
    fpsFrames = 0;
    fpsTime = now;
  }
}

// ═══════════════════════════════════════════
//  IDLE / SCREENSAVER MODE
// ═══════════════════════════════════════════
const IDLE_TIMEOUT = 10000; // 10 seconds
const REFORM_DURATION = 2.0; // 2 seconds to pull back
let lastActivityTime = performance.now();
let idleMode = false;
let reforming = false;
let reformTimer = 0;
const idleVelocities = new Float32Array(PARTICLE_COUNT * 3);

function resetIdleTimer() {
  lastActivityTime = performance.now();
  if (idleMode) {
    idleMode = false;
    reforming = true;
    reformTimer = 0;
    // Rebuild target so particles reform
    const shape = shapes[currentShapeIndex];
    targetPositions = shape.gen();
  }
}

function enterIdleMode() {
  idleMode = true;
  // Give each particle a random drift velocity
  for (let i = 0; i < PARTICLE_COUNT; i++) {
    const i3 = i * 3;
    const speed = 0.3 + Math.random() * 0.7;
    const theta = Math.random() * Math.PI * 2;
    const phi = Math.acos(2 * Math.random() - 1);
    idleVelocities[i3] = Math.sin(phi) * Math.cos(theta) * speed;
    idleVelocities[i3 + 1] = Math.sin(phi) * Math.sin(theta) * speed;
    idleVelocities[i3 + 2] = Math.cos(phi) * speed;
  }
}

// Track all user activity
for (const evt of ['mousemove', 'mousedown', 'keydown', 'touchstart']) {
  document.addEventListener(evt, resetIdleTimer);
}

// ═══════════════════════════════════════════
//  ANIMATION LOOP
// ═══════════════════════════════════════════
const clock = new THREE.Clock();

function animate() {
  requestAnimationFrame(animate);
  const delta = clock.getDelta();
  const elapsed = clock.getElapsedTime();

  const speedMult = cheats.speed ? 2.0 : 1.0;
  shaderMaterial.uniforms.uTime.value = elapsed;
  shaderMaterial.uniforms.uSpeedMult.value = speedMult;
  shaderMaterial.uniforms.uFreeze.value = cheats.freeze ? 1.0 : 0.0;

  // Process audio
  processAudio();
  shaderMaterial.uniforms.uAudioBass.value = audio.bass;
  shaderMaterial.uniforms.uAudioMid.value = audio.mid;
  shaderMaterial.uniforms.uAudioHigh.value = audio.high;
  shaderMaterial.uniforms.uBeatPulse.value = beat.pulse;

  // Mouse world position for hover glow
  shaderMaterial.uniforms.uMouseWorld.value.set(mouse.worldX, mouse.worldY, 0);

  // Cheat uniforms
  const rainbowTarget = cheats.rainbow ? 1 : 0;
  const discoTarget = cheats.disco ? 1 : 0;
  shaderMaterial.uniforms.uRainbow.value += (rainbowTarget - shaderMaterial.uniforms.uRainbow.value) * 0.1;
  shaderMaterial.uniforms.uDisco.value += (discoTarget - shaderMaterial.uniforms.uDisco.value) * 0.1;

  // Audio-driven bloom
  if (audioEnabled) {
    const baseBl = cheats.godMode ? 1.6 : 0.8;
    bloomPass.strength = baseBl + audio.bass * 0.8 + beat.pulse * 0.6;
  }

  // Update audio meter bars
  const bassFill = document.getElementById('bass-fill');
  const midFill = document.getElementById('mid-fill');
  const highFill = document.getElementById('high-fill');
  if (bassFill) bassFill.style.width = `${audio.bass * 100}%`;
  if (midFill) midFill.style.width = `${audio.mid * 100}%`;
  if (highFill) highFill.style.width = `${audio.high * 100}%`;

  // Beat indicator flash
  const beatDot = document.getElementById('beat-dot');
  if (beatDot) {
    beatDot.style.opacity = beat.pulse > 0.3 ? '1' : '0.2';
    beatDot.style.transform = `scale(${1 + beat.pulse})`;
  }

  // Idle detection (disabled)
  // if (!idleMode && !reforming && performance.now() - lastActivityTime > IDLE_TIMEOUT) {
  //   enterIdleMode();
  // }

  // Reform timer — gravity pull back over 2 seconds
  if (reforming) {
    reformTimer += delta;
    if (reformTimer >= REFORM_DURATION) {
      reforming = false;
      reformTimer = 0;
    }
  }

  const pos = particleSystem.geometry.attributes.position.array;
  const col = particleSystem.geometry.attributes.color.array;

  // Burst physics
  if (burstActive) {
    burstTimer += delta;
    for (let i = 0; i < PARTICLE_COUNT * 3; i++) {
      pos[i] += burstVelocities[i] * delta;
      burstVelocities[i] *= BURST_DECAY;
    }
    if (burstTimer > 0.6) burstActive = false;
  }

  // Equalizer — animate bar heights to audio
  if (cheats.equalizer && audioEnabled && audioData) {
    const bars = 32;
    for (let i = 0; i < PARTICLE_COUNT; i++) {
      const bar = i % bars;
      const binIdx = Math.floor((bar / bars) * audioData.length);
      const barHeight = (audioData[binIdx] / 255) * 12;
      const i3 = i * 3;
      const barProgress = (Math.floor(i / bars)) / (PARTICLE_COUNT / bars);
      targetPositions[i3 + 1] = barProgress * barHeight - 5;
    }
  }

  // Anti-gravity float
  const gravityOffset = cheats.antigravity ? Math.sin(elapsed * 0.5) * 0.03 : 0;

  const mouseInfluence = mouse.isDown ? -8 : 2;
  const freezeActive = cheats.freeze;

  for (let i = 0; i < PARTICLE_COUNT; i++) {
    const i3 = i * 3;

    if (!freezeActive) {
      if (idleMode) {
        // Free roam — particles drift with gentle velocity
        pos[i3] += idleVelocities[i3] * delta;
        pos[i3 + 1] += idleVelocities[i3 + 1] * delta;
        pos[i3 + 2] += idleVelocities[i3 + 2] * delta;

        // Soft boundary — bounce back when too far (radius ~14)
        const idleDist = Math.sqrt(pos[i3] * pos[i3] + pos[i3 + 1] * pos[i3 + 1] + pos[i3 + 2] * pos[i3 + 2]);
        if (idleDist > 14) {
          idleVelocities[i3] -= pos[i3] / idleDist * 0.02;
          idleVelocities[i3 + 1] -= pos[i3 + 1] / idleDist * 0.02;
          idleVelocities[i3 + 2] -= pos[i3 + 2] / idleDist * 0.02;
        }

        // Gentle swirl
        idleVelocities[i3] += (-pos[i3 + 2]) * 0.001;
        idleVelocities[i3 + 2] += pos[i3] * 0.001;
      } else {
        const tx = targetPositions[i3] * particleExpansion;
        const ty = targetPositions[i3 + 1] * particleExpansion;
        const tz = targetPositions[i3 + 2] * particleExpansion;

        // Reforming: accelerating pull (slow start → fast snap)
        let lerpSpeed = softMode ? LERP_SPEED * 0.3 : LERP_SPEED;
        if (reforming) {
          const t = Math.min(reformTimer / REFORM_DURATION, 1);
          // Cubic ease-in: starts very slow, accelerates
          lerpSpeed = 0.005 + t * t * t * 0.15;
        }

        pos[i3] += (tx - pos[i3]) * lerpSpeed;
        pos[i3 + 1] += (ty - pos[i3 + 1]) * lerpSpeed + gravityOffset;
        pos[i3 + 2] += (tz - pos[i3 + 2]) * lerpSpeed;
      }

      // Matrix rain — fall downward continuously
      if (cheats.matrix) {
        pos[i3 + 1] -= delta * (3 + randoms[i] * 5) * speedMult;
        if (pos[i3 + 1] < -15) pos[i3 + 1] = 15;
      }

      // Black hole spiral — rotate toward center
      if (cheats.blackhole) {
        const angle = Math.atan2(pos[i3 + 2], pos[i3]);
        const dist = Math.sqrt(pos[i3] * pos[i3] + pos[i3 + 2] * pos[i3 + 2]);
        const spiralSpeed = (0.5 / (dist + 0.5)) * delta * 60;
        const newAngle = angle + spiralSpeed;
        const newDist = dist * (1 - 0.002);
        pos[i3] = Math.cos(newAngle) * newDist;
        pos[i3 + 2] = Math.sin(newAngle) * newDist;
      }

      // Mouse force (disabled during reform)
      if (!handDetected && !reforming) {
        const dx = pos[i3] - mouse.worldX;
        const dy = pos[i3 + 1] - mouse.worldY;
        const dz = pos[i3 + 2];
        const distSq = dx * dx + dy * dy + dz * dz;
        if (distSq < 100 && distSq > 0.1) {
          const dist = Math.sqrt(distSq);
          const force = (mouseInfluence / distSq) * delta * 60;
          pos[i3] += (dx / dist) * force;
          pos[i3 + 1] += (dy / dist) * force;
          pos[i3 + 2] += (dz / dist) * force;
        }
      }
    }

    // Per-particle gradient coloring
    const dist = Math.sqrt(pos[i3] * pos[i3] + pos[i3 + 1] * pos[i3 + 1] + pos[i3 + 2] * pos[i3 + 2]);
    const gradientT = Math.min(dist / 12, 1);
    const tr = targetColor.r + (targetAccent.r - targetColor.r) * gradientT;
    const tg = targetColor.g + (targetAccent.g - targetColor.g) * gradientT;
    const tb = targetColor.b + (targetAccent.b - targetColor.b) * gradientT;

    col[i3] += (tr - col[i3]) * 0.06;
    col[i3 + 1] += (tg - col[i3 + 1]) * 0.06;
    col[i3 + 2] += (tb - col[i3 + 2]) * 0.06;
  }

  particleSystem.geometry.attributes.position.needsUpdate = true;
  particleSystem.geometry.attributes.color.needsUpdate = true;

  // Rotation (gentle auto-rotate only during reform)
  if (!cheats.freeze) {
    const rotSpeed = speedMult;
    if (reforming) {
      particleSystem.rotation.y += 0.001 * rotSpeed;
    } else if (handDetected) {
      particleSystem.rotation.y += (handX * 2 - particleSystem.rotation.y) * 0.1;
      particleSystem.rotation.x += (handY * 2 - particleSystem.rotation.x) * 0.1;
    } else {
      particleSystem.rotation.y += (mouse.x * 1.5 - particleSystem.rotation.y) * 0.03;
      particleSystem.rotation.x += (mouse.y * 1.0 - particleSystem.rotation.x) * 0.03;
    }
    if (!reforming) particleSystem.rotation.y += 0.001 * rotSpeed;

    // Voice-controlled continuous spin
    if (voiceSpinActive) {
      particleSystem.rotation.y += voiceSpinSpeed * rotSpeed;
    }

    // Disco = audio-driven rotation
    if (cheats.disco && audioEnabled) {
      particleSystem.rotation.y += audio.mid * 0.05 * rotSpeed;
      particleSystem.rotation.z += beat.pulse * 0.1;
    }
  }

  // Two-hand resize: smooth scale transition
  const _targetScale = new THREE.Vector3(currentScale, currentScale, currentScale);
  particleSystem.scale.lerp(_targetScale, 0.1);

  composer.render();
  updateFPS();
  updateInputIndicators();
  updateDrawHUD();
}

// ─── RESIZE ───
window.addEventListener('resize', () => {
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(window.innerWidth, window.innerHeight);
  composer.setSize(window.innerWidth, window.innerHeight);
});

// ─── VOICE COMMAND HANDLER ───
function initVoiceCommands() {
  return new SpeechController({
    onCommand: (action) => {
      switch (action) {
        case 'resetScale':
          currentScale = 1.0;
          break;
        case 'clearDrawing':
          if (drawingSystem) drawingSystem.clear();
          break;
        case 'undoDrawing':
          if (drawingSystem) drawingSystem.undo();
          break;
        case 'toggleDraw':
          drawMode = true;
          updateHUD();
          break;
        case 'stopDraw':
          drawMode = false;
          if (drawingSystem && drawingSystem.isDrawing) drawingSystem.endStroke();
          updateHUD();
          break;
        case 'flip90':
          particleSystem.rotation.z += Math.PI / 2;
          break;
        case 'flip180':
          particleSystem.rotation.z += Math.PI;
          break;
        case 'flip45':
          particleSystem.rotation.z += Math.PI / 4;
          break;
        case 'flipX':
          particleSystem.rotation.x += Math.PI / 2;
          break;
        case 'flipY':
          particleSystem.rotation.y += Math.PI / 2;
          break;
        case 'startSpin':
          voiceSpinActive = true;
          break;
        case 'stopSpin':
          voiceSpinActive = false;
          break;
        case 'spinFaster':
          voiceSpinSpeed = Math.min(voiceSpinSpeed * 2, 0.2);
          break;
        case 'spinSlower':
          voiceSpinSpeed = Math.max(voiceSpinSpeed * 0.5, 0.002);
          break;
        case 'softMode':
          softMode = true;
          break;
        case 'hardMode':
          softMode = false;
          break;
        case 'scatterParticles':
          triggerBurst();
          break;
        case 'reassembleParticles':
          reforming = true;
          reformTimer = 0;
          break;
        case 'decreaseGravity':
          particleExpansion = Math.max(0.5, particleExpansion - 0.3);
          break;
        default:
          break;
      }
    }
  });
}

// ─── START ───
window.addEventListener('jarvis-ready', () => {
  initHandTracking();
  initVoiceCommands();
  updateHUD();
  animate();
});
