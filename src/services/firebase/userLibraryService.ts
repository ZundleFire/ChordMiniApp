import {
  collection,
  doc,
  getDoc,
  setDoc,
  updateDoc,
  deleteDoc,
  query,
  where,
  getDocs,
  Timestamp,
  writeBatch,
  orderBy,
  limit,
} from 'firebase/firestore';
import { db } from '@/config/firebase';

export interface FavoriteTrack {
  id?: string;
  videoId: string;
  title: string;
  channelTitle: string;
  thumbnail: string;
  duration: number;
  audioUrl?: string;
  sourceType?: 'youtube' | 'suno' | 'local-upload';
  addedAt: Timestamp;
}

export interface Playlist {
  id?: string;
  userId: string;
  name: string;
  description?: string;
  tracks: string[]; // Array of videoIds
  createdAt: Timestamp;
  updatedAt: Timestamp;
  isPublic?: boolean;
}

const FAVORITES_COLLECTION = 'users';
const PLAYLISTS_COLLECTION = 'playlists';

function sanitizeFavoriteTrack(track: Omit<FavoriteTrack, 'id' | 'addedAt'>): Omit<FavoriteTrack, 'id' | 'addedAt'> {
  return Object.fromEntries(
    Object.entries(track).filter(([, value]) => value !== undefined)
  ) as Omit<FavoriteTrack, 'id' | 'addedAt'>;
}

export class UserLibraryService {
  private static getDb() {
    if (!db) {
      throw new Error('Firestore is not initialized');
    }
    return db;
  }

  /**
   * Add a track to user's favorites
   */
  static async addToFavorites(userId: string, track: Omit<FavoriteTrack, 'id' | 'addedAt'>) {
    try {
      const firestore = this.getDb();
      const userDocRef = doc(firestore, FAVORITES_COLLECTION, userId);
      const userDoc = await getDoc(userDocRef);
      const sanitizedTrack = sanitizeFavoriteTrack(track);

      if (!userDoc.exists()) {
        await setDoc(userDocRef, {
          favorites: [
            {
              ...sanitizedTrack,
              addedAt: Timestamp.now(),
            },
          ],
        });
      } else {
        const favorites = userDoc.data()?.favorites || [];

        // Check if already favorited
        if (favorites.some((f: FavoriteTrack) => f.videoId === sanitizedTrack.videoId)) {
          throw new Error('Track already in favorites');
        }

        favorites.push({
          ...sanitizedTrack,
          addedAt: Timestamp.now(),
        });

        await updateDoc(userDocRef, {
          favorites,
        });
      }
    } catch (error) {
      console.error('Error adding to favorites:', error);
      throw error;
    }
  }

  /**
   * Remove a track from user's favorites
   */
  static async removeFromFavorites(userId: string, videoId: string) {
    try {
      const firestore = this.getDb();
      const userDocRef = doc(firestore, FAVORITES_COLLECTION, userId);
      const userDoc = await getDoc(userDocRef);

      if (userDoc.exists()) {
        const favorites = userDoc.data()?.favorites || [];
        const updated = favorites.filter((f: FavoriteTrack) => f.videoId !== videoId);

        await updateDoc(userDocRef, {
          favorites: updated,
        });
      }
    } catch (error) {
      console.error('Error removing from favorites:', error);
      throw error;
    }
  }

  /**
   * Get all favorite tracks for a user
   */
  static async getFavorites(userId: string): Promise<FavoriteTrack[]> {
    try {
      const firestore = this.getDb();
      const userDocRef = doc(firestore, FAVORITES_COLLECTION, userId);
      const userDoc = await getDoc(userDocRef);

      if (userDoc.exists()) {
        return userDoc.data()?.favorites || [];
      }

      return [];
    } catch (error) {
      console.error('Error fetching favorites:', error);
      throw error;
    }
  }

  /**
   * Check if a track is favorited by the user
   */
  static async isFavorited(userId: string, videoId: string): Promise<boolean> {
    try {
      const favorites = await this.getFavorites(userId);
      return favorites.some((f) => f.videoId === videoId);
    } catch (error) {
      console.error('Error checking favorite status:', error);
      return false;
    }
  }

  /**
   * Create a new playlist
   */
  static async createPlaylist(userId: string, name: string, description?: string) {
    try {
      const firestore = this.getDb();
      const playlistRef = doc(collection(firestore, PLAYLISTS_COLLECTION));

      const playlist: Playlist = {
        id: playlistRef.id,
        userId,
        name,
        description,
        tracks: [],
        createdAt: Timestamp.now(),
        updatedAt: Timestamp.now(),
        isPublic: false,
      };

      await setDoc(playlistRef, playlist);
      return playlist;
    } catch (error) {
      console.error('Error creating playlist:', error);
      throw error;
    }
  }

  /**
   * Get all playlists for a user
   */
  static async getUserPlaylists(userId: string): Promise<Playlist[]> {
    try {
      const firestore = this.getDb();
      const q = query(
        collection(firestore, PLAYLISTS_COLLECTION),
        where('userId', '==', userId),
        orderBy('updatedAt', 'desc')
      );

      const snapshot = await getDocs(q);
      return snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      } as Playlist));
    } catch (error) {
      console.error('Error fetching playlists:', error);
      return [];
    }
  }

  /**
   * Add a track to a playlist
   */
  static async addTrackToPlaylist(playlistId: string, videoId: string) {
    try {
      const firestore = this.getDb();
      const playlistRef = doc(firestore, PLAYLISTS_COLLECTION, playlistId);
      const playlistDoc = await getDoc(playlistRef);

      if (!playlistDoc.exists()) {
        throw new Error('Playlist not found');
      }

      const tracks = playlistDoc.data()?.tracks || [];

      // Check if already in playlist
      if (tracks.includes(videoId)) {
        throw new Error('Track already in playlist');
      }

      tracks.push(videoId);

      await updateDoc(playlistRef, {
        tracks,
        updatedAt: Timestamp.now(),
      });
    } catch (error) {
      console.error('Error adding track to playlist:', error);
      throw error;
    }
  }

  /**
   * Remove a track from a playlist
   */
  static async removeTrackFromPlaylist(playlistId: string, videoId: string) {
    try {
      const firestore = this.getDb();
      const playlistRef = doc(firestore, PLAYLISTS_COLLECTION, playlistId);
      const playlistDoc = await getDoc(playlistRef);

      if (!playlistDoc.exists()) {
        throw new Error('Playlist not found');
      }

      const tracks = playlistDoc.data()?.tracks || [];
      const updated = tracks.filter((t: string) => t !== videoId);

      await updateDoc(playlistRef, {
        tracks: updated,
        updatedAt: Timestamp.now(),
      });
    } catch (error) {
      console.error('Error removing track from playlist:', error);
      throw error;
    }
  }

  /**
   * Update playlist metadata
   */
  static async updatePlaylist(
    playlistId: string,
    updates: Partial<Pick<Playlist, 'name' | 'description' | 'isPublic'>>
  ) {
    try {
      const firestore = this.getDb();
      const playlistRef = doc(firestore, PLAYLISTS_COLLECTION, playlistId);

      await updateDoc(playlistRef, {
        ...updates,
        updatedAt: Timestamp.now(),
      });
    } catch (error) {
      console.error('Error updating playlist:', error);
      throw error;
    }
  }

  /**
   * Delete a playlist
   */
  static async deletePlaylist(playlistId: string) {
    try {
      const firestore = this.getDb();
      const playlistRef = doc(firestore, PLAYLISTS_COLLECTION, playlistId);
      await deleteDoc(playlistRef);
    } catch (error) {
      console.error('Error deleting playlist:', error);
      throw error;
    }
  }
}
