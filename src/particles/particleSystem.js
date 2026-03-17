import * as THREE from 'three';
import { particleVertexShader, particleFragmentShader } from './particleShaders.js';

const PARTICLE_COUNT = 5000;

class ParticleSystem {
  constructor(scene) {
    this.scene = scene;
    this.geometry = null;
    this.material = null;
    this.points = null;
    this.uniforms = null;
    this.init();
  }

  init() {
    // Generate initial positions (sphere)
    const positions = new Float32Array(PARTICLE_COUNT * 3);
    const originalPositions = new Float32Array(PARTICLE_COUNT * 3);
    const velocities = new Float32Array(PARTICLE_COUNT * 3);
    const indices = new Float32Array(PARTICLE_COUNT);

    for (let i = 0; i < PARTICLE_COUNT; i++) {
      // Sphere distribution
      const phi = Math.acos(2 * Math.random() - 1);
      const theta = 2 * Math.PI * Math.random();
      const r = 8 + Math.random() * 2;
      const x = r * Math.sin(phi) * Math.cos(theta);
      const y = r * Math.sin(phi) * Math.sin(theta);
      const z = r * Math.cos(phi);
      positions.set([x, y, z], i * 3);
      originalPositions.set([x, y, z], i * 3);
      velocities.set([0, 0, 0], i * 3);
      indices[i] = i;
    }

    this.geometry = new THREE.BufferGeometry();
    this.geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    this.geometry.setAttribute('originalPosition', new THREE.BufferAttribute(originalPositions, 3));
    this.geometry.setAttribute('velocity', new THREE.BufferAttribute(velocities, 3));
    this.geometry.setAttribute('particleIndex', new THREE.BufferAttribute(indices, 1));

    this.uniforms = {
      uTime: { value: 0 },
      uBlend: { value: 0 },
      uForceCenter: { value: new THREE.Vector3(0, 0, 0) },
      uForceRadius: { value: 12 },
      uForceStrength: { value: 0.8 },
      uGlobalMode: { value: 0 },
      uFingerPos: { value: new THREE.Vector3(0, 0, 0) },
      uFingerRadius: { value: 3.5 },
      uFingerStrength: { value: 1.2 },
      uShockwaveTime: { value: 0 },
      uShockwaveCenter: { value: new THREE.Vector3(0, 0, 0) },
      uShockwaveRadius: { value: 0 },
      uShockwaveStrength: { value: 2.5 },
    };

    this.material = new THREE.ShaderMaterial({
      vertexShader: particleVertexShader,
      fragmentShader: particleFragmentShader,
      uniforms: this.uniforms,
      transparent: true,
      depthWrite: false,
      blending: THREE.AdditiveBlending,
    });

    this.points = new THREE.Points(this.geometry, this.material);
    this.points.frustumCulled = false;
    this.scene.add(this.points);
  }

  update({
    time,
    globalMode = 0,
    blend = 0,
    forceCenter = new THREE.Vector3(0, 0, 0),
    fingerPos = new THREE.Vector3(0, 0, 0),
    shockwave = null,
  }) {
    this.uniforms.uTime.value = time;
    this.uniforms.uGlobalMode.value = globalMode;
    this.uniforms.uBlend.value = blend;
    this.uniforms.uForceCenter.value.copy(forceCenter);
    this.uniforms.uFingerPos.value.copy(fingerPos);
    if (shockwave) {
      this.uniforms.uShockwaveTime.value = shockwave.time;
      this.uniforms.uShockwaveCenter.value.copy(shockwave.center);
      this.uniforms.uShockwaveRadius.value = shockwave.radius;
      this.uniforms.uShockwaveStrength.value = shockwave.strength;
    } else {
      this.uniforms.uShockwaveTime.value = 0;
      this.uniforms.uShockwaveRadius.value = 0;
    }
  }
}

export default ParticleSystem;
