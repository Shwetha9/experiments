import {
  CHARACTER_SCALE,
  DEFAULT_CAMERA_DISTANCE,
  CAMERA_FOV,
  followRig,
  safeFollowCamera,
  clipCamera,
} from './meadow-camera';
import { MeadowPony } from './meadow-pony';
import { rockHeight } from './meadow-collisions';
import * as T from 'three';
import {
  CURRENTS,
  SCENERY,
  SOLIDS,
  pickupPosition,
  LANTERN_REWARDS,
  FLIGHT_GEM,
  guardianPosition,
  ISLANDS,
  RELICS,
  RINGS,
  SHRINES,
  WorldState,
} from './meadow-world';

/** A procedural diorama: all scenery and the articulated unicorn are real 3D geometry. */
export class MeadowScene {
  readonly renderer: T.WebGLRenderer;
  private readonly scene = new T.Scene();
  private readonly camera = new T.PerspectiveCamera(CAMERA_FOV, 16 / 9, 0.1, 650);
  private readonly pony: T.Group;
  private readonly character: MeadowPony;
  private readonly burst = new T.Group();
  private wasAttract = true;
  private feedbackId = 0;
  private burstAt = -100;
  private readonly pickupLabels: T.Sprite[] = [];
  private readonly relics: T.Mesh[] = [];
  private readonly rings: T.Mesh[] = [];
  private readonly beacons: T.Group[] = [];
  private readonly guardians: T.Group[] = [];
  private readonly currents: T.Group[] = [];
  private readonly clouds: T.Group[] = [];
  private readonly materials = new Map<string, T.MeshStandardMaterial>();
  private readonly gem: T.Group;
  private readonly trail: T.Points;
  private readonly target = new T.Vector3();
  private readonly cameraPosition = new T.Vector3();
  private readonly shadow: T.Mesh;
  private castlePortal?: T.Group;
  private time = 0;
  private seed = 819;
  private width = 0;
  private height = 0;
  private reducedMotion = matchMedia('(prefers-reduced-motion: reduce)').matches;

  constructor(canvas: HTMLCanvasElement, name: string) {
    this.renderer = new T.WebGLRenderer({
      canvas,
      antialias: true,
      alpha: false,
      powerPreference: 'high-performance',
    });
    this.renderer.setPixelRatio(Math.min(devicePixelRatio, 1.5));
    this.renderer.outputColorSpace = T.SRGBColorSpace;
    this.renderer.toneMapping = T.ACESFilmicToneMapping;
    this.renderer.toneMappingExposure = 1.15;
    this.scene.fog = new T.FogExp2('#b0a6c7', 0.0035);
    this.scene.add(new T.HemisphereLight('#d5e7ff', '#635072', 2.5));
    const sun = new T.DirectionalLight('#ffe0c5', 3.5);
    sun.position.set(-30, 70, 45);
    this.scene.add(sun);
    const rim = new T.DirectionalLight('#9bd9df', 2);
    rim.position.set(20, 20, -60);
    this.scene.add(rim);
    this.makeSky();
    ISLANDS.forEach((island, j) => this.makeIsland(j));
    this.character = new MeadowPony(name);
    this.pony = this.character.root;
    this.pony.scale.setScalar(CHARACTER_SCALE);
    this.scene.add(this.pony);
    for (let j = 0; j < 16; j++)
      this.mesh(this.burst, new T.OctahedronGeometry(0.09), '#ffe7a8', 0, 0, 0).material =
        new T.MeshBasicMaterial({ color: '#ffe7a8' });
    this.scene.add(this.burst);
    this.shadow = new T.Mesh(
      new T.CircleGeometry(1.4, 24),
      new T.MeshBasicMaterial({
        color: '#292b4e',
        transparent: true,
        opacity: 0.2,
        depthWrite: false,
      }),
    );
    this.shadow.rotation.x = -Math.PI / 2;
    this.scene.add(this.shadow);
    RELICS.forEach((r, j) => {
      const gem = new T.Mesh(
        new T.OctahedronGeometry(0.65),
        new T.MeshStandardMaterial({
          color: '#ffe9ad',
          emissive: '#f1b95f',
          emissiveIntensity: 1.4,
          metalness: 0.2,
          roughness: 0.2,
        }),
      );
      gem.position.set(r.x, r.y, r.z);
      this.scene.add(gem);
      this.relics.push(gem);
      this.glow(gem, '#ffeab5', 3.5);
      this.pickupLabels.push(this.label(gem, '◆ +50', 1.3));
    });
    this.gem = new T.Group();
    this.gem.position.set(FLIGHT_GEM.x, FLIGHT_GEM.y, FLIGHT_GEM.z);
    this.mesh(this.gem, new T.OctahedronGeometry(0.85), '#8be5f5', 0, 0, 0).material =
      new T.MeshStandardMaterial({
        color: '#a3efff',
        emissive: '#5cb9f8',
        emissiveIntensity: 1.8,
        metalness: 0.3,
        roughness: 0.15,
      });
    this.glow(this.gem, '#8deaff', 6);
    this.label(this.gem, 'FLIGHT · +100', 1.5);
    this.scene.add(this.gem);
    RINGS.forEach((r, i) => {
      const ring = new T.Mesh(
        new T.TorusGeometry(2.7, 0.09, 6, 48),
        new T.MeshStandardMaterial({
          color: '#ffe6ae',
          emissive: '#e3b773',
          emissiveIntensity: 0.6,
          transparent: true,
          opacity: 0.7,
        }),
      );
      ring.position.set(r.x, r.y, r.z);
      const next = RINGS[Math.min(i + 1, RINGS.length - 1)];
      ring.lookAt(next.x, next.y, next.z - 1);
      this.scene.add(ring);
      this.rings.push(ring);
    });
    CURRENTS.forEach((p) => {
      const group = new T.Group();
      group.position.set(p.x, p.y, p.z);
      for (let j = 0; j < 6; j++) {
        const ring = this.mesh(
          group,
          new T.TorusGeometry(2.3 - j * 0.12, 0.025, 3, 32),
          '#b4f6f2',
          0,
          j * 1.5 - 4,
          0,
        );
        ring.rotation.x = Math.PI / 2;
        ring.material = new T.MeshBasicMaterial({
          color: '#b6e9ec',
          transparent: true,
          opacity: 0.22,
        });
      }
      this.scene.add(group);
      this.currents.push(group);
    });
    for (let j = 0; j < 4; j++) {
      const ghost = new T.Group();
      this.sphere(ghost, '#665182', 0, 0, 0, 0.6, 0.75, 0.6);
      this.sphere(ghost, '#fff7cb', -0.21, 0.18, -0.5, 0.09, 0.09, 0.06);
      this.sphere(ghost, '#fff7cb', 0.21, 0.18, -0.5, 0.09, 0.09, 0.06);
      this.glow(ghost, '#c3a7ed', 3);
      this.scene.add(ghost);
      this.guardians.push(ghost);
    }
    const positions = new Float32Array(50 * 3);
    positions.fill(-1000);
    const geometry = new T.BufferGeometry();
    geometry.setAttribute('position', new T.BufferAttribute(positions, 3));
    this.trail = new T.Points(
      geometry,
      new T.PointsMaterial({
        color: '#f9ddc4',
        size: 0.14,
        transparent: true,
        opacity: 0.7,
        depthWrite: false,
      }),
    );
    this.trail.frustumCulled = false;
    this.scene.add(this.trail);
    this.camera.position.set(0, 8, 28);
    this.camera.lookAt(0, 2, 7);
  }
  private random(): number {
    this.seed = (Math.imul(this.seed, 1664525) + 1013904223) | 0;
    return (this.seed >>> 0) / 4294967296;
  }
  private material(color: string): T.MeshStandardMaterial {
    let m = this.materials.get(color);
    if (!m) {
      m = new T.MeshStandardMaterial({ color, roughness: 0.88, flatShading: true });
      this.materials.set(color, m);
    }
    return m;
  }
  private mesh(
    parent: T.Object3D,
    geometry: T.BufferGeometry,
    color: string,
    x: number,
    y: number,
    z: number,
  ): T.Mesh {
    const m = new T.Mesh(geometry, this.material(color));
    m.position.set(x, y, z);
    parent.add(m);
    return m;
  }
  private sphere(
    parent: T.Object3D,
    color: string,
    x: number,
    y: number,
    z: number,
    sx: number,
    sy = sx,
    sz = sx,
  ): T.Mesh {
    const m = this.mesh(parent, new T.IcosahedronGeometry(1, 1), color, x, y, z);
    m.scale.set(sx, sy, sz);
    return m;
  }
  private glow(parent: T.Object3D, color: string, size: number): void {
    const c = document.createElement('canvas');
    c.width = c.height = 64;
    const ctx = c.getContext('2d')!;
    const gradient = ctx.createRadialGradient(32, 32, 0, 32, 32, 32);
    gradient.addColorStop(0, color + '90');
    gradient.addColorStop(0.25, color + '35');
    gradient.addColorStop(1, color + '00');
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, 64, 64);
    const texture = new T.CanvasTexture(c);
    const sprite = new T.Sprite(
      new T.SpriteMaterial({
        map: texture,
        transparent: true,
        depthWrite: false,
        blending: T.AdditiveBlending,
      }),
    );
    sprite.scale.set(size, size, 1);
    parent.add(sprite);
  }
  private label(parent: T.Object3D, text: string, y: number): T.Sprite {
    const c = document.createElement('canvas');
    c.width = 256;
    c.height = 64;
    const ctx = c.getContext('2d')!;
    ctx.fillStyle = '#213247dd';
    ctx.beginPath();
    ctx.roundRect(10, 7, 236, 50, 14);
    ctx.fill();
    ctx.font = 'bold 24px sans-serif';
    ctx.fillStyle = '#ffe5ac';
    ctx.textAlign = 'center';
    ctx.fillText(text, 128, 40);
    const sprite = new T.Sprite(
      new T.SpriteMaterial({ map: new T.CanvasTexture(c), transparent: true, depthWrite: false }),
    );
    sprite.position.y = y;
    sprite.scale.set(3.5, 0.875, 1);
    parent.add(sprite);
    return sprite;
  }
  private makeSky(): void {
    const sky = new T.Mesh(
      new T.SphereGeometry(400, 24, 16),
      new T.ShaderMaterial({
        side: T.BackSide,
        depthWrite: false,
        uniforms: {
          top: { value: new T.Color('#17263f') },
          bottom: { value: new T.Color('#e8b7b0') },
        },
        vertexShader:
          'varying vec3 vPosition; void main(){vPosition=position;gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.0);}',
        fragmentShader:
          'uniform vec3 top; uniform vec3 bottom; varying vec3 vPosition; void main(){float h=clamp(normalize(vPosition).y*.8+.28,0.0,1.0);gl_FragColor=vec4(mix(bottom,top,pow(h,.7)),1.0);}',
      }),
    );
    this.scene.add(sky);
    const moon = this.mesh(this.scene, new T.SphereGeometry(13, 28, 20), '#fff3d8', -95, 105, -190);
    moon.material = new T.MeshBasicMaterial({ color: '#ffefce' });
    this.glow(moon, '#fae3c1', 65);
    const positions = [];
    for (let j = 0; j < 600; j++) {
      const angle = this.random() * Math.PI * 2,
        r = 180 + this.random() * 140;
      positions.push(Math.sin(angle) * r, 35 + this.random() * 180, Math.cos(angle) * r);
    }
    const geometry = new T.BufferGeometry();
    geometry.setAttribute('position', new T.Float32BufferAttribute(positions, 3));
    this.scene.add(
      new T.Points(
        geometry,
        new T.PointsMaterial({
          color: '#fff3d9',
          size: 0.45,
          transparent: true,
          opacity: 0.8,
          sizeAttenuation: true,
        }),
      ),
    );
    for (let j = 0; j < 26; j++) {
      const group = new T.Group();
      group.position.set(
        (this.random() - 0.5) * 270,
        -13 - this.random() * 25,
        (this.random() - 0.5) * 220,
      );
      for (let k = 0; k < 4; k++)
        this.sphere(group, '#d0c2d9', k * 4, 0, this.random() * 2, 7, 2.5 + this.random() * 2, 5);
      this.scene.add(group);
      this.clouds.push(group);
    }
    // Translucent ribbons above the islands create an aurora without post-processing.
    for (let j = 0; j < 3; j++) {
      const points = [];
      for (let k = 0; k < 40; k++)
        points.push(new T.Vector3(-120 + k * 6, 65 + Math.sin(k * 0.18 + j) * 8, -130 + j * 18));
      const ribbon = new T.Mesh(
        new T.TubeGeometry(new T.CatmullRomCurve3(points), 80, 1.2, 3, false),
        new T.MeshBasicMaterial({
          color: ['#89dccc', '#a9a7ed', '#f2b8c7'][j],
          transparent: true,
          opacity: 0.12,
          depthWrite: false,
        }),
      );
      this.scene.add(ribbon);
    }
  }
  private makeIsland(index: number): void {
    const i = ISLANDS[index],
      group = new T.Group();
    group.position.set(i.x, i.y, i.z);
    this.scene.add(group);
    this.mesh(
      group,
      new T.CylinderGeometry(i.radius, i.radius * 0.88, 2.6, 12),
      i.color,
      0,
      -1.3,
      0,
    );
    const rock = this.mesh(
      group,
      new T.ConeGeometry(i.radius * 0.88, 15, 9, 1),
      '#696d92',
      0,
      -9.7,
      0,
    );
    rock.rotation.z = Math.PI;
    for (let j = 0; j < 7; j++) {
      const a = (j * Math.PI * 2) / 7;
      this.sphere(
        group,
        j % 2 ? '#8384a4' : '#9294b0',
        Math.sin(a) * i.radius * 0.55,
        rockHeight(index, j),
        Math.cos(a) * i.radius * 0.55,
        3,
        5,
        3,
      );
    }
    // Meandering pale stones lead toward each lantern.
    for (let j = 0; j < 8; j++) {
      const stone = this.mesh(
        group,
        new T.CylinderGeometry(0.55, 0.65, 0.09, 7),
        '#c8c4b6',
        Math.sin(j * 0.6) * 0.9,
        0.05,
        i.radius - 2 - j * 1.4,
      );
      stone.rotation.y = j;
    }
    for (const o of SCENERY.filter((o) => o.island === index)) {
      const { x, z, scale, variant } = o;
      if (o.kind === 'tree') this.tree(group, x, z, i.biome, variant, scale);
      else if (o.kind === 'ice')
        this.mesh(
          group,
          new T.ConeGeometry(0.5 * scale, 3 * scale, 5),
          '#e2f1ef',
          x,
          1.5 * scale,
          z,
        );
      else {
        this.mesh(
          group,
          new T.CylinderGeometry(0.07 * scale, 0.1 * scale, 0.7 * scale, 5),
          '#d8cfb7',
          x,
          0.35 * scale,
          z,
        );
        this.sphere(
          group,
          variant % 2 ? '#e4a7bd' : '#e3bc8e',
          x,
          0.85 * scale,
          z,
          0.6 * scale,
          0.25 * scale,
          0.6 * scale,
        );
      }
    }
    // Patches of tiny flowers and grass are batched into two instanced meshes per island.
    const blades = new T.InstancedMesh(
      new T.ConeGeometry(0.12, 0.55, 3),
      this.material(i.biome === 'ice' ? '#e1edf2' : '#9fc9b0'),
      120,
    );
    const flowers = new T.InstancedMesh(
      new T.IcosahedronGeometry(0.15, 0),
      this.material(index % 2 ? '#f0c8a7' : '#dfb7d9'),
      70,
    );
    const dummy = new T.Object3D();
    for (let j = 0; j < 120; j++) {
      const a = this.random() * 6.28,
        r = Math.sqrt(this.random()) * (i.radius - 1);
      dummy.position.set(Math.cos(a) * r, 0.2, Math.sin(a) * r);
      dummy.rotation.set(0, this.random() * 6.28, 0.1);
      dummy.updateMatrix();
      blades.setMatrixAt(j, dummy.matrix);
      if (j < 70) {
        dummy.position.y = 0.55;
        dummy.updateMatrix();
        flowers.setMatrixAt(j, dummy.matrix);
      }
    }
    group.add(blades, flowers);
    if (i.biome === 'water' || index === 0) {
      const pond = this.mesh(
        group,
        new T.CylinderGeometry(3.1, 3.1, 0.08, 28),
        '#7cbac4',
        -5,
        0.09,
        0,
      );
      pond.material = new T.MeshStandardMaterial({
        color: '#8bd4db',
        metalness: 0.65,
        roughness: 0.18,
        transparent: true,
        opacity: 0.9,
      });
      for (let j = 0; j < 3; j++) {
        const ripple = this.mesh(
          group,
          new T.TorusGeometry(1 + j * 0.7, 0.025, 3, 40),
          '#c6e8e3',
          -5,
          0.16,
          0,
        );
        ripple.rotation.x = Math.PI / 2;
      }
      const waterfall = this.mesh(
        group,
        new T.CylinderGeometry(0.65, 0.25, 22, 7),
        '#a0dbe0',
        -i.radius + 1,
        -11,
        0,
      );
      waterfall.material = new T.MeshStandardMaterial({
        color: '#a4e3e8',
        emissive: '#488aaf',
        emissiveIntensity: 0.3,
        transparent: true,
        opacity: 0.55,
      });
    }
    const shrine = SHRINES.findIndex((s) => s.island === index);
    if (shrine >= 0) {
      const beacon = new T.Group();
      group.add(beacon);
      this.beacons[shrine] = beacon;
      this.mesh(beacon, new T.CylinderGeometry(2.3, 2.6, 0.3, 12), '#c1b7c9', 0, 0.15, 0);
      this.mesh(beacon, new T.CylinderGeometry(0.55, 0.8, 2.2, 8), '#e2c9be', 0, 1.3, 0);
      const orb = this.mesh(beacon, new T.SphereGeometry(0.58, 16, 12), '#9b8da9', 0, 3, 0);
      orb.name = 'lantern';
      this.mesh(beacon, new T.CylinderGeometry(0.8, 0.8, 0.15, 12), '#b7a187', 0, 2.3, 0);
      this.mesh(beacon, new T.ConeGeometry(0.85, 0.4, 8), '#b7a187', 0, 3.8, 0);
      for (const x of [-0.65, 0.65])
        this.mesh(beacon, new T.CylinderGeometry(0.05, 0.05, 1.4, 6), '#b7a187', x, 3, 0);
      const beam = this.mesh(
        beacon,
        new T.CylinderGeometry(0.22, 0.8, 32, 12),
        '#ffe2a7',
        0,
        18,
        0,
      );
      beam.name = 'beam';
      beam.material = new T.MeshBasicMaterial({
        color: '#ffdb9c',
        transparent: true,
        opacity: 0.27,
        depthWrite: false,
      });
      beam.visible = false;
      const halo = new T.Group();
      halo.position.y = 3;
      halo.name = 'halo';
      this.glow(halo, '#ffdfad', 10);
      halo.visible = false;
      beacon.add(halo);
      // A broken arch frames each restoration site.
      for (const side of [-1, 1])
        this.mesh(group, new T.CylinderGeometry(0.5, 0.65, 5.8, 6), '#b7adc3', side * 3, 2.9, -2);
      const arch = this.mesh(
        group,
        new T.TorusGeometry(3, 0.45, 6, 18, Math.PI),
        '#c6b6cc',
        0,
        5.8,
        -2,
      );
      arch.rotation.z = 0;
    }
    if (index === 3) {
      const fox = new T.Group();
      fox.position.set(-3, 0.7, -3);
      this.sphere(fox, '#ca9dbe', 0, 0, 0, 0.65, 0.55, 1);
      this.sphere(fox, '#f2d2ce', 0, 0.45, -0.7, 0.5);
      for (const x of [-0.3, 0.3])
        this.mesh(fox, new T.ConeGeometry(0.25, 0.7, 4), '#cba9c7', x, 1, -0.7);
      group.add(fox);
    }
    if (i.biome === 'ruins')
      for (let j = 0; j < 6; j++) {
        const a = j * 1.05;
        this.mesh(
          group,
          new T.CylinderGeometry(0.65, 0.8, 3 + (j % 3), 6),
          '#c9bbc9',
          Math.sin(a) * 8,
          1.5,
          Math.cos(a) * 8,
        );
      }
    if (i.biome === 'castle') {
      this.mesh(group, new T.BoxGeometry(9, 6, 5), '#d8c9d6', 0, 3, -4);
      this.mesh(group, new T.ConeGeometry(7, 5, 4), '#877baf', 0, 8.5, -4).rotation.y = Math.PI / 4;
      for (const x of [-6, 6])
        for (const z of [-7, 0]) {
          this.mesh(group, new T.CylinderGeometry(1.5, 1.8, 10, 8), '#d6c8d8', x, 5, z);
          this.mesh(group, new T.ConeGeometry(2.2, 5, 8), '#8b7faf', x, 12.5, z);
          this.sphere(group, '#ffe3a2', x, 15.2, z, 0.28);
        }
      this.castlePortal = new T.Group();
      this.castlePortal.name = 'castlePortal';
      group.add(this.castlePortal);
      const portal = this.mesh(
        this.castlePortal,
        new T.TorusGeometry(2, 0.3, 8, 32),
        '#e7ccaa',
        0,
        2.4,
        0.5,
      );
      portal.scale.y = 1.25;
      this.mesh(
        this.castlePortal,
        new T.CircleGeometry(1.85, 28),
        '#a3b7dc',
        0,
        2.4,
        0.48,
      ).material = new T.MeshBasicMaterial({ color: '#bfdde7', transparent: true, opacity: 0.7 });
      this.glow(portal, '#d3f9ed', 9);
    }
  }
  private tree(
    parent: T.Object3D,
    x: number,
    z: number,
    biome: string,
    index: number,
    scale: number,
  ): void {
    const group = new T.Group();
    group.position.set(x, 0, z);
    group.scale.setScalar(scale);
    parent.add(group);
    this.mesh(group, new T.CylinderGeometry(0.15, 0.4, 3.7, 5), '#807380', 0, 1.8, 0);
    if (biome === 'ice') {
      for (let j = 0; j < 3; j++)
        this.mesh(
          group,
          new T.ConeGeometry(2 - j * 0.45, 2.7, 6),
          j % 2 ? '#becddd' : '#e1e6ed',
          0,
          3 + j * 1.2,
          0,
        );
    } else {
      const color = biome === 'forest' ? '#ac94bd' : index % 3 ? '#85ac9e' : '#d0b2bf';
      this.sphere(group, color, 0, 4.2, 0, 2.2, 2.4, 2.1);
      this.sphere(group, color, 1.3, 3.6, 0, 1.5, 1.6, 1.4);
      this.sphere(group, color, -1, 3.9, 0.6, 1.5);
    }
  }
  render(
    g: WorldState,
    dt: number,
    yaw: number,
    pitch: number,
    attract = false,
    cameraDistance = DEFAULT_CAMERA_DISTANCE,
  ): void {
    this.time += dt;
    const canvas = this.renderer.domElement,
      w = canvas.clientWidth,
      h = canvas.clientHeight;
    if (w !== this.width || h !== this.height) {
      this.width = w;
      this.height = h;
      this.renderer.setSize(w, h, false);
      this.camera.aspect = w / Math.max(1, h);
      this.camera.updateProjectionMatrix();
    }
    const p = g.position,
      t = this.time;
    this.pony.position.set(p.x, p.y + (g.grounded ? 0 : 0.12 * Math.sin(t * 4)), p.z);
    this.pony.rotation.y = g.yaw;
    const speed = Math.hypot(g.velocity.x, g.velocity.z);
    this.pony.rotation.z = g.grounded ? 0 : Math.sin(t * 2) * 0.03;
    this.character.update(t, speed, g.grounded, g.equippedReward);
    (this.trail.material as T.PointsMaterial).color.set(
      g.equippedReward === null ? '#f9ddc4' : LANTERN_REWARDS[g.equippedReward].color,
    );
    if (g.feedback && g.feedback.id !== this.feedbackId) {
      this.feedbackId = g.feedback.id;
      this.burstAt = t;
      const q = g.feedback.position;
      this.burst.position.set(q.x, q.y, q.z);
    }
    const age = t - this.burstAt;
    this.burst.visible = age < 0.85;
    if (this.burst.visible)
      this.burst.children.forEach((piece, j) => {
        const a = j * 2.399;
        piece.position.set(
          Math.cos(a) * age * 3,
          Math.sin(a * 2) * age * 2 + age,
          Math.sin(a) * age * 3,
        );
        piece.scale.setScalar(Math.max(0, 1 - age));
      });
    const island = ISLANDS[g.island];
    this.shadow.visible = !!island;
    if (island) {
      this.shadow.position.set(p.x, island.y + 0.08, p.z);
      this.shadow.scale.setScalar(Math.max(0.4, 1 - (p.y - island.y) * 0.035));
    }
    if (this.castlePortal) this.castlePortal.visible = g.beacons.size === 4;
    this.gem.visible = !g.gem;
    this.gem.rotation.y = t;
    this.gem.position.y = pickupPosition(FLIGHT_GEM, 0, g.elapsed).y;
    this.relics.forEach((relic, i) => {
      relic.visible = !g.relics.has(i);
      relic.rotation.y = t;
      this.pickupLabels[i].visible = relic.position.distanceTo(this.pony.position) < 22;
      relic.position.y = pickupPosition(RELICS[i], i, g.elapsed).y;
    });
    this.beacons.forEach((beacon, i) => {
      const on = g.beacons.has(i);
      beacon.getObjectByName('beam')!.visible = on;
      beacon.getObjectByName('halo')!.visible = on;
      const orb = beacon.getObjectByName('lantern') as T.Mesh;
      orb.material = on ? this.material('#ffe1a8') : this.material('#9b8da9');
      orb.rotation.y = t * 0.3;
    });
    this.guardians.forEach((guardian, i) => {
      const q = guardianPosition(i, g.elapsed);
      guardian.visible = !g.beacons.has(i);
      guardian.position.set(q.x, q.y, q.z);
      guardian.rotation.y = -g.elapsed * 0.4;
    });
    this.rings.forEach((ring, i) => {
      const next = g.raceIndex < 0 ? 0 : g.raceIndex;
      const m = ring.material as T.MeshStandardMaterial;
      m.opacity = i < next ? 0.15 : i === next ? 0.95 : 0.28;
      m.emissiveIntensity = i === next ? 1.4 : 0.3;
    });
    this.currents.forEach((current, i) => {
      current.rotation.y = t * 0.4;
      current.children.forEach((child, j) => {
        child.position.y = ((t * 2 + j * 1.5) % 9) - 4;
      });
    });
    if (!this.reducedMotion)
      this.clouds.forEach((cloud, i) => (cloud.position.x += dt * 0.12 * (1 + (i % 3))));
    const positions = this.trail.geometry.attributes['position'] as T.BufferAttribute;
    if (!this.reducedMotion && g.gem && !g.grounded) {
      const a = positions.array as Float32Array;
      a.copyWithin(3, 0, a.length - 3);
      a[0] = p.x;
      a[1] = p.y + 1;
      a[2] = p.z + 0.7;
      positions.needsUpdate = true;
    } else if (g.grounded) {
      positions.array.fill(-1000);
      positions.needsUpdate = true;
    }
    if (attract) {
      this.cameraPosition.set(43 + Math.sin(t * 0.035) * 10, 32, 59);
      this.target.set(0, 8, -24);
    } else {
      const rig = followRig(p, yaw, pitch, cameraDistance, this.camera.aspect);
      this.target.set(rig.target.x, rig.target.y, rig.target.z);
      const safe = safeFollowCamera(p, rig.camera, yaw, SOLIDS);
      this.cameraPosition.set(safe.x, safe.y, safe.z);
    }
    if (!attract && this.wasAttract) this.camera.position.copy(this.cameraPosition);
    else this.camera.position.lerp(this.cameraPosition, 1 - Math.exp(-dt * (attract ? 0.5 : 5)));
    if (!attract) {
      const safe = clipCamera({ x: p.x, y: p.y + 1.45, z: p.z }, this.camera.position, SOLIDS);
      this.camera.position.set(safe.x, safe.y, safe.z);
    }
    this.wasAttract = attract;
    this.camera.lookAt(this.target);
    this.renderer.render(this.scene, this.camera);
  }
  dispose(): void {
    const geometries = new Set<T.BufferGeometry>(),
      materials = new Set<T.Material>(),
      textures = new Set<T.Texture>();
    this.scene.traverse((object) => {
      const o = object as T.Mesh;
      if (o.geometry) geometries.add(o.geometry);
      const list = Array.isArray(o.material) ? o.material : [o.material];
      for (const m of list) {
        if (!m) continue;
        materials.add(m);
        const map = (m as T.MeshStandardMaterial).map;
        if (map) textures.add(map);
      }
    });
    geometries.forEach((g) => g.dispose());
    materials.forEach((m) => m.dispose());
    textures.forEach((t) => t.dispose());
    this.renderer.dispose();
  }
}
