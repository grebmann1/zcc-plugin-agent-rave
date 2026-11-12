# Agent Rave

This is the standalone optional Zana plugin `agent-rave`.

- `rave-app.tsx` contributes only `experimental_agentsView`; keep integrations inside the plugin.
- The host fleet is authoritative. Only live working agents dance. Idle/unknown agents stand still at the bar; needs-you/error agents wait near the DJ. Status changes move the same identity between zones, including while paused. Keep every agent accessible in the guest list.
- Keep the 80-guest drawing budget, prioritizing workers; bar cap 12 and DJ-area cap 8 share that budget. Schedules, run summaries, and exited sessions never become live guests.
- `scene.ts` owns and disposes all WebGL resources, controls, observers, and animation. Hidden/offscreen/paused/reduced-motion views must not animate. Keep the 30 fps and 1.5 pixel-ratio caps.
- Spotify is opt-in and requires an already-running desktop app on the Mac hosting Zana. Visual tempo is manual. Do not change personal Spotify during tests.
- `spotify.ts` validates every RPC action and canonicalizes Spotify links before a fixed script. Never interpolate renderer text into program text or shell commands.
- Preserve file-backed child capture in `capture.ts`: private files, timeout, size cap, cancellation, one native child, and cleanup on every path. The Electron production boundary once truncated piped stdout at 8192 bytes.
- The host supplies React. Bundle Three.js locally; no CDN or core renderer imports.
- Follow README.md for SDK setup. Run `npm test -- --coverage`, `npm run typecheck`, `npm run build`, and Node syntax checks for `app.js`/`server.mjs`. Maintain at least 80% meaningful coverage. Runtime changes also require the isolated built-Electron recipe in VERIFICATION.md.
- Release commits include compiled `app.js`, `server.mjs`, and their metadata. Keep source entries editable; do not publish node_modules, credentials, personal tracks, or local user state.
- Install and reload through `zcc plugin install .` / `zcc plugin dev . --once`. Never edit installed-plugin registry files. Keep the user's working installation and music unchanged during verification.
