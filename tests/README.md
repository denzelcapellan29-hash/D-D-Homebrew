# Visual QA

GitHub Actions runs Chromium with a software WebGL backend and records visual frames for Orbit, Explore, TV live mode, Areas 2/3/5, 2D fallback, and blackout.

**Review screenshots manually**: passing the automated checks proves rendering and basic interaction but does not establish cinematic composition or visual quality. The workflow uploads PNG frames in the `mapforge-visual-qa` artifact. Do not describe visual quality as verified until screenshots have been inspected.

To run locally (optional):

```sh
npm install --no-save playwright@1.58.2
npx playwright install chromium
node tests/visual-qa.cjs
```

The tests use Python 3's built-in HTTP server to serve the app; no backend or hosted service is required for players.

QA launch verification: GitHub Actions runner uses a separate headless software-WebGL browser.
