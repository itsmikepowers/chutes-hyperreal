# Neon Chutes

A cinematic, responsive 3D Chutes and Ladders game built with Vite and Three.js. Play against three bots on a 100-square serpentine board.

## Run

```bash
npm install
npm run dev
```

## Quality checks

```bash
npm test
npm run build
```

## Gameplay

Roll by clicking/tapping the die. You must land exactly on square 100. Ladders climb automatically and chutes slide automatically. Bot turns play on their own. Use the header controls to toggle audio or reduced motion.

## Architecture

- `src/game.js` — deterministic, rendering-independent game rules
- `src/game.test.js` — mapping, links, turns, exact-roll and win tests
- `src/main.js` — Three.js scene, animation, bots and WebAudio
- `src/style.css` — responsive HUD and visual system

All geometry, particles and sound effects are generated at runtime; no external media assets are used.
