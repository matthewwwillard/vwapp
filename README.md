# vwapp

A personal app to monitor and control a 2025 VW ID. Buzz.

It is an independent re-implementation of Volkswagen's official **myVW** iOS app
([App Store](https://apps.apple.com/us/app/myvw/id1481486650)). Rather than
reusing any of that app's code, it talks to the same VW backend servers — the
North America Car-Net cluster — by speaking the protocol reverse-engineered from
the stock app. The goal is the same core experience (vehicle status, lock/unlock,
charging, climate, parked location) in a small, self-hosted stack the owner
fully controls.

> Not affiliated with, endorsed by, or supported by Volkswagen. "myVW", "VW",
> and "ID. Buzz" are trademarks of Volkswagen AG, used here for reference only.

## What it does

- Live vehicle status: lock state, range, odometer, state of charge, charging
  state, and plug status
- Remote lock / unlock (S-PIN gated)
- Charging controls (start/stop, charge limit) and climate pre-conditioning
- Parked-location map and door/window detail
- Server-side polling so the dashboard stays fresh without the app open

## Architecture

pnpm monorepo:

- `app/` — Expo (SDK 56) + expo-router + Tamagui mobile app, runs in Expo Go
- `backend/` — Cloudflare Worker (oRPC) that owns the VW session and is the only
  writer to the database
- `packages/contract` — shared oRPC contract
- `packages/db` — shared InstantDB schema
- `packages/poc` — throwaway reference implementation of the VW protocol

The Worker holds a single VW session per account and polls VW on a cron; the app
reads vehicle data via InstantDB live queries for real-time updates and uses RPC
only for actions (login/logout/refresh/commands).

## Development

```bash
pnpm test                              # typecheck + lint (run before committing)
pnpm --filter @vwapp/backend dev       # Worker on localhost:8787
pnpm --filter @vwapp/mobile start      # Expo dev server
```

See [CLAUDE.md](./CLAUDE.md) for the full architecture, the VW protocol details,
deployment, and project conventions, and [TODO.md](./TODO.md) for planned work.
