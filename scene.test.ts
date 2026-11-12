// @vitest-environment jsdom
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
const state = vi.hoisted(() => ({ renderer: null as any, observers: [] as any[] }));
vi.mock('three', async original => {
  const actual = await original<typeof import('three')>();
  return { ...actual, WebGLRenderer: class {
    loop: ((now: number) => void) | null = null; scene: any; camera: any;
    setPixelRatio = vi.fn(); setClearColor = vi.fn(); setSize = vi.fn(); dispose = vi.fn();
    constructor() { state.renderer = this; }
    setAnimationLoop(fn: typeof this.loop) { this.loop = fn; }
    render(scene: any, camera: any) { this.scene = scene; this.camera = camera; scene.updateMatrixWorld(); camera.updateMatrixWorld(); }
  } };
});
vi.mock('three/examples/jsm/controls/OrbitControls.js', async () => {
  const T = await import('three');
  return { OrbitControls: class extends T.EventDispatcher {
    target = new T.Vector3(); constructor(public camera: any) { super(); }
    update() { this.camera.lookAt(this.target); } dispose = vi.fn();
  } };
});
import * as T from 'three';
import { createClub, type ClubOptions } from './scene.js';
const members = (n: number) => Array.from({ length: n }, (_, i) => ({ key: `thread:${i}`, live: true, harness: 'Codex', status: i === 0 ? 'needs-you' : 'working' } as any));
const options = (): ClubOptions => ({ members: members(4), paused: false, reduced: false, camera: 'floor', look: 'ultraviolet', bpm: 128, onSelect: vi.fn(), onHover: vi.fn(), onFailure: vi.fn() });
beforeEach(() => {
  state.observers = [];
  const observer = class { disconnect = vi.fn(); observe = vi.fn(); constructor(public callback: (entries: any[]) => void) { state.observers.push(this); } };
  vi.stubGlobal('ResizeObserver', observer); vi.stubGlobal('IntersectionObserver', observer);
  vi.spyOn(HTMLCanvasElement.prototype, 'getContext').mockReturnValue({ fillText: vi.fn() } as any);
});
afterEach(() => { vi.restoreAllMocks(); vi.unstubAllGlobals(); });
function canvas() {
  const c = document.createElement('canvas'); document.body.append(c);
  c.getBoundingClientRect = () => ({ width: 1000, height: 650, left: 0, top: 0 } as DOMRect); return c;
}
describe('Three.js room lifecycle and identity', () => {
  it('creates a real scene, animates only live identities, respects the drawing budget and releases all resources', () => {
    const c = canvas(), initial = options(), club = createClub(c, initial), r = state.renderer;
    const roots = () => r.scene.children.filter((o: T.Object3D) => o.userData.key);
    expect(roots()).toHaveLength(4); expect(r.loop).toBeTypeOf('function');
    const now = performance.now(); r.loop(now + 100); r.loop(now + 110); r.loop(now + 200);
    const before = roots()[1].position.y;
    r.loop(now + 900); expect(roots()[1].position.y).not.toBe(before);
    club.update({ ...initial, members: members(100), selected: 'thread:2', camera: 'balcony', look: 'acid' }); expect(roots()).toHaveLength(80);
    club.update({ ...initial, members: [{ ...initial.members[0], harness: 'Claude Code' }], camera: 'booth', selected: 'missing' }); expect(roots()).toHaveLength(1);
    club.update({ ...initial, members: [], paused: true }); expect(roots()).toHaveLength(0); expect(r.loop).toBeNull();
    const dispose = vi.spyOn(T.BufferGeometry.prototype, 'dispose'); club.dispose(); expect(dispose).toHaveBeenCalled(); expect(r.dispose).toHaveBeenCalledOnce(); expect(state.observers.every(o => o.disconnect.mock.calls.length === 1)).toBe(true);
  });
  it('opens only real hit identities, ignores drags and reports context loss', () => {
    const c = canvas(), initial = options(), club = createClub(c, initial), r = state.renderer;
    const root = r.scene.children.find((o: T.Object3D) => o.userData.key === 'thread:1');
    const hits = vi.spyOn(T.Raycaster.prototype, 'intersectObjects').mockReturnValue([{ object: root.children[0] }] as any);
    const pointer = (type: string, x: number) => c.dispatchEvent(new MouseEvent(type, { clientX: x, clientY: 200 }));
    pointer('pointermove', 200); expect(initial.onHover).toHaveBeenCalledWith('thread:1');
    pointer('pointerdown', 200); pointer('pointerup', 200); expect(initial.onSelect).toHaveBeenCalledWith('thread:1');
    pointer('pointerdown', 200); pointer('pointerup', 250); expect(initial.onSelect).toHaveBeenCalledTimes(1);
    hits.mockReturnValue([]); pointer('pointermove', 200); c.dispatchEvent(new Event('pointerleave')); expect(initial.onHover).toHaveBeenLastCalledWith();
    const event = new Event('webglcontextlost', { cancelable: true }); c.dispatchEvent(event); expect(event.defaultPrevented).toBe(true); expect(initial.onFailure).toHaveBeenCalledOnce(); expect(r.loop).toBeNull();
    club.update({ ...initial, look: 'acid' }); expect(r.loop).toBeNull(); club.dispose();
  });
  it('moves live identities between zones, keeps idle and attention guests still, and removes exits', () => {
    const c = canvas(), initial = { ...options(), members: [{ ...members(2)[1], status: 'idle' }] }, club = createClub(c, initial), r = state.renderer;
    const root = () => r.scene.children.find((o: T.Object3D) => o.userData.key === 'thread:1');
    const idleRoot = root(); expect(idleRoot.userData.zone).toBe('bar'); expect(idleRoot.position.x).toBeLessThan(-8);
    const pose = () => JSON.stringify([idleRoot.position, idleRoot.rotation, idleRoot.children.map((o: T.Object3D) => o.rotation)]);
    const now = performance.now(), idlePose = pose(); r.loop(now + 200); r.loop(now + 500); expect(pose()).toBe(idlePose);
    const update = (status: string, live = true) => club.update({ ...initial, members: [{ ...initial.members[0], status, live }] } as ClubOptions);
    update('working'); expect(root()).toBe(idleRoot); expect(root().userData.zone).toBe('floor'); expect(root().position.x).toBe(0);
    const workingPose = pose(); r.loop(now + 800); r.loop(now + 900); expect(pose()).not.toBe(workingPose);
    update('needs-you'); expect(root().userData.zone).toBe('booth'); expect(root().position.z).toBeLessThan(-4);
    const attentionRoot = root(), attentionPose = JSON.stringify(attentionRoot.rotation); r.loop(now + 1100); expect(JSON.stringify(attentionRoot.rotation)).toBe(attentionPose);
    expect(attentionRoot.children.filter((o: T.Object3D) => o instanceof T.Group)[0].rotation.z).toBe(2.3);
    update('idle'); expect(root().userData.zone).toBe('bar'); expect(root().position.y).toBe(0);
    expect(root().children.filter((o: T.Object3D) => o instanceof T.Group)[0].rotation.z).toBe(.12);
    update('done', false); expect(root()).toBeUndefined(); club.dispose();
  });
  it('stops hidden and offscreen loops and freezes motion on pause and reduced motion', () => {
    const c = canvas(), initial = options(), club = createClub(c, initial), r = state.renderer;
    state.observers[1].callback([{ isIntersecting: false }]); expect(r.loop).toBeNull();
    state.observers[1].callback([{ isIntersecting: true }]); expect(r.loop).toBeTypeOf('function');
    const hidden = vi.spyOn(document, 'hidden', 'get').mockReturnValue(true); document.dispatchEvent(new Event('visibilitychange')); expect(r.loop).toBeNull();
    hidden.mockReturnValue(false); document.dispatchEvent(new Event('visibilitychange')); expect(r.loop).toBeTypeOf('function');
    club.update({ ...initial, paused: true }); expect(r.loop).toBeNull(); club.update({ ...initial, reduced: true }); expect(r.loop).toBeNull();
    c.getBoundingClientRect = () => ({ width: 0, height: 0 } as DOMRect); state.observers[0].callback([]); club.dispose();
  });
});
