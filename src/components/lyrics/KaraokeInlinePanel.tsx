'use client';

import { useMemo } from 'react';
import type { LyricsData } from '@/types/musicAiTypes';

interface KaraokeInlinePanelProps {
  lyrics: LyricsData | null;
  currentTime: number;
}

function findActiveLineIndex(lyrics: LyricsData, currentTime: number): number {
  if (!lyrics.lines.length) {
    return -1;
  }

  const exactMatch = lyrics.lines.findIndex((line) => currentTime >= line.startTime && currentTime < line.endTime);
  if (exactMatch >= 0) {
    return exactMatch;
  }

  const nearestFuture = lyrics.lines.findIndex((line) => line.startTime > currentTime);
  return nearestFuture > 0 ? nearestFuture - 1 : 0;
}

export default function KaraokeInlinePanel({ lyrics, currentTime }: KaraokeInlinePanelProps) {
  const lines = lyrics?.lines ?? [];

  const { activeIndex, prevLine, activeLine, nextLine } = useMemo(() => {
    if (!lyrics || lines.length === 0) {
      return {
        activeIndex: -1,
        prevLine: null,
        activeLine: null,
        nextLine: null,
      };
    }

    const index = findActiveLineIndex(lyrics, currentTime);
    return {
      activeIndex: index,
      prevLine: index > 0 ? lines[index - 1] : null,
      activeLine: index >= 0 ? lines[index] : null,
      nextLine: index >= 0 && index < lines.length - 1 ? lines[index + 1] : null,
    };
  }, [currentTime, lines, lyrics]);

  if (activeIndex < 0 || !activeLine) {
    return null;
  }

  return (
    <div className="mb-3 rounded-xl border border-default-200 bg-gradient-to-r from-default-50 to-default-100/60 px-4 py-3 dark:border-default-100/20 dark:from-gray-900/60 dark:to-gray-800/60">
      {prevLine && (
        <p className="mb-1 line-clamp-2 text-center text-xs text-gray-500 dark:text-gray-400">
          {prevLine.text}
        </p>
      )}
      <p className="text-center text-lg font-semibold tracking-wide text-blue-700 dark:text-blue-300">
        {activeLine.text}
      </p>
      {nextLine && (
        <p className="mt-1 line-clamp-2 text-center text-xs text-gray-500 dark:text-gray-400">
          {nextLine.text}
        </p>
      )}
    </div>
  );
}
