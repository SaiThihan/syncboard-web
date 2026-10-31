# SyncBoard Web

The browser app for SyncBoard, a real-time collaborative whiteboard. React, TypeScript, Vite, Tailwind CSS, shadcn/ui, Zustand, Socket.IO and the HTML canvas. No accounts: your name is saved for the current browser tab only.

The server is a separate repository, `syncboard-api`. Start it first.

## Run it

```bash
npm install
npm run dev            # http://localhost:5173
```

| Variable       | Default                 | Meaning                  |
| -------------- | ----------------------- | ------------------------ |
| `VITE_API_URL` | `http://localhost:3000` | Where the API is running |

Copy `.env.example` to `.env` to change it.

## Scripts

| Command            | What it does                             |
| ------------------ | ---------------------------------------- |
| `npm run build`    | Type-check and build to `dist/`          |
| `npm run lint`     | ESLint                                   |
| `npm run format`   | Prettier                                 |
| `npm test`         | Unit tests (Vitest), in `tests/`         |
| `npm run test:e2e` | End-to-end tests (Playwright), in `e2e/` |

The end-to-end tests drive real browsers, with two windows for two people. They need the API running (`npm run start:dev` in `syncboard-api`) and, the first time, `npx playwright install chromium`. They start this app on port 5173 by themselves.

## What it does

Create a board and share its id or link. Everyone on it draws with a pen, rectangles, circles, arrows and text. They can move, resize, select several shapes and delete, and they see each other's changes and mouse pointers as they happen. If the connection drops, editing pauses until it is back, and the board catches up on what was missed.

## Layout

```
src/
  pages/        Home (create or join) and Board
  components/   board (toolbar, share bar), canvas, presence, ui
  canvas/       drawing, hit testing, resize handles and the tools
  stores/       Zustand: board, presence, session, tool
  hooks/        useBoardSocket (joins the board and syncs it), useToasts
  lib/          API client, socket, identity, throttle
  types/        contracts shared with the API, copied by hand
```

Shapes are drawn on one canvas, redrawn at most once per screen frame. Your own changes show at once and are rolled back with a short notice if the server refuses them.
