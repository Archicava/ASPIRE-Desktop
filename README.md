# ASPIRE Desktop (Electron + React + TypeScript)

Desktop adaptation inspired by the original ASPIRE Next.js project at:
`/Users/petricabutusina/Desktop/Apps/Aspire/ASPIRE`

## Included Screens

- Login (web-app auth session)
- Workspace dashboard
- Case Library with search/filter
- Case Detail view
- Predictive Lab (cohort-informed scenario engine)
- Research insights page
- Account (password change)
- Admin (user management via `/api/users`)

## Stack

- Electron
- React 18
- TypeScript
- Vite
- React Router

## Data Source

- `src/data/cohort-seed.json`
- `src/data/cohort-cstore.json`

These are used as local fallback if web API calls fail.

## Web App Integration

Desktop calls the ASPIRE web app backend through Electron IPC proxying:

- Auth: `/api/auth/login`, `/api/auth/logout`, `/api/auth/session`
- Cases: `/api/cases`, `/api/cases/:id`, `/api/cases/:id/retry`
- Platform: `/api/cstore-status`, `/api/r1fs-status`
- Users: `/api/users` (`GET`, `POST`, `PATCH`, `PUT`)

Set the web app base URL with:

```bash
ASPIRE_WEB_APP_URL=http://localhost:3000 npm run dev
```

If `ASPIRE_WEB_APP_URL` is not set, desktop defaults to `https://aspire-lab.archicava.com`.

## Run

```bash
npm install
npm run dev
```

To run without a dev server (local production build):

```bash
npm start
```

## Build

```bash
npm run build
```

This outputs renderer + Electron bundles via Vite.

## Package Installers (macOS + Windows)

After dependencies are installed (including `electron-builder`), use:

```bash
npm run dist:mac
npm run dist:win
```

Or build all configured targets:

```bash
npm run dist
```

Artifacts are written to `release/`.

## Signed macOS build (Apple Developer)

1. Copy signing template:

```bash
cp .env.mac-signing.example .env.mac-signing
```

2. Fill in your Apple Developer values in `.env.mac-signing`.
   Use `CSC_NAME="Your Name (TEAMID)"` (no `Developer ID Application:` prefix).
   `APPLE_TEAM_ID` is required for notarization with app-specific password.
3. Build signed/notarized mac artifacts:

```bash
npm run dist:mac:signed
```

## Open Source

- Repository: `https://github.com/Archicava/ASPIRE-Desktop`
- License: MIT (`LICENSE`)
- Contribution guide: `CONTRIBUTING.md`
- Security policy: `SECURITY.md`

## CI and Releases

- CI workflow: `.github/workflows/ci.yml` (type-check + build on PR/push)
- Release workflow: `.github/workflows/release.yml`

For signed/notarized macOS releases from GitHub Actions, set repository secrets:

- `CSC_LINK` (base64 or URL to your `Developer ID Application` `.p12`)
- `CSC_KEY_PASSWORD`
- `APPLE_ID`
- `APPLE_APP_SPECIFIC_PASSWORD`
- `APPLE_TEAM_ID`

To publish a release:

1. Bump `version` in `package.json`.
2. Commit and push to `main`.
3. Create and push a version tag:

```bash
git tag v0.1.0
git push origin v0.1.0
```

GitHub Actions will build installers and upload artifacts to GitHub Releases.
