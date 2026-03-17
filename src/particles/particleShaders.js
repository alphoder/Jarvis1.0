// Vertex and fragment shaders for GPU particle system

export const particleVertexShader = `
attribute vec3 originalPosition;
attribute vec3 velocity;
attribute float particleIndex;

uniform float uTime;
uniform float uBlend;
uniform vec3 uForceCenter;
uniform float uForceRadius;
uniform float uForceStrength;
uniform int uGlobalMode; // 0: idle, 1: scatter, 2: reassemble
uniform vec3 uFingerPos;
uniform float uFingerRadius;
uniform float uFingerStrength;
uniform float uShockwaveTime;
uniform vec3 uShockwaveCenter;
uniform float uShockwaveRadius;
uniform float uShockwaveStrength;

varying float vDistToFinger;
varying float vAlpha;

void main() {
    vec3 pos = originalPosition;
    vec3 vel = velocity;
    float blend = uBlend;

    // Global scatter (both palms open)
    if (uGlobalMode == 1) {
        vec3 dir = normalize(pos - uForceCenter);
        float dist = length(pos - uForceCenter);
        float force = uForceStrength * smoothstep(0.0, 1.0, dist / uForceRadius);
        vel += dir * force * blend;
        vel *= 0.96; // damping
        pos += vel * 0.016;
    }
    // Global reassemble (both fists closed)
    else if (uGlobalMode == 2) {
        vec3 spring = (originalPosition - pos) * uForceStrength * blend;
        vel += spring;
        vel *= 0.92; // stronger damping
        pos += vel * 0.016;
    }
    // Idle
    else {
        vel *= 0.98;
        pos += vel * 0.016;
    }

    // Local finger repulsion
    float fingerDist = length(pos - uFingerPos);
    vDistToFinger = fingerDist;
    if (fingerDist < uFingerRadius) {
        float repulse = uFingerStrength * (1.0 - smoothstep(0.0, uFingerRadius, fingerDist));
        vec3 repelDir = normalize(pos - uFingerPos);
        vel += repelDir * repulse;
        pos += repelDir * repulse * 0.016;
    }

    // Shockwave
    float shockDist = length(pos - uShockwaveCenter);
    if (uShockwaveTime > 0.0 && shockDist < uShockwaveRadius) {
        float shock = uShockwaveStrength * (1.0 - smoothstep(0.0, uShockwaveRadius, shockDist));
        vec3 shockDir = normalize(pos - uShockwaveCenter);
        vel += shockDir * shock * (1.0 - uShockwaveTime);
        pos += shockDir * shock * 0.016 * (1.0 - uShockwaveTime);
    }

    vAlpha = 1.0 - 0.5 * smoothstep(0.0, uFingerRadius, fingerDist);
    gl_Position = projectionMatrix * modelViewMatrix * vec4(pos, 1.0);
    gl_PointSize = 2.0;
}
`;

export const particleFragmentShader = `
varying float vDistToFinger;
varying float vAlpha;

void main() {
    float d = length(gl_PointCoord - vec2(0.5));
    if (d > 0.5) discard;
    vec3 color = mix(vec3(0.2, 0.7, 1.0), vec3(1.0, 0.8, 0.2), vAlpha);
    gl_FragColor = vec4(color, vAlpha * (1.0 - d * 1.2));
}
`;
