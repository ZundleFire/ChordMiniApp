package me.chordmini.data.database

import android.content.Context
import androidx.room.Database
import androidx.room.Room
import androidx.room.RoomDatabase

@Database(
    entities = [
        FavoriteTrack::class,
        PlaylistEntity::class,
        PlaylistTrack::class,
        AnalyzedTrack::class
    ],
    version = 1,
    exportSchema = false
)
abstract class ChordMiniDatabase : RoomDatabase() {
    abstract fun favoriteTrackDao(): FavoriteTrackDao
    abstract fun playlistDao(): PlaylistDao
    abstract fun playlistTrackDao(): PlaylistTrackDao
    abstract fun analyzedTrackDao(): AnalyzedTrackDao

    companion object {
        @Volatile
        private var INSTANCE: ChordMiniDatabase? = null

        fun getDatabase(context: Context): ChordMiniDatabase =
            INSTANCE ?: synchronized(this) {
                INSTANCE ?: Room.databaseBuilder(
                    context.applicationContext,
                    ChordMiniDatabase::class.java,
                    "chordmini.db"
                ).build().also { INSTANCE = it }
            }
    }
}
