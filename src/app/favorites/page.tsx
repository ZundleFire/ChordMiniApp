'use client';

import React from 'react';
import { Card, CardBody, Image, Button } from '@heroui/react';
import { addToast } from '@heroui/react';
import { useRouter } from 'next/navigation';
import Navigation from '@/components/common/Navigation';
import { useFavorites } from '@/hooks/useUserLibrary';
import { useUser } from '@/contexts/UserContext';
import { buildAudioProxyUrl } from '@/utils/audioProxyUrl';
import type { FavoriteTrack } from '@/services/firebase/userLibraryService';

export default function FavoritesPage() {
  const router = useRouter();
  const { isAuthenticated } = useUser();
  const { favorites, loading, removeFromFavorites } = useFavorites();

  const getAnalysisUrl = (track: FavoriteTrack): string | null => {
    if (track.sourceType === 'local-upload') {
      if (!track.audioUrl) {
        return null;
      }

      const params = new URLSearchParams({
        sharedAudioUrl: track.audioUrl,
      });

      if (track.title) {
        params.set('title', track.title);
      }

      return `/analyze?${params.toString()}`;
    }

    return `/analyze/${encodeURIComponent(track.videoId)}`;
  };

  const openAnalysis = (track: FavoriteTrack) => {
    const target = getAnalysisUrl(track);
    if (!target) {
      addToast({
        title: 'Missing audio source',
        description: 'This favorite does not have a playable audio URL yet.',
        color: 'warning',
      });
      return;
    }

    router.push(target);
  };

  const shareAnalysis = async (track: FavoriteTrack) => {
    const target = getAnalysisUrl(track);
    if (!target) {
      addToast({
        title: 'Cannot share yet',
        description: 'This favorite does not have a shareable analysis URL yet.',
        color: 'warning',
      });
      return;
    }

    try {
      const shareUrl = `${window.location.origin}${target}`;
      await navigator.clipboard.writeText(shareUrl);
      addToast({
        title: 'Share link copied',
        description: 'The analysis URL is now in your clipboard.',
        color: 'success',
      });
    } catch (error) {
      console.error('Failed to copy share link:', error);
      addToast({
        title: 'Share failed',
        description: 'Could not copy link to clipboard.',
        color: 'danger',
      });
    }
  };

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 dark:from-dark-bg dark:to-dark-secondary">
        <Navigation showStickySearch={false} />
        <div className="container mx-auto px-4 py-12">
          <div className="text-center">
            <h1 className="text-3xl font-bold mb-4 text-gray-900 dark:text-white">
              Favorites
            </h1>
            <p className="text-gray-600 dark:text-gray-300 mb-6">
              Sign in with Google to save and view your favorite tracks.
            </p>
          </div>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 dark:from-dark-bg dark:to-dark-secondary">
        <Navigation showStickySearch={false} />
        <div className="container mx-auto px-4 py-12">
          <div className="space-y-4">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-24 bg-gray-200 dark:bg-gray-700 rounded-lg animate-pulse" />
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 dark:from-dark-bg dark:to-dark-secondary">
      <Navigation showStickySearch={false} />
      
      <div className="container mx-auto px-4 py-12">
        <h1 className="text-4xl font-bold mb-2 text-gray-900 dark:text-white">
          Your Favorites
        </h1>
        <p className="text-gray-600 dark:text-gray-300 mb-8">
          {favorites.length} track{favorites.length !== 1 ? 's' : ''} saved
        </p>

        {favorites.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-gray-500 dark:text-gray-400">
              No favorites yet. Add your first favorite from an analysis!
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {favorites.map((track) => (
              <Card key={track.videoId} className="hover:shadow-lg transition-shadow">
                <CardBody className="p-4">
                  {track.thumbnail && (
                    <Image
                      alt={track.title}
                      className="w-full h-40 object-cover rounded-lg mb-3"
                      src={track.thumbnail}
                    />
                  )}
                  <h3 className="font-semibold text-lg text-gray-900 dark:text-white line-clamp-2">
                    {track.title}
                  </h3>
                  <p className="text-sm text-gray-600 dark:text-gray-400 mb-3">
                    {track.channelTitle}
                  </p>
                  <p className="text-xs text-gray-500 dark:text-gray-500 mb-4">
                    Added {new Date(track.addedAt.toDate?.() || 0).toLocaleDateString()}
                  </p>
                  {track.audioUrl && (
                    <div className="mb-3">
                      <audio
                        controls
                        preload="none"
                        src={buildAudioProxyUrl(track.audioUrl, { forceProxy: true })}
                        className="w-full"
                      />
                    </div>
                  )}
                  <div className="mb-3 flex flex-wrap gap-2">
                    <Button
                      color="primary"
                      variant="flat"
                      size="sm"
                      onPress={() => openAnalysis(track)}
                    >
                      Open Analysis
                    </Button>
                    <Button
                      color="secondary"
                      variant="flat"
                      size="sm"
                      onPress={() => shareAnalysis(track)}
                    >
                      Share
                    </Button>
                  </div>
                  <Button
                    color="danger"
                    variant="flat"
                    size="sm"
                    onPress={() => removeFromFavorites(track.videoId)}
                  >
                    Remove from Favorites
                  </Button>
                </CardBody>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
