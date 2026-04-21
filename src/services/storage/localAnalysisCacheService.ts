import { AnalysisResult } from '@/services/chord-analysis/chordRecognitionService';
import { LyricsData } from '@/types/musicAiTypes';

const CACHE_PREFIX = 'chordmini_local_analysis_v1:';
const CACHE_TTL_MS = 30 * 24 * 60 * 60 * 1000;

interface CachedLocalAnalysis {
  analysisResults: AnalysisResult;
  lyrics: LyricsData | null;
  duration: number;
  title?: string;
  savedAt: number;
}

function isBrowserReady(): boolean {
  return typeof window !== 'undefined' && typeof window.localStorage !== 'undefined';
}

function sanitizeKeySegment(value: string): string {
  return encodeURIComponent(value.trim()).slice(0, 600);
}

export function buildLocalAnalysisCacheKey(sourceIdentity: string): string {
  return `${CACHE_PREFIX}${sanitizeKeySegment(sourceIdentity)}`;
}

export function loadCachedLocalAnalysis(sourceIdentity: string): CachedLocalAnalysis | null {
  if (!isBrowserReady() || !sourceIdentity) {
    return null;
  }

  try {
    const key = buildLocalAnalysisCacheKey(sourceIdentity);
    const raw = window.localStorage.getItem(key);
    if (!raw) {
      return null;
    }

    const parsed = JSON.parse(raw) as CachedLocalAnalysis;
    if (!parsed?.analysisResults || typeof parsed.savedAt !== 'number') {
      window.localStorage.removeItem(key);
      return null;
    }

    if (Date.now() - parsed.savedAt > CACHE_TTL_MS) {
      window.localStorage.removeItem(key);
      return null;
    }

    return parsed;
  } catch (error) {
    console.warn('Failed to load local analysis cache:', error);
    return null;
  }
}

export function saveCachedLocalAnalysis(
  sourceIdentity: string,
  payload: {
    analysisResults: AnalysisResult;
    lyrics: LyricsData | null;
    duration: number;
    title?: string;
  }
): void {
  if (!isBrowserReady() || !sourceIdentity) {
    return;
  }

  const entry: CachedLocalAnalysis = {
    analysisResults: payload.analysisResults,
    lyrics: payload.lyrics,
    duration: payload.duration,
    title: payload.title,
    savedAt: Date.now(),
  };

  try {
    const key = buildLocalAnalysisCacheKey(sourceIdentity);
    window.localStorage.setItem(key, JSON.stringify(entry));
  } catch (error) {
    // Local cache writes are best-effort only.
    console.warn('Failed to save local analysis cache:', error);
  }
}
