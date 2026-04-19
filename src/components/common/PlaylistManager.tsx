'use client';

import React, { useState } from 'react';
import { useUser } from '@/contexts/UserContext';
import { usePlaylists } from '@/hooks/useUserLibrary';

interface PlaylistManagerProps {
  videoId: string;
  isOpen: boolean;
  onClose: () => void;
}

export function PlaylistManager({ videoId, isOpen, onClose }: PlaylistManagerProps) {
  const { isAuthenticated } = useUser();
  const { playlists, createPlaylist, addTrackToPlaylist, removeTrackFromPlaylist, loading } =
    usePlaylists();
  const [newPlaylistName, setNewPlaylistName] = useState('');
  const [isCreating, setIsCreating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState('');

  const handleCreatePlaylist = async () => {
    if (!newPlaylistName.trim()) {
      setError('Playlist name cannot be empty');
      return;
    }

    try {
      setError(null);
      setIsCreating(true);
      await createPlaylist(newPlaylistName);
      setNewPlaylistName('');
      setSuccessMessage('Playlist created!');
      setTimeout(() => setSuccessMessage(''), 2000);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to create playlist';
      setError(message);
    } finally {
      setIsCreating(false);
    }
  };

  const handleAddToPlaylist = async (playlistId: string) => {
    try {
      setError(null);
      const playlist = playlists.find((p) => p.id === playlistId);
      const isAlreadyInPlaylist = playlist?.tracks.includes(videoId);

      if (isAlreadyInPlaylist) {
        await removeTrackFromPlaylist(playlistId, videoId);
        setSuccessMessage('Track removed from playlist');
      } else {
        await addTrackToPlaylist(playlistId, videoId);
        setSuccessMessage('Track added to playlist');
      }

      setTimeout(() => setSuccessMessage(''), 2000);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to update playlist';
      setError(message);
    }
  };

  if (!isOpen) return null;

  if (!isAuthenticated) {
    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
        <div className="bg-white dark:bg-gray-800 rounded-lg p-6 max-w-sm w-full mx-4">
          <h2 className="text-xl font-bold mb-4 text-gray-900 dark:text-white">Playlists</h2>
          <p className="text-gray-700 dark:text-gray-300 mb-6">
            Sign in to create and manage playlists.
          </p>
          <button
            onClick={onClose}
            className="w-full px-4 py-2 rounded-lg bg-gray-300 dark:bg-gray-700 text-gray-900 dark:text-white hover:bg-gray-400 dark:hover:bg-gray-600"
          >
            Close
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white dark:bg-gray-800 rounded-lg p-6 max-w-md w-full mx-4 max-h-[80vh] overflow-y-auto">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-xl font-bold text-gray-900 dark:text-white">Playlists</h2>
          <button
            onClick={onClose}
            className="text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Create New Playlist */}
        <div className="mb-6 pb-6 border-b border-gray-300 dark:border-gray-600">
          <h3 className="font-semibold text-gray-900 dark:text-white mb-2">Create New Playlist</h3>
          <div className="flex gap-2">
            <input
              type="text"
              value={newPlaylistName}
              onChange={(e) => setNewPlaylistName(e.target.value)}
              placeholder="Playlist name"
              className="flex-1 px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
              disabled={isCreating}
            />
            <button
              onClick={handleCreatePlaylist}
              disabled={isCreating || !newPlaylistName.trim()}
              className="px-4 py-2 rounded-lg bg-blue-600 text-white hover:bg-blue-700 disabled:bg-gray-400"
            >
              {isCreating ? '...' : '+'}
            </button>
          </div>
        </div>

        {/* Existing Playlists */}
        <div>
          <h3 className="font-semibold text-gray-900 dark:text-white mb-3">Your Playlists</h3>

          {loading ? (
            <p className="text-gray-500 dark:text-gray-400">Loading playlists...</p>
          ) : playlists.length === 0 ? (
            <p className="text-gray-500 dark:text-gray-400">No playlists yet. Create one to get started!</p>
          ) : (
            <div className="space-y-2">
              {playlists.map((playlist) => {
                const isInPlaylist = playlist.tracks.includes(videoId);
                return (
                  <button
                    key={playlist.id}
                    onClick={() => handleAddToPlaylist(playlist.id!)}
                    className={`w-full text-left px-3 py-2 rounded-lg transition-colors ${
                      isInPlaylist
                        ? 'bg-blue-500 text-white'
                        : 'bg-gray-200 dark:bg-gray-700 text-gray-900 dark:text-white hover:bg-gray-300 dark:hover:bg-gray-600'
                    }`}
                  >
                    <div className="flex justify-between items-center">
                      <span className="font-medium">{playlist.name}</span>
                      <div className="flex items-center gap-2">
                        <span className="text-xs opacity-75">{playlist.tracks.length} tracks</span>
                        {isInPlaylist && (
                          <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                            <path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41L9 16.17z" />
                          </svg>
                        )}
                      </div>
                    </div>
                  </button>
                );
              })}
            </div>
          )}
        </div>

        {/* Messages */}
        {error && <p className="mt-4 text-sm text-red-600 dark:text-red-400">{error}</p>}
        {successMessage && (
          <p className="mt-4 text-sm text-green-600 dark:text-green-400">{successMessage}</p>
        )}
      </div>
    </div>
  );
}
