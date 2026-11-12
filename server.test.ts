import { expect, it, vi } from 'vitest';
import { createFakePluginHost } from '@zana-ai/zcc-plugin-sdk/testing';
const bridge = vi.hoisted(() => ({ request: vi.fn().mockResolvedValue({ connected: false }), dispose: vi.fn() }));
vi.mock('./spotify.js', () => ({ createSpotifyBridge: () => bridge }));
import plugin from './server.js';
it('registers the Spotify RPC and releases native work on plugin disposal', async () => {
  const host = createFakePluginHost(); plugin(host.zcc);
  expect(await host.harness.behavior.callRpc('spotify', { action: 'read' })).toEqual({ connected: false });
  expect(bridge.request).toHaveBeenCalledWith({ action: 'read' });
  await host.harness.dispose(); expect(bridge.dispose).toHaveBeenCalledOnce();
});
