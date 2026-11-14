import { createWorld, ISLANDS, SCENERY, SOLIDS, stepWorld, WorldInput } from './meadow-world';
import { PLAYER_RADIUS, resolveSolid, Solid, touchesPickup } from './meadow-collisions';
const idle: WorldInput = {
  forward: 0,
  strafe: 0,
  lift: false,
  descend: false,
  dash: false,
  interact: false,
  yaw: 0,
};
function move(g: ReturnType<typeof createWorld>, seconds: number, input: Partial<WorldInput>) {
  for (let t = 0; t < seconds; t += 0.02) stepWorld(g, { ...idle, ...input }, 0.02);
}

describe('Solid 3D world collisions', () => {
  it('blocks a running and dashing pony at real tree trunks', () => {
    const o = SCENERY.find((o) => o.kind === 'tree' && o.island === 0)!;
    const trunk = SOLIDS.find((s) => s.id === `tree-${SCENERY.indexOf(o)}-trunk`)!;
    for (const dash of [false, true]) {
      const g = createWorld();
      g.gem = true;
      g.position = { x: trunk.x, y: ISLANDS[0].y, z: trunk.z + 4 };
      move(g, 1, { forward: 1, dash });
      expect(g.position.z).toBeGreaterThan(trunk.z + trunk.rx + PLAYER_RADIUS - 0.01);
    }
  });
  it('slides along walls, stops at masonry, and passes through the arch opening', () => {
    const wall: Solid = { id: 'test-wall', shape: 'box', x: 0, y: 2, z: 0, rx: 3, ry: 2, rz: 0.5 };
    const p = { x: 1, y: 0, z: 1 },
      v = { x: 3, y: 0, z: -5 };
    expect(resolveSolid(p, v, wall)).toBeTrue();
    expect(p.z).toBeGreaterThan(1.49);
    expect(v.z).toBe(0);
    expect(v.x).toBe(3);
    const arch = SOLIDS.find((s) => s.id === 'arch-1-1')!,
      g = createWorld();
    g.gem = true;
    g.position = { x: arch.x, y: 4, z: arch.z + 4 };
    move(g, 1, { forward: 1, dash: true });
    expect(g.position.z).toBeGreaterThan(arch.z + arch.rx + PLAYER_RADIUS - 0.01);
    const opening = createWorld();
    opening.gem = true;
    opening.position = { x: ISLANDS[1].x, y: 4, z: ISLANDS[1].z - 1 };
    move(opening, 0.5, { forward: 1 });
    expect(opening.position.z).toBeLessThan(ISLANDS[1].z - 3);
  });
  it('allows flight above a solid tree but blocks entering its crown', () => {
    const tree = SOLIDS.find((s) => s.id.startsWith('tree-') && s.id.endsWith('-crown'))!;
    const velocity = { x: 0, y: 0, z: -10 },
      above = { x: tree.x, y: tree.y + tree.ry + 0.2, z: tree.z };
    expect(resolveSolid(above, velocity, tree)).toBeFalse();
    const inside = { x: tree.x, y: tree.y - 1, z: tree.z };
    expect(resolveSolid(inside, velocity, tree)).toBeTrue();
    expect(Math.hypot(inside.x - tree.x, inside.z - tree.z)).toBeGreaterThan(PLAYER_RADIUS);
  });
  it('blocks the castle wall and flying upward into an island underside', () => {
    const wall = SOLIDS.find((s) => s.id === 'castle-hall')!,
      g = createWorld();
    g.gem = true;
    g.checkpoint = 5;
    g.position = { x: wall.x, y: 24, z: wall.z + wall.rz + 3 };
    move(g, 1, { forward: 1, dash: true });
    expect(g.position.z).toBeGreaterThanOrEqual(wall.z + wall.rz + PLAYER_RADIUS - 0.01);
    const under = createWorld();
    under.gem = true;
    under.grounded = false;
    under.position = { x: 7, y: -7, z: 10 };
    move(under, 2, { lift: true });
    expect(under.position.y).toBeLessThan(-2.6);
  });
  it('uses the whole pony body for pickups and ignores objects well above or beside it', () => {
    const from = { x: 0, y: 0, z: 2 },
      to = { x: 0, y: 0, z: -2 };
    expect(touchesPickup(from, to, { x: 0, y: 3.1, z: 0 })).toBeTrue();
    expect(touchesPickup(from, to, { x: 6, y: 1, z: 0 })).toBeFalse();
    expect(touchesPickup(from, to, { x: 0, y: 7, z: 0 })).toBeFalse();
  });
});
