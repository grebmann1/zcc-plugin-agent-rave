import { defineConfig } from 'vitest/config';
export default defineConfig({
  test: {
    environment: 'node',
    include: ['*.test.ts', '*.test.tsx'],
    maxWorkers: 2,
    coverage: {
      provider: 'v8',
      include: ['rave-app.tsx', 'spotify-player.tsx', 'use-spotify.ts', 'scene.ts', 'model.ts', 'server.ts', 'spotify.ts', 'capture.ts'],
      thresholds: { statements: 80, branches: 80, lines: 80, functions: 80 }
    }
  }
});
