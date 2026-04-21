import { tmpdir } from 'os';
import path from 'path';
import { randomUUID } from 'crypto';
import { writeFile, unlink } from 'fs/promises';
import { spawn } from 'child_process';
import type { LyricsData } from '@/types/musicAiTypes';

function isLyricsSyncEnabled(): boolean {
  return process.env.LYRICS_SYNC_ENABLED === 'true';
}

function normalizePythonCommand(): string {
  return process.env.LYRICS_SYNC_PYTHON_BIN || 'python';
}

function isHttpUrl(value: string): boolean {
  return value.startsWith('http://') || value.startsWith('https://');
}

function resolveAudioPath(audioPath: string): string | null {
  if (!audioPath || isHttpUrl(audioPath)) {
    return null;
  }

  if (audioPath.startsWith('file://')) {
    return audioPath.slice('file://'.length);
  }

  const projectRoot = process.cwd();
  const publicRoot = path.join(projectRoot, 'public');

  if (audioPath.startsWith('/')) {
    return path.resolve(publicRoot, `.${audioPath}`);
  }

  return path.resolve(projectRoot, audioPath);
}

function runProcess(command: string, args: string[]): Promise<{ code: number | null; stdout: string; stderr: string }> {
  return new Promise((resolve) => {
    const child = spawn(command, args, { stdio: ['ignore', 'pipe', 'pipe'] });
    let stdout = '';
    let stderr = '';

    child.stdout.on('data', (chunk) => {
      stdout += String(chunk);
    });

    child.stderr.on('data', (chunk) => {
      stderr += String(chunk);
    });

    child.on('close', (code) => {
      resolve({ code, stdout, stderr });
    });

    child.on('error', (error) => {
      stderr += `\n${String(error)}`;
      resolve({ code: 1, stdout, stderr });
    });
  });
}

export async function tryAlignLyricsWithLyricsSync(params: {
  audioPath: string;
  plainLyrics: string;
}): Promise<LyricsData | null> {
  if (!isLyricsSyncEnabled()) {
    return null;
  }

  const resolvedAudioPath = resolveAudioPath(params.audioPath);
  if (!resolvedAudioPath) {
    return null;
  }

  const trimmedLyrics = params.plainLyrics.trim();
  if (!trimmedLyrics) {
    return null;
  }

  const lyricsFile = path.join(tmpdir(), `lyrics-sync-${randomUUID()}.txt`);
  const scriptPath = path.join(process.cwd(), 'scripts', 'lyrics_sync_align.py');

  await writeFile(lyricsFile, trimmedLyrics, 'utf8');

  try {
    const cmd = normalizePythonCommand();
    const result = await runProcess(cmd, [scriptPath, '--audio', resolvedAudioPath, '--lyrics', lyricsFile]);

    if (result.code !== 0) {
      console.warn('lyrics-sync process failed:', result.stderr || result.stdout);
      return null;
    }

    const parsed = JSON.parse(result.stdout) as { lines?: LyricsData['lines']; error?: string };
    if (!parsed?.lines || !Array.isArray(parsed.lines) || parsed.lines.length === 0) {
      console.warn('lyrics-sync returned no lines:', parsed?.error || 'empty output');
      return null;
    }

    return {
      lines: parsed.lines,
    };
  } catch (error) {
    console.warn('lyrics-sync integration error:', error);
    return null;
  } finally {
    try {
      await unlink(lyricsFile);
    } catch {
      // best-effort cleanup
    }
  }
}
