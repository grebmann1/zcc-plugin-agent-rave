export const playerStyles = `
.agent-rave .rave-deck {
  position: relative; flex-shrink: 0; padding: 20px 28px;
  background: radial-gradient(ellipse at 5% 100%, #9a62db12, transparent 38%), linear-gradient(110deg, #17131f, #111119 65%);
  box-shadow: 0 -16px 50px #0003;
}
.agent-rave .rave-deck::before { content: ''; position: absolute; inset: 0 0 auto; height: 1px; background: linear-gradient(90deg, #c9ff7644, #b56aff55 35%, #ffffff0d 70%); }
.agent-rave .rave-deck-main { display: grid; grid-template-columns: minmax(0, 1fr) minmax(280px, 1.25fr) minmax(0, 1fr); align-items: center; gap: 28px; }
.agent-rave .rave-deck-identity { display: flex; align-items: center; gap: 16px; min-width: 0; }
.agent-rave .rave-deck-art { position: relative; width: 62px; height: 62px; flex-shrink: 0; display: grid; place-items: center; border: 1px solid #b58cd52b; border-radius: 14px; background: radial-gradient(ellipse at 15% 0, #79539955, transparent 70%), #211a2b; box-shadow: inset 0 1px #ffffff0a, 0 4px 16px #0003; }
.agent-rave .rave-deck-vinyl { position: relative; width: 46px; height: 46px; border-radius: 50%; border: 1px solid #d7b6f740; background: repeating-radial-gradient(circle, #13101c 0 3px, #35263f 4px, #17121f 5px); display: grid; place-items: center; }
.agent-rave .rave-deck-vinyl i { width: 15px; height: 15px; border: 5px solid var(--rave-accent); border-radius: 50%; background: #25321c; box-shadow: 0 0 15px #c9ff7633; }
.agent-rave .rave-deck-vinyl::after { content: ''; position: absolute; top: 5px; left: 20px; width: 2px; height: 6px; border-radius: 2px; background: #c6b0d766; }
.agent-rave .rave-deck-spinning { animation: rave-turn 4s linear infinite; }
.agent-rave .rave-deck-meta { min-width: 0; overflow: hidden; display: flex; flex-direction: column; }
.agent-rave .rave-deck-label { display: flex; align-items: center; gap: 6px; color: #bddaa8; font-size: 8px; letter-spacing: 1.5px; font-weight: 650; white-space: nowrap; }
.agent-rave .rave-deck-label svg { width: 13px; height: 13px; flex-shrink: 0; color: var(--rave-accent); }
.agent-rave .rave-deck-meta strong { display: block; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; font-size: 16px; font-weight: 600; letter-spacing: -.3px; margin: 3px 0 1px; }
.agent-rave .rave-deck-artist { display: block; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; font-size: 12px; color: #b7adc3; }
.agent-rave .rave-deck-playback { width: 100%; max-width: 480px; justify-self: center; display: flex; flex-direction: column; align-items: center; gap: 10px; }
.agent-rave .rave-deck-transport { display: flex; align-items: center; gap: 21px; }
.agent-rave .rave-deck-icon { display: grid; place-items: center; width: 34px; height: 34px; flex-shrink: 0; border: 1px solid transparent; border-radius: 50%; background: transparent; color: #bdb4cb; padding: 8px; }
.agent-rave .rave-deck-icon svg { width: 17px; height: 17px; }
.agent-rave .rave-deck-icon:hover { background: #ffffff0a; color: #fff; }
.agent-rave .rave-deck-play { width: 42px; height: 42px; color: #18210e !important; background: var(--rave-accent); box-shadow: 0 0 20px #c9ff7612; transition: transform .15s, background .15s; }
.agent-rave .rave-deck-play:hover { transform: scale(1.05); background: #d7ff9c; }
.agent-rave .rave-deck-play:disabled { transform: none; }
.agent-rave .rave-deck-progress { width: 100%; display: flex; align-items: center; gap: 12px; color: #a99db8; font-size: 9px; font-variant-numeric: tabular-nums; }
.agent-rave .rave-deck-progress > span { min-width: 26px; }
.agent-rave .rave-deck-progress > span:last-child { text-align: right; }
.agent-rave .rave-deck-progress progress { appearance: none; flex: 1; min-width: 0; width: 100%; height: 3px; border: 0; border-radius: 10px; background: #ffffff14; overflow: hidden; }
.agent-rave .rave-deck-progress progress::-webkit-progress-bar { background: #ffffff14; border-radius: 10px; }
.agent-rave .rave-deck-progress progress::-webkit-progress-value { background: linear-gradient(90deg, #99c957, var(--rave-accent)); border-radius: 10px; }
.agent-rave .rave-deck-progress progress::-moz-progress-bar { background: var(--rave-accent); border-radius: 10px; }
.agent-rave .rave-deck-actions { display: flex; align-items: center; gap: 14px; justify-content: flex-end; min-width: 0; }
.agent-rave .rave-deck-choose { display: flex; align-items: center; gap: 9px; background: #ffffff05; border: 1px solid #d1b6ed30; color: #e1d8ec; border-radius: 9px; padding: 10px 14px; font-size: 11px; white-space: nowrap; }
.agent-rave .rave-deck-choose svg { width: 16px; height: 16px; color: var(--rave-accent); }
.agent-rave .rave-deck-choose:hover { background: #ffffff0a; border-color: #a786c666; }
.agent-rave .rave-deck-disconnect { border-left: 1px solid #ffffff12; border-radius: 0; width: 40px; padding-left: 15px; color: #a093b0; }
.agent-rave .rave-deck-connection { display: flex; align-items: center; gap: 6px; color: #a59ab2; font-size: 10px; white-space: nowrap; }
.agent-rave .rave-deck-connection i { width: 4px; height: 4px; background: var(--rave-accent); border-radius: 50%; }
.agent-rave .rave-deck-connect { display: inline-flex; align-items: center; justify-content: center; gap: 9px; background: var(--rave-accent); color: #18210e !important; border: 0; border-radius: 9px; padding: 10px 14px; font-size: 11px; font-weight: 650; white-space: nowrap; }
.agent-rave .rave-deck-connect svg { width: 17px; height: 17px; }
.agent-rave .rave-deck[data-connected=false] .rave-deck-identity { grid-column: 1 / 3; }
.agent-rave .rave-deck-picker { position: absolute; right: 28px; bottom: calc(100% + 12px); z-index: 6; display: flex; flex-wrap: wrap; align-items: flex-end; gap: 10px; padding: 18px; width: min(520px, calc(100% - 40px)); background: #1b1225f5; backdrop-filter: blur(16px); border: 1px solid #564063; border-radius: 12px; box-shadow: 0 12px 40px #0009; }
.agent-rave .rave-deck-picker label { display: flex; flex: 1; flex-direction: column; gap: 8px; font-size: 11px; color: #c7b2da; min-width: 180px; }
.agent-rave .rave-deck-picker input { padding: 10px; width: 100%; min-width: 0; background: #110c19; border: 1px solid #5d456c; border-radius: 6px; font-size: 11px; }
.agent-rave .rave-deck-picker > span { width: 100%; color: #ffbd88; font-size: 11px; }
.agent-rave .rave-deck-error { margin: 14px 0 0; padding: 8px 11px; border-left: 2px solid #e8b568; background: #36232b; font-size: 11px; color: #f1c896; }
@container (max-width: 1050px) {
  .agent-rave .rave-deck-main { grid-template-columns: minmax(0, 1fr) auto; gap: 18px 24px; }
  .agent-rave .rave-deck-playback { grid-column: 1 / -1; grid-row: 2; max-width: 620px; flex-direction: row; gap: 26px; }
  .agent-rave .rave-deck-connection { display: none; }
  .agent-rave .rave-deck[data-connected=false] .rave-deck-identity { grid-column: 1; }
}
@container (max-width: 600px) {
  .agent-rave .rave-deck { padding: 18px 16px; }
  .agent-rave .rave-deck-main { gap: 18px 12px; }
  .agent-rave .rave-deck-identity { gap: 11px; }
  .agent-rave .rave-deck-art { width: 52px; height: 52px; border-radius: 11px; }
  .agent-rave .rave-deck-vinyl { width: 39px; height: 39px; }
  .agent-rave .rave-deck-vinyl::after { left: 17px; }
  .agent-rave .rave-deck-label { font-size: 7px; letter-spacing: 1px; }
  .agent-rave .rave-deck-meta strong { font-size: 14px; }
  .agent-rave .rave-deck-artist { font-size: 11px; }
  .agent-rave .rave-deck-choose { padding: 9px; gap: 7px; font-size: 10px; }
  .agent-rave .rave-deck-actions { gap: 7px; }
  .agent-rave .rave-deck-disconnect { padding: 7px; width: 28px; border: 0; }
  .agent-rave .rave-deck-playback { gap: 18px; }
  .agent-rave .rave-deck-transport { gap: 12px; }
  .agent-rave .rave-deck-play { width: 38px; height: 38px; }
  .agent-rave .rave-deck-progress { gap: 8px; }
  .agent-rave .rave-deck-connect { padding: 10px; font-size: 10px; }
  .agent-rave .rave-deck-picker { right: 16px; width: calc(100% - 32px); }
}
`;
