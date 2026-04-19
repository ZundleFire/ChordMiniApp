# ChordMini Android App

Advanced music analysis platform for Android with AI-powered chord recognition, beat detection, and synchronized lyrics.

## Features

- **Analyze Audio**: Chord and beat recognition from YouTube videos or local audio files
- **Favorites**: Save your favorite analyzed tracks for quick access
- **Playlists**: Organize tracks into custom playlists
- **Offline Support**: Room database for offline access to previously analyzed content
- **Firebase Integration**: Sync favorites and playlists across devices (upcoming)
- **Google Sign-In**: Authenticate with your Google account

## Architecture

### Data Layer
- **Room Database**: Local storage for favorites, playlists, and analyzed tracks
- **Backend Service**: HTTP client connecting to ChordMini Python backend (http://backend:8080)
- **DataStore**: User preferences and configuration

### UI Layer
- **Jetpack Compose**: Modern declarative UI framework
- **Material 3**: Material Design 3 components
- **Navigation**: Compose Navigation for screen management
- **MVVM Pattern**: Clean separation of concerns

### Technologies
- **Kotlin**: Primary language
- **Jetpack Compose**: UI framework
- **Room**: Local database
- **Firebase**: Authentication and Firestore (future)
- **Coil**: Image loading
- **OkHttp + Gson**: Networking
- **Kotlin Coroutines**: Async/reactive programming

## Project Structure

```
android/
├── src/main/
│   ├── kotlin/me/chordmini/
│   │   ├── MainActivity.kt                    # App entry point
│   │   ├── data/
│   │   │   ├── database/                      # Room entities, DAOs
│   │   │   ├── remote/                        # Backend API service
│   │   │   └── repository/                    # Data repositories
│   │   └── ui/
│   │       ├── theme/                         # Material 3 theme
│   │       ├── navigation/                    # Screen navigation
│   │       └── screens/                       # Composable screens
│   └── AndroidManifest.xml
├── build.gradle.kts                           # App-level build config
└── proguard-rules.pro                         # ProGuard config
```

## Setup & Build

### Prerequisites
- Android Studio (latest)
- Android SDK 35+
- Kotlin 2.0+

### Build Commands

```bash
# Build APK
./gradlew assembleRelease

# Build and install on device
./gradlew installRelease

# Run tests
./gradlew test

# Check code quality
./gradlew lint
```

## Configuration

### Backend URL
Update the `baseUrl` in `BackendService.kt` to point to your ChordMini backend:

```kotlin
// Local development
private val baseUrl = "http://10.0.2.2:8080"  // For Android emulator

// Production
private val baseUrl = "http://backend:8080"   // Docker network
```

### Firebase Setup (Future)
1. Create Firebase project at https://console.firebase.google.com
2. Add Android app and download `google-services.json`
3. Place in `android/app/` directory
4. Enable Authentication and Firestore
5. Sync rooms across devices

## Database Schema

### FavoriteTrack
```sql
CREATE TABLE favorite_tracks (
    videoId TEXT PRIMARY KEY,
    title TEXT,
    channelTitle TEXT,
    thumbnail TEXT,
    duration INTEGER,
    addedAt INTEGER
)
```

### Playlist
```sql
CREATE TABLE playlists (
    id INTEGER PRIMARY KEY,
    name TEXT,
    description TEXT,
    isPublic BOOLEAN,
    createdAt INTEGER,
    updatedAt INTEGER
)
```

### PlaylistTrack
```sql
CREATE TABLE playlist_tracks (
    id INTEGER PRIMARY KEY,
    playlistId INTEGER,
    videoId TEXT,
    position INTEGER,
    FOREIGN KEY (playlistId) REFERENCES playlists(id)
)
```

### AnalyzedTrack
```sql
CREATE TABLE analyzed_tracks (
    videoId TEXT PRIMARY KEY,
    title TEXT,
    channelTitle TEXT,
    thumbnail TEXT,
    duration INTEGER,
    beats TEXT,              # JSON
    chords TEXT,            # JSON
    synchronizedChords TEXT,# JSON
    analyzedAt INTEGER
)
```

## API Integration

### Backend Endpoints

**Analyze Audio**
```
GET /analyze?video_id=<videoId>

Response:
{
  "videoId": "...",
  "title": "...",
  "beats": [...],
  "chords": [...],
  "synchronizedChords": [...],
  "timeSignature": 4,
  "audioDuration": 180.5
}
```

**Health Check**
```
GET /
Response: 200 OK
```

## Development Roadmap

- [ ] Implement Analyze screen with YouTube URL input
- [ ] Add local audio file picker
- [ ] Implement Favorites screen with search
- [ ] Implement Playlists screen with CRUD
- [ ] Add Settings screen with preferences
- [ ] Firebase integration for sync
- [ ] Google Sign-In implementation
- [ ] Offline analysis support
- [ ] Native audio export
- [ ] Unit and UI tests

## FAQ

**Q: How do I connect to the local backend?**
A: Update `baseUrl` in `BackendService.kt`. For emulator use `10.0.2.2:8080`, for device use your local IP.

**Q: Can I use the app offline?**
A: You can view previously analyzed tracks and playlists, but can't analyze new audio without network access.

**Q: How do I sync data between devices?**
A: Firebase sync is coming in a future version with Google Sign-In support.

## License

Same as ChordMiniApp (see root LICENSE file)
