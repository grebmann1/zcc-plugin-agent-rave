import * as T from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import type { PluginFleetMember } from '@zana-ai/zcc-plugin-sdk/app';
import { agentColor, clubLayout, hash, type Camera, type Look } from './model.js';

export interface ClubOptions {
  members: readonly PluginFleetMember[]; paused: boolean; reduced: boolean; look: Look; camera: Camera; bpm: number;
  selected?: string; onSelect(key: string): void; onHover(key?: string): void; onFailure(): void;
}
type Dancer = { root: T.Group; arms: T.Group[]; legs: T.Group[]; phase: number; key?: string };
export function createClub(canvas: HTMLCanvasElement, initial: ClubOptions) {
  let options = initial, disposed = false, broken = false, visible = true, time = 0, last = 0, renderedAt = 0;
  const renderer = new T.WebGLRenderer({ canvas, antialias: true, alpha: false, powerPreference: 'low-power' });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 1.5));
  renderer.setClearColor('#06060e'); renderer.toneMapping = T.ACESFilmicToneMapping; renderer.toneMappingExposure = 1.35;
  const scene = new T.Scene(); scene.fog = new T.FogExp2('#080611', .025);
  const camera = new T.PerspectiveCamera(43, 1, .1, 100);
  const controls = new OrbitControls(camera, canvas);
  controls.enablePan = false; controls.enableDamping = false; controls.minDistance = 10; controls.maxDistance = 38;
  controls.minPolarAngle = .3; controls.maxPolarAngle = Math.PI * .47; controls.target.set(0, 2, -2);
  const geometries = new Set<T.BufferGeometry>(), materials = new Set<T.Material>(), textures = new Set<T.Texture>();
  const material = (color: string, glow = 0, opacity = 1) => {
    const m = new T.MeshStandardMaterial({ color, roughness: .55, metalness: .35, emissive: color, emissiveIntensity: glow, transparent: opacity < 1, opacity, depthWrite: opacity === 1 });
    materials.add(m); return m;
  };
  const dark = material('#121320'), steel = material('#34374b'), black = material('#080911'), white = material('#ced9ed');
  const pink = material('#df43ff', 2.6), cyan = material('#59e6ff', 2.1), lime = material('#cbff61', 1.8);
  function mesh(geometry: T.BufferGeometry, mat: T.Material, x: number, y: number, z: number, parent: T.Object3D = scene) {
    geometries.add(geometry); const m = new T.Mesh(geometry, mat); m.position.set(x, y, z); parent.add(m); return m;
  }
  const box = (w: number, h: number, d: number, mat: T.Material, x: number, y: number, z: number, parent?: T.Object3D) => mesh(new T.BoxGeometry(w, h, d), mat, x, y, z, parent);
  const sphere = (r: number, mat: T.Material, x: number, y: number, z: number, parent?: T.Object3D) => mesh(new T.SphereGeometry(r, 12, 8), mat, x, y, z, parent);
  function line(points: number[][], color: string, opacity = 1) {
    const g = new T.BufferGeometry().setFromPoints(points.map(p => new T.Vector3(...p as [number, number, number]))); geometries.add(g);
    const m = new T.LineBasicMaterial({ color, transparent: opacity < 1, opacity, blending: T.AdditiveBlending }); materials.add(m);
    const l = new T.Line(g, m); scene.add(l); return l;
  }
  function text(value: string, w: number, h: number, x: number, y: number, z: number, color = '#f0ebff') {
    const c = document.createElement('canvas'); c.width = 1024; c.height = 256;
    const ctx = c.getContext('2d')!; ctx.fillStyle = color; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
    ctx.font = `900 ${value.length > 16 ? 55 : 170}px Arial`; ctx.fillText(value, 512, 130);
    const texture = new T.CanvasTexture(c); texture.colorSpace = T.SRGBColorSpace; textures.add(texture);
    const mat = new T.MeshBasicMaterial({ map: texture, transparent: true, side: T.DoubleSide }); materials.add(mat);
    return mesh(new T.PlaneGeometry(w, h), mat, x, y, z);
  }
  scene.add(new T.AmbientLight('#9b9dff', 1.7));
  const overhead = new T.DirectionalLight('#c5c7ff', 3); overhead.position.set(0, 15, 8); scene.add(overhead);
  for (const [color, x, z] of [['#b840ff', -7, -5], ['#34e5ff', 7, -3], ['#de38b4', 0, 5]] as const) {
    const light = new T.PointLight(color, 65, 24, 1.7); light.position.set(x, 5, z); scene.add(light);
  }
  box(28, .3, 29, material('#10101c'), 0, -.25, -1);
  box(28, 13, .3, material('#0e0e1a'), 0, 6.1, -12);
  for (let x = -14; x <= 14; x += 2) line([[x, -.07, -11], [x, -.07, 13]], '#605178', .22);
  for (let z = -11; z <= 13; z += 2) line([[-14, -.07, z], [14, -.07, z]], '#605178', .22);
  // Open warehouse trusses frame the room without hiding the dance floor.
  for (const z of [-10.5, 0, 11]) {
    for (const x of [-12, 12]) { box(.18, 11, .18, steel, x, 5.3, z); box(.07, 10, .07, cyan, x + .16, 5.3, z); }
    box(24, .18, .18, steel, 0, 10.8, z);
    for (let x = -12; x < 12; x += 2) {
      const brace = box(2.2, .06, .06, steel, x + 1, 10.4, z); brace.rotation.z = x % 4 === 0 ? .32 : -.32;
    }
  }
  box(19, .65, 5, dark, 0, .15, -8);
  box(19, .05, .06, pink, 0, .5, -5.48); box(19, .05, .06, cyan, 0, -.1, -5.4);
  box(7, 1.5, 1.8, black, 0, 1.42, -7.6); box(7.2, .12, 2, steel, 0, 2.2, -7.6);
  const boothFront = box(6.7, .95, .03, material('#683eb2', .8), 0, 1.5, -6.67);
  text('AGENTS AFTER HOURS', 5.7, 1.25, 0, 1.5, -6.63, '#edffcc');
  for (const x of [-2.15, 2.15]) {
    const deck = mesh(new T.CylinderGeometry(.68, .68, .07, 32), black, x, 2.31, -7.5);
    mesh(new T.TorusGeometry(.51, .025, 6, 32), cyan, x, 2.36, -7.5).rotation.x = -Math.PI / 2;
    sphere(.12, lime, x, 2.37, -7.5); deck.rotation.y = .4;
  }
  for (let i = -2; i <= 2; i++) { box(.07, .03, .55, dark, i * .18, 2.29, -7.3); box(.12, .06, .1, lime, i * .18, 2.33, -7.2 + i * .04); }
  for (const x of [-8, 8]) for (let y = 0; y < 3; y++) {
    box(2, 1.6, 1.5, black, x, 1.25 + y * 1.65, -8);
    const speaker = mesh(new T.CylinderGeometry(.58, .58, .08, 24), steel, x, 1.25 + y * 1.65, -7.21); speaker.rotation.x = Math.PI / 2;
    sphere(.25, black, x, 1.25 + y * 1.65, -7.13);
    box(.035, 1.4, .03, pink, x - .89, 1.25 + y * 1.65, -7.18);
  }
  // A quiet side bar keeps idle agents out of the working dance floor.
  box(1.2, 1.2, 12, black, -11.4, .6, 3);
  box(1.45, .13, 12.3, steel, -11.4, 1.25, 3);
  box(.035, .055, 12, cyan, -10.77, .94, 3);
  box(.035, .035, 12, pink, -10.77, .18, 3);
  const barSign = text('THE BAR', 3.8, 1, -11.6, 3.1, 3, '#8cecff'); barSign.rotation.y = Math.PI / 2;
  const glass = material('#74dcff', .3, .45);
  for (let i = 0; i < 6; i++) {
    mesh(new T.CylinderGeometry(.11, .08, .25, 10), glass, -11.2, 1.44, -1.5 + i * 1.9);
    sphere(.035, lime, -11.2, 1.57, -1.5 + i * 1.9);
  }
  const rings: T.Mesh[] = [];
  for (const [r, mat] of [[3.6, pink], [3.8, cyan], [4.3, material('#6c3184', 1)]] as const) rings.push(mesh(new T.TorusGeometry(r, .035, 6, 96), mat, 0, 6, -11.65));
  text('RAVE', 7.2, 2.2, 0, 6.5, -11.45); text('Z A N A   S O U N D   S Y S T E M', 6.7, .7, 0, 5.1, -11.44, '#c9ff7d');
  const bars: T.Mesh[] = [];
  for (let i = 0; i < 29; i++) bars.push(box(.13, 1, .08, i % 3 ? pink : cyan, (i - 14) * .48, 3.1, -11.5));
  const tiles: T.Mesh[] = [];
  for (let x = -4; x <= 4; x++) for (let z = 0; z < 7; z++) {
    const m = material((x + z) % 3 ? '#683199' : '#26727d', .35, .65);
    tiles.push(box(1.72, .025, 1.72, m, x * 1.85, -.055, -3.5 + z * 1.85));
  }
  const beams: T.Group[] = [];
  for (let i = 0; i < 8; i++) {
    const group = new T.Group(); group.position.set((i - 3.5) * 2.8, 10.5, -9.5); scene.add(group);
    const color = i % 2 ? '#b8ff53' : '#c959ff';
    const m = new T.MeshBasicMaterial({ color, transparent: true, opacity: .045, side: T.DoubleSide, depthWrite: false, blending: T.AdditiveBlending }); materials.add(m);
    const cone = mesh(new T.ConeGeometry(1.5, 17, 20, 1, true), m, 0, -8.5, 0, group);
    const laser = box(.018, 17, .018, i % 2 ? lime : pink, 0, -8.5, 0, group); cone.renderOrder = 3; laser.renderOrder = 2;
    box(.45, .4, .6, steel, 0, .1, 0, group); group.rotation.x = -.45; beams.push(group);
  }
  // Floating haze motes, not extra agents.
  const points = new Float32Array(180 * 3);
  for (let i = 0; i < points.length; i++) points[i] = Math.sin(i * 879.31) * (i % 3 === 1 ? 5 : 13) + (i % 3 === 1 ? 5 : 0);
  const pg = new T.BufferGeometry(); pg.setAttribute('position', new T.BufferAttribute(points, 3)); geometries.add(pg);
  const pm = new T.PointsMaterial({ color: '#bbb0fc', size: .035, transparent: true, opacity: .45 }); materials.add(pm);
  const dust = new T.Points(pg, pm); scene.add(dust);
  function dancer(color: string, key?: string): Dancer {
    const root = new T.Group(); scene.add(root); root.userData.key = key;
    const shirt = material(color, .14), visor = material('#171c32');
    box(.64, .78, .36, shirt, 0, 1.1, 0, root);
    sphere(.34, white, 0, 1.87, 0, root); box(.53, .22, .19, visor, 0, 1.9, -.25, root);
    for (const x of [-.14, .14]) box(.06, .06, .04, cyan, x, 1.93, -.36, root);
    const arms: T.Group[] = [], legs: T.Group[] = [];
    for (const side of [-1, 1]) {
      const arm = new T.Group(); arm.position.set(side * .46, 1.4, 0); root.add(arm);
      box(.19, .65, .2, shirt, 0, -.22, 0, arm); sphere(.12, white, 0, -.62, 0, arm); arms.push(arm);
      const leg = new T.Group(); leg.position.set(side * .21, .71, 0); root.add(leg);
      box(.23, .59, .25, dark, 0, -.24, 0, leg); box(.27, .16, .43, white, 0, -.58, -.06, leg); legs.push(leg);
    }
    const halo = mesh(new T.TorusGeometry(.65, .015, 4, 32), key ? shirt : lime, 0, .015, 0, root); halo.rotation.x = Math.PI / 2;
    return { root, arms, legs, phase: hash(key ?? 'dj') / 4294967295 * Math.PI * 2, key };
  }
  const dj = dancer('#c5ff70'); dj.root.position.set(0, .9, -8.6); dj.root.rotation.y = Math.PI;
  const headphones = mesh(new T.TorusGeometry(.39, .07, 6, 24, Math.PI), black, 0, 1.89, 0, dj.root);
  headphones.rotation.y = Math.PI / 2; for (const x of [-.39, .39]) box(.15, .35, .3, lime, x, 1.9, 0, dj.root);
  const dancers = new Map<string, Dancer>();
  const selection = mesh(new T.TorusGeometry(.8, .035, 6, 48), lime, 0, .06, 0); selection.rotation.x = Math.PI / 2; selection.visible = false;
  function reconcile() {
    const wanted = clubLayout(options.members), keys = new Set(wanted.map(({ member }) => member.key));
    for (const [key, value] of dancers) if (!keys.has(key)) { scene.remove(value.root); releaseTree(value.root); dancers.delete(key); }
    wanted.forEach(({ member, zone, x, z, scale }) => {
      let d = dancers.get(member.key);
      if (d && d.root.userData.color !== agentColor(member)) { scene.remove(d.root); releaseTree(d.root); dancers.delete(member.key); d = undefined; }
      if (!d) { d = dancer(agentColor(member), member.key); d.root.userData.color = agentColor(member); dancers.set(member.key, d); }
      d.root.scale.setScalar(scale); d.root.position.set(x, 0, z);
      d.root.userData.zone = zone;
      pose(d, time * options.bpm / 60 * Math.PI);
    });
  }
  function releaseTree(root: T.Object3D) {
    // Dancer geometry and shirt/visor are private; common stage materials stay alive.
    root.traverse(o => { if (o instanceof T.Mesh) { o.geometry.dispose(); geometries.delete(o.geometry); } });
    const privateMats = new Set<T.Material>(); root.traverse(o => { if (o instanceof T.Mesh && ![dark, white, cyan, lime].includes(o.material as T.MeshStandardMaterial)) privateMats.add(o.material as T.Material); });
    for (const m of privateMats) { m.dispose(); materials.delete(m); }
  }
  function setCamera(view: Camera) {
    const values = view === 'booth' ? [0, 5.4, -10.7, 0, 1.2, 3] : view === 'balcony' ? [17, 17, 23, 0, 1.5, -2] : [11.5, 9, 21, 0, 3, -3];
    camera.position.set(values[0], values[1], values[2]); controls.target.set(values[3], values[4], values[5]); controls.update();
  }
  function pose(d: Dancer, beat: number) {
    const t = beat + d.phase, zone = d.root.userData.zone;
    if (d !== dj && zone !== 'floor') {
      d.root.position.y = 0; d.root.rotation.set(0, zone === 'bar' ? Math.PI / 2 : Math.PI, 0);
      d.arms.forEach((arm, i) => { arm.rotation.set(0, 0, zone === 'booth' && i === 0 ? 2.3 : (i ? -1 : 1) * .12); });
      d.legs.forEach(leg => leg.rotation.set(0, 0, 0));
      return;
    }
    d.root.position.y = (d === dj ? .9 : 0) + Math.max(0, Math.sin(t * 2)) * .13;
    d.root.rotation.z = Math.sin(t) * .08; d.root.rotation.y = Math.sin(t * .5) * .28 + (d === dj ? Math.PI : 0);
    d.arms.forEach((a, i) => { a.rotation.z = (i ? -1 : 1) * (.7 + Math.sin(t + i * 1.8) * .9); a.rotation.x = Math.cos(t + i) * .5; });
    d.legs.forEach((l, i) => { l.rotation.x = Math.sin(t + i * Math.PI) * .22; });
  }
  function render(now: number) {
    if (disposed || broken) return;
    const moving = !options.paused && !options.reduced;
    if (moving && now - renderedAt < 1000 / 30) return;
    const delta = last ? Math.min(.1, (now - last) / 1000) : 0; last = now; renderedAt = now;
    if (moving) time += delta;
    const beat = time * options.bpm / 60 * Math.PI;
    for (const d of dancers.values()) pose(d, beat); pose(dj, beat);
    beams.forEach((b, i) => { b.rotation.z = Math.sin(time * .22 + i * 1.3) * .65; b.rotation.x = -.6 + Math.cos(time * .2 + i) * .3; });
    bars.forEach((b, i) => { b.scale.y = .2 + (Math.sin(time * 2.1 + i * .7) + 1) * .6; });
    tiles.forEach((tile, i) => { (tile.material as T.MeshStandardMaterial).emissiveIntensity = .2 + (Math.sin(beat * .45 + i * .65) + 1) * .25; });
    dust.rotation.y = time * .007;
    pink.color.set(options.look === 'acid' ? '#cbff61' : '#df43ff'); pink.emissive.copy(pink.color);
    const selected = options.selected && dancers.get(options.selected);
    selection.visible = !!selected; if (selected) selection.position.set(selected.root.position.x, .06, selected.root.position.z);
    renderer.render(scene, camera);
  }
  const boothMat = boothFront.material;
  // Keep time frozen during hidden/paused intervals; user camera changes still draw.
  function schedule() { last = 0; renderer.setAnimationLoop(!disposed && !broken && visible && !document.hidden && !options.paused && !options.reduced ? render : null); if (visible && !document.hidden) render(performance.now()); }
  function resize() { const r = canvas.getBoundingClientRect(); if (!r.width || !r.height) return; renderer.setSize(r.width, r.height, false); camera.aspect = r.width / r.height; camera.updateProjectionMatrix(); render(performance.now()); }
  const observer = new ResizeObserver(resize); observer.observe(canvas);
  const intersection = new IntersectionObserver(entries => { visible = entries[0]?.isIntersecting ?? true; schedule(); }); intersection.observe(canvas);
  const raycaster = new T.Raycaster(), pointer = new T.Vector2(); let down = { x: 0, y: 0 };
  function hit(event: PointerEvent) {
    const r = canvas.getBoundingClientRect(); pointer.set((event.clientX - r.left) / r.width * 2 - 1, -(event.clientY - r.top) / r.height * 2 + 1);
    raycaster.setFromCamera(pointer, camera);
    const hits = raycaster.intersectObjects([...dancers.values()].map(d => d.root), true);
    let item: T.Object3D | null = hits[0]?.object ?? null;
    while (item && !item.userData.key) item = item.parent;
    return item?.userData.key as string | undefined;
  }
  const pointerDown = (e: PointerEvent) => { down = { x: e.clientX, y: e.clientY }; };
  const pointerUp = (e: PointerEvent) => { if (Math.hypot(e.clientX - down.x, e.clientY - down.y) < 6) { const key = hit(e); if (key) options.onSelect(key); } };
  const pointerMove = (e: PointerEvent) => { const key = hit(e); canvas.style.cursor = key ? 'pointer' : 'grab'; options.onHover(key); };
  const pointerLeave = () => options.onHover();
  const lost = (e: Event) => { e.preventDefault(); broken = true; renderer.setAnimationLoop(null); options.onFailure(); };
  const changed = () => render(performance.now());
  canvas.addEventListener('pointerdown', pointerDown); canvas.addEventListener('pointerup', pointerUp); canvas.addEventListener('pointermove', pointerMove); canvas.addEventListener('pointerleave', pointerLeave); canvas.addEventListener('webglcontextlost', lost);
  document.addEventListener('visibilitychange', schedule); controls.addEventListener('change', changed);
  reconcile(); setCamera(options.camera); resize(); schedule();
  return {
    update(next: ClubOptions) { const old = options; options = next; if (old.members !== next.members) reconcile(); if (old.camera !== next.camera) setCamera(next.camera); boothFront.material = next.look === 'acid' ? lime : boothMat; schedule(); },
    dispose() {
      disposed = true; renderer.setAnimationLoop(null); observer.disconnect(); intersection.disconnect(); controls.dispose();
      document.removeEventListener('visibilitychange', schedule); controls.removeEventListener('change', changed);
      canvas.removeEventListener('pointerdown', pointerDown); canvas.removeEventListener('pointerup', pointerUp); canvas.removeEventListener('pointermove', pointerMove); canvas.removeEventListener('pointerleave', pointerLeave); canvas.removeEventListener('webglcontextlost', lost);
      for (const g of geometries) g.dispose(); for (const m of materials) m.dispose(); for (const t of textures) t.dispose(); renderer.dispose(); scene.clear();
    }
  };
}
