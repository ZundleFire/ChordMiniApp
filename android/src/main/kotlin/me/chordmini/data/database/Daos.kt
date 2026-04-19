package me.chordmini.data.database

import androidx.room.*
import kotlinx.coroutines.flow.Flow

@Dao
interface FavoriteTrackDao {
    @Query("SELECT * FROM favorite_tracks ORDER BY addedAt DESC")
    fun getFavorites(): Flow<List<FavoriteTrack>>

    @Query("SELECT * FROM favorite_tracks WHERE videoId = :videoId")
    suspend fun getFavorite(videoId: String): FavoriteTrack?

    @Insert(onConflict = OnConflictStrategy.REPLACE)
    suspend fun addFavorite(track: FavoriteTrack)

    @Query("DELETE FROM favorite_tracks WHERE videoId = :videoId")
    suspend fun removeFavorite(videoId: String)

    @Query("SELECT COUNT(*) FROM favorite_tracks WHERE videoId = :videoId")
    suspend fun isFavorited(videoId: String): Int

    @Query("SELECT COUNT(*) FROM favorite_tracks")
    suspend fun getFavoritesCount(): Int
}

@Dao
interface PlaylistDao {
    @Query("SELECT * FROM playlists ORDER BY updatedAt DESC")
    fun getPlaylists(): Flow<List<PlaylistEntity>>

    @Query("SELECT * FROM playlists WHERE id = :playlistId")
    suspend fun getPlaylist(playlistId: Long): PlaylistEntity?

    @Transaction
    @Query("SELECT * FROM playlists WHERE id = :playlistId")
    suspend fun getPlaylistWithTracks(playlistId: Long): PlaylistWithTracks?

    @Insert(onConflict = OnConflictStrategy.REPLACE)
    suspend fun insertPlaylist(playlist: PlaylistEntity): Long

    @Update
    suspend fun updatePlaylist(playlist: PlaylistEntity)

    @Query("DELETE FROM playlists WHERE id = :playlistId")
    suspend fun deletePlaylist(playlistId: Long)
}

@Dao
interface PlaylistTrackDao {
    @Query("SELECT * FROM playlist_tracks WHERE playlistId = :playlistId ORDER BY position")
    suspend fun getPlaylistTracks(playlistId: Long): List<PlaylistTrack>

    @Insert(onConflict = OnConflictStrategy.REPLACE)
    suspend fun addTrackToPlaylist(track: PlaylistTrack)

    @Query("DELETE FROM playlist_tracks WHERE playlistId = :playlistId AND videoId = :videoId")
    suspend fun removeTrackFromPlaylist(playlistId: Long, videoId: String)

    @Query("DELETE FROM playlist_tracks WHERE playlistId = :playlistId")
    suspend fun clearPlaylist(playlistId: Long)
}

@Dao
interface AnalyzedTrackDao {
    @Query("SELECT * FROM analyzed_tracks ORDER BY analyzedAt DESC LIMIT :limit")
    fun getRecentTracks(limit: Int = 50): Flow<List<AnalyzedTrack>>

    @Query("SELECT * FROM analyzed_tracks WHERE videoId = :videoId")
    suspend fun getAnalyzedTrack(videoId: String): AnalyzedTrack?

    @Insert(onConflict = OnConflictStrategy.REPLACE)
    suspend fun insertAnalyzedTrack(track: AnalyzedTrack)

    @Query("DELETE FROM analyzed_tracks WHERE videoId = :videoId")
    suspend fun deleteAnalyzedTrack(videoId: String)

    @Query("SELECT COUNT(*) FROM analyzed_tracks")
    suspend fun getAnalyzedTracksCount(): Int
}
