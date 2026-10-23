# Spotify Queue Shuffler

A client-only Expo application for viewing Spotify playback and building a shuffled queue from a user's library.

## Spotify application setup

1. Create an application in the [Spotify Developer Dashboard](https://developer.spotify.com/dashboard).
2. Add these exact redirect URIs:
   - Web development: `http://127.0.0.1:8081/oauth/callback`
   - iOS and Android development builds: `spotify-queue-login://callback`
3. In Development Mode, add each tester in **Users Management**. Spotify currently requires the app owner to have Premium and limits new development apps to five allowlisted users.
4. Copy `.env.example` to the ignored `.env` file and set:

```sh
EXPO_PUBLIC_SPOTIFY_CLIENT_ID=your_client_id
EXPO_PUBLIC_SPOTIFY_WEB_REDIRECT_URI=http://127.0.0.1:8081/oauth/callback
```

The client ID is public application configuration. Never add a Spotify client secret or personal access token to this client-only app.

## Run locally

Use Node 24, then install dependencies:

```sh
npm install
```

For web:

```sh
npm run web
```

Open `http://127.0.0.1:8081` rather than `localhost` so the browser origin exactly matches the Spotify redirect URI. Production web deployments must use an allowlisted HTTPS callback.

Native Spotify sign-in requires a development or production build that owns the `spotify-queue-login` URL scheme; Expo Go cannot provide that app-specific callback. Use `npx expo run:ios` or `npx expo run:android` for local native builds.

## Project structure

- `app/` — Expo Router routes and composition
- `src/features/` — user workflows
- `src/domain/` — framework-independent models and queue rules
- `src/integrations/spotify/` — Spotify OAuth and Web API boundary
- `src/platform/` — web and native adapters
- `src/components/` — reusable presentational UI

## Verification

```sh
npm test
npm run check
npx expo-doctor
npx expo export --platform all
```
