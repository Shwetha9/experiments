import {
  CAMERA_FOV,
  CHARACTER_SCALE,
  clipCamera,
  DEFAULT_CAMERA_DISTANCE,
  followRig,
  safeFollowCamera,
} from './meadow-camera';
import { Solid } from './meadow-collisions';
import { PerspectiveCamera, Vector3 } from 'three';

describe('Exploration camera', () => {
  it('keeps the pony below a fifth of the screen in an unobstructed default view', () => {
    for (const aspect of [16 / 9, 1, 390 / 844]) {
      const rig = followRig({ x: 0, y: 0, z: 0 }, 0, 0.24, DEFAULT_CAMERA_DISTANCE, aspect),
        camera = new PerspectiveCamera(CAMERA_FOV, aspect, 0.1, 650);
      camera.position.set(rig.camera.x, rig.camera.y, rig.camera.z);
      camera.lookAt(rig.target.x, rig.target.y, rig.target.z);
      camera.updateMatrixWorld();
      const head = new Vector3(0, 3.54 * CHARACTER_SCALE, 0).project(camera),
        feet = new Vector3(0, 0, 0).project(camera),
        fraction = Math.abs(head.y - feet.y) / 2;
      expect(fraction).withContext(`aspect ${aspect}`).toBeLessThan(0.2);
      expect(fraction).toBeGreaterThan(0.08);
    }
  });
  it('retracts the camera before walls, trunks and foliage instead of entering them', () => {
    for (const shape of ['box', 'cylinder', 'ellipsoid'] as const) {
      const obstacle: Solid = {
        id: 'camera-obstacle',
        shape,
        x: 0,
        y: 2,
        z: 5,
        rx: 1,
        ry: 3,
        rz: 1,
      };
      const safe = clipCamera({ x: 0, y: 2, z: 0 }, { x: 0, y: 2, z: 10 }, [obstacle]);
      expect(safe.z).toBeLessThan(3.8);
      expect(safe.z).toBeGreaterThan(3);
    }
  });
  it('keeps a useful view when a lantern stands between the player and the camera', () => {
    const position = { x: 0, y: 0, z: -2 },
      rig = followRig(position, 0, 0.24, 17, 1);
    const lamp: Solid = {
      id: 'lantern',
      shape: 'cylinder',
      x: 0,
      y: 1.95,
      z: 0,
      rx: 0.85,
      ry: 1.95,
      rz: 0.85,
    };
    const safe = safeFollowCamera(position, rig.camera, 0, [lamp]);
    expect(
      Math.hypot(safe.x - position.x, safe.y - position.y - 1.45, safe.z - position.z),
    ).toBeGreaterThan(9);
    const clipped = clipCamera({ ...position, y: 1.45 }, safe, [lamp]);
    expect(clipped.x).toBeCloseTo(safe.x, 5);
    expect(clipped.z).toBeCloseTo(safe.z, 5);
  });
  it('does not shorten a boom that passes above or beside a wall', () => {
    const obstacle: Solid = { id: 'wall', shape: 'box', x: 0, y: 0, z: 5, rx: 1, ry: 1, rz: 1 };
    expect(clipCamera({ x: 0, y: 3, z: 0 }, { x: 0, y: 3, z: 10 }, [obstacle]).z).toBe(10);
    expect(clipCamera({ x: 3, y: 0, z: 0 }, { x: 3, y: 0, z: 10 }, [obstacle]).z).toBe(10);
  });
});
