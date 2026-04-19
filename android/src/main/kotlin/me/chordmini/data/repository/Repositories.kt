package me.chordmini.data.repository

import kotlinx.coroutines.flow.Flow
import me.chordmini.data.database.*
import me.chordmini.data.remote.BackendService
import me.chordmini.data.remote.AnalysisResponse
import com.google.gson.Gson

class FavoritesRepository(
    private val favoriteTrackDao: FavoriteTrackDao
) {
    fun getFavorites(): Flow<List<FavoriteTrack>> = favoriteTrackDao.getFavorites()

    suspend fun addFavorite(track: FavoriteTrack) = favoriteTrackDao.addFavorite(track)

    suspend fun removeFavorite(videoId: String) = favoriteTrackDao.removeFavorite(videoId)

    suspend fun isFavorited(videoId: String) = favoriteTrackDao.isFavorited(videoId) > 0
}

class PlaylistRepository(
    private val playlistDao: PlaylistDao,
    private val playlistTrackDao: PlaylistTrackDao
) {
    fun getPlaylists(): Flow<List<PlaylistEntity>> = playlistDao.getPlaylists()

    suspend fun getPlaylistWithTracks(playlistId: Long): PlaylistWithTracks? =
        playlistDao.getPlaylistWithTracks(playlistId)

    suspend fun createPlaylist(name: String, description: String? = null): Long {
        val playlist = PlaylistEntity(
            name = name,
            description = description
        )
        return playlistDao.insertPlaylist(playlist)
    }

    suspend fun updatePlaylist(playlistId: Long, name: String, description: String? = null) {
        val playlist = PlaylistEntity(
            id = playlistId,
            name = name,
            description = description,
            updatedAt = System.currentTimeMillis()
        )
        playlistDao.updatePlaylist(playlist)
    }

    suspend fun deletePlaylist(playlistId: Long) = playlistDao.deletePlaylist(playlistId)

    suspend fun addTrackToPlaylist(playlistId: Long, videoId: String) {
        val tracks = playlistTrackDao.getPlaylistTracks(playlistId)
        val track = PlaylistTrack(
            playlistId = playlistId,
            videoId = videoId,
            position = tracks.size
        )
        playlistTrackDao.addTrackToPlaylist(track)
    }

    suspend fun removeTrackFromPlaylist(playlistId: Long, videoId: String) =
        playlistTrackDao.removeTrackFromPlaylist(playlistId, videoId)
}

class AnalyzedTrackRepository(
    private val analyzedTrackDao: AnalyzedTrackDao,
    private val backendService: BackendService
) {
    fun getRecentTracks(limit: Int = 50): Flow<List<AnalyzedTrack>> =
        analyzedTrackDao.getRecentTracks(limit)

    suspend fun analyzeTrack(videoId: String): AnalyzedTrack {
        // Try to get from cache first
        val cached = analyzedTrackDao.getAnalyzedTrack(videoId)
        if (cached != null) {
            return cached
        }

        // Fetch from backend
        val response = backendService.analyzeAudio(videoId)

        // Save to local database
        val gson = Gson()
        val track = AnalyzedTrack(
            videoId = response.videoId,
            title = response.title,
            channelTitle = response.channelTitle,
            thumbnail = response.thumbnail,
            duration = response.audioDuration?.toInt() ?: 0,
            beats = gson.toJson(response.beats),
            chords = gson.toJson(response.chords),
            synchronizedChords = gson.toJson(response.synchronizedChords)
        )

        analyzedTrackDao.insertAnalyzedTrack(track)
        return track
    }

    suspend fun getAnalyzedTrack(videoId: String): AnalyzedTrack? =
        analyzedTrackDao.getAnalyzedTrack(videoId)

    suspend fun deleteAnalyzedTrack(videoId: String) =
        analyzedTrackDao.deleteAnalyzedTrack(videoId)
}
