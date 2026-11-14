import {
  createWorld,
  claimReward,
  equipReward,
  score,
  pickupPosition,
  FLIGHT_GEM,
  ISLANDS,
  readWorldSave,
  RELICS,
  returnToCheckpoint,
  RINGS,
  SHRINES,
  stepWorld,
  Vec3,
  WorldInput,
  WorldState,
  worldSave,
} from './meadow-world';

const idle: WorldInput = {
  forward: 0,
  strafe: 0,
  lift: false,
  descend: false,
  dash: false,
  interact: false,
  yaw: 0,
};
function advance(g: WorldState, seconds: number, input: Partial<WorldInput> = {}): void {
  for (let t = 0; t < seconds; t += 0.02) stepWorld(g, { ...idle, ...input }, 0.02);
}
/** Steer using the same continuous controls a player has, without teleporting. */
function flyTo(g: WorldState, target: Vec3, land = false): boolean {
  for (let frame = 0; frame < 2200; frame++) {
    const dx = target.x - g.position.x,
      dz = target.z - g.position.z,
      h = Math.hypot(dx, dz);
    // Climb above the landing surface before crossing the void, then descend at the target.
    const height = h > 4 ? Math.max(target.y + 11, ISLANDS[g.checkpoint].y + 11) : target.y;
    const lift = g.position.y < height - 0.3;
    stepWorld(
      g,
      {
        ...idle,
        forward: h > 1 ? Math.min(1, h * 0.3) : 0,
        yaw: Math.atan2(dx, -dz),
        lift,
        descend: h < 2 && g.position.y > height + 1,
      },
      0.02,
    );
    if (h < 2 && Math.abs(g.position.y - target.y) < 1.1 && (!land || g.grounded)) return true;
  }
  return false;
}

describe('Skybound expedition', () => {
  it('starts on a real island and unlocks flight only at the crystal', () => {
    const g = createWorld();
    advance(g, 0.5, { lift: true });
    expect(g.gem).toBeFalse();
    expect(g.position.y).toBeLessThan(4);
    const fresh = createWorld();
    advance(fresh, 1.6, { forward: 1 });
    expect(fresh.gem).toBeTrue();
    const y = fresh.position.y;
    advance(fresh, 1, { lift: true });
    expect(fresh.position.y).toBeGreaterThan(y + 5);
    expect(fresh.stamina).toBeLessThan(100);
  });
  it('normalizes diagonal movement and clamps long frame delays', () => {
    const a = createWorld(),
      b = createWorld();
    advance(a, 1, { forward: 1 });
    advance(b, 1, { forward: 1, strafe: 1 });
    expect(Math.hypot(a.position.x, a.position.z - 15)).toBeCloseTo(
      Math.hypot(b.position.x, b.position.z - 15),
      3,
    );
    const c = createWorld();
    stepWorld(c, { ...idle, forward: 1 }, 60);
    expect(c.elapsed).toBe(0.04);
    expect(c.position.z).toBeGreaterThan(14);
  });
  it('requires all three local stars and an interaction at each lantern', () => {
    const g = createWorld();
    const i = ISLANDS[1];
    g.position = { x: i.x, y: i.y, z: i.z };
    advance(g, 0.04, { interact: true });
    expect(g.beacons.size).toBe(0);
    g.relics = new Set([0, 1, 2]);
    advance(g, 0.04);
    expect(g.beacons.size).toBe(0);
    advance(g, 0.04, { interact: true });
    expect(g.beacons.has(0)).toBeTrue();
  });
  it('can complete every restoration and reach the castle using flight controls', () => {
    const g = createWorld();
    advance(g, 1.6, { forward: 1 });
    expect(g.gem).toBeTrue();
    for (let shrine = 0; shrine < SHRINES.length; shrine++) {
      const island = ISLANDS[SHRINES[shrine].island];
      expect(flyTo(g, { x: island.x, y: island.y, z: island.z + 4 }, true))
        .withContext(`land on ${island.name}`)
        .toBeTrue();
      for (let r = 0; r < RELICS.length; r++)
        if (RELICS[r].shrine === shrine) {
          expect(flyTo(g, { ...RELICS[r], y: RELICS[r].y - 1 }))
            .withContext(`fly to star ${r}`)
            .toBeTrue();
          expect(g.relics.has(r)).withContext(`collect star ${r}`).toBeTrue();
        }
      expect(flyTo(g, { ...island, z: island.z + 3 }, true))
        .withContext(`return to ${island.name} lantern`)
        .toBeTrue();
      advance(g, 0.1, { interact: true });
      expect(g.beacons.has(shrine)).withContext(`restore lantern ${shrine}`).toBeTrue();
    }
    for (const side of [7, 6])
      expect(flyTo(g, ISLANDS[side], true))
        .withContext(`visit ${ISLANDS[side].name}`)
        .toBeTrue();
    expect(flyTo(g, { ...ISLANDS[5], z: ISLANDS[5].z + 3 }, true)).toBeTrue();
    advance(g, 0.1);
    expect(g.completed).toBeTrue();
    expect(g.relics.size).toBe(12);
    expect(g.visited.size).toBe(8);
  });
  it('returns to a checkpoint without losing discoveries and recharges on landing', () => {
    const g = createWorld();
    g.gem = true;
    g.relics.add(3);
    g.checkpoint = 2;
    g.stamina = 0;
    g.position.y = -22;
    stepWorld(g, idle, 0.02);
    expect(g.position.y).toBe(ISLANDS[2].y);
    expect(g.relics.has(3)).toBeTrue();
    expect(g.stamina).toBe(100);
    g.stamina = 10;
    advance(g, 1);
    expect(g.stamina).toBeGreaterThan(40);
  });
  it('has a separate ordered ring race that never gates the story', () => {
    const g = createWorld();
    g.gem = true;
    for (let r = 0; r < RINGS.length; r++) {
      g.position = { ...RINGS[r], y: RINGS[r].y - 1 };
      stepWorld(g, idle, 0.02);
      if (r < RINGS.length - 1) expect(g.raceIndex).toBe(r + 1);
    }
    expect(g.bestRace).not.toBeNull();
    expect(g.raceIndex).toBe(-1);
    expect(g.beacons.size).toBe(0);
  });
  it('collects visible diamonds at head height while walking or dashing, exactly once', () => {
    for (const dash of [false, true]) {
      const g = createWorld();
      g.gem = true;
      g.checkpoint = 1;
      g.visited.add(1);
      g.position = { x: RELICS[1].x, y: ISLANDS[1].y, z: RELICS[1].z + 4 };
      const before = score(g);
      advance(g, 0.8, { forward: 1, dash });
      expect(g.relics.has(1)).withContext(`dash ${dash}`).toBeTrue();
      expect(score(g)).toBe(before + 50);
      expect(g.feedback?.points).toBe(50);
      const earned = score(g);
      advance(g, 0.1);
      expect(score(g)).toBe(earned);
    }
  });
  it('awards points and claimable, persistent cosmetics without duplicate claims', () => {
    const g = createWorld();
    g.gem = true;
    g.relics = new Set([0, 1, 2]);
    const i = ISLANDS[1];
    g.position = { x: i.x, y: i.y, z: i.z + 3 };
    const before = score(g);
    advance(g, 0.04, { interact: true });
    expect(g.beacons.has(0)).toBeTrue();
    expect(score(g)).toBeGreaterThanOrEqual(before + 250);
    expect(claimReward(g, 1)).toBeFalse();
    const earned = score(g);
    expect(claimReward(g, 0)).toBeTrue();
    expect(score(g)).toBe(earned + 100);
    expect(g.equippedReward).toBe(0);
    expect(claimReward(g, 0)).toBeFalse();
    expect(score(g)).toBe(earned + 100);
    equipReward(g, 0);
    expect(g.equippedReward).toBeNull();
    equipReward(g, 0);
    const restored = createWorld(readWorldSave(JSON.stringify(worldSave(g))));
    expect(restored.claimedRewards.has(0)).toBeTrue();
    expect(restored.equippedReward).toBe(0);
    expect(score(restored)).toBe(score(g));
  });
  it('validates browser saves and restores safe island checkpoints', () => {
    const g = createWorld();
    g.gem = true;
    g.checkpoint = 3;
    g.visited.add(3);
    g.relics = new Set([0, 1, 2]);
    g.beacons.add(0);
    const restored = createWorld(readWorldSave(JSON.stringify(worldSave(g))));
    expect(restored.position.y).toBe(ISLANDS[3].y);
    expect(restored.beacons.has(0)).toBeTrue();
    expect(readWorldSave('{broken')).toBeNull();
    expect(readWorldSave(JSON.stringify({ ...worldSave(g), friend: 'Clover' }))?.friend).toBe(
      'Clover',
    );
    const duplicates = readWorldSave(
      JSON.stringify({ ...worldSave(g), beacons: [0, 0, 0, 0], completed: true }),
    );
    expect(duplicates?.completed).toBeFalse();
    const unsafe = readWorldSave(
      JSON.stringify({
        gem: true,
        relics: [-1, 999],
        beacons: [1],
        visited: [10],
        checkpoint: 999,
        completed: true,
        bestRace: -1,
      }),
    );
    expect(unsafe?.checkpoint).toBe(0);
    expect(unsafe?.beacons).toEqual([]);
    expect(unsafe?.completed).toBeFalse();
    expect(unsafe?.bestRace).toBeNull();
  });
});
