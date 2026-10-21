# Spotify Queue Shuffler

A client-only Expo application for building a shuffled queue from a user's Spotify library.

## Run locally

```sh
npm install
npm run web
```

Use `npm run ios` or `npm run android` for native development.

## Project structure

- `app/` — Expo Router routes and composition
- `src/features/` — user workflows
- `src/domain/` — framework-independent models and queue rules
- `src/integrations/spotify/` — Spotify OAuth and Web API boundary
- `src/platform/` — web and native adapters
- `src/components/` — reusable presentational UI

Run `npm run check` before committing.
