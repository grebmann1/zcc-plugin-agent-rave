// @vitest-environment node
import { describe, expect, it } from 'vitest';
import { captureProcess } from './capture.js';
describe('bounded native output capture', () => {
  it('retains output beyond 8192 bytes and runs with a private cwd, inherited HOME and a 0600 file', async () => {
    const code = `const fs=require('fs'); const s=fs.fstatSync(1); console.log(JSON.stringify({data:'x'.repeat(12000),mode:s.mode&511,cwd:process.cwd(),home:process.env.HOME}));`;
    const result = JSON.parse(await captureProcess(process.execPath, ['-e', code]));
    expect(result.data).toHaveLength(12000); expect(result.mode).toBe(384); expect(result.home).toBe(process.env.HOME); expect(result.cwd).toContain('zana-rave-');
    const fs = await import('node:fs'); expect(fs.existsSync(result.cwd)).toBe(false);
  });
  it('rejects missing executables, nonzero exit, oversized output, timeout and cancellation', async () => {
    await expect(captureProcess('/not-an-executable', [])).rejects.toThrow(/could not start/);
    await expect(captureProcess(process.execPath, ['-e', 'process.exit(1)'])).rejects.toThrow(/Automation/);
    await expect(captureProcess(process.execPath, ['-e', "console.log('x'.repeat(70000))"])).rejects.toThrow(/too large/);
    await expect(captureProcess(process.execPath, ['-e', 'setInterval(()=>{},1000)'], { timeoutMs: 100 })).rejects.toThrow(/did not respond/);
    const controller = new AbortController(), result = captureProcess(process.execPath, ['-e', 'setInterval(()=>{},1000)'], { signal: controller.signal });
    setTimeout(() => controller.abort(), 60); await expect(result).rejects.toThrow(/stopped/);
    await expect(captureProcess(process.execPath, [], { signal: controller.signal })).rejects.toThrow(/stopped/);
    await expect(captureProcess(process.execPath, ['-e', "process.stdout.write('x'.repeat(70000));setInterval(()=>{},1000)"])).rejects.toThrow(/too large/);
  });
});
