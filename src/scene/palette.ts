import * as THREE from "three";

// Dark observatory, anodised instrument metal, brass adjusters, one warm beam, cool starlight.
export const PALETTE = {
  night: 0x04060b,
  dome: 0x0b1019,
  bench: 0x151a24,
  benchEdge: 0x2b3240,
  engraving: 0x3b4658,
  steel: 0x6d7789,
  darkSteel: 0x252b37,
  brass: 0xb8915a,
  mirror: 0xe4ebf5,
  glass: 0x9fd0ff,
  beam: 0xffd6a0,
  scatter: 0xff5f45,
  lampOff: 0x1e2636,
  focus: 0x8fb4ff,
  starLine: 0x9dbbff,
  moon: 0xbfd0ff,
} as const;

export const BEAM_Y = 0.42;

/** Soft round glow used for stars, glints and lamps. */
let glow: THREE.Texture | null = null;
export function glowTexture(): THREE.Texture {
  if (glow) return glow;
  const size = 64;
  const canvas = document.createElement("canvas");
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext("2d");
  if (ctx) {
    const g = ctx.createRadialGradient(size / 2, size / 2, 0, size / 2, size / 2, size / 2);
    g.addColorStop(0, "rgba(255,255,255,1)");
    g.addColorStop(0.18, "rgba(255,255,255,0.75)");
    g.addColorStop(0.45, "rgba(255,255,255,0.18)");
    g.addColorStop(1, "rgba(255,255,255,0)");
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, size, size);
  }
  glow = new THREE.CanvasTexture(canvas);
  glow.colorSpace = THREE.SRGBColorSpace;
  return glow;
}

export function glowMaterial(color: number, opacity = 1): THREE.SpriteMaterial {
  return new THREE.SpriteMaterial({
    map: glowTexture(),
    color,
    opacity,
    transparent: true,
    blending: THREE.AdditiveBlending,
    depthWrite: false,
    toneMapped: false,
  });
}
