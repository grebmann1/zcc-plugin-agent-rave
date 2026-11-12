import { useEffect, useMemo, useRef, useState } from 'react';
import { definePluginApp, type PluginAgentsViewProps } from '@zana-ai/zcc-plugin-sdk/app';
import { createClub, type ClubOptions } from './scene.js';
import { agentColor, clubLayout, clubMembers, clubZone, DISCONNECTED, PAGE_SIZE, STATUS, ZONE_LABEL, type Camera, type Look } from './model.js';
import { useSpotify } from './use-spotify.js';
import { styles } from './styles.js';
import { SpotifyPlayer, type MusicProps } from './spotify-player.js';
export type { MusicAction, MusicProps } from './spotify-player.js';

export function AgentRave(props: PluginAgentsViewProps) {
  const spotify = useSpotify();
  return <RaveClub key={props.projectId ?? 'global'} {...props} {...spotify}/>;
}
export function RaveClub(props: PluginAgentsViewProps & Partial<MusicProps>) {
  const { music = DISCONNECTED, busy = false, connected = false, onMusic = () => {}, onDisconnect = () => {} } = props;
  const population = props.population ?? props;
  const members = useMemo(() => clubMembers(population.members), [population.members]);
  const illustrated = useMemo(() => clubLayout(members).length, [members]);
  const [camera, setCamera] = useState<Camera>('floor'), [look, setLook] = useState<Look>('ultraviolet');
  const [paused, setPaused] = useState(false), [reduced, setReduced] = useState(() => window.matchMedia?.('(prefers-reduced-motion: reduce)').matches ?? false);
  const [bpm, setBpm] = useState(128), [roster, setRoster] = useState(false), [all, setAll] = useState(false);
  const [filter, setFilter] = useState('all'), [search, setSearch] = useState(''), [pageChoice, setPage] = useState(0);
  const [hovered, setHovered] = useState<string>(), [selected, setSelected] = useState<string>();
  const [available, setAvailable] = useState(true);
  const canvas = useRef<HTMLCanvasElement>(null), club = useRef<ReturnType<typeof createClub> | null>(null);
  const rosterButton = useRef<HTMLButtonElement>(null), rosterSearch = useRef<HTMLInputElement>(null);
  const options: ClubOptions = { members, paused, reduced, camera, look, bpm, selected,
    onSelect: key => { setSelected(key); props.onInspect(key); }, onHover: setHovered, onFailure: () => setAvailable(false) };
  const latest = useRef(options); latest.current = options;
  useEffect(() => {
    const media = window.matchMedia?.('(prefers-reduced-motion: reduce)');
    const change = () => setReduced(media?.matches ?? false); media?.addEventListener('change', change);
    return () => media?.removeEventListener('change', change);
  }, []);
  useEffect(() => {
    try { club.current = createClub(canvas.current!, latest.current); }
    catch { setAvailable(false); }
    return () => { club.current?.dispose(); club.current = null; };
  }, []);
  useEffect(() => { club.current?.update(options); }, [members, paused, reduced, camera, look, bpm, selected, props.onInspect]);
  useEffect(() => { if (roster) rosterSearch.current?.focus(); }, [roster]);
  const query = search.trim().toLowerCase(), hostMatches = new Set(props.members.map(m => m.key));
  const rows = (all ? population.members : members).filter(m => (filter === 'all' || (filter === 'attention' ? m.status === 'needs-you' || m.status === 'error' : m.status === filter)) && (!props.searchQuery || hostMatches.has(m.key)) && `${m.title} ${m.harness ?? ''} ${props.projects.find(p => p.id === m.projectId)?.name ?? ''}`.toLowerCase().includes(query));
  const page = Math.min(pageChoice, Math.max(0, Math.ceil(rows.length / PAGE_SIZE) - 1));
  const working = members.filter(m => m.status === 'working').length, needs = members.filter(m => m.status === 'needs-you' || m.status === 'error').length, idle = members.filter(m => m.status === 'idle').length;
  const hover = members.find(m => m.key === hovered);
  function closeRoster() { setRoster(false); rosterButton.current?.focus(); }
  function showFilter(value: string) { setFilter(value); setPage(0); setRoster(true); }
  return <section className="agent-rave" data-testid="agent-rave" data-look={look} aria-label="Agent Rave">
    <style>{styles}</style>
    <header className="rave-header">
      <div className="rave-brand"><span className="rave-brand-icon" aria-hidden="true">✳</span><div><span className="rave-eyebrow">ZANA / AFTER HOURS</span><h2>Agent Rave<span className="rave-live"><i/>LIVE FLEET</span></h2></div></div>
      <div className="rave-header-actions"><div className="rave-looks" role="group" aria-label="Club lighting">{(['ultraviolet', 'acid'] as Look[]).map(value => <button key={value} type="button" aria-pressed={look === value} onClick={() => setLook(value)}><i style={{ background: value === 'acid' ? '#c5ff67' : '#c56dff' }}/>{value === 'acid' ? 'Acid' : 'Ultraviolet'}</button>)}</div><button type="button" className="rave-button" aria-pressed={paused || reduced} disabled={reduced} onClick={() => setPaused(!paused)}>{reduced ? 'Reduced motion' : paused ? '▶ Resume motion' : 'Ⅱ Pause motion'}</button></div>
    </header>
    <div className="rave-stage" onKeyDown={event => { if (event.key === 'Escape' && roster && !event.defaultPrevented) { event.preventDefault(); closeRoster(); } }}>
      <canvas ref={canvas} className="rave-canvas" aria-label="Three-dimensional club. Working agents dance, idle agents stand at the bar, and agents needing attention wait near the DJ. Drag to orbit, scroll to zoom. Open Guest list for keyboard access to every agent."/>
      <div className="rave-stage-top"><div><span className="rave-eyebrow">THE WAREHOUSE · ROOM 01</span><p>Your agents. <em>Off the clock.</em></p></div><button type="button" className="rave-button" ref={rosterButton} aria-expanded={roster} onClick={() => setRoster(!roster)}>☷ Guest list <span>{members.length}</span></button></div>
      <div className="rave-counts" aria-label="Live agent status filters"><button type="button" onClick={() => showFilter('all')}><strong>{members.length}</strong>in the club</button><button type="button" onClick={() => showFilter('working')}><i className="rave-dot"/><strong>{working}</strong>working</button><button type="button" onClick={() => showFilter('idle')}><i className="rave-dot rave-idle"/><strong>{idle}</strong>idle at the bar</button><button type="button" onClick={() => showFilter('attention')}><i className="rave-dot rave-amber"/><strong>{needs}</strong>need attention</button></div>
      {!available && <div className="rave-fallback" role="status"><strong>The dance floor needs WebGL.</strong><span>Your agents are still in the guest list.</span><button className="rave-button" type="button" onClick={() => setRoster(true)}>Open guest list</button></div>}
      {available && members.length === 0 && <div className="rave-empty"><span>THE DJ IS READY.</span><strong>The floor is yours.</strong><p>Start an agent to bring this room to life.</p></div>}
      {available && members.length > 0 && working === 0 && <div className="rave-floor-note" role="status">No agents working right now.<span>The floor fills when work starts.</span></div>}
      {hover && <div className="rave-hover"><i style={{ background: agentColor(hover) }}/><strong>{hover.title}</strong><span>{STATUS[hover.status]} · {ZONE_LABEL[clubZone(hover)]} · Click to inspect</span></div>}
      {roster && <aside className="rave-roster" aria-label="Club guest list"><div className="rave-roster-head"><div><span className="rave-eyebrow">REAL AGENTS. REAL STATUS.</span><h3>On the list <span>{rows.length}</span></h3></div><button type="button" className="rave-icon-button" aria-label="Close guest list" onClick={closeRoster}>×</button></div><input aria-label="Search guests" ref={rosterSearch} value={search} placeholder="Find an agent or project…" onChange={event => { setSearch(event.target.value); setPage(0); }}/>
        <div className="rave-roster-filters"><button type="button" aria-pressed={!all} onClick={() => { setAll(false); setPage(0); }}>Live</button><button type="button" aria-pressed={all} onClick={() => { setAll(true); setPage(0); }}>All sessions</button>{filter !== 'all' && <button type="button" onClick={() => setFilter('all')}>Clear status ×</button>}</div>
        <div className="rave-guests">{rows.slice(page * PAGE_SIZE, (page + 1) * PAGE_SIZE).map(member => <button type="button" key={member.key} className="rave-guest" onClick={() => { setSelected(member.key); props.onInspect(member.key); }} aria-label={`Inspect ${member.title}, ${STATUS[member.status]}`}><span className="rave-avatar" style={{ color: agentColor(member) }} aria-hidden="true">▣</span><span><strong>{member.title}</strong><small>{props.projects.find(p => p.id === member.projectId)?.name ?? 'Project'}{member.harness ? ` · ${member.harness}` : ''}</small><small data-status={member.status}>{STATUS[member.status]} · {member.live ? ZONE_LABEL[clubZone(member)] : 'Off the floor'}</small></span><span className="rave-guest-arrow" aria-hidden="true">↗</span></button>)}{!rows.length && <p className="rave-no-guests">{search || props.searchQuery || filter !== 'all' ? 'No matching guests.' : 'No agents here yet.'}</p>}</div>
        {rows.length > PAGE_SIZE && <div className="rave-pages"><button type="button" disabled={page === 0} aria-label="Previous guests" onClick={() => setPage(page - 1)}>←</button><span>{page + 1} / {Math.ceil(rows.length / PAGE_SIZE)}</span><button type="button" disabled={(page + 1) * PAGE_SIZE >= rows.length} aria-label="Next guests" onClick={() => setPage(page + 1)}>→</button></div>}<footer>Working agents dance. Idle agents wait at the bar.{members.length > illustrated ? ` ${illustrated} illustrated; all ${members.length} are listed.` : ''} Schedules are not guests.</footer>
      </aside>}
      <div className="rave-stage-bottom"><span className="rave-orbit-hint">DRAG TO ORBIT · SCROLL TO ZOOM</span><div className="rave-cameras" role="group" aria-label="Club camera">{(['floor', 'balcony', 'booth'] as Camera[]).map(value => <button type="button" key={value} aria-pressed={camera === value} onClick={() => setCamera(value)}>{value === 'floor' ? 'Dance floor' : value === 'balcony' ? 'Balcony' : 'Behind the DJ'}</button>)}</div><label className="rave-tempo">SCENE TEMPO <input type="range" min="80" max="160" step="1" value={bpm} aria-label="Scene tempo" onChange={event => setBpm(Number(event.target.value))}/><span>{bpm} BPM</span></label></div>
    </div>
    <SpotifyPlayer music={music} busy={busy} connected={connected} onMusic={onMusic} onDisconnect={onDisconnect} paused={paused} reduced={reduced}/>
  </section>;
}
export default definePluginApp(app => { app.slots.experimental_agentsView?.({ id: 'rave', title: 'Rave', icon: 'Disc3', component: AgentRave }); });
