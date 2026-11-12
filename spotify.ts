import { captureProcess } from './capture.js';
import { DISCONNECTED, spotifyUri, type SpotifyState } from './model.js';

// Fixed script, positional arguments, no shell or renderer-provided program text.
export const SPOTIFY_SCRIPT = `function run(argv) {
  var app = Application('com.spotify.client');
  if (!app.running()) return JSON.stringify({ available: true, connected: false, error: 'Open Spotify on this Mac, then connect again.' });
  var action = argv[0];
  if (action === 'playpause') app.playpause();
  else if (action === 'next') app.nextTrack();
  else if (action === 'previous') app.previousTrack();
  else if (action === 'playUri') app.playTrack(argv[1]);
  var state = app.playerState(), track = app.currentTrack;
  function text(read) { try { return String(read() || '').slice(0, 1000); } catch (_) { return ''; } }
  function number(read) { try { return Number(read()) || 0; } catch (_) { return 0; } }
  return JSON.stringify({ available: true, connected: true, playing: state === 'playing',
    title: text(function() { return track.name(); }), artist: text(function() { return track.artist(); }), album: text(function() { return track.album(); }),
    duration: number(function() { return track.duration(); }) / 1000, position: number(function() { return app.playerPosition(); }), volume: number(function() { return app.soundVolume(); }) });
}`;
export type NativeRunner = (action: string, uri: string | undefined, signal: AbortSignal) => Promise<string>;
export function parseSpotify(raw: string): SpotifyState {
  const value = JSON.parse(raw) as Record<string, unknown>;
  if (!value || typeof value !== 'object' || typeof value.available !== 'boolean' || typeof value.connected !== 'boolean') throw new Error('Spotify returned an invalid response.');
  const text = (name: string) => typeof value[name] === 'string' ? (value[name] as string).slice(0, 1000) : '';
  const number = (name: string, max: number) => typeof value[name] === 'number' && Number.isFinite(value[name]) ? Math.min(max, Math.max(0, value[name] as number)) : 0;
  return { available: value.available, connected: value.connected, playing: value.connected && value.playing === true, title: text('title'), artist: text('artist'), album: text('album'), duration: number('duration', 86400), position: number('position', 86400), volume: number('volume', 100), ...(text('error') ? { error: text('error') } : {}) };
}
export function createSpotifyBridge(platform = process.platform, run: NativeRunner = (action, uri, signal) => captureProcess('/usr/bin/osascript', ['-l', 'JavaScript', '-e', SPOTIFY_SCRIPT, action, ...(uri ? [uri] : [])], { signal })) {
  const controller = new AbortController();
  let pending: Promise<SpotifyState> | undefined;
  const fail = (error: string): SpotifyState => ({ ...DISCONNECTED, available: platform === 'darwin', error });
  return {
    request(input: unknown): Promise<SpotifyState> {
      if (controller.signal.aborted) return Promise.resolve(fail('Spotify connection stopped.'));
      const args = input && typeof input === 'object' ? input as Record<string, unknown> : {};
      if (!['read', 'playpause', 'next', 'previous', 'playUri'].includes(args.action as string)) return Promise.resolve(fail('Unknown Spotify control.'));
      const uri = args.action === 'playUri' ? spotifyUri(args.uri) : undefined;
      if (uri === null) return Promise.resolve(fail('Use a Spotify track, album, or playlist link.'));
      if (platform !== 'darwin') return Promise.resolve(fail('Spotify desktop controls currently require Zana running on a Mac.'));
      if (pending) return args.action === 'read' ? pending : Promise.resolve(fail('Spotify is busy. Try again in a moment.'));
      pending = run(args.action as string, uri, controller.signal).then(parseSpotify).catch(error => fail(error instanceof Error ? error.message : 'Spotify connection failed.')).finally(() => { pending = undefined; });
      return pending;
    },
    dispose() { controller.abort(); return pending?.then(() => undefined); }
  };
}
