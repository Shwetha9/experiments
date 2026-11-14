/** Shared solid volumes. The scene and simulation use the same positions and dimensions. */
export interface Position3 {
  x: number;
  y: number;
  z: number;
}
export interface Solid {
  id: string;
  shape: 'box' | 'cylinder' | 'ellipsoid';
  x: number;
  y: number;
  z: number;
  rx: number;
  ry: number;
  rz: number;
}
export const PLAYER_RADIUS = 1;
export const PLAYER_HEIGHT = 2.9;
export interface Scenery {
  island: number;
  kind: 'tree' | 'ice' | 'mushroom';
  x: number;
  z: number;
  scale: number;
  variant: number;
}
interface Island extends Position3 {
  radius: number;
  biome: string;
}
export function createScenery(islands: Island[]): Scenery[] {
  let seed = 127;
  const random = () => {
    seed = (Math.imul(seed, 1664525) + 1013904223) | 0;
    return (seed >>> 0) / 4294967296;
  };
  return islands.flatMap((island, index) => {
    if (island.biome === 'castle') return [];
    const result: Scenery[] = [];
    for (let j = 0; j < 23; j++) {
      const a = random() * Math.PI * 2,
        r = island.radius * (0.48 + random() * 0.35),
        x = Math.cos(a) * r,
        z = Math.sin(a) * r,
        scale = 0.75 + random() * 0.4;
      // Keep the runway, lantern approach and every pickup free of solid scenery.
      if (
        (Math.abs(x) < 3 && z > 0) ||
        Math.hypot(x, z) < 5 ||
        [
          [-5, 4],
          [5, 0],
          [0, -6],
        ].some(([px, pz]) => Math.hypot(x - px, z - pz) < 3.7)
      )
        continue;
      if (result.some((o) => Math.hypot(o.x - x, o.z - z) < 3)) continue;
      result.push({
        island: index,
        kind: j < 11 ? 'tree' : island.biome === 'ice' ? 'ice' : 'mushroom',
        x,
        z,
        scale,
        variant: j,
      });
    }
    return result;
  });
}
export function rockHeight(island: number, index: number): number {
  return -5 - (((island * 13 + index * 7) % 11) / 11) * 3;
}
export function scenerySolids(islands: Island[], scenery: Scenery[]): Solid[] {
  const solids: Solid[] = [];
  const add = (
    id: string,
    shape: Solid['shape'],
    x: number,
    y: number,
    z: number,
    rx: number,
    ry: number,
    rz = rx,
  ) => solids.push({ id, shape, x, y, z, rx, ry, rz });
  for (const [j, o] of scenery.entries()) {
    const i = islands[o.island],
      x = i.x + o.x,
      z = i.z + o.z,
      s = o.scale;
    if (o.kind === 'tree') {
      add(`tree-${j}-trunk`, 'cylinder', x, i.y + 1.85 * s, z, 0.4 * s, 1.85 * s);
      // Crown volumes enclose the rendered foliage, so flight also has to go around trees.
      if (i.biome === 'ice')
        add(`tree-${j}-crown`, 'ellipsoid', x, i.y + 4.1 * s, z, 2 * s, 3.1 * s);
      else {
        add(`tree-${j}-crown`, 'ellipsoid', x, i.y + 4.2 * s, z, 2.2 * s, 2.4 * s, 2.1 * s);
        add(
          `tree-${j}-branch`,
          'ellipsoid',
          x + 1.3 * s,
          i.y + 3.6 * s,
          z,
          1.5 * s,
          1.6 * s,
          1.4 * s,
        );
        add(`tree-${j}-branch2`, 'ellipsoid', x - s, i.y + 3.9 * s, z + 0.6 * s, 1.5 * s, 1.5 * s);
      }
    } else if (o.kind === 'ice') add(`ice-${j}`, 'cylinder', x, i.y + 1.5 * s, z, 0.5 * s, 1.5 * s);
    else add(`mushroom-${j}`, 'cylinder', x, i.y + 0.55 * s, z, 0.6 * s, 0.55 * s);
  }
  for (const [index, i] of islands.entries()) {
    add(`island-${index}-rim`, 'cylinder', i.x, i.y - 1.3, i.z, i.radius, 1.3);
    for (let k = 0; k < 15; k++)
      add(
        `island-${index}-underside-${k}`,
        'cylinder',
        i.x,
        i.y - 2.7 - k,
        i.z,
        i.radius * 0.88 * (1 - k / 15),
        0.5,
      );
    for (let k = 0; k < 7; k++) {
      const a = (k * Math.PI * 2) / 7;
      add(
        `island-${index}-rock-${k}`,
        'ellipsoid',
        i.x + Math.sin(a) * i.radius * 0.55,
        i.y + rockHeight(index, k),
        i.z + Math.cos(a) * i.radius * 0.55,
        3,
        5,
      );
    }
  }
  // Architecture remains passable through its openings, solid through its masonry.
  for (let j = 1; j <= 4; j++) {
    const i = islands[j];
    add(`lantern-${j}`, 'cylinder', i.x, i.y + 1.95, i.z, 0.85, 1.95);
    for (const side of [-1, 1])
      add(`arch-${j}-${side}`, 'cylinder', i.x + side * 3, i.y + 2.9, i.z - 2, 0.65, 2.9);
    for (let k = 0; k < 9; k++) {
      const a = (k * Math.PI) / 8;
      add(
        `arch-${j}-top-${k}`,
        'ellipsoid',
        i.x + Math.cos(a) * 3,
        i.y + 5.8 + Math.sin(a) * 3,
        i.z - 2,
        0.48,
        0.48,
      );
    }
    if (i.biome === 'ruins')
      for (let k = 0; k < 6; k++) {
        const a = k * 1.05,
          h = 3 + (k % 3);
        add(
          `ruin-${k}`,
          'cylinder',
          i.x + Math.sin(a) * 8,
          i.y + 1.5,
          i.z + Math.cos(a) * 8,
          0.8,
          h / 2,
        );
      }
  }
  const castle = islands[5];
  add('castle-hall', 'box', castle.x, castle.y + 3, castle.z - 4, 4.5, 3, 2.5);
  add('castle-roof', 'box', castle.x, castle.y + 8.5, castle.z - 4, 5, 2.5, 5);
  for (const x of [-6, 6])
    for (const z of [-7, 0]) {
      add(`castle-tower-${x}-${z}`, 'cylinder', castle.x + x, castle.y + 5, castle.z + z, 1.8, 5);
      add(
        `castle-spire-${x}-${z}`,
        'cylinder',
        castle.x + x,
        castle.y + 12.5,
        castle.z + z,
        2.2,
        2.5,
      );
    }
  return solids;
}
/** Resolve a vertical player capsule against boxes, columns and rounded crowns.
 * Motion is substepped by the caller; the shallowest separating axis gives wall sliding. */
export function resolveSolid(position: Position3, velocity: Position3, solid: Solid): boolean {
  const centerY = position.y + PLAYER_HEIGHT / 2;
  const low = solid.y - solid.ry,
    high = solid.y + solid.ry;
  if (position.y >= high || position.y + PLAYER_HEIGHT <= low) return false;
  let rx = solid.rx,
    rz = solid.rz;
  if (solid.shape === 'ellipsoid') {
    const closestY = Math.max(position.y, Math.min(position.y + PLAYER_HEIGHT, solid.y));
    const section = Math.sqrt(Math.max(0, 1 - ((closestY - solid.y) / solid.ry) ** 2));
    rx *= section;
    rz *= section;
  }
  const dx = position.x - solid.x,
    dz = position.z - solid.z;
  let pushX = 0,
    pushZ = 0,
    depth = 0;
  if (solid.shape === 'box') {
    const nearX = Math.max(-rx, Math.min(rx, dx)),
      nearZ = Math.max(-rz, Math.min(rz, dz));
    const ox = dx - nearX,
      oz = dz - nearZ,
      d = Math.hypot(ox, oz);
    if (d >= PLAYER_RADIUS) return false;
    if (d > 0.00001) {
      depth = PLAYER_RADIUS - d;
      pushX = ox / d;
      pushZ = oz / d;
    } else if (rx - Math.abs(dx) < rz - Math.abs(dz)) {
      depth = rx - Math.abs(dx) + PLAYER_RADIUS;
      pushX = dx >= 0 ? 1 : -1;
    } else {
      depth = rz - Math.abs(dz) + PLAYER_RADIUS;
      pushZ = dz >= 0 ? 1 : -1;
    }
  } else {
    // An expanded ellipse gives stable normals even at the center of a column.
    const ex = rx + PLAYER_RADIUS,
      ez = rz + PLAYER_RADIUS,
      n = Math.hypot(dx / ex, dz / ez);
    if (n >= 1) return false;
    if (n < 0.00001) {
      pushX = 1;
      depth = ex;
    } else {
      const bx = dx / n,
        bz = dz / n;
      depth = Math.hypot(bx - dx, bz - dz);
      pushX = (bx - dx) / depth;
      pushZ = (bz - dz) / depth;
    }
  }
  const up = high - position.y,
    down = position.y + PLAYER_HEIGHT - low;
  if (up < depth && centerY > solid.y) {
    position.y = high;
    velocity.y = Math.max(0, velocity.y);
  } else if (down < depth && centerY < solid.y) {
    position.y = low - PLAYER_HEIGHT;
    velocity.y = Math.min(0, velocity.y);
  } else {
    position.x += pushX * (depth + 0.001);
    position.z += pushZ * (depth + 0.001);
    const inward = velocity.x * pushX + velocity.z * pushZ;
    if (inward < 0) {
      velocity.x -= inward * pushX;
      velocity.z -= inward * pushZ;
    }
  }
  return true;
}
/** Swept pickup against the pony's full body, rather than a point at its hooves. */
export function touchesPickup(
  from: Position3,
  to: Position3,
  item: Position3,
  radius = 1.7,
): boolean {
  // Sample the short motion segment; substeps are at most .12 m at dash speed.
  for (let j = 0; j <= 4; j++) {
    const t = j / 4,
      x = from.x + (to.x - from.x) * t,
      z = from.z + (to.z - from.z) * t,
      y = from.y + (to.y - from.y) * t;
    const nearestY = Math.max(y + 0.4, Math.min(y + PLAYER_HEIGHT, item.y));
    if (Math.hypot(item.x - x, item.y - nearestY, item.z - z) < PLAYER_RADIUS + radius) return true;
  }
  return false;
}
