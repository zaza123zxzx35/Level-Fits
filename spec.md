# spec.md — LevelFit

> AI อ่านไฟล์นี้ทุกครั้งที่เริ่ม session และอัพเดทหลังทุก task

---

## Project Overview

**LevelFit** — Solo Leveling style fitness RPG
Stack: React 19 · TypeScript · Vite · Tailwind CSS v4 · Firebase · Motion · Express

Repo: `Level-Fits`
Main branch: `main`

---

## Current State

**Last updated:** 2026-06-25

### Architecture
```
src/
  App.tsx           — root, tab routing
  components/       — UI components
  data/             — static data (quests, classes, etc.)
  utils/            — helper functions
  types.ts          — shared TypeScript types
  firebase.ts       — Firebase init (optional)
  index.css         — global styles + Tailwind
firebase-blueprint.json   — Firestore schema reference
firestore.rules           — security rules
security_spec.md          — security test spec
```

### Modes
- **Guest mode** — localStorage only, fully offline, no config needed
- **Firebase mode** — Auth + Firestore, requires config in `src/firebase.ts`

### Key Features
- Character system: class (Warrior/Mage/Assassin), level, XP, stats (STR/AGI/END/VIT)
- Workout logging → XP + stat growth
- Quests & achievements
- 21-Day Transformation tab with soft gate + discipline lock
- Before/After photos (localStorage only, never uploaded)

---

## Decisions Made

| Date | Decision | Rationale |
|------|----------|-----------|
| 2026-06-25 | Set up CLAUDE.md with 4-layer guardrail system | Prevent scope drift, magic guessing, and context loss |

---

## Active Constraints

- ไม่มี test suite — verify ด้วยการรัน dev server + ดูใน browser
- `firestore.rules` เป็น R1 — แตะต้องบอกก่อน
- Images ไม่ commit — copyright (Solo Leveling fan art)
- `.env` ไม่ commit — มี `.env.example` แทน

---

## Next Tasks

_ยังไม่มี task ที่ queue อยู่_

---

## Parking Lot (ideas, not planned)

_ยังว่างอยู่_
