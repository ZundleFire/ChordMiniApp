# ChordMiniApp Development Progress — April 19, 2026

## Completed Work

### ✅ Step 1: Docker Compose Configuration for x86 Build
**Commit:** `9d8603f`
- Updated `docker-compose.prod.yml` to build from source instead of pulling pre-built ARM-only images from Docker Hub
- Frontend builds from `./Dockerfile` (Node 20 Alpine multi-stage)
- Backend builds from `./python_backend/Dockerfile` (Python 3.10 slim)
- Ports: 3001 → 3000 (frontend), 8080 → 8080 (backend)
- Audio cache volume at `./audio-cache:/app/audio_cache` for both services
- SongFormer remains disabled (upstream LFS quota exceeded)

### ✅ Step 2: Google Sign-In & Favorites/Playlists (Frontend)
**Commit:** `94bb148`

**New Files:**
- `src/contexts/UserContext.tsx` — Firebase auth state management
  - Anonymous auth preserved
  - Google Sign-In popup flow
  - Auth persistence via localStorage
- `src/services/firebase/userLibraryService.ts` — Firestore backend
  - `users` collection: favorites array
  - `playlists` collection: user-created playlists
  - CRUD operations with error handling
  - Track association with playlists
- `src/hooks/useUserLibrary.ts` — React hooks for components
  - `useFavorites()` — manage favorites with local state
  - `usePlaylists()` — manage playlists with local state
- `src/components/common/GoogleSignInButton.tsx` — Auth UI button
  - Integrated into navbar
  - Shows user profile when signed in
  - Logout button
- `src/components/common/FavoritesButton.tsx` — Add/remove from favorites
  - Heart icon toggle
  - Requires sign-in
  - Per-track favorite status
- `src/components/common/PlaylistManager.tsx` — Playlist modal
  - Create playlists inline
  - Add/remove tracks from playlists
  - Shows track count per playlist
  - Visual feedback for track membership

**Modified Files:**
- `src/app/providers.tsx` — Wrap app with `UserProvider`
- `src/components/common/Navigation.tsx` — Add Google Sign-In button to navbar

**Firestore Schema:**
```
users/{uid}
  ├── favorites: [
  │   ├── videoId
  │   ├── title
  │   ├── channelTitle
  │   ├── thumbnail
  │   ├── duration
  │   └── addedAt (timestamp)
  └── ]

playlists/{playlistId}
  ├── userId
  ├── name
  ├── description
  ├── tracks: [videoId, videoId, ...]
  ├── isPublic
  ├── createdAt
  └── updatedAt
```

### ✅ Step 3: Progressive Web App (PWA) Offline Support
**Commit:** `e9babee`

**New Files:**
- `public/manifest.json` — PWA app metadata
  - App name, icons, theme colors
  - Shortcuts for quick actions (Analyze Audio)
  - Share target configuration
- `next.config.js` — Updated with next-pwa configuration
  - Runtime cache strategies optimized for music analysis
  - CacheFirst: Google fonts, images, audio, Firebase storage
  - NetworkFirst: API calls with 5s timeout
  - Stale-while-revalidate capabilities

**Cache Strategies:**
- Google Fonts: 1 year cache
- YouTube images (yt3.ggpht.com, etc.): 1 week cache
- Firebase storage: 1 month cache
- Static images: 1 month cache
- Audio files (mp3, wav, etc.): 1 week cache
- API calls: 1 hour cache, network timeout 5s

**Modified Files:**
- `package.json` — Added `next-pwa: ^5.6.15`
- `src/app/layout.tsx` — PWA meta tags
  - Manifest link
  - Theme color
  - Mobile web app capabilities (iOS/Android)
  - Apple-specific meta tags

**Features:**
- Installable on home screen (Android/iOS/Desktop)
- Offline access to previously analyzed content
- Service worker caching
- Install prompt shown to browser

### ✅ Step 4: Android App Framework (Kotlin + Jetpack Compose)
**Commit:** `8b454cf`

**Project Structure:**
```
android/
├── build.gradle.kts — App-level build config
├── settings.gradle.kts — Gradle plugins
├── proguard-rules.pro — ProGuard obfuscation rules
├── README.md — Documentation
└── src/main/
    ├── AndroidManifest.xml
    └── kotlin/me/chordmini/
        ├── MainActivity.kt
        ├── data/
        │   ├── database/
        │   │   ├── Entities.kt — Room entities
        │   │   ├── Daos.kt — Database access objects
        │   │   └── ChordMiniDatabase.kt
        │   ├── remote/
        │   │   └── BackendService.kt — HTTP API client
        │   └── repository/
        │       └── Repositories.kt — Data layer
        └── ui/
            ├── theme/Theme.kt — Material 3 design
            ├── navigation/Navigation.kt — Screen routing
            └── screens/Screens.kt — Composable screens
```

**Core Technologies:**
- Kotlin 2.0+ with Gradle Kotlin DSL
- Jetpack Compose for UI
- Material 3 design system
- Room for offline database
- OkHttp 4.12 + Gson for networking
- Firebase (auth/firestore) ready
- Firebase Analytics ready
- Coil for image loading
- Kotlin Coroutines & Flow

**Database Schema:**
- `favorite_tracks` — Local favorites
- `playlists` — Custom playlists
- `playlist_tracks` — Track membership
- `analyzed_tracks` — Cached analysis results

**Screens (MVP):**
- Home — App intro with Analyze button
- Analyze — Input YouTube URL (placeholder)
- Favorites — Browse favorited tracks
- Playlists — Manage playlists
- Settings — User preferences

**Architecture:**
- MVVM pattern via ViewModels
- Repository layer for data access
- Coroutines for async operations
- Firebase integration ready for sync

**Features (MVP):**
- Bottom navigation between screens
- Material 3 theme (dark mode support)
- Room database initialization
- Backend API client ready
- Responsive layout

---

## Next Steps (Roadmap)

### Immediate (Before First Server Build)
1. ✅ Docker Compose config — DONE
2. ✅ Google Sign-In & Favorites — DONE
3. ✅ next-pwa for offline — DONE
4. ✅ Android skeleton — DONE

### Server Deployment (Step 5)
1. SSH into Ubuntu server
2. `git pull` latest from your fork
3. Configure `.env.docker` with API keys
4. `docker compose -f docker-compose.prod.yml up --build -d`
5. Test frontend at `http://SERVER_IP:3001` and backend at `http://SERVER_IP:8080`

### Web Frontend Enhancement (Step 6)
1. Integrate FavoritesButton in video results
2. Integrate PlaylistManager in analysis view
3. Add Favorites/Playlists pages to navigation
4. Sync UI state with Firestore in real-time
5. Test PWA offline capabilities
6. Deploy web frontend to Vercel or keep self-hosted

### Android App Development (Step 7)
1. Implement Analyze screen with YouTube URL input
2. Add local audio file picker
3. Wire up Favorites/Playlists screens to Room database
4. Implement Firebase auth (Google Sign-In)
5. Add Settings screen with preferences
6. Build debug APK and test on device/emulator
7. Connect to backend for live analysis
8. Implement offline analysis cache strategy
9. Handle network errors gracefully
10. Performance optimization & testing

### CI/CD & Production (Step 8)
1. GitHub Actions for automated builds
2. Firebase Hosting for web app
3. Play Store distribution for Android app
4. Docker image tagging and versioning
5. Server health monitoring
6. Error tracking (Sentry)

---

## Deployment Checklist

### Before First Server Build
- [ ] Clone fork on Windows ✅
- [ ] Make source code changes ✅
  - [ ] docker-compose.prod.yml updated ✅
  - [ ] Firestore collections ready ✅
  - [ ] PWA manifest ready ✅
  - [ ] Android framework ready ✅
- [ ] Push to GitHub ✅

### Server Setup
- [ ] SSH into Ubuntu 25.04
- [ ] `cd ~/ChordMiniApp && git pull`
- [ ] Create `.env.docker` with all API keys
- [ ] Create `audio-cache` directory
- [ ] Run `docker compose -f docker-compose.prod.yml up --build -d`
- [ ] Verify services with health checks
- [ ] Test audio analysis via backend API

### Frontend Web
- [ ] Test at `http://LOCAL_SERVER_IP:3001`
- [ ] Verify Google Sign-In flow
- [ ] Check offline PWA installation
- [ ] Test favorites/playlists functionality
- [ ] Deploy to Vercel (optional)

### Android App
- [ ] Install Android Studio on Windows/Mac/Linux
- [ ] Open `android/` folder as a project
- [ ] Configure Firebase (future step)
- [ ] Build debug APK
- [ ] Test on emulator or device
- [ ] Connect to backend for live testing

---

## Current codebase status
- **Frontend:** Next.js 16 with Compose UI, Firestore integration, PWA support
- **Backend:** Python Flask with ML models (Beat-Transformer, Chord-CNN-LSTM, ChordMini)
- **Android:** Kotlin Compose app with Room database, ready for feature development
- **All on GitHub:** https://github.com/ZundleFire/ChordMiniApp

---

## Key Decisions Made
1. **Build from source** — Upstream images are ARM-only; x86 server needs local builds
2. **Local audio cache** — No Firebase Storage; use Docker volume instead
3. **Room database** — Android offline support for analyzed tracks and playlists
4. **Material 3** — Modern UI framework for Android (matches web intent)
5. **firebase-admin** — Server-side operations for user data sync

---

## Known Limitations
- SongFormer disabled (upstream LFS quota exceeded)
- Genius & Music.AI API keys not configured (optional for MVP)
- Android app framework is skeleton — screens need implementation
- No CI/CD pipeline yet (manual builds)
- Local network deployment only (no public internet yet)

---

## Questions & Contact
- **Fork owner:** ZundleFire
- **Tests:** Run locally on Windows dev machine and via emulator/device for Android
- **Issues:** Track on GitHub Issues
