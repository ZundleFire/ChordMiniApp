'use client';

import React, { useState } from 'react';
import { Card, CardBody, Button, Input, Modal, ModalContent, ModalHeader, ModalBody, ModalFooter } from '@heroui/react';
import Navigation from '@/components/common/Navigation';
import { usePlaylists } from '@/hooks/useUserLibrary';
import { useUser } from '@/contexts/UserContext';

export default function PlaylistsPage() {
  const { isAuthenticated } = useUser();
  const { playlists, loading, createPlaylist, deletePlaylist } = usePlaylists();
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [newPlaylistName, setNewPlaylistName] = useState('');
  const [newPlaylistDescription, setNewPlaylistDescription] = useState('');
  const [isCreating, setIsCreating] = useState(false);

  const handleCreatePlaylist = async () => {
    if (!newPlaylistName.trim()) return;

    try {
      setIsCreating(true);
      await createPlaylist(newPlaylistName, newPlaylistDescription);
      setNewPlaylistName('');
      setNewPlaylistDescription('');
      setIsCreateModalOpen(false);
    } finally {
      setIsCreating(false);
    }
  };

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 dark:from-dark-bg dark:to-dark-secondary">
        <Navigation showStickySearch={false} />
        <div className="container mx-auto px-4 py-12">
          <div className="text-center">
            <h1 className="text-3xl font-bold mb-4 text-gray-900 dark:text-white">
              Playlists
            </h1>
            <p className="text-gray-600 dark:text-gray-300 mb-6">
              Sign in with Google to create and manage playlists.
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
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-4xl font-bold text-gray-900 dark:text-white">
              Your Playlists
            </h1>
            <p className="text-gray-600 dark:text-gray-300">
              {playlists.length} playlist{playlists.length !== 1 ? 's' : ''}
            </p>
          </div>
          <Button
            color="primary"
            onPress={() => setIsCreateModalOpen(true)}
          >
            Create Playlist
          </Button>
        </div>

        {playlists.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-gray-500 dark:text-gray-400 mb-4">
              No playlists yet. Create your first playlist!
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {playlists.map((playlist) => (
              <Card key={playlist.id} className="hover:shadow-lg transition-shadow">
                <CardBody className="p-6">
                  <h3 className="font-semibold text-xl text-gray-900 dark:text-white mb-1">
                    {playlist.name}
                  </h3>
                  {playlist.description && (
                    <p className="text-sm text-gray-600 dark:text-gray-400 mb-3">
                      {playlist.description}
                    </p>
                  )}
                  <p className="text-xs text-gray-500 dark:text-gray-500 mb-4">
                    {playlist.tracks.length} track{playlist.tracks.length !== 1 ? 's' : ''}
                  </p>
                  <Button
                    color="danger"
                    variant="flat"
                    size="sm"
                    onPress={() => deletePlaylist(playlist.id!)}
                  >
                    Delete Playlist
                  </Button>
                </CardBody>
              </Card>
            ))}
          </div>
        )}
      </div>

      <Modal isOpen={isCreateModalOpen} onOpenChange={setIsCreateModalOpen}>
        <ModalContent>
          <ModalHeader>Create New Playlist</ModalHeader>
          <ModalBody>
            <Input
              label="Playlist Name"
              placeholder="My Favorite Songs"
              value={newPlaylistName}
              onValueChange={setNewPlaylistName}
              autoFocus
            />
            <Input
              label="Description (optional)"
              placeholder="Add a description..."
              value={newPlaylistDescription}
              onValueChange={setNewPlaylistDescription}
            />
          </ModalBody>
          <ModalFooter>
            <Button color="default" onPress={() => setIsCreateModalOpen(false)}>
              Cancel
            </Button>
            <Button
              color="primary"
              onPress={handleCreatePlaylist}
              isLoading={isCreating}
              disabled={!newPlaylistName.trim() || isCreating}
            >
              Create
            </Button>
          </ModalFooter>
        </ModalContent>
      </Modal>
    </div>
  );
}
