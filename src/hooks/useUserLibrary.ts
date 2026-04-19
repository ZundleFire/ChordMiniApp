import { useState, useCallback, useEffect } from 'react';
import { useUser } from '@/contexts/UserContext';
import { UserLibraryService, FavoriteTrack, Playlist } from '@/services/firebase/userLibraryService';

export function useFavorites() {
  const { user, isAuthenticated } = useUser();
  const [favorites, setFavorites] = useState<FavoriteTrack[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Load favorites on mount or when user changes
  useEffect(() => {
    if (!isAuthenticated || !user?.uid) {
      setFavorites([]);
      return;
    }

    const loadFavorites = async () => {
      try {
        setLoading(true);
        setError(null);
        const fav = await UserLibraryService.getFavorites(user.uid);
        setFavorites(fav);
      } catch (err) {
        const message = err instanceof Error ? err.message : 'Failed to load favorites';
        setError(message);
        console.error('Error loading favorites:', err);
      } finally {
        setLoading(false);
      }
    };

    loadFavorites();
  }, [isAuthenticated, user?.uid]);

  const addToFavorites = useCallback(
    async (track: Omit<FavoriteTrack, 'id' | 'addedAt'>) => {
      if (!isAuthenticated || !user?.uid) {
        throw new Error('Not authenticated');
      }

      try {
        await UserLibraryService.addToFavorites(user.uid, track);
        setFavorites((prev) => [
          ...prev,
          {
            ...track,
            addedAt: { toDate: () => new Date() } as any,
          },
        ]);
      } catch (err) {
        const message = err instanceof Error ? err.message : 'Failed to add favorite';
        setError(message);
        throw err;
      }
    },
    [isAuthenticated, user?.uid]
  );

  const removeFromFavorites = useCallback(
    async (videoId: string) => {
      if (!isAuthenticated || !user?.uid) {
        throw new Error('Not authenticated');
      }

      try {
        await UserLibraryService.removeFromFavorites(user.uid, videoId);
        setFavorites((prev) => prev.filter((f) => f.videoId !== videoId));
      } catch (err) {
        const message = err instanceof Error ? err.message : 'Failed to remove favorite';
        setError(message);
        throw err;
      }
    },
    [isAuthenticated, user?.uid]
  );

  const isFavorited = useCallback(
    (videoId: string) => favorites.some((f) => f.videoId === videoId),
    [favorites]
  );

  return {
    favorites,
    loading,
    error,
    addToFavorites,
    removeFromFavorites,
    isFavorited,
  };
}

export function usePlaylists() {
  const { user, isAuthenticated } = useUser();
  const [playlists, setPlaylists] = useState<Playlist[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Load playlists on mount or when user changes
  useEffect(() => {
    if (!isAuthenticated || !user?.uid) {
      setPlaylists([]);
      return;
    }

    const loadPlaylists = async () => {
      try {
        setLoading(true);
        setError(null);
        const playlists = await UserLibraryService.getUserPlaylists(user.uid);
        setPlaylists(playlists);
      } catch (err) {
        const message = err instanceof Error ? err.message : 'Failed to load playlists';
        setError(message);
        console.error('Error loading playlists:', err);
      } finally {
        setLoading(false);
      }
    };

    loadPlaylists();
  }, [isAuthenticated, user?.uid]);

  const createPlaylist = useCallback(
    async (name: string, description?: string) => {
      if (!isAuthenticated || !user?.uid) {
        throw new Error('Not authenticated');
      }

      try {
        setError(null);
        const newPlaylist = await UserLibraryService.createPlaylist(
          user.uid,
          name,
          description
        );
        setPlaylists((prev) => [newPlaylist, ...prev]);
        return newPlaylist;
      } catch (err) {
        const message = err instanceof Error ? err.message : 'Failed to create playlist';
        setError(message);
        throw err;
      }
    },
    [isAuthenticated, user?.uid]
  );

  const deletePlaylist = useCallback(
    async (playlistId: string) => {
      if (!isAuthenticated) {
        throw new Error('Not authenticated');
      }

      try {
        setError(null);
        await UserLibraryService.deletePlaylist(playlistId);
        setPlaylists((prev) => prev.filter((p) => p.id !== playlistId));
      } catch (err) {
        const message = err instanceof Error ? err.message : 'Failed to delete playlist';
        setError(message);
        throw err;
      }
    },
    [isAuthenticated]
  );

  const addTrackToPlaylist = useCallback(
    async (playlistId: string, videoId: string) => {
      if (!isAuthenticated) {
        throw new Error('Not authenticated');
      }

      try {
        setError(null);
        await UserLibraryService.addTrackToPlaylist(playlistId, videoId);
        setPlaylists((prev) =>
          prev.map((p) =>
            p.id === playlistId
              ? {
                  ...p,
                  tracks: [...p.tracks, videoId],
                  updatedAt: { toDate: () => new Date() } as any,
                }
              : p
          )
        );
      } catch (err) {
        const message = err instanceof Error ? err.message : 'Failed to add track to playlist';
        setError(message);
        throw err;
      }
    },
    [isAuthenticated]
  );

  const removeTrackFromPlaylist = useCallback(
    async (playlistId: string, videoId: string) => {
      if (!isAuthenticated) {
        throw new Error('Not authenticated');
      }

      try {
        setError(null);
        await UserLibraryService.removeTrackFromPlaylist(playlistId, videoId);
        setPlaylists((prev) =>
          prev.map((p) =>
            p.id === playlistId
              ? {
                  ...p,
                  tracks: p.tracks.filter((t) => t !== videoId),
                  updatedAt: { toDate: () => new Date() } as any,
                }
              : p
          )
        );
      } catch (err) {
        const message =
          err instanceof Error ? err.message : 'Failed to remove track from playlist';
        setError(message);
        throw err;
      }
    },
    [isAuthenticated]
  );

  return {
    playlists,
    loading,
    error,
    createPlaylist,
    deletePlaylist,
    addTrackToPlaylist,
    removeTrackFromPlaylist,
  };
}
