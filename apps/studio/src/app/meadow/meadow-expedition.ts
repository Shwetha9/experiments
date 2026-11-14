import { DEFAULT_CAMERA_DISTANCE } from './meadow-camera';
import {
  AfterViewInit,
  Component,
  ElementRef,
  HostListener,
  NgZone,
  OnDestroy,
  ViewChild,
  inject,
  output,
  signal,
  computed,
} from '@angular/core';
import { RouterLink } from '@angular/router';
import { MeadowScene } from './meadow-scene';
import {
  createWorld,
  claimReward,
  equipReward,
  score,
  LANTERN_REWARDS,
  distance,
  ISLANDS,
  nextObjective,
  readWorldSave,
  RELICS,
  returnToCheckpoint,
  SHRINES,
  stepWorld,
  WorldState,
  WORLD_SAVE_KEY,
  worldSave,
} from './meadow-world';

@Component({
  selector: 'app-meadow-expedition',
  imports: [RouterLink],
  templateUrl: './meadow-expedition.html',
  styleUrl: './meadow-expedition.scss',
})
export class MeadowExpedition implements AfterViewInit, OnDestroy {
  @ViewChild('skyCanvas', { static: true }) private canvas!: ElementRef<HTMLCanvasElement>;
  @ViewChild('modal') set modal(ref: ElementRef<HTMLElement> | undefined) {
    this.overlay = ref?.nativeElement;
    if (ref)
      queueMicrotask(() => ref.nativeElement.querySelector<HTMLElement>('button, input')?.focus());
    else if (this.started()) queueMicrotask(() => this.canvas.nativeElement.focus());
  }
  readonly arcade = output<void>();
  protected readonly friends = [
    {
      name: 'Mia',
      description: 'A little courage. A lot of heart.',
      image: 'images/meadow/pippa-winged.png',
    },
    {
      name: 'Clover',
      description: 'For the beautifully curious.',
      image: 'images/meadow/clover-winged.png',
    },
    {
      name: 'Violete',
      description: 'Always chasing the next star.',
      image: 'images/meadow/miso-winged.png',
    },
  ];
  protected readonly friend = signal(this.load()?.friend ?? 'Mia');
  protected readonly friendImage = computed(
    () => this.friends.find((p) => p.name === this.friend())?.image ?? this.friends[0].image,
  );
  protected readonly cameraDistance = signal(
    this.load()?.cameraDistance ?? DEFAULT_CAMERA_DISTANCE,
  );
  protected readonly started = signal(false);
  protected readonly paused = signal(false);
  protected readonly mapOpen = signal(false);
  protected readonly helpOpen = signal(false);
  protected readonly rewardsOpen = signal(false);
  protected readonly rewards = LANTERN_REWARDS;
  protected readonly sound = signal(false);
  protected readonly error = signal('');
  protected readonly ending = signal(false);
  protected readonly islands = ISLANDS;
  protected readonly shrines = SHRINES;
  protected readonly saved = signal(this.load());
  protected readonly view = signal({
    stamina: 100,
    score: 0,
    feedback: null as { text: string; points: number; until: number; id: number } | null,
    claimed: [] as number[],
    equipped: null as number | null,
    altitudeHint: '',
    relics: 0,
    beacons: 0,
    gem: false,
    location: 'Moonbeam Meadow',
    objective: 'Find the flight crystal',
    distance: 12,
    message: '',
    visited: 1,
    grounded: true,
    raceIndex: -1,
    raceTime: 0,
    bestRace: null as number | null,
    completed: false,
    x: 0,
    z: 15,
    y: 0,
    bearing: 0,
    restorable: false,
    restored: [] as number[],
    pieces: [] as number[],
  });
  private readonly zone = inject(NgZone);
  private world = createWorld();
  private scene: MeadowScene | null = null;
  private held = new Set<string>();
  private frame = 0;
  private lastTime = 0;
  private lastPublish = 0;
  private yaw = 0;
  private pitch = 0.24;
  private dragging: { x: number; y: number } | null = null;
  private context: AudioContext | null = null;
  private narration: HTMLAudioElement | null = null;
  private lastSave = '';
  private disposed = false;
  private overlay?: HTMLElement;
  private readonly movement = new Set([
    'KeyW',
    'KeyA',
    'KeyS',
    'KeyD',
    'ArrowUp',
    'ArrowDown',
    'ArrowLeft',
    'ArrowRight',
    'Space',
    'ShiftLeft',
    'ShiftRight',
    'KeyC',
    'KeyQ',
    'KeyR',
    'KeyE',
  ]);
  ngAfterViewInit(): void {
    this.createScene();
  }
  private createScene(): void {
    this.scene?.dispose();
    this.scene = null;
    try {
      this.scene = new MeadowScene(this.canvas.nativeElement, this.friend());
      this.error.set('');
    } catch {
      this.error.set(
        'The sky needs WebGL 2. Try opening the game in a browser with hardware acceleration, or play the story trials below.',
      );
      return;
    }
    if (!this.frame)
      this.zone.runOutsideAngular(() => (this.frame = requestAnimationFrame((t) => this.tick(t))));
  }
  protected choose(name: string): void {
    this.friend.set(name);
    this.createScene();
  }
  protected begin(resume = false): void {
    const saved = resume ? this.saved() : null;
    this.world = createWorld(saved);
    this.yaw = 0;
    this.pitch = 0.24;
    this.held.clear();
    this.started.set(true);
    this.paused.set(false);
    this.helpOpen.set(!saved);
    this.ending.set(false);
    this.rewardsOpen.set(false);
    this.persist();
    this.publish();
    this.canvas.nativeElement.focus();
  }
  protected menu(): void {
    this.persist();
    this.started.set(false);
    this.paused.set(false);
    this.mapOpen.set(false);
    this.rewardsOpen.set(false);
    this.helpOpen.set(false);
    this.ending.set(false);
    this.held.clear();
    this.stopNarration();
  }
  protected togglePause(): void {
    this.paused.update((v) => !v);
    this.held.clear();
    if (!this.paused()) this.canvas.nativeElement.focus();
  }
  protected toggleHelp(): void {
    this.helpOpen.update((v) => !v);
  }
  protected toggleMap(): void {
    this.rewardsOpen.set(false);
    this.mapOpen.update((v) => !v);
    this.held.clear();
  }
  protected setCameraDistance(event: Event): void {
    this.cameraDistance.set(Number((event.target as HTMLInputElement).value));
    this.persist();
  }
  protected toggleRewards(): void {
    this.rewardsOpen.update((v) => !v);
    this.mapOpen.set(false);
    this.held.clear();
  }
  protected claim(index: number): void {
    if (claimReward(this.world, index)) {
      this.chime('beacon');
      this.persist();
      this.publish();
      requestAnimationFrame(() =>
        this.overlay?.querySelector<HTMLElement>(`[data-reward="${index}"] .reward-equip`)?.focus(),
      );
    }
  }
  protected equip(index: number): void {
    equipReward(this.world, index);
    this.persist();
    this.publish();
  }
  protected restore(): void {
    // A semantic click works for mouse, touch, Enter and Space; it need not be held for a frame.
    stepWorld(
      this.world,
      {
        forward: 0,
        strafe: 0,
        lift: false,
        descend: false,
        dash: false,
        interact: true,
        yaw: this.yaw,
      },
      0.008,
    );
    if (this.world.event === 'beacon') this.chime('beacon');
    this.persist();
    this.publish();
  }
  protected toggleSound(): void {
    this.sound.update((v) => !v);
    if (this.sound()) this.chime('gem');
    else {
      this.stopNarration();
      this.context?.suspend();
    }
  }
  protected control(event: PointerEvent, key: string, on: boolean): void {
    event.preventDefault();
    event.stopPropagation();
    if (on) {
      (event.currentTarget as HTMLElement).setPointerCapture(event.pointerId);
      this.held.add(key);
    } else this.held.delete(key);
  }
  protected dragStart(e: PointerEvent): void {
    if (!this.started() || this.paused()) return;
    this.dragging = { x: e.clientX, y: e.clientY };
    this.canvas.nativeElement.setPointerCapture(e.pointerId);
    this.canvas.nativeElement.focus();
  }
  protected dragMove(e: PointerEvent): void {
    if (!this.dragging) return;
    this.yaw -= (e.clientX - this.dragging.x) * 0.005;
    this.pitch = Math.max(-0.2, Math.min(0.9, this.pitch + (e.clientY - this.dragging.y) * 0.004));
    this.dragging = { x: e.clientX, y: e.clientY };
  }
  protected dragEnd(): void {
    this.dragging = null;
  }
  protected returnHome(): void {
    returnToCheckpoint(this.world);
    this.publish();
    this.persist();
    this.paused.set(false);
    this.held.clear();
  }
  protected mapX(x: number): number {
    return 110 + x * 1.4;
  }
  protected mapY(z: number): number {
    return 36 + (z + 90) * 1.4;
  }
  protected piecesFor(shrine: number): number {
    return RELICS.filter((r, i) => r.shrine === shrine && this.view().pieces.includes(i)).length;
  }
  private tick(time: number): void {
    if (this.disposed) return;
    const dt = this.lastTime ? Math.min(0.04, (time - this.lastTime) / 1000) : 0.016;
    this.lastTime = time;
    const active =
      this.started() && !this.paused() && !this.mapOpen() && !this.rewardsOpen() && !this.ending();
    if (active) {
      const key = (...codes: string[]): number => (codes.some((c) => this.held.has(c)) ? 1 : 0);
      this.yaw += (key('KeyR') - key('KeyQ')) * dt * 1.5;
      const before = this.world.beacons.size;
      stepWorld(
        this.world,
        {
          forward: key('KeyW', 'ArrowUp') - key('KeyS', 'ArrowDown'),
          strafe: key('KeyD', 'ArrowRight') - key('KeyA', 'ArrowLeft'),
          lift: !!key('Space'),
          descend: !!key('KeyC'),
          dash: !!key('ShiftLeft', 'ShiftRight'),
          interact: !!key('KeyE'),
          yaw: this.yaw,
        },
        dt,
      );
      const event = this.world.event;
      if (event) {
        this.persist();
        this.chime(event);
        if (event === 'beacon') this.narrate(`episode-${[...this.world.beacons].at(-1)! + 1}-end`);
        if (event === 'gem') this.helpOpen.set(true);
      }
      if (this.world.beacons.size !== before) this.publish();
      if (event === 'finish') this.zone.run(() => this.ending.set(true));
      if (time - this.lastPublish > 100) {
        this.lastPublish = time;
        this.zone.run(() => this.publish());
        this.persist();
      }
    }
    this.scene?.render(
      this.world,
      dt,
      this.yaw,
      this.pitch,
      !this.started(),
      this.cameraDistance(),
    );
    this.frame = requestAnimationFrame((t) => this.tick(t));
  }
  private publish(): void {
    const g = this.world,
      objective = nextObjective(g),
      dx = objective.point.x - g.position.x,
      dz = objective.point.z - g.position.z;
    const restorable = SHRINES.some(
      (s, j) =>
        !g.beacons.has(j) &&
        g.grounded &&
        distance(g.position, ISLANDS[s.island]) < 4.5 &&
        RELICS.every((r, k) => r.shrine !== j || g.relics.has(k)),
    );
    this.view.set({
      stamina: Math.round(g.stamina),
      score: score(g),
      feedback: g.feedback && g.feedback.until > g.elapsed ? g.feedback : null,
      claimed: [...g.claimedRewards],
      equipped: g.equippedReward,
      altitudeHint:
        objective.kind === 'diamond' || objective.kind === 'crystal'
          ? objective.point.y - g.position.y > 3
            ? `Fly ${Math.round(objective.point.y - g.position.y - 2)} m higher`
            : objective.point.y - g.position.y < -0.5
              ? `Descend ${Math.round(g.position.y - objective.point.y + 1)} m`
              : 'Touch it to collect automatically'
          : objective.kind === 'lantern'
            ? 'Collect 3 diamonds, then land beside the lantern'
            : 'Follow the compass',
      relics: g.relics.size,
      beacons: g.beacons.size,
      gem: g.gem,
      location: g.island >= 0 ? ISLANDS[g.island].name : 'The open sky',
      objective: objective.label,
      distance: Math.round(distance(g.position, objective.point)),
      message: g.messageUntil > g.elapsed ? g.message : '',
      visited: g.visited.size,
      grounded: g.grounded,
      raceIndex: g.raceIndex,
      raceTime: g.raceTime,
      bestRace: g.bestRace,
      completed: g.completed,
      x: g.position.x,
      z: g.position.z,
      y: g.position.y,
      bearing: (Math.atan2(dx, -dz) * 180) / Math.PI - (this.yaw * 180) / Math.PI,
      restorable,
      restored: [...g.beacons],
      pieces: [...g.relics],
    });
  }
  private load() {
    try {
      return readWorldSave(localStorage.getItem(WORLD_SAVE_KEY));
    } catch {
      return null;
    }
  }
  private persist(): void {
    if (!this.started()) return;
    try {
      const save = {
          ...worldSave(this.world),
          friend: this.friend(),
          cameraDistance: this.cameraDistance(),
        },
        raw = JSON.stringify(save);
      if (raw === this.lastSave) return;
      localStorage.setItem(WORLD_SAVE_KEY, raw);
      this.lastSave = raw;
      this.saved.set(save);
    } catch {
      /* Exploration remains available with storage disabled. */
    }
  }
  private chime(event: NonNullable<WorldState['event']>): void {
    if (!this.sound()) return;
    try {
      this.context ??= new AudioContext();
      void this.context.resume();
      const ctx = this.context;
      const notes =
        event === 'hurt'
          ? [180, 120]
          : event === 'beacon' || event === 'finish'
            ? [392, 494, 587, 784]
            : [587, 784];
      notes.forEach((hz, i) => {
        const o = ctx.createOscillator(),
          gain = ctx.createGain(),
          at = ctx.currentTime + i * 0.12;
        o.type = 'sine';
        o.frequency.value = hz;
        gain.gain.setValueAtTime(0, at);
        gain.gain.linearRampToValueAtTime(0.065, at + 0.025);
        gain.gain.exponentialRampToValueAtTime(0.001, at + 0.7);
        o.connect(gain).connect(ctx.destination);
        o.start(at);
        o.stop(at + 0.75);
      });
    } catch {
      /* Sound is optional. */
    }
  }
  private narrate(id: string): void {
    if (!this.sound()) return;
    this.stopNarration();
    this.narration = new Audio(`audio/meadow/${id}.mp3`);
    void this.narration.play().catch(() => {});
  }
  private stopNarration(): void {
    this.narration?.pause();
    this.narration = null;
  }
  @HostListener('window:keydown', ['$event']) onKeyDown(e: KeyboardEvent): void {
    if (!this.started() || e.ctrlKey || e.metaKey || e.altKey) return;
    if (e.code === 'Tab' && this.overlay) {
      const buttons = Array.from(
        this.overlay.querySelectorAll<HTMLElement>('button:not(:disabled), input:not(:disabled)'),
      );
      const first = buttons[0],
        last = buttons[buttons.length - 1];
      if (e.shiftKey && document.activeElement === first) {
        e.preventDefault();
        last?.focus();
      } else if (!e.shiftKey && document.activeElement === last) {
        e.preventDefault();
        first?.focus();
      }
      return;
    }
    if (e.code === 'Escape') {
      e.preventDefault();
      if (this.ending()) this.ending.set(false);
      else if (this.mapOpen()) this.mapOpen.set(false);
      else if (this.rewardsOpen()) this.rewardsOpen.set(false);
      else this.togglePause();
      return;
    }
    if (e.code === 'KeyM' && !e.repeat) {
      e.preventDefault();
      this.toggleMap();
      return;
    }
    if (e.code === 'KeyH' && !e.repeat) {
      this.helpOpen.update((v) => !v);
      return;
    }
    if (
      this.movement.has(e.code) &&
      !this.paused() &&
      !this.mapOpen() &&
      !this.rewardsOpen() &&
      !this.ending()
    ) {
      e.preventDefault();
      this.held.add(e.code);
    }
  }
  @HostListener('window:keyup', ['$event']) onKeyUp(e: KeyboardEvent): void {
    this.held.delete(e.code);
  }
  @HostListener('window:blur') onBlur(): void {
    this.held.clear();
    this.dragging = null;
    if (this.started()) this.paused.set(true);
  }
  @HostListener('document:visibilitychange') onVisibility(): void {
    if (document.hidden) this.onBlur();
  }
  protected contextLost(e: Event): void {
    e.preventDefault();
    this.paused.set(true);
    this.error.set(
      'The sky lost its graphics connection. Your discoveries are saved. Reload to continue.',
    );
  }
  ngOnDestroy(): void {
    this.disposed = true;
    cancelAnimationFrame(this.frame);
    this.persist();
    this.scene?.dispose();
    this.stopNarration();
    void this.context?.close();
  }
}
