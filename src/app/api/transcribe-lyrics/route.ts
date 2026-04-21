import { NextRequest, NextResponse } from 'next/server';
import { getFirestore, doc, getDoc, setDoc } from 'firebase/firestore';
import { firebaseApp } from '@/services/firebase/firebaseService';
import { searchLyricsWithFallback } from '@/services/lyrics/lyricsService';
import musicAiService from '@/services/lyrics/musicAiService';
import { tryAlignLyricsWithLyricsSync } from '@/services/lyrics/lyricsSyncService';
import type { LyricsData } from '@/types/musicAiTypes';

interface CachedLyricsData {
  lines?: unknown[];
  source?: string;
  [key: string]: unknown;
}

const TIMED_LYRICS_CACHE_SOURCES = new Set([
  'musicai-transcription',
  'free-lrclib-timing-json',
  'lyrics-sync-alignment',
  'manual-lyrics-timed-json',
]);

function buildLyricsFromSynchronizedEntries(
  entries: Array<{ time: number; text: string }>
): LyricsData {
  const lines = entries
    .filter((entry) => Number.isFinite(entry.time) && typeof entry.text === 'string' && entry.text.trim().length > 0)
    .map((entry, index, arr) => {
      const startTime = Math.max(0, entry.time);
      const nextStart = arr[index + 1]?.time;
      const endTime = Number.isFinite(nextStart) && (nextStart as number) > startTime
        ? Math.max(startTime + 0.2, (nextStart as number) - 0.02)
        : startTime + 2.0;

      return {
        startTime,
        endTime,
        text: entry.text.trim(),
        chords: [],
      };
    });

  return { lines };
}

export const maxDuration = 300;

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const {
      videoId,
      audioPath,
      forceRefresh,
      checkCacheOnly,
      musicAiApiKey,
      title,
      artist,
      channel,
      searchQuery,
    } = body;

    if (!videoId) {
      return NextResponse.json({ error: 'Video ID is required' }, { status: 400 });
    }

    const db = getFirestore(firebaseApp);
    const lyricsDocRef = doc(db, 'lyrics', videoId);
    const lyricsDoc = await getDoc(lyricsDocRef);

    if (lyricsDoc.exists() && !forceRefresh) {
      const cachedData = lyricsDoc.data() as CachedLyricsData;
      const cacheSource = typeof cachedData?.source === 'string' ? cachedData.source : '';
      const isTimedLyricsCache = TIMED_LYRICS_CACHE_SOURCES.has(cacheSource);
      if (cachedData?.lines && Array.isArray(cachedData.lines) && cachedData.lines.length > 0 && isTimedLyricsCache) {
        return NextResponse.json({
          success: true,
          message: 'Lyrics retrieved from cache',
          lyrics: cachedData,
          cached: true,
        });
      }
    }

    if (checkCacheOnly) {
      return NextResponse.json({ success: false, message: 'No cached lyrics found', cached: false });
    }

    if (!audioPath) {
      return NextResponse.json({ error: 'Audio file not found. Please extract audio first.' }, { status: 404 });
    }

    const providedMusicAiKey = typeof musicAiApiKey === 'string' ? musicAiApiKey.trim() : '';
    if (providedMusicAiKey) {
      try {
        const musicAiLyrics = await musicAiService.transcribeLyrics(audioPath, undefined, providedMusicAiKey);
        if (musicAiLyrics?.lines?.length) {
          try {
            await setDoc(lyricsDocRef, {
              ...musicAiLyrics,
              videoId,
              timestamp: new Date().toISOString(),
              cached: true,
              source: 'musicai-transcription',
            });
          } catch (cacheError) {
            console.warn('Failed to cache Music.ai lyrics in Firestore:', cacheError);
          }

          return NextResponse.json({
            success: true,
            message: 'Lyrics transcribed with Music.ai',
            lyrics: musicAiLyrics,
            cached: false,
            source: 'musicai-transcription',
          });
        }
      } catch (musicAiError) {
        console.warn('Music.ai transcription failed, falling back to free synchronized lyrics:', musicAiError);
      }
    }

    const parsedTitle = typeof title === 'string' ? title.trim() : '';
    const parsedArtist = typeof artist === 'string'
      ? artist.trim()
      : (typeof channel === 'string' ? channel.trim() : '');
    const parsedSearchQuery = typeof searchQuery === 'string'
      ? searchQuery.trim()
      : [parsedArtist, parsedTitle].filter(Boolean).join(' - ') || (typeof videoId === 'string' ? videoId : '');

    const fallbackResult = await searchLyricsWithFallback({
      title: parsedTitle || undefined,
      artist: parsedArtist || undefined,
      search_query: parsedSearchQuery || undefined,
      prefer_synchronized: true,
    });

    if (
      fallbackResult.success
      && !fallbackResult.has_synchronized
      && typeof fallbackResult.plain_lyrics === 'string'
      && fallbackResult.plain_lyrics.trim().length > 0
    ) {
      const syncedFromLyricsSync = await tryAlignLyricsWithLyricsSync({
        audioPath,
        plainLyrics: fallbackResult.plain_lyrics,
      });

      if (syncedFromLyricsSync?.lines?.length) {
        try {
          await setDoc(lyricsDocRef, {
            ...syncedFromLyricsSync,
            videoId,
            timestamp: new Date().toISOString(),
            cached: true,
            source: 'lyrics-sync-alignment',
            provider: 'mikezzb/lyrics-sync',
            metadata: fallbackResult.metadata,
          });
        } catch (cacheError) {
          console.warn('Failed to cache lyrics-sync aligned lyrics in Firestore:', cacheError);
        }

        return NextResponse.json({
          success: true,
          message: 'Timed lyrics aligned with lyrics-sync',
          lyrics: syncedFromLyricsSync,
          cached: false,
          source: 'lyrics-sync-alignment',
        });
      }
    }

    if (!fallbackResult.success || !fallbackResult.has_synchronized || !fallbackResult.synchronized_lyrics?.length) {
      return NextResponse.json(
        {
          error: 'No timed lyrics available from free synchronized sources.',
          details: fallbackResult.error || 'Synchronized free lyrics not found.',
        },
        { status: 404 }
      );
    }

    const freeLyrics = buildLyricsFromSynchronizedEntries(fallbackResult.synchronized_lyrics);

    try {
      await setDoc(lyricsDocRef, {
        ...freeLyrics,
        videoId,
        timestamp: new Date().toISOString(),
        cached: true,
        source: 'free-lrclib-timing-json',
        provider: fallbackResult.source,
        metadata: fallbackResult.metadata,
      });
    } catch (cacheError) {
      console.warn('Failed to cache free synchronized lyrics in Firestore:', cacheError);
    }

    return NextResponse.json({
      success: true,
      message: 'Timed lyrics loaded from free synchronized source',
      lyrics: freeLyrics,
      cached: false,
      source: 'free-lrclib-timing-json',
    });
  } catch (error: unknown) {
    console.error('Error transcribing lyrics:', error);
    return NextResponse.json(
      {
        error: 'Error transcribing lyrics',
        details: error instanceof Error ? error.message : String(error),
      },
      { status: 500 }
    );
  }
}
