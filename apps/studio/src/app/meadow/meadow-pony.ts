import * as T from 'three';
import { LANTERN_REWARDS } from './meadow-world';

/** Smooth, articulated character with tapered hair strands and overlapping feather vanes. */
export class MeadowPony {
  readonly root = new T.Group();
  private readonly wings: T.Group[] = [];
  private readonly legs: T.Group[] = [];
  private readonly tail = new T.Group();
  private readonly crown = new T.Group();
  private readonly wingMeshes: T.Mesh[] = [];
  private readonly wingMaterial: T.MeshPhysicalMaterial;
  private readonly skin: T.MeshPhysicalMaterial;
  private activeReward: number | null = null;
  constructor(name: string) {
    const colors =
      name === 'Clover'
        ? ['#c5dfb1', '#267e86', '#50afb0', '#82ccd3']
        : name === 'Violete'
          ? ['#d6cef3', '#5e55a5', '#9388d1', '#b7ace4']
          : ['#f3c5ad', '#a45563', '#d1808b', '#e8a3a8'];
    this.skin = this.material(colors[0]);
    const muzzle = this.material(
      name === 'Clover' ? '#e6edcd' : name === 'Violete' ? '#ece4fa' : '#ffe0cd',
    );
    const hoof = this.material(
      name === 'Clover' ? '#4d7872' : name === 'Violete' ? '#73729d' : '#906d77',
      0.4,
    );
    const hair = this.material(colors[1], 0.38),
      highlight = this.material(colors[2], 0.4),
      light = this.material(colors[3], 0.45);
    this.wingMaterial = this.material(colors[0], 0.52);
    // Body and haunches blend into a compact, lifted chest; silhouettes stay rounded at all angles.
    this.ellipsoid(this.root, this.skin, [0, 1.28, 0.12], [0.61, 0.67, 0.99]);
    this.ellipsoid(this.root, this.skin, [0, 1.22, 0.65], [0.64, 0.64, 0.63]);
    this.ellipsoid(this.root, muzzle, [0, 1.1, -0.32], [0.5, 0.48, 0.61]);
    const neck = this.ellipsoid(this.root, this.skin, [0, 1.92, -0.59], [0.41, 0.73, 0.43]);
    neck.rotation.x = -0.28;
    this.ellipsoid(this.root, this.skin, [0, 2.5, -0.95], [0.5, 0.51, 0.58]);
    this.ellipsoid(this.root, muzzle, [0, 2.28, -1.36], [0.39, 0.3, 0.4]);
    // Rounded nostrils, smiling muzzle line, layered eyes with irises and two catchlights.
    for (const side of [-1, 1]) {
      this.ellipsoid(
        this.root,
        this.material('#9a737d'),
        [side * 0.2, 2.35, -1.69],
        [0.055, 0.035, 0.022],
      );
      const white = this.ellipsoid(
        this.root,
        this.material('#fffaf4'),
        [side * 0.434, 2.53, -1.08],
        [0.072, 0.193, 0.17],
      );
      white.rotation.y = side * 0.25;
      this.ellipsoid(
        this.root,
        this.material(name === 'Clover' ? '#438c86' : name === 'Violete' ? '#6f73ae' : '#8d6557'),
        [side * 0.49, 2.53, -1.128],
        [0.034, 0.14, 0.115],
      );
      this.ellipsoid(
        this.root,
        this.material('#243545'),
        [side * 0.515, 2.53, -1.148],
        [0.019, 0.105, 0.079],
      );
      this.ellipsoid(
        this.root,
        this.material('#ffffff'),
        [side * 0.535, 2.595, -1.18],
        [0.016, 0.037, 0.036],
      );
      this.ellipsoid(
        this.root,
        this.material('#ffffff'),
        [side * 0.535, 2.49, -1.122],
        [0.012, 0.017, 0.017],
      );
      this.strand(
        this.root,
        [
          [side * 0.43, 2.72, -1.21],
          [side * 0.48, 2.75, -1.09],
          [side * 0.45, 2.73, -0.96],
        ],
        0.023,
        this.material(colors[1]),
      );
      this.strand(
        this.root,
        [
          [side * 0.29, 2.16, -1.58],
          [side * 0.35, 2.135, -1.49],
          [side * 0.37, 2.18, -1.39],
        ],
        0.012,
        this.material('#b28c91'),
      );
      this.ear(side, this.skin, muzzle);
      for (const z of [-0.63, 0.68]) {
        const leg = new T.Group();
        leg.position.set(side * 0.41, 1.05, z);
        this.root.add(leg);
        this.legs.push(leg);
        const front = z < 0;
        this.ellipsoid(leg, this.skin, [0, -0.17, 0], [0.215, 0.4, 0.23]);
        this.ellipsoid(leg, this.skin, [0, -0.52, front ? 0.035 : 0.12], [0.15, 0.25, 0.16]);
        this.ellipsoid(leg, muzzle, [0, -0.75, front ? -0.02 : 0.08], [0.14, 0.24, 0.145]);
        this.ellipsoid(leg, hoof, [0, -0.95, front ? -0.09 : 0.025], [0.195, 0.13, 0.25]);
        this.ellipsoid(
          leg,
          light,
          [side * 0.04, -0.915, front ? -0.245 : -0.13],
          [0.07, 0.035, 0.025],
        );
      }
      const wing = new T.Group();
      wing.position.set(side * 0.47, 1.58, 0.05);
      this.root.add(wing);
      this.wings.push(wing);
      const shoulder = this.ellipsoid(
        wing,
        this.wingMaterial,
        [side * 0.27, 0.06, 0.06],
        [0.48, 0.23, 0.52],
      );
      this.wingMeshes.push(shoulder);
      for (let j = 0; j < 7; j++) {
        const feather = this.feather(wing, side, j, this.wingMaterial);
        this.wingMeshes.push(feather);
      }
      for (let j = 0; j < 5; j++) {
        const covert = this.ellipsoid(
          wing,
          muzzle,
          [side * (0.26 + j * 0.14), 0.14, 0.02 + j * 0.13],
          [0.38, 0.105, 0.14],
        );
        covert.rotation.y = side * (-0.28 + j * 0.11);
      }
    }
    // A gently curved horn has a continuous spiral, instead of an untextured cone.
    const gold = this.material('#eac88b', 0.32, 0.35);
    const horn = new T.Mesh(new T.ConeGeometry(0.13, 0.82, 24), gold);
    horn.position.set(0, 3.13, -1.12);
    horn.rotation.x = -0.22;
    this.root.add(horn);
    const spiral: number[][] = [];
    for (let j = 0; j <= 90; j++) {
      const h = j / 90,
        r = 0.127 * (1 - h);
      spiral.push([
        Math.cos(h * Math.PI * 7) * r,
        2.73 + h * 0.79,
        -1.04 - h * 0.17 + Math.sin(h * Math.PI * 7) * r,
      ]);
    }
    this.strand(this.root, spiral, 0.015, this.material('#fff1cd', 0.26, 0.2));
    // Forelock and mane use continuous, tapered spline geometry with contrasting hair ribbons.
    const forelock = [
      [0.12, 2.91, -0.86],
      [-0.1, 3.03, -1.04],
      [-0.36, 2.84, -1.27],
      [-0.27, 2.59, -1.32],
      [-0.37, 2.49, -1.14],
    ];
    this.strand(this.root, forelock, 0.2, hair);
    this.strand(
      this.root,
      forelock.map(([x, y, z]) => [x - 0.045, y + 0.055, z - 0.055]),
      0.065,
      highlight,
    );
    for (let j = 0; j < 8; j++) {
      const side = j < 5 ? -1 : 1,
        k = j < 5 ? j : j - 5;
      const path = [
        [side * 0.1, 2.85, -0.65],
        [side * (0.3 + k * 0.035), 2.67, -0.43],
        [side * (0.38 + k * 0.045), 2.24, -0.2],
        [side * (0.3 + k * 0.055), 1.85, 0.04],
        [side * (0.48 + k * 0.03), 1.51, 0.27],
        [side * (0.3 + k * 0.04), 1.27, 0.42],
      ];
      this.strand(this.root, path, 0.16 - k * 0.012, j % 3 === 0 ? highlight : hair);
      if (j % 2 === 0)
        this.strand(
          this.root,
          path.map(([x, y, z]) => [x + side * 0.045, y + 0.015, z + 0.035]),
          0.023,
          light,
        );
    }
    this.tail.position.set(0, 1.46, 1);
    this.root.add(this.tail);
    for (let j = 0; j < 8; j++) {
      const offset = (j - 3.5) * 0.045;
      this.strand(
        this.tail,
        [
          [offset, 0, 0],
          [offset + 0.1, 0.2, 0.42],
          [offset + 0.26, -0.06, 0.84],
          [offset + 0.34, -0.5, 0.98],
          [offset + 0.15, -0.94, 1.02],
          [offset - 0.15, -1.07, 0.82],
        ],
        0.22 - j * 0.012,
        j % 3 === 0 ? highlight : hair,
      );
    }
    // Crown is a tangible, equippable reward.
    this.crown.position.set(0, 2.93, -0.9);
    this.root.add(this.crown);
    const rim = new T.Mesh(new T.TorusGeometry(0.4, 0.045, 8, 36), gold);
    rim.rotation.x = Math.PI / 2;
    this.crown.add(rim);
    for (let j = 0; j < 7; j++) {
      const a = (j * Math.PI * 2) / 7;
      const point = new T.Mesh(new T.ConeGeometry(0.085, 0.3, 8), gold);
      point.position.set(Math.cos(a) * 0.37, 0.12, Math.sin(a) * 0.37);
      this.crown.add(point);
    }
    this.crown.visible = false;
  }
  private material(color: string, roughness = 0.65, metalness = 0): T.MeshPhysicalMaterial {
    return new T.MeshPhysicalMaterial({
      color,
      roughness,
      metalness,
      clearcoat: 0.16,
      clearcoatRoughness: 0.45,
    });
  }
  private ellipsoid(parent: T.Object3D, material: T.Material, p: number[], s: number[]): T.Mesh {
    const mesh = new T.Mesh(new T.SphereGeometry(1, 24, 16), material);
    mesh.position.set(p[0], p[1], p[2]);
    mesh.scale.set(s[0], s[1], s[2]);
    parent.add(mesh);
    return mesh;
  }
  private ear(side: number, skin: T.Material, inner: T.Material): void {
    const group = new T.Group();
    group.position.set(side * 0.33, 2.85, -0.67);
    group.rotation.z = -side * 0.27;
    this.root.add(group);
    const ear = this.ellipsoid(group, skin, [0, 0.18, 0], [0.15, 0.28, 0.12]);
    ear.rotation.x = -0.13;
    this.ellipsoid(group, inner, [0, 0.18, -0.092], [0.095, 0.18, 0.035]);
  }
  private strand(
    parent: T.Object3D,
    points: number[][],
    radius: number,
    material: T.Material,
  ): T.Mesh {
    const curve = new T.CatmullRomCurve3(points.map((p) => new T.Vector3(p[0], p[1], p[2]))),
      segments = Math.max(18, points.length * 6),
      sides = 10,
      frames = curve.computeFrenetFrames(segments, false),
      positions: number[] = [],
      indices: number[] = [];
    for (let j = 0; j <= segments; j++) {
      const t = j / segments,
        point = curve.getPointAt(t),
        r = radius * Math.max(0.035, Math.sin(Math.PI * (0.13 + t * 0.87)) ** 0.65);
      for (let k = 0; k <= sides; k++) {
        const angle = (k * Math.PI * 2) / sides,
          v = point
            .clone()
            .addScaledVector(frames.normals[j], Math.cos(angle) * r)
            .addScaledVector(frames.binormals[j], Math.sin(angle) * r);
        positions.push(v.x, v.y, v.z);
        if (j < segments && k < sides) {
          const a = j * (sides + 1) + k,
            b = a + sides + 1;
          indices.push(a, b, a + 1, b, b + 1, a + 1);
        }
      }
    }
    const geometry = new T.BufferGeometry();

    const startIndex = positions.length / 3,
      endIndex = startIndex + 1;
    const start = curve.getPointAt(0),
      end = curve.getPointAt(1);
    positions.push(start.x, start.y, start.z, end.x, end.y, end.z);
    for (let k = 0; k < sides; k++) {
      indices.push(startIndex, k + 1, k);
      const last = segments * (sides + 1);
      indices.push(endIndex, last + k, last + k + 1);
    }
    geometry.setAttribute('position', new T.Float32BufferAttribute(positions, 3));
    geometry.setIndex(indices);
    geometry.computeVertexNormals();
    const mesh = new T.Mesh(geometry, material);
    parent.add(mesh);
    return mesh;
  }
  private feather(parent: T.Object3D, side: number, index: number, material: T.Material): T.Mesh {
    const length = 1.55 - index * 0.09;
    const mesh = this.ellipsoid(
      parent,
      material,
      [side * (0.5 + index * 0.13), -0.015, 0.08 + index * 0.15],
      [length / 2, 0.075, 0.16],
    );
    mesh.rotation.y = side * (-0.3 + index * 0.13);
    mesh.rotation.z = side * (0.08 + index * 0.018);
    return mesh;
  }
  update(time: number, speed: number, grounded: boolean, reward: number | null): void {
    this.wings.forEach((wing, i) => {
      const side = i === 0 ? -1 : 1;
      wing.rotation.z = side * (grounded ? -0.25 : Math.sin(time * 7) * 0.48 + 0.1);
      wing.scale.x = grounded ? 0.65 : 1;
      wing.rotation.y = side * (grounded ? -0.9 : 0);
    });
    this.legs.forEach(
      (leg, i) =>
        (leg.rotation.x = grounded
          ? Math.sin(time * 9 + (i === 0 || i === 3 ? 0 : Math.PI)) * Math.min(0.38, speed * 0.045)
          : 0.22 + (i % 2) * 0.12),
    );
    this.tail.rotation.z = Math.sin(time * 2) * 0.09;
    this.tail.rotation.x = Math.sin(time * 2.8) * 0.06;
    if (reward !== this.activeReward) {
      this.activeReward = reward;
      this.wingMaterial.color.copy(this.skin.color);
      if (reward !== null && reward < 3) this.wingMaterial.color.set(LANTERN_REWARDS[reward].color);
      this.crown.visible = reward === 3;
    }
  }
}
