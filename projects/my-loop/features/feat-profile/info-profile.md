---
type: feature
title: Profile & Avatars — Info
project: my-loop
feature: feat-profile
status: active
role: info
author: robin
tags: [profile, avatar, firebase-auth, identity, achievements]
---

# Current Architecture

### Components
- **Authentication**: Firebase Auth (Google + Apple sign-in). `GoogleSignIn.instance` (v7 singleton API) + `AppleAuthProvider` via `signInWithProvider`. JWT tokens for API authorization.
- **Avatar Selection**: Emoji-based avatars (grid of 24+ emojis). User picks during onboarding via `AvatarPickerScreen`.
- **Color Assignment**: 8 curated hex colors: `#58CC02, #1CB0F6, #FF4B4B, #FF9600, #A560E8, #FFC800, #FF6B81, #2ED8A3`.
- **Profile Screen**: Stats grid with Material Icons + colored backgrounds (hexes owned, total walked, rank, streak), settings (avatar/color, name, sign out). Uses `userProfileProvider` (Riverpod Notifier) for reactive state.
- **Stat Cards**: `_StatCard` widget uses `IconData` + `Color` + `FittedBox` for responsive scaling. No emoji text — proper Material Icons with tinted circle backgrounds.
- **User Profile View**: Other users' profiles viewable at `/user-profile` route. Shows avatar, name, hex tier badge (Bronze/Silver/Gold/Platinum/Crystal/Diamond with divisions I-IV), stats (hexes, distance, streak, rank). Accessible by tapping any user in leaderboard. **Layout**: Row with avatar (56px) + name horizontally aligned (name at avatar center height). Tag/title below avatar with indent. HexTrophyBadge (90px) on the right side with enhanced animation. Stats as simple list rows below.
- **Player Title System**: `PlayerTitle` model in `shared/models/player_titles.dart`. Titles based on hex count: Drifter(0), Wanderer(10), Trailblazer(50), Territory Lord(100), Hex Overlord(500), Grid Dominator(1000+). Each has `emoji`, `label`, `minHexes`. `getTitle(hexCount)` returns appropriate tier.
- **Hex Tier System**: Bronze(0-49), Silver(50-199), Gold(200-499), Platinum(500-1499), Crystal(1500-2999), Diamond(3000+). Each tier has 4 divisions (I-IV). `HexTrophyBadge` widget: **dual animation** (pulse 2s 6% scale + shimmer 3s rotating sweep), gradient hexagon, tier label, hex count pill with divider + roman numeral, progress bar to next division, breathing glow shadow. `showProgress: true` renders the progress bar and hex count pill.
- **Local Auth**: `local_signup_screen.dart` for dev/local accounts without federated login. Name field validation (min 2 chars). Navigates to `/avatar` with `prefillName`. API register endpoint detects `dev_`/`local_` UID prefix, generates unique `local_<guid>`. Returns existing user on duplicate (200, not 409). User entity has `AuthProvider` field (default `"local"`).
- **Achievements System**: 100 achievements in 5 categories × 20 each. 1/2/3 star tiers (like Clash of Clans). Categories: Territory, Walking, Social/Competitive, Exploration, Milestones. Own dedicated tab (not inside profile). Tappable → bottom sheet with description + tier breakdown. Header uses `Icons.hexagon` icon + text (NOT unicode — unicode glyph was broken on some devices).
- **Avatar Clickability**: Home tab avatar has circular border + glow shadow + small badge indicator (menu icon overlay) to make it visually clear it's tappable.
- **Settings**: Bottom sheet editors for avatar+color, display name (TextField). Sign out → navigates to `/login`.

### Auth Implementation Details
- `AuthService` class in `shared/services/auth_service.dart`
- Google: `GoogleSignIn.instance.initialize()` (called once via `_googleInitialized` flag) → `.authenticate()` → `GoogleAuthProvider.credential(idToken:)` → `FirebaseAuth.signInWithCredential()`
- Apple: `AppleAuthProvider()` with email+name scopes → `FirebaseAuth.signInWithProvider()`
- Local: `local_signup_screen.dart` → `avatar_picker_screen.dart` → calls register API with `dev_` UID prefix → API generates `local_<guid>` to ensure uniqueness
- Sign out: `GoogleSignIn.instance.signOut()` + `FirebaseAuth.signOut()`
- Providers: `authServiceProvider` (Provider), `authStateProvider` (StreamProvider<User?>)
- `main.dart`: `await Firebase.initializeApp()` before `runApp()`
- **Auto-login on app restart**: `LoginScreen` is now a `ConsumerStatefulWidget`. In `initState` → `addPostFrameCallback` → checks `authService.currentUser`. If non-null (Firebase session persists automatically), shows spinner, calls `_routeAfterAuth(uid)` which does: `getUserByUid` → `getLeaderboard` (for rank) → `setFromApi(all fields including rank)` → `context.go('/home')`. No token storage code needed — Firebase handles it.
- **Offline login persistence (PR #24, issue #19)**: `ProfileCache` (`shared/services/profile_cache.dart`) stores the last profile on disk, written after each successful login (`save(firebaseUid, profile)`) and cleared on sign-out / account deletion. If the backend is unreachable on launch, `_routeAfterAuth`'s `catch` calls `_restoreOfflineSession(error, firebaseUid)`: when the error is a connectivity failure (`isServerUnreachable`) and a cached profile exists, it restores the session offline instead of stranding the user on login. The cache is a `CachedProfile { firebaseUid, profile }` and restore is gated on `cached.firebaseUid == firebaseUid` so a second account on the same device cannot inherit the first user's session offline (see [[bug-2026-06-15-offline-restore-cross-user-identity]]). `decode` returns `null` without `firebaseUid` → legacy caches are safely dropped on upgrade.
- Login screen is a `ConsumerStatefulWidget` (converted from ConsumerWidget for auto-login lifecycle)
- `_routeAfterAuth(uid)`: fetches full user profile + rank → `setFromApi(all fields)` → init push notifications → gets Firebase ID token → connects SignalR (with token + userId) → calls `hydrateAllSlices(ref)` → navigates to `/home`
- `_devSkip()`: Same pattern as `_routeAfterAuth` — connects SignalR + hydrates after setFromApi
- `RegisterRequest` has optional `AuthProvider` field (default `"local"`)
- `User` entity has `AuthProvider` column — added via `ALTER TABLE IF NOT EXISTS` in `Program.cs`

### Achievement System Details
- Model: `Achievement` class with `id`, `name`, `emoji`, `description`, `tier1/tier2/tier3` (int thresholds), `unit`, `getStars(progress)` method
- 100 items defined as `const achievements` list
- Categories: Territory (1-20), Walking (21-40), Social (41-60), Exploration (61-80), Milestones (81-100)
- UI: `_AchievementTile` with emoji, name, progress bar, star display (⭐ vs ☆)
- "See All" pushes `_AllAchievementsScreen` with total star count header + scrollable list
- Progress currently mocked in-app (will connect to API later)

### Known Behaviors
- Firebase Auth handles social login flows (Google, Apple — Apple required for iOS App Store)
- JWT token attached to all API requests via Authorization header
- Avatar stored as index into `avatarEmojis` list (not image assets)
- Color stored as hex string in user profile
- Profile data will come from `GET /api/users/me`
- Sign out calls `context.go('/login')` via go_router
- Settings changes show success SnackBar ("Name updated! ✅", "Avatar updated! ✅")

### Edge Cases
- `GoogleSignIn.instance.initialize()` must only be called once (guarded by `_googleInitialized` bool)
- Apple sign-in requirement: must support "Hide My Email" relay
- Account deletion: GDPR compliance — `UserService.DeleteUserData` now `ExecuteDeleteAsync`-purges **all 8 child tables** (TerritoryCells, CellTransfers, Claims, LeaderboardEntries, ExploredCells, DailyMissions, UserAchievements, DeviceTokens) before the user row (abb321a, CRITICAL-3). There are NO DB-level FK cascades (confirmed in AppDbContext), so these explicit purges are mandatory — previously only 4 of 8 were purged, leaving ExploredCells/DailyMissions/UserAchievements/DeviceTokens orphaned.
- Display name moderation: profanity filter on server
- Auth errors caught with try/catch, shown as red SnackBar
- Offline restore must be identity-bound: only restore the cached profile when its `firebaseUid` matches the currently-authenticated user. A bare `currentUser != null` check is insufficient — because `ProfileCache.save` runs only *after* the server call succeeds, a second user authenticating while the backend is down would otherwise inherit the previous user's cached session (cross-user identity / IDOR risk). Fixed in `1e578ff` ([[bug-2026-06-15-offline-restore-cross-user-identity]]).
- `isServerUnreachable` distinguishes connectivity failures (restore offline) from real HTTP error responses like 500 (server reachable → do NOT restore a stale cache)

## File Map
- `mobile/lib/features/auth/login_screen.dart` — ConsumerStatefulWidget, Google + Apple sign-in buttons, SKIP dev mode, SignalR connect + hydrate on auth
- `mobile/lib/features/auth/local_signup_screen.dart` — Local/dev account creation, name validation (min 2 chars)
- `mobile/lib/features/auth/avatar_picker_screen.dart` — Onboarding avatar selection, accepts `prefillName` extra param
- `mobile/lib/features/profile/profile_screen.dart` — Stats grid (Material Icons), settings, avatar/color editor
- `mobile/lib/features/profile/user_profile_screen.dart` — Other users' public profile, card layout with HexTrophyBadge(60px)
- `mobile/lib/features/achievements/achievements_screen.dart` — Dedicated tab, tappable tiles with bottom sheet details, Icons.hexagon header
- `mobile/lib/shared/models/achievements.dart` — 100 achievements with star tiers + descriptions
- `mobile/lib/shared/models/player_titles.dart` — PlayerTitle model, getTitle(hexCount), 6 tiers (Drifter→Grid Dominator)
- `mobile/lib/shared/services/auth_service.dart` — Firebase Auth + Google + Apple; clears `ProfileCache` on sign-out
- `mobile/lib/shared/services/profile_cache.dart` — On-disk `CachedProfile {firebaseUid, profile}`; `encode`/`decode`/`save`/`load`/`clear`; identity-bound offline session restore (PR #24)
- `mobile/test/login_persist_test.dart` — Tests for `ProfileCache` codec (UID round-trip, missing-UID rejection) + `isServerUnreachable` (PR #24)
- `mobile/lib/shared/services/user_state.dart` — `UserProfile` + `UserProfileNotifier` (Riverpod Notifier)
- `mobile/lib/shared/state/profile_slice.dart` — ProfileState Notifier (hexCount, streak, distanceKm, rank) — updated via SignalR push
- `mobile/lib/shared/state/hydration.dart` — Orchestrates full state load from GET /game-state into all slices
- `mobile/lib/main.dart` — Firebase.initializeApp() in try-catch (web doesn't have firebase_options)
- `api/MyLoop.Api/Entities/User.cs` — Added `AuthProvider` field
- `api/MyLoop.Api/Controllers/UsersController.cs` — Register/profile/game-state/delete endpoints (thin; was previously documented as a non-existent `Endpoints/UserEndpoints.cs`)
- `api/MyLoop.Api/Services/UserService.cs` — Register (local/federated dedup, `local_<guid>` UID generation), profile queries, `DeleteUserData` full 8-table GDPR cascade (abb321a)
- `api/MyLoop.Api/Program.cs` — ALTER TABLE adds AuthProvider column if missing (safe for existing DBs)

## Integration Points
- Firebase Auth → JWT → all API calls authenticated
- User color stored in user profile, applied to territory hexes on map
- Avatar is emoji-based (shipped with app, no network fetch)
- Profile stats will aggregate from `territories` and `claims` tables
- Achievement progress will come from API (currently mocked)

## Open Questions
- ~~Exact avatar art style~~ → Decided: emoji-based (🦊🐸🦁 etc.)
- ~~Should users be able to change color?~~ → Yes, via settings bottom sheet
- Username uniqueness: global or per-city?
- ~~Achievement progress tracking: client-side cache or always fetch from API?~~ → Resolved: push via SignalR (AchievementUnlocked event), hydrated from GET /game-state on login
- Custom avatar creator SDK (Ready Player Me or similar) — deferred post-MVP

## Evolution
- 2026-06-15 — Documented offline login persistence (`ProfileCache` / `_restoreOfflineSession`, PR #24, issue #19) and the identity-binding requirement found in review ([[bug-2026-06-15-offline-restore-cross-user-identity]], fixed `1e578ff`). Added File Map entries for `profile_cache.dart` + `login_persist_test.dart`.

# Related
- [[feat-profile]]
