import fs from 'fs/promises';
import path from 'path';
import { tmpdir } from 'os';
import type { LyricsData, LyricWordTiming } from '@/types/musicAiTypes';

interface AssemblyWord {
  text?: string;
  start?: number;
  end?: number;
}

interface AssemblyUtterance {
  text?: string;
  start?: number;
  end?: number;
  words?: AssemblyWord[];
}

interface AssemblyTranscriptResponse {
  id?: string;
  status?: string;
  error?: string;
  utterances?: AssemblyUtterance[];
  words?: AssemblyWord[];
  text?: string;
}

const ASSEMBLY_BASE_URL = 'https://api.assemblyai.com/v2';

function isSafePath(candidatePath: string): boolean {
  const projectRoot = process.cwd();
  const publicRoot = path.join(projectRoot, 'public');
  const allowedRoots = [projectRoot, publicRoot, tmpdir()];
  return allowedRoots.some((rootPath) => {
    const relativePath = path.relative(rootPath, candidatePath);
    return relativePath === '' || (!relativePath.startsWith('..') && !path.isAbsolute(relativePath));
  });
}

function resolveLocalPath(audioPath: string): string {
  const projectRoot = process.cwd();
  const publicRoot = path.join(projectRoot, 'public');

  let resolvedPath: string;
  if (audioPath.startsWith('file://')) {
    resolvedPath = path.normalize(audioPath.slice('file://'.length));
  } else if (audioPath.startsWith('/')) {
    resolvedPath = path.resolve(publicRoot, `.${audioPath}`);
  } else {
    resolvedPath = path.resolve(projectRoot, audioPath);
  }

  if (!isSafePath(resolvedPath)) {
    throw new Error('Audio file path is outside allowed directories');
  }

  return resolvedPath;
}

function toSeconds(value: number | undefined): number {
  return typeof value === 'number' && Number.isFinite(value) ? value / 1000 : 0;
}

function buildWordTimings(words: AssemblyWord[] | undefined): LyricWordTiming[] {
  if (!words?.length) {
    return [];
  }

  let cursor = 0;
  return words
    .filter((word) => (word.text || '').trim().length > 0)
    .map((word) => {
      const text = (word.text || '').trim();
      const startChar = cursor;
      const endChar = Math.max(startChar, startChar + text.length - 1);
      cursor = endChar + 2;
      return {
        text,
        startTime: toSeconds(word.start),
        endTime: toSeconds(word.end),
        startChar,
        endChar,
      };
    });
}

function buildLyricsData(result: AssemblyTranscriptResponse): LyricsData {
  const utterances = result.utterances || [];

  if (utterances.length > 0) {
    const lines = utterances
      .map((utterance) => {
        const text = (utterance.text || '').trim();
        if (!text) {
          return null;
        }

        const startTime = toSeconds(utterance.start);
        const endTimeRaw = toSeconds(utterance.end);
        const endTime = endTimeRaw > startTime ? endTimeRaw : startTime + 1.5;

        return {
          startTime,
          endTime,
          text,
          chords: [],
          wordTimings: buildWordTimings(utterance.words),
        };
      })
      .filter((line): line is NonNullable<typeof line> => line !== null);

    if (lines.length > 0) {
      return { lines };
    }
  }

  const words = result.words || [];
  if (words.length > 0) {
    const chunkSize = 8;
    const lines = [] as LyricsData['lines'];

    for (let index = 0; index < words.length; index += chunkSize) {
      const chunk = words.slice(index, index + chunkSize).filter((word) => (word.text || '').trim().length > 0);
      if (chunk.length === 0) {
        continue;
      }

      const startTime = toSeconds(chunk[0].start);
      const endTimeRaw = toSeconds(chunk[chunk.length - 1].end);
      const endTime = endTimeRaw > startTime ? endTimeRaw : startTime + 1.5;
      const text = chunk.map((word) => (word.text || '').trim()).join(' ').trim();
      lines.push({
        startTime,
        endTime,
        text,
        chords: [],
        wordTimings: buildWordTimings(chunk),
      });
    }

    if (lines.length > 0) {
      return { lines };
    }
  }

  const transcriptText = (result.text || '').trim();
  if (transcriptText.length > 0) {
    return {
      lines: transcriptText
        .split(/\r?\n+/)
        .map((line) => line.trim())
        .filter((line) => line.length > 0)
        .map((line, index) => ({
          startTime: index * 2,
          endTime: index * 2 + 2,
          text: line,
          chords: [],
        })),
    };
  }

  return { lines: [], error: 'No lyrics found in transcript result' };
}

async function uploadAudioBufferToAssembly(audioBuffer: ArrayBuffer, apiKey: string): Promise<string> {
  const uploadResponse = await fetch(`${ASSEMBLY_BASE_URL}/upload`, {
    method: 'POST',
    headers: {
      authorization: apiKey,
      'content-type': 'application/octet-stream',
    },
    body: audioBuffer,
  });

  const uploadData = await uploadResponse.json().catch(() => ({}));
  if (!uploadResponse.ok || !uploadData?.upload_url) {
    throw new Error(uploadData?.error || `AssemblyAI upload failed (${uploadResponse.status})`);
  }

  return uploadData.upload_url as string;
}

async function fetchAudioAsBuffer(audioPath: string): Promise<ArrayBuffer> {
  if (audioPath.startsWith('https://') || audioPath.startsWith('http://')) {
    const response = await fetch(audioPath);
    if (!response.ok) {
      throw new Error(`Failed to fetch audio source (${response.status})`);
    }
    return await response.arrayBuffer();
  }

  const resolvedPath = resolveLocalPath(audioPath);
  const fileBuffer = await fs.readFile(resolvedPath);
  return fileBuffer.buffer.slice(fileBuffer.byteOffset, fileBuffer.byteOffset + fileBuffer.byteLength) as ArrayBuffer;
}

export async function transcribeLyricsWithAssembly(audioPath: string, apiKey: string): Promise<LyricsData> {
  const audioBuffer = await fetchAudioAsBuffer(audioPath);
  const uploadedAudioUrl = await uploadAudioBufferToAssembly(audioBuffer, apiKey);

  const transcriptCreateResponse = await fetch(`${ASSEMBLY_BASE_URL}/transcript`, {
    method: 'POST',
    headers: {
      authorization: apiKey,
      'content-type': 'application/json',
    },
    body: JSON.stringify({
      audio_url: uploadedAudioUrl,
      speech_model: 'best',
      punctuate: true,
      format_text: true,
      speaker_labels: true,
      language_detection: true,
    }),
  });

  const createData = await transcriptCreateResponse.json().catch(() => ({}));
  if (!transcriptCreateResponse.ok || !createData?.id) {
    throw new Error(createData?.error || `AssemblyAI transcript creation failed (${transcriptCreateResponse.status})`);
  }

  const transcriptId = createData.id as string;
  const maxAttempts = 120;

  for (let attempt = 0; attempt < maxAttempts; attempt++) {
    const pollResponse = await fetch(`${ASSEMBLY_BASE_URL}/transcript/${transcriptId}?utterances=true`, {
      method: 'GET',
      headers: {
        authorization: apiKey,
      },
    });

    const pollData = (await pollResponse.json().catch(() => ({}))) as AssemblyTranscriptResponse;

    if (!pollResponse.ok) {
      throw new Error(pollData?.error || `AssemblyAI polling failed (${pollResponse.status})`);
    }

    if (pollData.status === 'completed') {
      return buildLyricsData(pollData);
    }

    if (pollData.status === 'error') {
      throw new Error(pollData.error || 'AssemblyAI transcription failed');
    }

    await new Promise((resolve) => setTimeout(resolve, 1500));
  }

  throw new Error('AssemblyAI transcription timed out');
}

export async function validateAssemblyApiKey(apiKey: string): Promise<{ valid: boolean; error?: string }> {
  try {
    const response = await fetch(`${ASSEMBLY_BASE_URL}/transcript?limit=1`, {
      method: 'GET',
      headers: { authorization: apiKey },
    });

    if (response.ok) {
      return { valid: true };
    }

    if (response.status === 401 || response.status === 403) {
      return { valid: false, error: 'Invalid or unauthorized AssemblyAI API key.' };
    }

    return { valid: false, error: `AssemblyAI validation failed (HTTP ${response.status}).` };
  } catch (error) {
    return { valid: false, error: error instanceof Error ? error.message : 'Network error validating key' };
  }
}
