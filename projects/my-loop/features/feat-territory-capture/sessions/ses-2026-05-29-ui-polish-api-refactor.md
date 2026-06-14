---
type: session
title: UI Polish, API Architecture Refactor, Map Fixes
date: 2026-05-29
project: my-loop
feature: feat-territory-capture
status: complete
author: robin
continues-from: "[[ses-2026-05-28-continued-architecture-refinement]]"
tags: [ui, profile, shimmer, map, api-refactor, validation, ngrok]
files:
  - path: mobile/lib/features/profile/user_profile_screen.dart
    role: rewritten
  - path: mobile/lib/features/home/home_screen.dart
    role: modified
  - path: mobile/lib/features/home/home_tab.dart
    role: modified
  - path: mobile/lib/features/journey/journey_screen.dart
    role: modified
  - path: mobile/lib/features/leaderboard/leaderboard_screen.dart
    role: modified
  - path: mobile/lib/features/auth/local_signup_screen.dart
    role: modified
  - path: mobile/lib/shared/services/api_service.dart
    role: modified
  - path: mobile/lib/shared/widgets/avatar_widget.dart
    role: modified
  - path: api/MyLoop.Api/DTOs/UserDtos.cs
    role: created
  - path: api/MyLoop.Api/DTOs/ResponseDtos.cs
    role: created
  - path: api/MyLoop.Api/Services/ValidationService.cs
    role: created
  - path: api/MyLoop.Api/Endpoints/UserEndpoints.cs
    role: modified
  - path: api/MyLoop.Api/Endpoints/TerritoryEndpoints.cs
    role: modified
---

# What Was Built

## UI Fixes
- **Home page tab-switch glitch**: Fixed with IndexedStack (keeps all 3 tabs alive, no GoRouter child swap)
- **User profile redesign**: Avatar + name + title tag in centered horizontal row. Badge below centered. Stats as clean list rows. Joined date at bottom center.
- **Shimmer lazy load**: Hexes modal and streak modal now use scroll-triggered shimmer (NotificationListener) instead of "Show More" buttons
- **Leaderboard tier badge**: Small colored hex icon before each player name showing their tier at a glance
- **Profile drawer tag alignment**: Fixed with CrossAxisAlignment.center + Flexible wrapper for text overflow
- **Streak modal**: Respects actual streak count, generates matching entries (capped at 60)

## Map / Journey Fixes
- **Loading state**: Shows spinner while acquiring GPS. Error + Retry if location fails. No more (0,0) ocean view.
- **Owned hexes on map open**: Loads user's hexes (~1km radius) on first GPS fix, renders at 20% opacity
- **Post-claim UX**: User stays on map to see captured hexes (not auto-popped)

## API Architecture Refactor
- **DTOs extracted**: `UserDtos.cs` (RegisterRequest, UpdateUserRequest, ClaimRequest), `ResponseDtos.cs` (LeaderboardResponse, UserProfileResponse, ClaimResponse, TerritoryCellResponse)
- **ValidationService**: Static validation methods with source-generated regex ([GeneratedRegex])
- **Input validation**: All endpoints (register, patch, claim) now validate display name (2-20 chars, alphanumeric+spaces+basic punctuation), color (hex format), avatarId (0-23 range)
- **Flutter validation**: local_signup_screen + home name editor both validate with same regex

## Infrastructure
- **ngrok**: Installed, configured, tunnel active for remote phone testing
- **API URL**: Configurable via `--dart-define=API_URL=...` at build time
- **Git**: All pushed to https://github.com/ProManXi/my_loop.git (commit fa7ac1a)

# Decisions Made
- IndexedStack over GoRouter child swap (eliminates frame-skip glitch)
- Scroll-triggered shimmer over "Show More" buttons (smoother UX)
- Centered profile layout over left/right split (avoids alignment issues on narrow screens)
- Stats as list rows over boxed cards (cleaner, less visual clutter)

# Bugs Found & Fixed
- Stray closing brackets in home_screen.dart (leftover from previous edit)
- `profile.id` should be `profile.userId` in journey_screen.dart
- TerritoryEndpoints had duplicate inline ClaimRequest record (removed, uses DTOs now)

# Open Questions
- Map web geolocation may not work in some browsers (works fine on iPhone native)
- iPhone app crash when cable disconnected: need to archive + install profile for persistence
- Free Apple Developer cert expires in 7 days — re-sign from Xcode to extend
