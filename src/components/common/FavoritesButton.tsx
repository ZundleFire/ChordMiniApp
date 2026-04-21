'use client';

import React, { useState } from 'react';
import { useUser } from '@/contexts/UserContext';
import { useFavorites } from '@/hooks/useUserLibrary';
import { FavoriteTrack } from '@/services/firebase/userLibraryService';

interface FavoritesButtonProps {
  videoId: string;
  title: string;
  channelTitle: string;
  thumbnail: string;
  duration: number;
  audioUrl?: string;
  sourceType?: 'youtube' | 'suno' | 'local-upload';
  className?: string;
}

export function FavoritesButton({
  videoId,
  title,
  channelTitle,
  thumbnail,
  duration,
  audioUrl,
  sourceType,
  className = '',
}: FavoritesButtonProps) {
  const { isAuthenticated } = useUser();
  const { isFavorited, addToFavorites, removeFromFavorites } = useFavorites();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const isFav = isFavorited(videoId);

  const handleToggle = async () => {
    if (!isAuthenticated) {
      setError('Please sign in to use favorites');
      return;
    }

    try {
      setIsLoading(true);
      setError(null);

      if (isFav) {
        await removeFromFavorites(videoId);
      } else {
        const track: Omit<FavoriteTrack, 'id' | 'addedAt'> = {
          videoId,
          title,
          channelTitle,
          thumbnail,
          duration,
          audioUrl,
          sourceType,
        };
        await addToFavorites(track);
      }
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to update favorite';
      setError(message);
      console.error('Favorite error:', err);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex flex-col gap-1">
      <button
        onClick={handleToggle}
        disabled={isLoading || !isAuthenticated}
        className={`p-2 rounded-lg transition-colors ${
          isFav
            ? 'bg-red-500 text-white hover:bg-red-600'
            : 'bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-300 dark:hover:bg-gray-600'
        } disabled:opacity-50 disabled:cursor-not-allowed ${className}`}
        title={isAuthenticated ? (isFav ? 'Remove from favorites' : 'Add to favorites') : 'Sign in to use favorites'}
      >
        <svg className="w-5 h-5" fill={isFav ? 'currentColor' : 'none'} stroke="currentColor" viewBox="0 0 24 24">
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z"
          />
        </svg>
      </button>
      {error && <p className="text-xs text-red-600 dark:text-red-400">{error}</p>}
    </div>
  );
}
