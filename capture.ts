import { spawn } from 'node:child_process';
import { mkdtemp, open, readFile, rm, stat } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

/** File-backed capture avoids Electron's historical piped-stdout truncation. */
export async function captureProcess(command: string, args: string[], options: { signal?: AbortSignal; timeoutMs?: number; maxBytes?: number } = {}): Promise<string> {
  const directory = await mkdtemp(join(tmpdir(), 'zana-rave-'));
  const path = join(directory, 'output');
  let file: Awaited<ReturnType<typeof open>> | undefined;
  try {
    file = await open(path, 'wx', 0o600);
    const maxBytes = options.maxBytes ?? 65536;
    await new Promise<void>((resolve, reject) => {
      if (options.signal?.aborted) { reject(new Error('Spotify connection stopped.')); return; }
      const child = spawn(command, args, { cwd: directory, stdio: ['ignore', file!.fd, file!.fd], windowsHide: true });
      let failure: Error | undefined;
      const stop = (message: string) => { failure ??= new Error(message); child.kill('SIGKILL'); };
      const abort = () => stop('Spotify connection stopped.');
      options.signal?.addEventListener('abort', abort, { once: true });
      const timer = setTimeout(() => stop('Spotify did not respond. Check its Automation permission, then retry.'), options.timeoutMs ?? 6000);
      const cap = setInterval(() => { void stat(path).then(info => { if (info.size > maxBytes) stop('Spotify response was too large.'); }, () => stop('Spotify output could not be read.')); }, 50);
      const cleanup = () => { clearTimeout(timer); clearInterval(cap); options.signal?.removeEventListener('abort', abort); };
      child.once('error', () => { cleanup(); reject(new Error('Spotify controls could not start.')); });
      child.once('close', code => { cleanup(); if (failure) reject(failure); else if (code !== 0) reject(new Error('Allow Zana to control Spotify in System Settings → Privacy & Security → Automation, then retry.')); else resolve(); });
    });
    if ((await stat(path)).size > maxBytes) throw new Error('Spotify response was too large.');
    return await readFile(path, 'utf8');
  } finally { try { await file?.close(); } finally { await rm(directory, { recursive: true, force: true }); } }
}
