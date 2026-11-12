import type { ZccPluginApi } from '@zana-ai/zcc-plugin-sdk/server';
import { createSpotifyBridge } from './spotify.js';

export default function agentRave(zcc: ZccPluginApi) {
  const spotify = createSpotifyBridge();
  zcc.rpc.method('spotify', input => spotify.request(input));
  zcc.onDispose(() => spotify.dispose());
}
