<p align="center">
  <img src="apps/desktop/src-tauri/icons/icon.png" width="80" height="80" alt="Record icon" />
</p>

<h1 align="center">Record</h1>

<p align="center">
  <strong>Know where your time goes.</strong><br />
  Privacy-first activity tracker for macOS.
</p>

<p align="center">
  <a href="https://github.com/Stoffbergie/record/releases"><img src="https://img.shields.io/github/v/release/Stoffbergie/record" alt="Latest release" /></a>
  <img src="https://img.shields.io/badge/platform-macOS-000?logo=apple" alt="macOS" />
  <img src="https://img.shields.io/badge/Rust-backend-B7410E?logo=rust" alt="Rust" />
  <img src="https://img.shields.io/badge/license-MIT-green" alt="License" />
</p>

Record tracks which apps and projects you work on, stores activity locally in SQLite, and shows daily and weekly breakdowns in a macOS desktop app. No cloud or account required.

## Features

- Foreground app tracking with idle detection
- Daily app breakdowns with native icons, session details, and live counters
- Weekly summaries with daily activity bars and previous-week comparisons
- Project detection for supported editors, terminals, and browsers
- Spaces to group projects, with CSV export for a chosen date range
- OpenCode agent activity alongside your own focus time
- App and project exclusions, including temporary exclusions
- Launch at login and background tracking from the menu bar
- Light, dark, and system themes

## Install

```bash
brew install stoffbergie/tap/record
```

Or download the latest `.dmg` from [Releases](https://github.com/Stoffbergie/record/releases), open it, and drag Record to Applications. Choose `aarch64` for Apple Silicon or `x64` for Intel.

On first launch, follow the onboarding screen to grant Accessibility permission so Record can read window titles. Enable **Launch at login** in Settings to start tracking when you sign in.

Closing the window keeps tracking in the background. Use **Quit** in the menu bar icon's menu to stop Record.

## Using Record

- **Today:** browse daily app activity and project totals, or open an app for its sessions.
- **Weekly:** compare a week's activity with the previous week.
- **Spaces:** group projects and export their time to CSV.
- **Settings:** choose a theme, manage launch at login, and re-detect projects in recorded sessions.

Use **Cmd+1–4** to switch views and the **left/right arrow keys** to browse dates in Today or Weekly. Press **t** in Today to return to the current day.

## Develop

```bash
pnpm install
pnpm dev
```

Requires macOS, [Rust](https://rustup.rs/) 1.77.2 or newer, [Node.js](https://nodejs.org/) 22+, [pnpm](https://pnpm.io/) 10+, and Xcode Command Line Tools.

| Command | What it does |
|---------|-------------|
| `pnpm dev` | Start in development mode (hot reload) |
| `pnpm build` | Production build |
| `pnpm check` | Run lint, typecheck, doctor, Rust formatting, clippy, and tests |
| `pnpm lint` | Biome lint + format check |
| `pnpm test` | Rust tests |
| `pnpm clippy` | Rust linting |

Pre-commit hooks (via [Lefthook](https://github.com/evilmartians/lefthook)) run Biome, rustfmt, and clippy automatically. Install with `lefthook install`.

## Architecture

```
record/
├── apps/
│   └── desktop/             Tauri v2 app
│       ├── src/             Solid.js frontend
│       └── src-tauri/       Rust backend (tracker, store, tray)
├── packages/
│   └── types/               Shared TypeScript interfaces
└── lefthook.yml             Pre-commit hooks
```

Rust backend for memory safety and small footprint during 24/7 uptime. Solid.js frontend for a tiny bundle and reactive primitives. SQLite with WAL mode for local storage. Tauri v2 ties it together as a native macOS app with system tray.

Shared types live in `packages/` so they can be reused later by a CLI, web dashboard, or sync layer.

## How it works

The tracker checks the active window every 5 seconds and when the foreground app changes. Idle detection separates active and idle time. Consecutive heartbeats for the same app get merged into sessions, stored in SQLite with RFC3339 timestamps.

The Today view fetches summaries every 5 seconds and interpolates counters at 1 second intervals.

Project adapters use window titles and supported apps' local state. OpenCode agent activity is read from its local database. Project totals combine focus and agent activity without counting overlapping time twice.

Bundle IDs are resolved by walking the process path up to find the `.app` bundle and reading `CFBundleIdentifier` from `Info.plist`. App icons are extracted from `.icns` files via `sips`, cached on disk and in memory.

## Data

Recorded activity stays in `~/Library/Application Support/dev.stoff.record/`:

| File | Contents |
|------|----------|
| `record.db` | Activity and agent sessions, projects, spaces, and exclusions |
| `icon_cache/` | PNG app icons (extracted from system `.icns` files) |

Record can read window titles and supported apps' local databases to identify projects and agent activity. External databases are opened read-only. CSV exports are saved to the location you choose.

## License

MIT
