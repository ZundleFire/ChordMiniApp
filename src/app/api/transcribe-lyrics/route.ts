import { NextRequest, NextResponse } from 'next/server';
import { getFirestore, doc, getDoc, setDoc } from 'firebase/firestore';
import { firebaseApp } from '@/services/firebase/firebaseService';
import { transcribeLyricsWithAssembly } from '@/services/lyrics/assemblyAiService';

interface CachedLyricsData {
  lines?: unknown[];
  [key: string]: unknown;
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
      assemblyAiApiKey,
      musicAiApiKey,
    } = body;

    if (!videoId) {
      return NextResponse.json({ error: 'Video ID is required' }, { status: 400 });
    }

    const db = getFirestore(firebaseApp);
    const lyricsDocRef = doc(db, 'lyrics', videoId);
    const lyricsDoc = await getDoc(lyricsDocRef);

    if (lyricsDoc.exists() && !forceRefresh) {
      const cachedData = lyricsDoc.data() as CachedLyricsData;
      if (cachedData?.lines && Array.isArray(cachedData.lines) && cachedData.lines.length > 0) {
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

    const providedKey = (assemblyAiApiKey || musicAiApiKey || '').trim();
    const apiKey = providedKey || process.env.ASSEMBLYAI_API_KEY || '';

    if (!apiKey) {
      return NextResponse.json(
        { error: 'AssemblyAI API key is required for transcription.' },
        { status: 400 }
      );
    }

    const lyricsData = await transcribeLyricsWithAssembly(audioPath, apiKey);

    if (!lyricsData?.lines?.length) {
      return NextResponse.json(
        { error: 'Lyrics transcription returned no data' },
        { status: 500 }
      );
    }

    try {
      await setDoc(lyricsDocRef, {
        ...lyricsData,
        videoId,
        timestamp: new Date().toISOString(),
        cached: true,
        source: 'assemblyai-transcription',
      });
    } catch (cacheError) {
      console.warn('Failed to cache lyrics in Firestore:', cacheError);
    }

    return NextResponse.json({
      success: true,
      message: 'Lyrics transcribed successfully',
      lyrics: lyricsData,
      cached: false,
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
