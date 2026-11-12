import { describe, expect, it, vi } from 'vitest';
import { createSpotifyBridge, parseSpotify } from './spotify.js';
const snapshot = JSON.stringify({ available: true, connected: true, playing: true, title: 'A track', artist: 'An artist', duration: 240, position: 12, volume: 30 });
describe('Spotify desktop boundary', () => {
  it('validates every command before running a fixed native program and passes only canonical URIs', async () => {
    const run = vi.fn().mockResolvedValue(snapshot), bridge = createSpotifyBridge('darwin', run);
    for (const action of ['read', 'playpause', 'next', 'previous']) expect((await bridge.request({ action })).title).toBe('A track');
    await bridge.request({ action: 'playUri', uri: 'https://open.spotify.com/playlist/0123456789abcdefghijkl?si=123' });
    expect(run).toHaveBeenLastCalledWith('playUri', 'spotify:playlist:0123456789abcdefghijkl', expect.any(AbortSignal));
    const before = run.mock.calls.length;
    for (const input of [null, { action: 'exec' }, { action: 'playUri', uri: 'evil' }]) expect((await bridge.request(input)).connected).toBe(false);
    expect(run).toHaveBeenCalledTimes(before); bridge.dispose();
    expect((await bridge.request({ action: 'read' })).error).toMatch(/stopped/);
  });
  it('coalesces reads, rejects concurrent transport commands, and aborts on plugin disposal', async () => {
    let resolve!: (value: string) => void;
    const run = vi.fn((_a, _u, signal: AbortSignal) => new Promise<string>(r => { resolve = r; expect(signal.aborted).toBe(false); }));
    const bridge = createSpotifyBridge('darwin', run), first = bridge.request({ action: 'read' });
    expect(bridge.request({ action: 'read' })).toBe(first);
    expect((await bridge.request({ action: 'next' })).error).toMatch(/busy/);
    bridge.dispose(); expect(run.mock.calls[0][2].aborted).toBe(true);
    resolve(snapshot); await first; expect(run).toHaveBeenCalledTimes(1);
  });
  it('reports unsupported hosts, unavailable Spotify, corrupt output, and native permission failures honestly', async () => {
    const run = vi.fn(); expect((await createSpotifyBridge('linux', run).request({ action: 'read' })).error).toMatch(/Mac/); expect(run).not.toHaveBeenCalled();
    for (const raw of ['bad', 'null', '{}', JSON.stringify({ available: 'yes' })]) expect((await createSpotifyBridge('darwin', vi.fn().mockResolvedValue(raw)).request({ action: 'read' })).connected).toBe(false);
    expect((await createSpotifyBridge('darwin', vi.fn().mockRejectedValue(new Error('Permission denied'))).request({ action: 'read' })).error).toBe('Permission denied');
    expect((await createSpotifyBridge('darwin', vi.fn().mockRejectedValue(null)).request({ action: 'read' })).error).toBe('Spotify connection failed.');
    expect(parseSpotify('{"available":true,"connected":false,"error":"Open Spotify"}').error).toBe('Open Spotify');
    const value = parseSpotify(JSON.stringify({ available: true, connected: true, playing: 'true', title: 'x'.repeat(2000), duration: -1, position: 1e20, volume: 101, artist: null }));
    expect(value.title).toHaveLength(1000); expect(value.duration).toBe(0); expect(value.position).toBe(86400); expect(value.volume).toBe(100); expect(value.playing).toBe(false); expect(value.artist).toBe('');
  });
});
