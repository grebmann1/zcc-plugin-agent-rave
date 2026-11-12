# Live Agent Rave verification

1. Build and install from this checkout: `npm run build`, then `zcc plugin install .`.
2. Open **Agents → Rave**. Only working agents dance; idle agents stand still at the side bar; agents needing attention wait near the DJ. Start/finish work and verify the same agent changes zones, including while motion is paused. Check status counts, the idle filter, and inspection through the guest list or scene. Large idle rosters must not displace workers.
3. Switch cameras and lighting, pause/resume, and test reduced motion. Narrow the viewport and check the player and guest list.
4. With Spotify already running on the hosting Mac, click Connect Spotify and verify metadata. Test transport only when authorized; automated Electron tests use a private fixture.
5. After a visible source change, run `zcc plugin dev . --once` and verify the open view reloads. Keep the requested plugin installed.
6. Run `npm test -- --coverage` and `npm run typecheck`, then the private Electron recipe in VERIFICATION.md when runtime behavior changes.

An install/reload acknowledgement alone is not rendered-UI verification. Report unavailable checks honestly. Do not restart the user's installed Zana or change personal music for a plugin test.
