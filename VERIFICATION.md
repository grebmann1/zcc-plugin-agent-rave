# Agent Rave 0.1.0 verification

## Original live implementation

Host source: `salesforce/zana` at `ed295d4be8f007fb657c5827b4b85f0fdc02c36c`, plus the Agent Rave working-tree source exported into this repository.

Before export, the plugin passed its build, TypeScript check, all 23 unit tests, the Rave built-Electron test, and the standard plugin-authoring built-Electron test. The full production host build and `pnpm verify:fast` also passed: 38,160 tests passed / 150 skipped, followed by all 417 source guards.

The Rave Electron test uses an isolated HOME, real host agent membership and inspection, and a private native Spotify fixture. It exercises idle → working → idle transitions, motion/pause, cameras, lighting, transport, link validation, responsive layout, hot reload, reduced motion, and disable/re-enable. More than 8192 bytes cross the real child-process → plugin RPC → UI boundary. It never starts or changes personal Spotify.

## Run the Electron check

`verification/agent-rave-plugin.spec.ts` uses the public host's Electron fixtures. It is run inside a compatible Zana source checkout; it is not a standalone Playwright suite.

1. Install this plugin's developer dependencies, including the packed host SDK, using README.md.
2. In a separate compatible Zana checkout, install its dependencies and copy this repository's `verification/agent-rave-plugin.spec.ts` into the host's `e2e/agent-rave-plugin.spec.ts` (use an unused test path if that name already exists).
3. Set `ZCC_RAVE_SOURCE` to this plugin checkout, then run from the host checkout:

```sh
ZCC_RAVE_SOURCE=/absolute/path/to/zcc-plugin-agent-rave pnpm test:e2e -- e2e/agent-rave-plugin.spec.ts e2e/plugin-authoring-live.spec.ts
```

The host command builds a private Electron app and isolates user data. Never launch a test against the user's installed app. The Rave test copies the packaged CLI from `ZCC_E2E_APP_ROOT` to avoid concurrent workspace-build races, and sets only the private test renderer's zoom to 1 for accurate screenshots.

## Standalone release checks

The standalone checkout is checked with the real packed SDK, unit-test coverage, TypeScript, compiled-entry syntax checks, and a production plugin build before publication. CI repeats the unit, coverage, type, and syntax checks with the same pinned public host SDK.

Standalone export results: all 23 tests passed with 98.83% statements, 93.76% branches, 95.23% functions, and 99.69% lines. TypeScript, `npm run build`, and Node syntax checks passed. The isolated Electron test also passed against this standalone source (34.4 seconds for the test; 40.8 seconds total). It explicitly compiles the private music fixture before installation because the published manifest declares compiled entry points.
