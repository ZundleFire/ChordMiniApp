package me.chordmini.data.database

import androidx.room.*
import kotlinx.serialization.Serializable

@Serializable
@Entity(tableName = "favorite_tracks")
data class FavoriteTrack(
    @PrimaryKey
    val videoId: String,
    val title: String,
    val channelTitle: String,
    val thumbnail: String,
    val duration: Int,
    val addedAt: Long = System.currentTimeMillis()
)

@Serializable
@Entity(tableName = "playlists")
data class PlaylistEntity(
    @PrimaryKey(autoGenerate = true)
    val id: Long = 0,
    val name: String,
    val description: String? = null,
    val isPublic: Boolean = false,
    val createdAt: Long = System.currentTimeMillis(),
    val updatedAt: Long = System.currentTimeMillis()
)

@Serializable
@Entity(
    tableName = "playlist_tracks",
    foreignKeys = [
        ForeignKey(
            entity = PlaylistEntity::class,
            parentColumns = ["id"],
            childColumns = ["playlistId"],
            onDelete = ForeignKey.CASCADE
        )
    ],
    indices = [
        Index(value = ["playlistId"])
    ]
)
data class PlaylistTrack(
    @PrimaryKey(autoGenerate = true)
    val id: Long = 0,
    val playlistId: Long,
    val videoId: String,
    val position: Int
)

// Data class for queries
data class PlaylistWithTracks(
    @Embedded
    val playlist: PlaylistEntity,
    
    @Relation(
        parentColumn = "id",
        entityColumn = "playlistId"
    )
    val tracks: List<PlaylistTrack> = emptyList()
)

@Serializable
@Entity(tableName = "analyzed_tracks")
data class AnalyzedTrack(
    @PrimaryKey
    val videoId: String,
    val title: String,
    val channelTitle: String,
    val thumbnail: String,
    val duration: Int,
    val beats: String, // JSON serialized
    val chords: String, // JSON serialized
    val synchronizedChords: String, // JSON serialized
    val analyzedAt: Long = System.currentTimeMillis()
)
