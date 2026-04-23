# chineseopfietspad

## 为什么要做这个
很多场景下，中国人（包括东亚人）对于玩笑的反应太认真严肃，动不动就开始宏大叙事。
但是在西方文化下，这种反应容易招致更多的嘲笑和攻击。
所以这次我要用魔法打败魔法，把玩笑开回去！

See [`PLAN.md`](./PLAN.md) for the full product plan.

## How to add a tile

Every tile lives in `src/data/tiles/v1_en.yaml` (English) and `src/data/tiles/v1_nl.yaml` (Dutch) — one YAML file per language, keyed by tile number `"1"` through `"63"`. To fill in a new tile:

1. Open `src/data/tiles/v1_en.yaml` (and `v1_nl.yaml` for Dutch).
2. Find the entry for the tile number you want, e.g. `"7":`.
3. Change `status: empty` to `status: filled` and add the fields:

   ```yaml
   "7":
     status: filled
     suit: material           # geography | material | food | people
     title: Hot water is not a thing
     body: |
       If you like to have some hot water in a restaurant, you will have to
       order a cup of tea…
     did_you_know: |
       Optional counter-fact (Chinese POV).
     icon: fa fa-mug-hot      # optional FontAwesome class
   ```

4. Save. The dev server hot-reloads; refresh to see the tile on the board.

Tile `"39"` is **reserved** — that's the counter-punch to the Amsterdam 750 book. Don't use it for a casual tile.

Hazard tiles (geese, well, maze, etc.) are already pre-seeded — leave them alone unless you want to rewrite the Dutch flavor text.

## Local development

```sh
npm install

# Dev server with hot reload
npm run dev

# Production build (outputs to ./dist)
npm run build

# Preview production build
npm run preview
```

## Multiplayer (P2P)

Click "Share" to generate a room link. Open it in another browser — rolls sync live via WebRTC (no server needed). Without a `?room=` param, the game runs in single-player mode with no network activity.

## Deploy

Pushes to `main` trigger `.github/workflows/deploy.yml`, which runs `npm run build` and publishes `dist/` to GitHub Pages.

## Stack

- **Astro** — static site generator (`output: 'static'`)
- **Svelte 5** — interactive game island (`client:load`)
- **Yjs + y-webrtc** — P2P state sync (lazy-loaded only in multiplayer)
- **SCSS** — styles
- **GitHub Pages** — hosting
