import React, { useState } from 'react';
import { createRoot } from 'react-dom/client';
import { RaveClub } from '../rave-app.js';
import { DISCONNECTED } from '../model.js';
function Preview() {
  const [empty, setEmpty] = useState(false), [inspected, setInspected] = useState(''), [music, setMusic] = useState(DISCONNECTED), [running, setRunning] = useState(false);
  const titles = ['Build the rave view', 'Review API changes', 'Ship the landing page', 'Fix the flaky test', 'Explore the city', 'Prepare release notes', 'Agentforce rehearsal', 'Refactor the composer', 'Check accessibility', 'Plan the next sprint', 'Deploy the sandbox', 'Update the plugin guide', 'Trace the connection'];
  const members = empty ? [] : titles.map((title, i) => ({ key: `thread:${i}`, title, projectId: `p${i % 3}`, kind: 'thread' as const, status: (i === 3 ? 'needs-you' : i < 4 || i === 4 && running ? 'working' : 'idle') as 'needs-you' | 'working' | 'idle', detail: 'Sample agent', live: true, scheduled: false, harness: i % 2 ? 'Claude Code' : 'Codex' }));
  React.useEffect(() => { const button = document.getElementById('empty')!; const click = () => setEmpty(value => !value); button.addEventListener('click', click); return () => button.removeEventListener('click', click); }, []);
  React.useEffect(() => { const button = document.getElementById('status')!; const click = () => setRunning(value => !value); button.addEventListener('click', click); return () => button.removeEventListener('click', click); }, []);
  React.useEffect(() => { document.getElementById('status')!.textContent = running ? 'Finish sample task → bar' : 'Start sample task → dance floor'; }, [running]);
  return <><RaveClub members={members} projects={[{ id: 'p0', name: 'zana-command-center' }, { id: 'p1', name: 'agentforce-provision' }, { id: 'p2', name: 'plugin-salesforce' }]} schedules={[]} executions={[]} projectId={null} includeScheduled={true} searchQuery="" onInspect={setInspected} music={music} connected={music.connected} onDisconnect={() => setMusic(DISCONNECTED)} onMusic={action => setMusic(value => ({ ...value, available: true, connected: true, playing: action === 'playpause' ? !value.playing : true, title: action === 'next' ? 'Opus' : 'Innerbloom', artist: action === 'next' ? 'Eric Prydz' : 'RÜFÜS DU SOL', album: 'Sample music', duration: 578, position: 137 }))}/>{inspected && <div id="inspect" role="dialog" aria-label="Sample agent inspector"><small>SIMULATED HOST INSPECTOR</small><h3>{members.find(m => m.key === inspected)?.title}</h3><p>In Zana, this opens the actual agent.</p><button onClick={() => setInspected('')}>Back to the party</button></div>}</>;
}
createRoot(document.getElementById('app')!).render(<Preview/>);
