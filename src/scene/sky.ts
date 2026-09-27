import * as THREE from "three";
import { PALETTE } from "./palette";

// Observatory dome (open slit to the north), floor and a twinkling star field beyond.

export const DOME_RADIUS = 30;
export const SLIT_HALF = 4.2;
export const SKY_RADIUS = 220;

/** Unit direction up the dome slit at a given elevation (degrees). */
export function slitDirection(elevation: number): THREE.Vector3 {
  const e = THREE.MathUtils.degToRad(elevation);
  return new THREE.Vector3(0, Math.sin(e), -Math.cos(e));
}

function dome(): THREE.Mesh {
  const geo = new THREE.SphereGeometry(DOME_RADIUS, 96, 52, 0, Math.PI * 2, 0, Math.PI / 2 + 0.12);
  const mat = new THREE.ShaderMaterial({
    side: THREE.BackSide,
    uniforms: {
      uBase: { value: new THREE.Color(PALETTE.dome) },
      uRib: { value: new THREE.Color(0x1a2130) },
      uRim: { value: new THREE.Color(PALETTE.moon) },
      uSlit: { value: SLIT_HALF },
    },
    vertexShader: /* glsl */ `
      varying vec3 vPos;
      void main() {
        vPos = position;
        gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
      }`,
    fragmentShader: /* glsl */ `
      uniform vec3 uBase, uRib, uRim;
      uniform float uSlit;
      varying vec3 vPos;
      void main() {
        float edge = abs(vPos.x) - uSlit;
        if (edge < 0.0 && vPos.z < 6.0 && vPos.y > 0.0) discard;
        float az = atan(vPos.z, vPos.x) / 6.28318 * 32.0;
        float rib = smoothstep(0.93, 1.0, abs(fract(az) * 2.0 - 1.0));
        float el = asin(clamp(vPos.y / ${DOME_RADIUS.toFixed(1)}, 0.0, 1.0)) / 1.5708 * 7.0;
        float ring = smoothstep(0.95, 1.0, abs(fract(el) * 2.0 - 1.0));
        vec3 col = mix(uBase, uRib, max(rib, ring) * 0.9);
        float nearSlit = exp(-max(edge, 0.0) * 0.55) * step(vPos.z, 6.0);
        col += uRim * nearSlit * 0.05;
        col += uRim * smoothstep(0.35, 0.0, max(edge, 0.0)) * 0.35 * step(vPos.z, 6.0);
        col *= 0.5 + 0.5 * clamp(vPos.y / ${DOME_RADIUS.toFixed(1)}, 0.0, 1.0);
        gl_FragColor = vec4(col, 1.0);
        #include <colorspace_fragment>
      }`,
  });
  return new THREE.Mesh(geo, mat);
}

function floor(): THREE.Mesh {
  const mesh = new THREE.Mesh(
    new THREE.CircleGeometry(DOME_RADIUS, 64),
    new THREE.MeshStandardMaterial({ color: 0x05070b, metalness: 0.1, roughness: 0.9 }),
  );
  mesh.rotation.x = -Math.PI / 2;
  mesh.position.y = -2.45;
  mesh.receiveShadow = true;
  return mesh;
}

export interface StarField {
  points: THREE.Points;
  uniforms: { uTime: { value: number }; uPixel: { value: number }; uTwinkle: { value: number } };
}

function stars(count: number): StarField {
  const pos = new Float32Array(count * 3);
  const size = new Float32Array(count);
  const tint = new Float32Array(count);
  const phase = new Float32Array(count);
  let seed = 11;
  const rand = () => {
    seed = (seed * 16807) % 2147483647;
    return seed / 2147483647;
  };
  const v = new THREE.Vector3();
  for (let i = 0; i < count; i++) {
    // A faint band across the slit plus a uniform scatter.
    const band = i % 3 === 0;
    const az = band ? (rand() - 0.5) * 0.9 + Math.PI * 1.5 : rand() * Math.PI * 2;
    const el = band ? rand() * Math.PI * 0.5 : Math.asin(rand() * 0.98 + 0.02);
    v.setFromSphericalCoords(SKY_RADIUS, Math.PI / 2 - el, az);
    pos.set([v.x, v.y, v.z], i * 3);
    size[i] = 1 + 5.5 * rand() ** 6;
    tint[i] = rand();
    phase[i] = rand() * 6.28;
  }
  const geo = new THREE.BufferGeometry();
  geo.setAttribute("position", new THREE.BufferAttribute(pos, 3));
  geo.setAttribute("aSize", new THREE.BufferAttribute(size, 1));
  geo.setAttribute("aTint", new THREE.BufferAttribute(tint, 1));
  geo.setAttribute("aPhase", new THREE.BufferAttribute(phase, 1));
  const uniforms = { uTime: { value: 0 }, uPixel: { value: 1 }, uTwinkle: { value: 1 } };
  const material = new THREE.ShaderMaterial({
    transparent: true,
    depthWrite: false,
    blending: THREE.AdditiveBlending,
    uniforms,
    vertexShader: /* glsl */ `
      attribute float aSize, aTint, aPhase;
      uniform float uTime, uPixel, uTwinkle;
      varying vec3 vColor;
      varying float vAlpha;
      void main() {
        vColor = mix(vec3(0.72, 0.8, 1.0), vec3(1.0, 0.86, 0.7), aTint);
        vAlpha = 0.55 + 0.45 * mix(1.0, sin(uTime * (0.6 + aTint) + aPhase), 0.5 * uTwinkle);
        gl_PointSize = aSize * uPixel;
        gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
      }`,
    fragmentShader: /* glsl */ `
      varying vec3 vColor;
      varying float vAlpha;
      void main() {
        float d = length(gl_PointCoord - 0.5);
        float a = smoothstep(0.5, 0.0, d);
        gl_FragColor = vec4(vColor * a * a * vAlpha, 1.0);
      }`,
  });
  return { points: new THREE.Points(geo, material), uniforms };
}

export function buildSky(): { group: THREE.Group; field: StarField } {
  const group = new THREE.Group();
  const field = stars(2600);
  group.add(dome(), floor(), field.points);
  return { group, field };
}
