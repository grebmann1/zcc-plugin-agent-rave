import { cpSync, mkdirSync, readFileSync, realpathSync, symlinkSync, writeFileSync } from 'node:fs';
import { join, resolve } from 'node:path';
import { execFile } from 'node:child_process';
import { promisify } from 'node:util';
import { test, expect } from './fixtures/app.js';

const exec = promisify(execFile);
test.use({ initialConfig: { sponsorPromptDismissed: true }, launchEnv: { ZCC_FAKE_PROVIDER: '1' } });
test('Rave renders real fleet, inspects agents, controls a private music fixture and reloads in built Electron', async ({ app, home }, testInfo) => {
  test.setTimeout(240_000);
  // CDP clips use CSS coordinates; Electron's default renderer zoom offsets crops.
  // Use a 1:1 viewport for the visual layout assertions and artifacts.
  const nativeWindow = await app.electron.browserWindow(app.window);
  try { await nativeWindow.evaluate(window => window.webContents.setZoomFactor(1)); }
  finally { await nativeWindow.dispose(); }
  const source = join(home, 'agent-rave');
  const pluginRoot = resolve(process.env.ZCC_RAVE_SOURCE ?? 'plugins/agent-rave');
  cpSync(pluginRoot, source, { recursive: true, filter: p => !p.includes('node_modules') && !p.includes('/preview') && !p.includes('/.git') });
  mkdirSync(join(source, 'node_modules'), { recursive: true });
  symlinkSync(realpathSync(join(pluginRoot, 'node_modules/three')), join(source, 'node_modules/three'), 'dir');
  // Another E2E build may refresh workspace dist after our build lock is released.
  // Copy the CLI captured by our private runtime, never that mutable workspace output.
  const cli = join(home, 'cli');
  cpSync(resolve(process.env.ZCC_E2E_APP_ROOT ?? '.', 'packages/cli/dist'), cli, { recursive: true, dereference: true });
  const env = { ...process.env, HOME: home, ZCC_DATA_DIR: join(home, '.zcc'), ZCC_SERVER_URL: new URL(app.window.url()).origin,
    ZCC_SESSION_ID: undefined, ZCC_SESSION_TOKEN: undefined, ZCC_SKIP_PLUGIN_NPM: '1', NODE_PATH: '', ESBUILD_BINARY_PATH: '' };
  const run = (args: string[]) => exec(process.execPath, [join(cli, 'bin/zcc'), ...args], { cwd: source, env, timeout: 60_000, maxBuffer: 1024 * 1024 });
  // Only the throwaway plugin has a music fixture. Never control the user's Spotify in E2E.
  // Its real child emits >8192 bytes into the production capture path, then crosses RPC → UI.
  writeFileSync(join(source, 'server.ts'), `
import { createSpotifyBridge } from './spotify.js';
import { captureProcess } from './capture.js';
export default function plugin(zcc) {
  let playing = false, title = 'Production boundary track';
  const bridge = createSpotifyBridge('darwin', async (action, uri, signal) => {
    if (action === 'playpause') playing = !playing;
    if (action === 'next') title = 'Second fixture track';
    if (action === 'playUri') title = uri;
    const snapshot = {available:true,connected:true,playing,title,artist:'Private fixture',album:'x'.repeat(12000),position:12,duration:240};
    return captureProcess(${JSON.stringify(process.execPath)}, ['-e', 'process.stdout.write('+JSON.stringify(JSON.stringify(snapshot))+')'], {signal});
  });
  zcc.rpc.method('spotify', input => bridge.request(input));
  zcc.onDispose(() => bridge.dispose());
}`);
  const root = join(home, 'rave-project'); mkdirSync(root);
  const seed = await app.window.evaluate(async path => {
    const project = (await (await fetch('/api/v1/projects', { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ path }) })).json()).project;
    const thread = (await (await fetch('/api/v1/threads', { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ projectId: project.id, providerId: 'fake', title: 'Rave real guest', input: 'Hello' }) })).json()).thread;
    return { projectId: project.id, threadId: thread.id };
  }, root);
  await expect.poll(() => app.window.evaluate(async id => (await (await fetch(`/api/v1/threads/${id}`)).json()).thread.status, seed.threadId)).toBe('idle');
  const errors: string[] = []; app.window.on('pageerror', e => errors.push(e.message));
  // Published manifests point at compiled entries. Compile the private fixture first.
  await run(['plugin', 'build', '.']);
  await run(['plugin', 'install', '.']);
  const navigate = (path: string) => app.window.evaluate(url => { history.pushState({}, '', url); dispatchEvent(new PopStateEvent('popstate')); }, path);
  await navigate('/agents');
  const toggle = app.window.getByRole('button', { name: 'Rave view', exact: true }).filter({ visible: true });
  await toggle.click();
  const rave = app.window.getByTestId('agent-rave'); await expect(rave).toBeVisible();
  await expect(rave.getByRole('button', { name: '1 in the club', exact: true })).toBeVisible();
  await expect(rave.getByRole('button', { name: '1 idle at the bar', exact: true })).toBeVisible();
  await expect(rave.getByRole('status').filter({ hasText: 'No agents working right now.' })).toBeVisible();
  await expect(rave.getByText('The dance floor needs WebGL.')).toHaveCount(0);
  const frame = () => rave.locator('canvas').screenshot().then(bytes => bytes.toString('base64'));
  const first = await frame(); await expect.poll(frame).not.toBe(first);
  await rave.getByRole('button', { name: /Pause motion/ }).click();
  // A paused scene is stable even after a full repaint.
  const still = await frame(); expect(await frame()).toBe(still);
  await rave.getByRole('button', { name: 'Acid', exact: true }).click(); await expect(rave).toHaveAttribute('data-look', 'acid');
  expect(await frame()).not.toBe(still);
  for (const name of ['Balcony', 'Behind the DJ', 'Dance floor']) { await rave.getByRole('button', { name, exact: true }).click(); await expect(rave.getByRole('button', { name, exact: true })).toHaveAttribute('aria-pressed', 'true'); }
  await rave.getByRole('button', { name: /Guest list/ }).click();
  const guest = rave.getByRole('button', { name: 'Inspect Rave real guest, Idle' }); await expect(guest).toBeVisible(); await guest.click();
  await expect(app.window.getByRole('heading', { name: 'Rave real guest', exact: true }).first()).toBeVisible();
  await navigate('/agents'); await expect(rave).toBeVisible();
  // The same host identity moves to work and back to the bar, including while paused.
  const motion = rave.getByRole('button', { name: /Pause motion|Resume motion/ });
  if (await motion.getAttribute('aria-pressed') !== 'true') await motion.click();
  const barFrame = await frame();
  const threadAction = (action: string, body: object) => app.window.evaluate(async ({ id, action, body }) => {
    const response = await fetch(`/api/v1/threads/${id}/${action}`, { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify(body) });
    if (!response.ok) throw new Error(await response.text());
  }, { id: seed.threadId, action, body });
  await threadAction('send', { input: 'delay:60000 Working on the dance floor', mode: 'auto' });
  await expect(rave.getByRole('button', { name: '1 working', exact: true })).toBeVisible();
  await expect(rave.getByRole('button', { name: '0 idle at the bar', exact: true })).toBeVisible();
  await expect(rave.getByRole('status').filter({ hasText: 'No agents working right now.' })).toHaveCount(0);
  await expect.poll(frame).not.toBe(barFrame);
  await rave.getByRole('button', { name: /Guest list/ }).click();
  await expect(rave.getByRole('button', { name: 'Inspect Rave real guest, Working' })).toContainText('Working · On the dance floor');
  await threadAction('stop', {});
  await expect(rave.getByRole('button', { name: '1 idle at the bar', exact: true })).toBeVisible();
  await expect(guest).toContainText('Idle · At the bar');
  await rave.getByRole('button', { name: 'Close guest list', exact: true }).click();
  await rave.getByRole('button', { name: /Connect Spotify/ }).click();
  await expect(rave.getByText('Production boundary track', { exact: true })).toBeVisible({ timeout: 15000 });
  await app.window.setViewportSize({ width: 1600, height: 1000 });
  const deck = rave.getByRole('region', { name: 'Spotify DJ controls' });
  await expect(deck.getByRole('progressbar', { name: 'Track progress' })).toBeVisible();
  const deckBox = (await deck.boundingBox())!, playBox = (await deck.getByRole('button', { name: 'Play Spotify', exact: true }).boundingBox())!;
  expect(Math.abs(playBox.x + playBox.width / 2 - deckBox.x - deckBox.width / 2)).toBeLessThan(35);
  await deck.screenshot({ path: testInfo.outputPath('rave-player-wide.png') });
  await rave.screenshot({ path: testInfo.outputPath('rave-club-idle-at-bar.png') });
  await testInfo.attach('rave-player-wide', { path: testInfo.outputPath('rave-player-wide.png'), contentType: 'image/png' });
  await rave.getByRole('button', { name: 'Play Spotify', exact: true }).click(); await expect(rave.getByRole('button', { name: 'Pause Spotify', exact: true })).toBeVisible();
  await rave.getByRole('button', { name: 'Next track', exact: true }).click(); await expect(rave.getByText('Second fixture track', { exact: true })).toBeVisible();
  await rave.getByRole('button', { name: /Choose music/ }).click(); await rave.getByLabel('Spotify link').fill('https://evil.test/track/0123456789abcdefghijkl'); await rave.getByRole('button', { name: 'Play in Spotify' }).click(); await expect(rave.getByRole('alert')).toContainText('Paste a Spotify');
  await rave.getByLabel('Spotify link').fill('https://open.spotify.com/playlist/0123456789abcdefghijkl?si=tracking'); await rave.getByRole('button', { name: 'Play in Spotify' }).click(); await expect(rave.getByText('spotify:playlist:0123456789abcdefghijkl', { exact: true })).toBeVisible();
  await app.window.setViewportSize({ width: 720, height: 900 });
  await expect(deck.getByRole('progressbar', { name: 'Track progress' })).toBeVisible();
  expect(await deck.evaluate(element => element.scrollWidth <= element.clientWidth)).toBe(true);
  await rave.getByRole('button', { name: 'Choose music', exact: true }).click();
  await rave.getByLabel('Spotify link').press('Escape');
  await expect(rave.getByLabel('Spotify link')).toHaveCount(0);
  await expect(rave.getByRole('button', { name: 'Choose music', exact: true })).toBeFocused();
  await deck.screenshot({ path: testInfo.outputPath('rave-player-narrow.png') });
  await testInfo.attach('rave-player-narrow', { path: testInfo.outputPath('rave-player-narrow.png'), contentType: 'image/png' });
  await rave.getByRole('button', { name: 'Disconnect Spotify', exact: true }).click(); await expect(rave.getByRole('button', { name: /Connect Spotify/ })).toBeVisible();
  await app.window.setViewportSize({ width: 1600, height: 1000 });
  // Reload changed source while the plugin is open, without restarting the user's app.
  const appSource = join(source, 'rave-app.tsx'); writeFileSync(appSource, readFileSync(appSource, 'utf8').replace('THE WAREHOUSE · ROOM 01', 'THE WAREHOUSE · LIVE RELOAD'));
  await run(['plugin', 'dev', '.', '--once']); await expect(rave.getByText('THE WAREHOUSE · LIVE RELOAD')).toBeVisible();
  await app.window.emulateMedia({ reducedMotion: 'reduce' }); await expect(rave.getByRole('button', { name: 'Reduced motion' })).toBeDisabled();
  await app.window.setViewportSize({ width: 720, height: 900 });
  await rave.getByRole('button', { name: /Guest list/ }).click(); await expect(rave.getByRole('button', { name: 'Inspect Rave real guest, Idle' })).toBeVisible();
  await testInfo.attach('rave-narrow', { body: await rave.screenshot(), contentType: 'image/png' });
  await run(['plugin', 'disable', 'agent-rave']); await expect(rave).toHaveCount(0);
  await run(['plugin', 'enable', 'agent-rave']); await app.window.getByRole('button', { name: 'Rave view', exact: true }).filter({ visible: true }).click(); await expect(rave).toBeVisible();
  expect(errors).toEqual([]);
});
