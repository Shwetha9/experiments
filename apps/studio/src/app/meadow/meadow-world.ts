/** Deterministic simulation shared by the 3D renderer and gameplay tests. */
export interface Vec3 {
  x: number;
  y: number;
  z: number;
}
export interface SkyIsland extends Vec3 {
  name: string;
  radius: number;
  color: string;
  biome: 'meadow' | 'water' | 'forest' | 'ice' | 'ruins' | 'castle';
}
export const ISLANDS: SkyIsland[] = [
  { name: 'Moonbeam Meadow', x: 0, y: 0, z: 10, radius: 16, color: '#759e93', biome: 'meadow' },
  { name: 'Glitter Brook', x: -30, y: 4, z: -15, radius: 12, color: '#63a8a7', biome: 'water' },
  { name: 'Whispering Grove', x: 29, y: 7, z: -13, radius: 12, color: '#9490b4', biome: 'forest' },
  { name: 'Frosted Sky', x: -25, y: 14, z: -49, radius: 12, color: '#c5d7df', biome: 'ice' },
  { name: 'Starlight Ruins', x: 27, y: 18, z: -49, radius: 12, color: '#af94b5', biome: 'ruins' },
  { name: 'Moon Castle', x: 0, y: 24, z: -83, radius: 16, color: '#c6b4c1', biome: 'castle' },
  {
    name: 'Fernlight Sanctuary',
    x: -58,
    y: 9,
    z: -32,
    radius: 9,
    color: '#75a997',
    biome: 'forest',
  },
  { name: 'Apricot Orchard', x: 57, y: 11, z: -31, radius: 9, color: '#c2a688', biome: 'meadow' },
];
export const SHRINES = [
  {
    island: 1,
    title: 'Give the brook its voice',
    reward: 'The silver bell sings again.',
    clue: 'The river remembers a bell. Gather its three scattered notes.',
    icon: '♫',
  },
  {
    island: 2,
    title: 'Wake the sleeping grove',
    reward: 'The trees answer with a thousand lights.',
    clue: 'Three firefly stars can wake the forest lantern.',
    icon: '✧',
  },
  {
    island: 3,
    title: 'Bring the borrowed stars home',
    reward: 'A lantern glows for the little sky fox.',
    clue: 'The fox was afraid of the dark. Leave a light for her.',
    icon: '✦',
  },
  {
    island: 4,
    title: 'Rebuild the moonlight',
    reward: 'The last beacon opens the castle skyway.',
    clue: 'The ruins hold the last pieces of the Moonbeam Map.',
    icon: '◈',
  },
];
export interface Relic extends Vec3 {
  shrine: number;
}
export const RELICS: Relic[] = SHRINES.flatMap((s, shrine) => {
  const i = ISLANDS[s.island];
  return [
    { x: i.x - 5, y: i.y + 1.5, z: i.z + 4, shrine },
    { x: i.x + 5, y: i.y + 3, z: i.z, shrine },
    { x: i.x, y: i.y + 5, z: i.z - 6, shrine },
  ];
});
export const FLIGHT_GEM: Vec3 = { x: 0, y: 1.7, z: 3 };
export const RINGS: Vec3[] = [
  { x: 0, y: 7, z: -10 },
  { x: -14, y: 10, z: -18 },
  { x: -32, y: 13, z: -24 },
  { x: -41, y: 18, z: -37 },
  { x: -25, y: 23, z: -49 },
  { x: -5, y: 25, z: -51 },
  { x: 16, y: 27, z: -48 },
  { x: 22, y: 30, z: -65 },
  { x: 0, y: 31, z: -78 },
];
export const CURRENTS: Vec3[] = [
  { x: -14, y: 6, z: -5 },
  { x: 14, y: 9, z: -6 },
  { x: -28, y: 15, z: -32 },
  { x: 28, y: 20, z: -32 },
  { x: 0, y: 25, z: -65 },
];
export const WORLD_SAVE_KEY = 'moonbeam-meadow-sky-v1';
export interface WorldSave {
  friend?: string;
  gem: boolean;
  relics: number[];
  beacons: number[];
  visited: number[];
  checkpoint: number;
  completed: boolean;
  bestRace: number | null;
}
export interface WorldState {
  position: Vec3;
  velocity: Vec3;
  yaw: number;
  elapsed: number;
  stamina: number;
  grounded: boolean;
  gem: boolean;
  relics: Set<number>;
  beacons: Set<number>;
  visited: Set<number>;
  checkpoint: number;
  completed: boolean;
  bestRace: number | null;
  island: number;
  message: string;
  messageUntil: number;
  invincible: number;
  raceIndex: number;
  raceTime: number;
  event: 'gem' | 'relic' | 'beacon' | 'hurt' | 'ring' | 'finish' | null;
}
export interface WorldInput {
  forward: number;
  strafe: number;
  lift: boolean;
  descend: boolean;
  dash: boolean;
  interact: boolean;
  yaw: number;
}
export const distance = (a: Vec3, b: Vec3): number => Math.hypot(a.x - b.x, a.y - b.y, a.z - b.z);
export function readWorldSave(raw: string | null): WorldSave | null {
  try {
    const v = JSON.parse(raw ?? 'null');
    if (!v || !Array.isArray(v.relics) || !Array.isArray(v.beacons) || !Array.isArray(v.visited))
      return null;
    const ids = (values: unknown[], max: number): number[] => [
      ...new Set(
        values.filter((n): n is number => Number.isInteger(n) && Number(n) >= 0 && Number(n) < max),
      ),
    ];
    const relics = ids(v.relics, RELICS.length);
    const beacons = ids(v.beacons, 4).filter((n) =>
      RELICS.every((r, i) => r.shrine !== n || relics.includes(i)),
    );
    return {
      friend: ['Pippa', 'Clover', 'Miso'].includes(v.friend) ? v.friend : 'Pippa',
      gem: !!v.gem,
      relics,
      beacons,
      visited: ids(v.visited, ISLANDS.length),
      checkpoint: Number.isInteger(v.checkpoint) && ISLANDS[v.checkpoint] ? v.checkpoint : 0,
      completed: !!v.completed && beacons.length === 4,
      bestRace:
        typeof v.bestRace === 'number' && Number.isFinite(v.bestRace) && v.bestRace > 0
          ? v.bestRace
          : null,
    };
  } catch {
    return null;
  }
}
export function createWorld(save: WorldSave | null = null): WorldState {
  const checkpoint = save?.checkpoint ?? 0,
    i = ISLANDS[checkpoint];
  return {
    position: { x: i.x, y: i.y, z: i.z + 5 },
    velocity: { x: 0, y: 0, z: 0 },
    yaw: 0,
    elapsed: 0,
    stamina: 100,
    grounded: true,
    gem: save?.gem ?? false,
    relics: new Set(save?.relics),
    beacons: new Set(save?.beacons),
    visited: new Set([0, ...(save?.visited ?? [])]),
    checkpoint,
    completed: save?.completed ?? false,
    bestRace: save?.bestRace ?? null,
    island: checkpoint,
    message: save?.completed
      ? 'Welcome back. The sky is yours to explore.'
      : save?.gem
        ? 'Welcome back. Follow the compass, or find your own way through the sky.'
        : 'Walk toward the blue crystal. Your wings are waiting.',
    messageUntil: 8,
    invincible: 2,
    raceIndex: -1,
    raceTime: 0,
    event: null,
  };
}
export function worldSave(g: WorldState): WorldSave {
  return {
    gem: g.gem,
    relics: [...g.relics],
    beacons: [...g.beacons],
    visited: [...g.visited],
    checkpoint: g.checkpoint,
    completed: g.completed,
    bestRace: g.bestRace,
  };
}
function announce(g: WorldState, message: string): void {
  g.message = message;
  g.messageUntil = g.elapsed + 6;
}
export function returnToCheckpoint(g: WorldState): void {
  const i = ISLANDS[g.checkpoint];
  g.position = { x: i.x, y: i.y, z: i.z + 5 };
  g.velocity = { x: 0, y: 0, z: 0 };
  g.stamina = 100;
  g.invincible = 3;
  g.grounded = true;
  g.island = g.checkpoint;
  g.raceIndex = -1;
  g.raceTime = 0;
  announce(g, 'The meadow catches you. Your discoveries are safe.');
  g.event = 'hurt';
}
export function guardianPosition(index: number, time: number): Vec3 {
  const i = ISLANDS[index + 1],
    angle = time * (0.38 + index * 0.06) + index * 2;
  return {
    x: i.x + Math.cos(angle) * 8,
    y: i.y + 3.3 + Math.sin(time * 1.3 + index) * 1.5,
    z: i.z + Math.sin(angle) * 8,
  };
}
export function nextObjective(g: WorldState): { point: Vec3; label: string } {
  if (!g.gem) return { point: FLIGHT_GEM, label: 'Find the flight crystal' };
  if (g.beacons.size === 4)
    return {
      point: { ...ISLANDS[5], y: ISLANDS[5].y + 1 },
      label: g.completed ? 'The sky is yours' : 'Enter Moon Castle',
    };
  const shrine = SHRINES.findIndex((_, i) => !g.beacons.has(i));
  const missing = RELICS.findIndex((r, i) => r.shrine === shrine && !g.relics.has(i));
  return missing >= 0
    ? { point: RELICS[missing], label: SHRINES[shrine].title }
    : { point: ISLANDS[SHRINES[shrine].island], label: 'Land at the lantern · E to restore' };
}
export function stepWorld(g: WorldState, input: WorldInput, seconds: number): void {
  const dt = Math.min(0.04, Math.max(0, seconds));
  g.elapsed += dt;
  g.event = null;
  g.invincible = Math.max(0, g.invincible - dt);
  const p = g.position,
    oldY = p.y;
  const n = Math.max(1, Math.hypot(input.forward, input.strafe));
  const f = input.forward / n,
    s = input.strafe / n,
    speed = input.dash && g.gem && g.stamina > 2 ? 22 : g.grounded ? 8 : 12;
  const dx = (Math.sin(input.yaw) * f + Math.cos(input.yaw) * s) * speed,
    dz = (-Math.cos(input.yaw) * f + Math.sin(input.yaw) * s) * speed;
  const lerp = 1 - Math.exp(-dt * 7);
  g.velocity.x += (dx - g.velocity.x) * lerp;
  g.velocity.z += (dz - g.velocity.z) * lerp;
  p.x += g.velocity.x * dt;
  p.z += g.velocity.z * dt;
  if (Math.hypot(dx, dz) > 0.1) g.yaw = Math.atan2(-dx, -dz);
  const lift = g.gem && input.lift && g.stamina > 0;
  if (lift) {
    g.velocity.y = 7;
    g.stamina = Math.max(0, g.stamina - dt * 8);
    g.grounded = false;
  } else if (g.grounded && input.lift) {
    g.velocity.y = 7;
    g.grounded = false;
  } else
    g.velocity.y = Math.max(
      g.gem && !input.descend && g.stamina > 0 ? -2.5 : -15,
      g.velocity.y - dt * 16,
    );
  if (input.descend && !g.grounded) g.velocity.y = -9;
  if (!g.grounded && g.gem && !lift) g.stamina = Math.max(0, g.stamina - dt * 0.7);
  if (input.dash && g.gem && Math.hypot(f, s) > 0.1) g.stamina = Math.max(0, g.stamina - dt * 7);
  p.y = Math.min(43, p.y + g.velocity.y * dt);
  g.grounded = false;
  g.island = -1;
  for (let j = 0; j < ISLANDS.length; j++) {
    const i = ISLANDS[j];
    if (Math.hypot(p.x - i.x, p.z - i.z) < i.radius - 0.6) {
      if (oldY >= i.y - 0.3 && p.y <= i.y && g.velocity.y <= 0) {
        p.y = i.y;
        g.velocity.y = 0;
        g.grounded = true;
        g.island = j;
        g.stamina = Math.min(100, g.stamina + dt * 38);
        if (!g.visited.has(j)) {
          g.visited.add(j);
          announce(g, `Discovered ${i.name}. A new place to catch your breath.`);
        }
        g.checkpoint = j;
      } else if (p.y > i.y && p.y < i.y + 9) g.island = j;
    }
  }
  if (!g.gem && distance({ x: p.x, y: p.y + 1, z: p.z }, FLIGHT_GEM) < 2.5) {
    g.gem = true;
    g.stamina = 100;
    g.event = 'gem';
    announce(g, 'Your wings are awake! Hold Space to climb. Release to glide.');
  }
  RELICS.forEach((r, i) => {
    if (!g.relics.has(i) && distance({ x: p.x, y: p.y + 1, z: p.z }, r) < 2.8) {
      g.relics.add(i);
      g.event = 'relic';
      g.stamina = Math.min(100, g.stamina + 25);
      announce(
        g,
        `${SHRINES[r.shrine].icon} Starlight found. ${RELICS.filter((r2, j) => r2.shrine === r.shrine && g.relics.has(j)).length} of 3 for this lantern.`,
      );
    }
  });
  SHRINES.forEach((s, j) => {
    const i = ISLANDS[s.island];
    if (!g.beacons.has(j) && g.grounded && distance(p, i) < 4.5) {
      const ready = RELICS.every((r, k) => r.shrine !== j || g.relics.has(k));
      if (ready && input.interact) {
        g.beacons.add(j);
        g.event = 'beacon';
        announce(g, `${s.reward} ${g.beacons.size} of 4 lanterns restored.`);
      } else if (ready && g.messageUntil < g.elapsed)
        announce(g, 'All three stars are here. Press E to restore this lantern.');
      else if (!ready && g.messageUntil < g.elapsed) announce(g, s.clue);
    }
  });
  for (const c of CURRENTS) {
    if (Math.hypot(p.x - c.x, p.z - c.z) < 3.8 && p.y > c.y - 8 && p.y < c.y + 10 && g.gem) {
      g.stamina = Math.min(100, g.stamina + dt * 65);
      if (!input.descend) g.velocity.y = Math.max(g.velocity.y, 5);
    }
  }
  for (let j = 0; j < 4; j++) {
    if (
      !g.beacons.has(j) &&
      g.invincible <= 0 &&
      distance({ x: p.x, y: p.y + 1, z: p.z }, guardianPosition(j, g.elapsed)) < 1.6
    ) {
      returnToCheckpoint(g);
      return;
    }
  }
  if (p.y < -19 || Math.hypot(p.x, p.z) > 160) {
    returnToCheckpoint(g);
    return;
  }
  if (g.raceIndex >= 0) g.raceTime += dt;
  const ring = g.raceIndex < 0 ? 0 : g.raceIndex;
  if (distance({ x: p.x, y: p.y + 1, z: p.z }, RINGS[ring]) < 3.2) {
    if (g.raceIndex < 0) {
      g.raceIndex = 1;
      g.raceTime = 0;
      announce(g, 'Sky ribbon started! Follow the golden rings.');
    } else if (g.raceIndex === RINGS.length - 1) {
      const time = g.raceTime;
      g.bestRace = g.bestRace === null ? time : Math.min(g.bestRace, time);
      g.raceIndex = -1;
      announce(g, `Sky ribbon complete in ${time.toFixed(1)}s. Best: ${g.bestRace.toFixed(1)}s.`);
    } else g.raceIndex++;
    g.stamina = 100;
    g.event = 'ring';
  }
  if (!g.completed && g.beacons.size === 4 && g.grounded && distance(p, ISLANDS[5]) < 4.5) {
    g.completed = true;
    g.event = 'finish';
    announce(g, 'Every lantern is lit. The Moonbeam Map is whole. The sky is yours.');
  }
}
