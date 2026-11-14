import { Position3, Solid } from './meadow-collisions';
export const CHARACTER_SCALE = 0.82;
export const DEFAULT_CAMERA_DISTANCE = 17;
export const CAMERA_FOV = 57;
/** Sphere-cast the camera boom against the same solids that block the character. */
export function clipCamera(
  target: Position3,
  desired: Position3,
  solids: Solid[],
  radius = 0.3,
): Position3 {
  const direction = { x: desired.x - target.x, y: desired.y - target.y, z: desired.z - target.z };
  let nearest = 1;
  for (const solid of solids) {
    let enter = 0,
      exit = nearest;
    const axes = ['x', 'y', 'z'] as const;
    if (solid.shape === 'box') {
      for (const axis of axes) {
        const half = (axis === 'x' ? solid.rx : axis === 'y' ? solid.ry : solid.rz) + radius,
          origin = target[axis] - solid[axis],
          delta = direction[axis];
        if (Math.abs(delta) < 1e-8) {
          if (Math.abs(origin) > half) {
            exit = -1;
            break;
          }
        } else {
          const a = (-half - origin) / delta,
            b = (half - origin) / delta;
          enter = Math.max(enter, Math.min(a, b));
          exit = Math.min(exit, Math.max(a, b));
        }
      }
    } else {
      const active = solid.shape === 'ellipsoid' ? axes : (['x', 'z'] as const);
      let a = 0,
        b = 0,
        c = -1;
      for (const axis of active) {
        const half = (axis === 'x' ? solid.rx : axis === 'y' ? solid.ry : solid.rz) + radius,
          o = (target[axis] - solid[axis]) / half,
          d = direction[axis] / half;
        a += d * d;
        b += 2 * o * d;
        c += o * o;
      }
      if (a < 1e-10 || b * b - 4 * a * c < 0) continue;
      const discriminant = Math.sqrt(b * b - 4 * a * c);
      enter = Math.max(enter, (-b - discriminant) / (2 * a));
      exit = Math.min(exit, (-b + discriminant) / (2 * a));
      if (solid.shape === 'cylinder') {
        const origin = target.y - solid.y,
          delta = direction.y,
          half = solid.ry + radius;
        if (Math.abs(delta) < 1e-8) {
          if (Math.abs(origin) > half) continue;
        } else {
          const a = (-half - origin) / delta,
            b = (half - origin) / delta;
          enter = Math.max(enter, Math.min(a, b));
          exit = Math.min(exit, Math.max(a, b));
        }
      }
    }
    if (enter <= exit && exit > 0 && enter > 0) nearest = Math.max(0, enter - 0.015);
  }
  return {
    x: target.x + direction.x * nearest,
    y: target.y + direction.y * nearest,
    z: target.z + direction.z * nearest,
  };
}
export function followRig(
  position: Position3,
  yaw: number,
  pitch: number,
  distance: number,
  aspect: number,
): { camera: Position3; target: Position3 } {
  const boom =
    Math.max(14, Math.min(26, distance)) * Math.max(1, Math.min(1.35, 0.7 / Math.max(0.3, aspect)));
  return {
    camera: {
      x: position.x - Math.sin(yaw) * Math.cos(pitch) * boom,
      y: position.y + 3.4 + Math.sin(pitch) * boom,
      z: position.z + Math.cos(yaw) * Math.cos(pitch) * boom,
    },
    target: {
      x: position.x + Math.sin(yaw) * 3,
      y: position.y + 2,
      z: position.z - Math.cos(yaw) * 3,
    },
  };
}
/** Cast from the player's torso, independently of the look-ahead composition target. */
export function safeFollowCamera(
  position: Position3,
  desired: Position3,
  yaw: number,
  solids: Solid[],
): Position3 {
  const pivot = { x: position.x, y: position.y + 1.45, z: position.z };
  const length = (p: Position3) => Math.hypot(p.x - pivot.x, p.y - pivot.y, p.z - pivot.z);
  let safe = clipCamera(pivot, desired, solids);
  if (length(safe) < 9) {
    const right = { x: Math.cos(yaw), z: Math.sin(yaw) };
    const candidates = [
      { ...desired, y: desired.y + 8 },
      { ...desired, y: desired.y + 14 },
      { ...desired, x: desired.x + right.x * 12, z: desired.z + right.z * 12 },
      { ...desired, x: desired.x - right.x * 12, z: desired.z - right.z * 12 },
    ];
    for (const candidate of candidates) {
      const clipped = clipCamera(pivot, candidate, solids);
      if (length(clipped) > length(safe)) safe = clipped;
      if (length(safe) > 14) break;
    }
  }
  return safe;
}
