# LevelFit — Solo Leveling style fitness RPG

Turn your training into an RPG. Log workouts to gain XP, level up, allocate
stats (STR / AGI / END / VIT), clear quests, fight weekly bosses, and run a
**21‑Day Transformation** protocol — all wrapped in a Solo Leveling
"AWAKEN" aesthetic (muted purple, frosted glass, serif display type).

## Features

- **Character system** — class (Warrior / Mage / Assassin), levels, XP, stat
  points, hunter ranks, shadow army.
- **Workout logging** — categories map to stat growth; boss/gate framing for
  weekly volume.
- **Quests & achievements** — daily trials, badges, equippable titles.
- **21‑Day Transformation** (the `21‑Day` tab):
  - A `Day 1 → 21` path with three daily pillars: **workout · nutrition ·
    skincare** (King Henry "Golden Body" program).
  - **Soft Gate** — the next day stays locked until today's pillars are
    cleared; past days lock to prevent backfilling.
  - **Discipline Lock** (opt‑in, Duolingo‑style) — blocks every other screen
    until today's core workout is done.
  - Clearing a day grants XP + a stat point; a **Day‑21 final boss** grants a
    large bonus.
  - **Before / After photos** and a customizable hero image — kept **on your
    device only** (localStorage), never uploaded or committed.
- **Guest mode** — works fully offline via localStorage, no account needed.
- **Firebase mode** — optional cloud sync (Auth + Firestore) when configured.

## Run locally

Prerequisites: **Node.js** (LTS).

```bash
npm install
npm run dev
```

Then open the printed `http://localhost:…` URL and sign in as **Guest** to try
everything without any backend.

> Windows PowerShell note: `&&` may not work in older versions — run the two
> commands on separate lines, or use `npm install; npm run dev`.

### Optional: Firebase / Gemini

- Guest mode needs no configuration.
- For cloud sync, add your Firebase web config in `src/firebase.ts`.
- `GEMINI_API_KEY` / `APP_URL` (see `.env.example`) are only needed for the AI
  Studio hosting integration.

## Tech stack

React 19 · TypeScript · Vite · Tailwind CSS v4 · Firebase · Motion · Express
(dev server) · lucide-react icons.

## A note on images

Character art from anime / fan sources (Solo Leveling, etc.) is copyrighted and
is **not** bundled in this repo. Use the **"เปลี่ยนรูป" / change‑image** button
on the AWAKEN screen to set your own hero image — it is stored locally on your
device only.
