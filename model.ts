import type { PluginFleetMember } from '@zana-ai/zcc-plugin-sdk/app';

export type Camera = 'floor' | 'balcony' | 'booth';
export type Look = 'ultraviolet' | 'acid';
export const STATUS = { working: 'Working', 'needs-you': 'Needs you', idle: 'Idle', done: 'Exited', error: 'Error', unknown: 'Unknown' } as const;
export const MAX_DANCERS = 80, PAGE_SIZE = 24;
export function hash(key: string): number {
  let value = 2166136261;
  for (let i = 0; i < key.length; i++) value = Math.imul(value ^ key.charCodeAt(i), 16777619);
  return value >>> 0;
}
export function agentColor(member: PluginFleetMember): string {
  if (member.status === 'needs-you' || member.status === 'error') return '#ffbe55';
  return /codex/i.test(member.harness ?? '') ? '#78f8c5' : /claude/i.test(member.harness ?? '') ? '#ffab91' : '#b9a0ff';
}
/** Only real, live sessions enter the club. Plans and run summaries are never guests. */
export function clubMembers(members: readonly PluginFleetMember[]): PluginFleetMember[] {
  const unique = new Map<string, PluginFleetMember>();
  for (const member of members) if (member.live) unique.set(member.key, member);
  return [...unique.values()].sort((a, b) => a.key.localeCompare(b.key));
}
export function danceFloor(members: readonly PluginFleetMember[]): PluginFleetMember[] {
  return clubMembers(members).filter(member => member.status === 'working');
}
export type ClubZone = 'floor' | 'bar' | 'booth';
export const ZONE_LABEL: Record<ClubZone, string> = { floor: 'On the dance floor', bar: 'At the bar', booth: 'Near the DJ' };
export function clubZone(member: PluginFleetMember): ClubZone {
  return member.status === 'working' ? 'floor' : member.status === 'needs-you' || member.status === 'error' ? 'booth' : 'bar';
}
/** Keep the floor available to workers; a large idle roster must not displace them. */
export function clubLayout(members: readonly PluginFleetMember[]) {
  const live = clubMembers(members), floor = danceFloor(live).slice(0, MAX_DANCERS);
  const booth = live.filter(member => clubZone(member) === 'booth').slice(0, Math.min(8, MAX_DANCERS - floor.length));
  const bar = live.filter(member => clubZone(member) === 'bar').slice(0, Math.min(12, MAX_DANCERS - floor.length - booth.length));
  const cols = Math.max(1, Math.min(floor.length, 9, Math.ceil(Math.sqrt(floor.length * 1.45)))), rows = Math.ceil(floor.length / cols);
  return [
    ...floor.map((member, i) => ({ member, zone: 'floor' as const, x: (i % cols - (cols - 1) / 2) * Math.min(2.1, 15 / cols), z: -2.7 + Math.floor(i / cols) * Math.min(2.2, 12 / rows), scale: floor.length > 40 ? .72 : .92 })),
    ...booth.map((member, i) => ({ member, zone: 'booth' as const, x: (i - (booth.length - 1) / 2) * 1.5, z: -4.5, scale: .85 })),
    ...bar.map((member, i) => ({ member, zone: 'bar' as const, x: -9.7 + Math.floor(i / 6) * 1.5, z: -1.5 + i % 6 * 1.9, scale: .85 }))
  ];
}
export function spotifyUri(input: unknown): string | null {
  if (typeof input !== 'string' || input.length > 500) return null;
  const value = input.trim();
  const uri = /^spotify:(track|album|playlist):([A-Za-z0-9]{22})$/.exec(value);
  if (uri) return value;
  try {
    const url = new URL(value);
    if (url.protocol !== 'https:' || url.hostname !== 'open.spotify.com' || url.username || url.password || url.port) return null;
    const match = /^\/(track|album|playlist)\/([A-Za-z0-9]{22})\/?$/.exec(url.pathname);
    return match ? `spotify:${match[1]}:${match[2]}` : null;
  } catch { return null; }
}
export type SpotifyState = {
  available: boolean; connected: boolean; playing: boolean;
  title: string; artist: string; album: string; position: number; duration: number; volume: number;
  error?: string;
};
export const DISCONNECTED: SpotifyState = { available: false, connected: false, playing: false, title: '', artist: '', album: '', position: 0, duration: 0, volume: 0 };
export function timeLabel(seconds: number): string {
  const safe = Math.max(0, Number.isFinite(seconds) ? Math.floor(seconds) : 0);
  return `${Math.floor(safe / 60)}:${String(safe % 60).padStart(2, '0')}`;
}
