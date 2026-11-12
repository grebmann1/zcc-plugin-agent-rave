import { useRef, useState, type FormEvent } from 'react';
import { spotifyUri, timeLabel, type SpotifyState } from './model.js';

export type MusicAction = 'read' | 'playpause' | 'next' | 'previous' | 'playUri';
export type MusicProps = { music: SpotifyState; busy: boolean; connected: boolean; onMusic(action: MusicAction, uri?: string): void; onDisconnect(): void };

const icons = {
  spotify: <><circle cx="12" cy="12" r="10" fill="currentColor" opacity=".18"/><path d="M6 9c4-2 8-1 12 1M7 12c3-1 6-1 10 1M8 15c2-1 5-1 8 1"/></>,
  previous: <path d="M6 5h2v14H6zm12 0v14L8 12z" fill="currentColor" stroke="none"/>,
  next: <path d="M16 5h2v14h-2zM6 5v14l10-7z" fill="currentColor" stroke="none"/>,
  play: <path d="m8 4 12 8-12 8z" fill="currentColor" stroke="none"/>,
  pause: <path d="M7 5h3v14H7zm7 0h3v14h-3z" fill="currentColor" stroke="none"/>,
  queue: <path d="M4 6h12M4 10h9M4 14h6m9-3v8m0-8 3 3m-3-3-3 3"/>,
  disconnect: <path d="M9 3v6m6-6v6M6 9h12v2a6 6 0 0 1-6 6v4m0-4a6 6 0 0 1-6-6Z"/>,
  close: <path d="m6 6 12 12M18 6 6 18"/>
};
function Icon({ name }: { name: keyof typeof icons }) {
  return <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" focusable="false">{icons[name]}</svg>;
}

export function SpotifyPlayer({ music, busy, connected, onMusic, onDisconnect, paused, reduced }: MusicProps & { paused: boolean; reduced: boolean }) {
  const [picker, setPicker] = useState(false), [uri, setUri] = useState(''), [error, setError] = useState('');
  const chooseButton = useRef<HTMLButtonElement>(null);
  function closePicker() { setPicker(false); chooseButton.current?.focus(); }
  function playLink(event: FormEvent) {
    event.preventDefault(); const parsed = spotifyUri(uri);
    if (!parsed) { setError('Paste a Spotify track, album, or playlist link.'); return; }
    setError(''); onMusic('playUri', parsed); closePicker();
  }
  return <section className="rave-deck" aria-label="Spotify DJ controls" data-connected={music.connected}>
    <div className="rave-deck-main">
      <div className="rave-deck-identity">
        <div className="rave-deck-art" aria-hidden="true"><div className={`rave-deck-vinyl${music.playing && !paused && !reduced ? ' rave-deck-spinning' : ''}`}><i/></div></div>
        <div className="rave-deck-meta">
          <span className="rave-deck-label"><Icon name="spotify"/>{music.connected ? 'SPOTIFY / ON THE DECKS' : 'SPOTIFY / YOUR MUSIC'}</span>
          <strong title={music.title}>{music.connected ? music.title || 'Nothing queued' : 'Your Spotify. Our sound system.'}</strong>
          <span className="rave-deck-artist" title={music.artist}>{music.connected ? music.artist || 'Choose a track in Spotify' : 'Connect the Spotify desktop app on this Mac.'}</span>
        </div>
      </div>
      {music.connected && <div className="rave-deck-playback">
        <div className="rave-deck-transport">
          <button type="button" className="rave-deck-icon" aria-label="Previous track" disabled={busy} onClick={() => onMusic('previous')}><Icon name="previous"/></button>
          <button type="button" className="rave-deck-icon rave-deck-play" aria-label={music.playing ? 'Pause Spotify' : 'Play Spotify'} disabled={busy} onClick={() => onMusic('playpause')}><Icon name={music.playing ? 'pause' : 'play'}/></button>
          <button type="button" className="rave-deck-icon" aria-label="Next track" disabled={busy} onClick={() => onMusic('next')}><Icon name="next"/></button>
        </div>
        <div className="rave-deck-progress"><span>{timeLabel(music.position)}</span><progress aria-label="Track progress" value={Math.min(music.position, music.duration)} max={Math.max(1, music.duration)}/><span>{timeLabel(music.duration)}</span></div>
      </div>}
      <div className="rave-deck-actions">
        {music.connected ? <><span className="rave-deck-connection"><i/>Connected</span><button ref={chooseButton} type="button" className="rave-deck-choose" aria-expanded={picker} onClick={() => setPicker(!picker)}><Icon name="queue"/>Choose music</button><button type="button" className="rave-deck-icon rave-deck-disconnect" aria-label="Disconnect Spotify" title="Disconnect controls; music keeps playing" onClick={() => { setPicker(false); onDisconnect(); }}><Icon name="disconnect"/></button></> : <button type="button" className="rave-deck-connect" disabled={busy} onClick={() => onMusic('read')}><Icon name="spotify"/>{busy ? 'Connecting…' : connected ? 'Retry Spotify' : 'Connect Spotify'}</button>}
      </div>
    </div>
    {picker && music.connected && <form className="rave-deck-picker" onSubmit={playLink} onKeyDown={event => { if (event.key === 'Escape') { event.preventDefault(); closePicker(); } }}>
      <label>Spotify track, album, or playlist<input autoFocus aria-label="Spotify link" value={uri} onChange={event => setUri(event.target.value)} placeholder="https://open.spotify.com/playlist/…"/></label>
      <button type="submit" className="rave-deck-connect" disabled={busy}>Play in Spotify</button>
      <button type="button" className="rave-deck-icon" aria-label="Close music picker" onClick={closePicker}><Icon name="close"/></button>
      {error && <span role="alert">{error}</span>}
    </form>}
    {music.error && <p className="rave-deck-error" role="status">{music.error}</p>}
  </section>;
}
