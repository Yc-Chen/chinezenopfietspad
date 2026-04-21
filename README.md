# chineseopfietspad

## 为什么要做这个
很多场景下，中国人（包括东亚人）对于玩笑的反应太认真严肃，动不动就开始宏大叙事。
但是在西方文化下，这种反应容易招致更多的嘲笑和攻击。
所以这次我要用魔法打败魔法，把玩笑开回去！

See [`PLAN.md`](./PLAN.md) for the full product plan.

## How to add a tile

Every tile lives in [`data/tiles/v1.yaml`](./data/tiles/v1.yaml) — one YAML file, keyed by tile number `"1"` through `"63"`. To fill in a new tile:

1. Open `data/tiles/v1.yaml`.
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

4. Save. `hugo server` hot-reloads; refresh to see the tile on the board.

Tile `"39"` is **reserved** — that's the counter-punch to the Amsterdam 750 book. Don't use it for a casual tile.

Hazard tiles (geese, well, maze, etc.) are already pre-seeded — leave them alone unless you want to rewrite the Dutch flavor text.

## Local development

```sh
# Dev server with hot reload
hugo server

# Production build (outputs to ./public)
hugo --minify
```

## Deploy

Pushes to `main` trigger `.github/workflows/deploy.yml`, which builds and publishes to GitHub Pages. The live URL is set by `baseURL` in `hugo.yaml` — update that when a custom domain is wired up.
