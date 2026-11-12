// @vitest-environment jsdom
import { act, cleanup, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import type { PluginAgentsViewProps } from '@zana-ai/zcc-plugin-sdk/app';
const mock = vi.hoisted(() => ({ options: {} as any, dispose: vi.fn(), fail: false, rpc: { call: vi.fn() }, reduced: false, mediaListener: undefined as (() => void) | undefined }));
vi.mock('./scene.js', () => ({ createClub: (_canvas: unknown, options: unknown) => { if (mock.fail) throw new Error('No WebGL'); mock.options = options; return { update: (value: unknown) => { mock.options = value; }, dispose: mock.dispose }; } }));
vi.mock('@zana-ai/zcc-plugin-sdk/app', () => ({ definePluginApp: (setup: unknown) => ({ setup }), useRpc: () => mock.rpc }));
import definition, { AgentRave, RaveClub } from './rave-app.js';
import { DISCONNECTED } from './model.js';
const data = (count = 3): PluginAgentsViewProps => ({ projectId: null, projects: [{ id: 'p', name: 'Test project' }], members: Array.from({ length: count }, (_, i) => ({ key: `thread:${i}`, kind: 'thread', title: `Agent ${i}`, projectId: 'p', live: i !== 2, status: i === 0 ? 'working' : i === 2 ? 'done' : 'needs-you', scheduled: false, detail: '', harness: 'Codex' })), schedules: [], executions: [], includeScheduled: true, searchQuery: '', onInspect: vi.fn() });
beforeEach(() => { mock.fail = false; mock.reduced = false; mock.rpc.call.mockReset(); Object.defineProperty(window, 'matchMedia', { configurable: true, value: () => ({ get matches() { return mock.reduced; }, addEventListener: (_name: string, fn: () => void) => { mock.mediaListener = fn; }, removeEventListener: vi.fn() }) }); });
afterEach(() => { cleanup(); vi.useRealTimers(); });
describe('Agent Rave', () => {
  it('registers only the host fleet view and works on older hosts without the slot', () => {
    const experimental_agentsView = vi.fn(), navPanel = vi.fn(); definition.setup({ slots: { experimental_agentsView, navPanel } } as any);
    expect(experimental_agentsView).toHaveBeenCalledWith(expect.objectContaining({ id: 'rave', title: 'Rave', component: AgentRave }));
    definition.setup({ slots: { navPanel } } as any); expect(navPanel).not.toHaveBeenCalled();
  });
  it('keeps real identities inspectable, filters status and searches, then restores focus on Escape', () => {
    const props = data(); render(<RaveClub {...props}/>);
    expect(screen.getByRole('button', { name: '2 in the club' })).toBeTruthy();
    fireEvent.click(screen.getByRole('button', { name: /Guest list/ }));
    expect(document.activeElement).toBe(screen.getByLabelText('Search guests'));
    fireEvent.click(screen.getByRole('button', { name: 'Inspect Agent 1, Needs you' })); expect(props.onInspect).toHaveBeenCalledWith('thread:1');
    act(() => { mock.options.onHover('thread:0'); mock.options.onSelect('thread:0'); }); expect(props.onInspect).toHaveBeenLastCalledWith('thread:0');
    expect(screen.getByText('Working · On the dance floor · Click to inspect')).toBeTruthy();
    fireEvent.click(screen.getByRole('button', { name: '1 working' })); expect(screen.queryByRole('button', { name: /Inspect Agent 1/ })).toBeNull();
    fireEvent.click(screen.getByRole('button', { name: /Clear status/ }));
    fireEvent.click(screen.getByRole('button', { name: 'All sessions' })); expect(screen.getByRole('button', { name: 'Inspect Agent 2, Exited' })).toBeTruthy();
    fireEvent.change(screen.getByLabelText('Search guests'), { target: { value: 'nope' } }); expect(screen.getByText('No matching guests.')).toBeTruthy();
    fireEvent.change(screen.getByLabelText('Search guests'), { target: { value: 'Test project' } }); expect(screen.getAllByRole('button', { name: /Inspect Agent/ })).toHaveLength(3);
    fireEvent.keyDown(screen.getByLabelText('Search guests'), { key: 'Escape' }); expect(screen.queryByLabelText('Club guest list')).toBeNull(); expect(document.activeElement).toBe(screen.getByRole('button', { name: /Guest list/ }));
    fireEvent.click(screen.getByRole('button', { name: '1 need attention' })); expect(screen.getAllByRole('button', { name: /Inspect Agent/ })).toHaveLength(1);
  });
  it('keeps idle guests inspectable at the bar and reacts when they start and finish work', () => {
    const props = data(1), idle = { ...props.members[0], status: 'idle' as const };
    const { rerender } = render(<RaveClub {...props} members={[idle]}/>);
    expect(screen.getByRole('button', { name: '0 working' })).toBeTruthy();
    expect(screen.getByText('No agents working right now.')).toBeTruthy();
    fireEvent.click(screen.getByRole('button', { name: '1 idle at the bar' }));
    expect(screen.getByText('Idle · At the bar')).toBeTruthy();
    fireEvent.click(screen.getByRole('button', { name: 'Inspect Agent 0, Idle' })); expect(props.onInspect).toHaveBeenCalledWith(idle.key);
    rerender(<RaveClub {...props}/>);
    expect(screen.getByRole('button', { name: '1 working' })).toBeTruthy();
    expect(screen.queryByText('No agents working right now.')).toBeNull();
    expect(screen.queryByRole('button', { name: 'Inspect Agent 0, Idle' })).toBeNull();
    fireEvent.click(screen.getByRole('button', { name: /Clear status/ })); expect(screen.getByText('Working · On the dance floor')).toBeTruthy();
    rerender(<RaveClub {...props} members={[idle]}/>); expect(screen.getByText('Idle · At the bar')).toBeTruthy();
    fireEvent.click(screen.getByRole('button', { name: 'All sessions' }));
    rerender(<RaveClub {...props} members={[{ ...idle, live: false, status: 'done' }]}/>);
    expect(screen.getByText('Exited · Off the floor')).toBeTruthy();
  });
  it('switches cameras, palettes, tempo and pause while reacting to reduced motion', () => {
    const view = render(<RaveClub {...data()}/>);
    fireEvent.click(screen.getByRole('button', { name: 'Balcony' })); expect(mock.options.camera).toBe('balcony');
    fireEvent.click(screen.getByRole('button', { name: 'Behind the DJ' })); expect(mock.options.camera).toBe('booth');
    fireEvent.click(screen.getByRole('button', { name: 'Dance floor' })); expect(mock.options.camera).toBe('floor');
    fireEvent.click(screen.getByRole('button', { name: 'Acid' })); expect(screen.getByTestId('agent-rave').getAttribute('data-look')).toBe('acid');
    fireEvent.click(screen.getByRole('button', { name: 'Ultraviolet' })); expect(mock.options.look).toBe('ultraviolet');
    fireEvent.change(screen.getByLabelText('Scene tempo'), { target: { value: '140' } }); expect(mock.options.bpm).toBe(140);
    fireEvent.click(screen.getByRole('button', { name: /Pause motion/ })); expect(mock.options.paused).toBe(true);
    fireEvent.click(screen.getByRole('button', { name: /Resume motion/ })); expect(mock.options.paused).toBe(false);
    mock.reduced = true; act(() => mock.mediaListener?.()); expect(screen.getByRole('button', { name: 'Reduced motion' }).hasAttribute('disabled')).toBe(true);
    view.unmount(); expect(mock.dispose).toHaveBeenCalled();
  });
  it('preserves full population during host search and pages every guest beyond the drawing cap', () => {
    const props = data(100); props.population = { members: props.members.map(m => ({ ...m, live: true })), schedules: [], executions: [] };
    const { rerender } = render(<RaveClub {...props}/>); expect(mock.options.members).toHaveLength(100);
    fireEvent.click(screen.getByRole('button', { name: /Guest list/ })); expect(screen.getAllByRole('button', { name: /Inspect Agent/ })).toHaveLength(24);
    expect(screen.getByText(/all 100 are listed/)).toBeTruthy();
    fireEvent.click(screen.getByRole('button', { name: 'Next guests' })); expect(screen.getByText('2 / 5')).toBeTruthy();
    fireEvent.click(screen.getByRole('button', { name: 'Previous guests' })); expect(screen.getByText('1 / 5')).toBeTruthy();
    rerender(<RaveClub {...props} searchQuery="Agent 99" members={[props.members[99]]}/>); expect(mock.options.members).toHaveLength(100); expect(screen.getAllByRole('button', { name: /Inspect Agent/ })).toHaveLength(1);
    rerender(<RaveClub {...data(0)}/>); expect(screen.getByText('The floor is yours.')).toBeTruthy(); expect(screen.getByText('No agents here yet.')).toBeTruthy();
  });
  it('keeps the complete roster when WebGL is unavailable or lost', () => {
    mock.fail = true; render(<RaveClub {...data()}/>); expect(screen.getByText('The dance floor needs WebGL.')).toBeTruthy(); fireEvent.click(screen.getByRole('button', { name: 'Open guest list' })); expect(screen.getAllByRole('button', { name: /Inspect Agent/ })).toHaveLength(2);
    cleanup(); mock.fail = false; render(<RaveClub {...data()}/>); act(() => mock.options.onFailure()); expect(screen.getByText('The dance floor needs WebGL.')).toBeTruthy();
  });
  it('controls actual playback and canonicalizes music links without pretending a connection', () => {
    const onMusic = vi.fn(), disconnect = vi.fn(), props = data();
    const { rerender } = render(<RaveClub {...props} onMusic={onMusic}/>); fireEvent.click(screen.getByRole('button', { name: /Connect Spotify/ })); expect(onMusic).toHaveBeenCalledWith('read');
    const music = { ...DISCONNECTED, available: true, connected: true, playing: true, title: 'Real track', artist: 'Artist', duration: 240, position: 90 };
    rerender(<RaveClub {...props} music={music} onMusic={onMusic} onDisconnect={disconnect}/>);
    expect(screen.getByText('Real track')).toBeTruthy();
    fireEvent.click(screen.getByRole('button', { name: 'Pause Spotify' })); expect(onMusic).toHaveBeenLastCalledWith('playpause');
    fireEvent.click(screen.getByRole('button', { name: 'Next track' })); expect(onMusic).toHaveBeenLastCalledWith('next');
    fireEvent.click(screen.getByRole('button', { name: 'Previous track' })); expect(onMusic).toHaveBeenLastCalledWith('previous');
    fireEvent.click(screen.getByRole('button', { name: /Choose music/ })); fireEvent.click(screen.getByRole('button', { name: 'Play in Spotify' })); expect(screen.getByRole('alert').textContent).toMatch(/Paste a Spotify/);
    fireEvent.change(screen.getByLabelText('Spotify link'), { target: { value: 'https://open.spotify.com/track/0123456789abcdefghijkl' } }); fireEvent.click(screen.getByRole('button', { name: 'Play in Spotify' })); expect(onMusic).toHaveBeenLastCalledWith('playUri', 'spotify:track:0123456789abcdefghijkl');
    fireEvent.click(screen.getByRole('button', { name: /Choose music/ })); fireEvent.click(screen.getByRole('button', { name: 'Close music picker' }));
    expect(document.activeElement).toBe(screen.getByRole('button', { name: 'Choose music' }));
    fireEvent.click(screen.getByRole('button', { name: 'Choose music' }));
    fireEvent.keyDown(screen.getByLabelText('Spotify link'), { key: 'Escape' });
    expect(screen.queryByLabelText('Spotify link')).toBeNull();
    expect(document.activeElement).toBe(screen.getByRole('button', { name: 'Choose music' }));
    fireEvent.click(screen.getByRole('button', { name: 'Choose music' }));
    fireEvent.click(screen.getByRole('button', { name: 'Disconnect Spotify' })); expect(disconnect).toHaveBeenCalled();
    expect(screen.queryByLabelText('Spotify link')).toBeNull();
    rerender(<RaveClub {...props} music={{ ...music, playing: false, title: '', artist: '', error: 'Permission needed' }}/>) ; expect(screen.getByRole('button', { name: 'Play Spotify' })).toBeTruthy(); expect(screen.getByText('Nothing queued')).toBeTruthy(); expect(screen.getByText('Permission needed')).toBeTruthy();
    rerender(<RaveClub {...props} busy={true}/>); expect(screen.getByRole('button', { name: 'Connecting…' }).hasAttribute('disabled')).toBe(true);
  });
});

describe('opt-in Spotify polling', () => {
  it('starts only after connection, skips hidden tabs, disconnects and ignores late responses', async () => {
    vi.useFakeTimers(); mock.rpc.call.mockResolvedValue({ ...DISCONNECTED, connected: true, title: 'Native track' });
    const { unmount } = render(<AgentRave {...data()}/>); expect(mock.rpc.call).not.toHaveBeenCalled();
    fireEvent.click(screen.getByRole('button', { name: /Connect Spotify/ })); await act(async () => {}); expect(screen.getByText('Native track')).toBeTruthy();
    await act(async () => { vi.advanceTimersByTime(4000); }); expect(mock.rpc.call).toHaveBeenCalledTimes(2);
    const hidden = vi.spyOn(document, 'hidden', 'get').mockReturnValue(true);
    await act(async () => { vi.advanceTimersByTime(4000); }); expect(mock.rpc.call).toHaveBeenCalledTimes(2); hidden.mockRestore();
    fireEvent.click(screen.getByRole('button', { name: 'Disconnect Spotify' })); await act(async () => { vi.advanceTimersByTime(8000); }); expect(mock.rpc.call).toHaveBeenCalledTimes(2);
    let resolve!: (value: unknown) => void; mock.rpc.call.mockReturnValue(new Promise(r => { resolve = r; })); fireEvent.click(screen.getByRole('button', { name: /Connect Spotify/ })); unmount(); await act(async () => { resolve({ ...DISCONNECTED, connected: true }); }); expect(vi.getTimerCount()).toBe(0);
  });
  it('shows RPC failures and stops polling after an unavailable connection', async () => {
    mock.rpc.call.mockRejectedValue(new Error('offline')); render(<AgentRave {...data()}/>); fireEvent.click(screen.getByRole('button', { name: /Connect Spotify/ })); await act(async () => {}); expect(screen.getByText(/Spotify connection failed/)).toBeTruthy();
    mock.rpc.call.mockResolvedValue({ ...DISCONNECTED, error: 'Open Spotify' }); fireEvent.click(screen.getByRole('button', { name: /Connect Spotify/ })); await act(async () => {}); expect(screen.getByText('Open Spotify')).toBeTruthy();
  });
});
