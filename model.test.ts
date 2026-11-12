import { describe, expect, it } from 'vitest';
import { agentColor, clubLayout, clubMembers, clubZone, danceFloor, hash, spotifyUri, timeLabel } from './model.js';
const member = { key: 'thread:1', live: true, harness: 'Codex', status: 'working' } as any;
describe('truthful club population', () => {
  it('deduplicates live identities, excludes exited sessions, and sorts independently of arrival order', () => {
    expect(danceFloor([{ ...member, key: 'z' }, member, { ...member, key: 'gone', live: false }, member]).map(m => m.key)).toEqual(['thread:1', 'z']);
    const idle = { ...member, key: 'idle', status: 'idle' }, attention = { ...member, key: 'attention', status: 'needs-you' };
    expect(clubMembers([idle, attention, member, idle]).map(m => m.key)).toEqual(['attention', 'idle', 'thread:1']);
    expect(danceFloor([idle, attention, member])).toEqual([member]);
    expect(hash('thread:1')).toBe(hash('thread:1')); expect(hash('thread:1')).not.toBe(hash('thread:2'));
    expect(agentColor(member)).toBe('#78f8c5'); expect(agentColor({ ...member, harness: 'Claude Code' })).toBe('#ffab91'); expect(agentColor({ ...member, harness: undefined })).toBe('#b9a0ff');
    for (const status of ['needs-you', 'error']) expect(agentColor({ ...member, status })).toBe('#ffbe55');
  });
  it('places only working agents on the floor and keeps all other live statuses off it', () => {
    for (const [status, zone] of [['working', 'floor'], ['idle', 'bar'], ['unknown', 'bar'], ['done', 'bar'], ['needs-you', 'booth'], ['error', 'booth']]) {
      const guest = { ...member, status };
      expect(clubZone(guest)).toBe(zone);
      expect(clubLayout([guest])[0].zone).toBe(zone);
    }
    expect(clubLayout([{ ...member, live: false }])).toEqual([]);
    expect(clubLayout([member])[0]).toMatchObject({ x: 0, zone: 'floor' });
  });
  it('prioritizes workers over large idle rosters while keeping zones bounded and deterministic', () => {
    const idle = Array.from({ length: 150 }, (_, i) => ({ ...member, key: `a-idle:${i}`, status: 'idle' }));
    const attention = Array.from({ length: 20 }, (_, i) => ({ ...member, key: `attention:${i}`, status: 'error' }));
    const working = Array.from({ length: 90 }, (_, i) => ({ ...member, key: `z-working:${i}` }));
    const sparse = clubLayout([...idle, ...attention, ...working.slice(0, 3)]);
    expect(sparse.filter(p => p.zone === 'floor')).toHaveLength(3);
    expect(sparse.filter(p => p.zone === 'bar')).toHaveLength(12);
    expect(sparse.filter(p => p.zone === 'booth')).toHaveLength(8);
    expect(sparse.filter(p => p.zone === 'bar').every(p => p.x < -8)).toBe(true);
    expect(sparse.filter(p => p.zone === 'booth').every(p => p.z < -4)).toBe(true);
    expect(clubLayout([...working.slice(0, 3), ...idle.reverse(), ...attention.reverse()])).toEqual(sparse);
    const packed = clubLayout([...idle, ...attention, ...working]);
    expect(packed).toHaveLength(80); expect(packed.every(p => p.zone === 'floor' && p.scale === .72)).toBe(true);
    const limited = clubLayout([...idle, ...attention, ...working.slice(0, 75)]);
    expect(limited).toHaveLength(80); expect(limited.filter(p => p.zone === 'booth')).toHaveLength(5);
    expect(clubLayout([...working.slice(0, 75), ...idle]).filter(p => p.zone === 'bar')).toHaveLength(5);
  });
  it('accepts only first-party music links and strips tracking parameters', () => {
    const id = '0123456789abcdefghijkl';
    for (const type of ['track', 'album', 'playlist']) {
      expect(spotifyUri(` https://open.spotify.com/${type}/${id}?si=tracking `)).toBe(`spotify:${type}:${id}`);
      expect(spotifyUri(`spotify:${type}:${id}`)).toBe(`spotify:${type}:${id}`);
    }
    for (const value of [null, {}, 'x'.repeat(501), '', 'javascript:alert(1)', 'http://open.spotify.com/track/'+id, 'https://open.spotify.com.evil.test/track/'+id, 'https://user:pass@open.spotify.com/track/'+id, 'https://open.spotify.com:99/track/'+id, 'https://open.spotify.com/show/'+id, 'spotify:track:bad', 'https://open.spotify.com/track/'+id+'/extra']) expect(spotifyUri(value)).toBeNull();
    expect(timeLabel(137.7)).toBe('2:17'); expect(timeLabel(-1)).toBe('0:00'); expect(timeLabel(NaN)).toBe('0:00');
  });
});
