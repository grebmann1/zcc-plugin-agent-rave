import { useEffect, useRef, useState } from 'react';
import { useRpc } from '@zana-ai/zcc-plugin-sdk/app';
import { DISCONNECTED, type SpotifyState } from './model.js';
import type { MusicAction, MusicProps } from './rave-app.js';
/** Connect explicitly. Never overlap requests or poll a hidden tab. */
export function useSpotify(): MusicProps {
  const rpc = useRpc(), [music, setMusic] = useState<SpotifyState>(DISCONNECTED), [connected, setConnected] = useState(false), [busy, setBusy] = useState(false);
  const inFlight = useRef(false), epoch = useRef(0), alive = useRef(true);
  useEffect(() => { alive.current = true; return () => { alive.current = false; ++epoch.current; }; }, []);
  async function request(action: MusicAction, uri?: string, interactive = true) {
    if (inFlight.current) return;
    const current = epoch.current; inFlight.current = true; setBusy(true);
    if (interactive) setConnected(true);
    try {
      const result = await rpc.call('spotify', { action, uri }) as SpotifyState;
      if (alive.current && epoch.current === current) { setMusic(result); if (!result.connected) setConnected(false); }
    } catch { if (alive.current && epoch.current === current) { setMusic({ ...DISCONNECTED, error: 'Spotify connection failed. Try connecting again.' }); setConnected(false); } }
    finally { inFlight.current = false; if (alive.current) setBusy(false); }
  }
  useEffect(() => {
    if (!connected) return;
    const timer = window.setInterval(() => { if (!document.hidden) void request('read', undefined, false); }, 4000);
    return () => window.clearInterval(timer);
  }, [connected, rpc]);
  return { music, busy, connected, onMusic: (action, uri) => { void request(action, uri); }, onDisconnect: () => { ++epoch.current; setConnected(false); setMusic(DISCONNECTED); } };
}
