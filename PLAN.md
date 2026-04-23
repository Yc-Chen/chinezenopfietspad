# Chinese op Fietspad — Product Plan

## The core move

Amsterdam's 750-year anniversary book included a roll-and-move board-game tile singling out Chinese tourists blocking the bike path ("Om ze te ontwijken ga je terug naar vakje 39"). The book was distributed to ~60,000 primary school children.

Response strategy: **return the joke in the same envelope it arrived in** — a playable Dutch ganzenbord (goose game) where every themed tile is an observation about Dutch daily life, with one tile sitting at position 39.

Tone is playful and observational, never bitter. If a reader's reaction is "Chinese are too serious to take a joke," the strategy has failed.

## Format

**Ganzenbord**, not a card deck. Reasons:
- Direct mirror of the book's mechanic.
- Every Dutch person played ganzenbord as a kid — the form itself is legible to the target audience.
- Structural filler tiles (blanks, "gooi opnieuw," the well, the maze) mean we don't need a themed joke on every square.
- A playable board produces screenshot-able individual moments. Static grids do not.

Board size: classic 63 tiles. Aim for ~15 themed tiles per edition; filler does the rest.

**Tile 39** is reserved for the counter-punch to the book. Content TBD — should be sharp, specific, and obviously a callback.

## Content strategy: editions, not drift

Ship as dated editions with expansion packs. **Do not** let the site grow silently — a "finished game" is a shippable artifact a journalist can cover; a perpetually-updating site is not.

- **v1.0 "Editie 2026"** — ships with the strongest ~15 tiles. Frozen on release.
- **Expansion packs** — drop every few months or per ~10 new tiles. Each is a fresh reason to repost.
- **Contributed pack** — crowdsourced submissions, credited. Contributors share what they shipped in.

The four existing suits map 1:1 to expansion packs:

| Pack | Suit | Sample tiles |
|---|---|---|
| v1 "Editie 2026" | mixed, strongest of each | hot water, bicycle rage, "lekker?", bottle caps, tile 39 |
| Exp 1 "De Keuken" | food / shopping | nasi-bami, frying, beer vs food, train strikes |
| Exp 2 "Op de Fiets" | people | loud in public, lunches, parties, agenda, theme park, coffee pacing |
| Exp 3 "Huis & Haard" | material / house | leaking, renovation, shops 9-5, doorbell/delivery, toilet |

## v1 selection rules

1. **Universally relatable.** "Hot water is not a thing" works for any non-Dutch reader. "Chinese high-speed trains run at 40°C" needs context — save for themed expansion where context lives.
2. **One strongest from each suit** in v1 so all four themes are represented from day one.
3. **Merge/cut overlap on the way in.** The two "Holiday is holiday" entries (one is actually about coffee) and the train-strikes / train-schedule overlap collapse now, not later.

## Editorial principles

- **Playful > bitter.** Every "Did you know" comparison gets read by a skeptical Dutch reader. If the comparison can be flipped into "see, Chinese people are defensive/boasting," cut it or source it.
- **Serious ≠ playful.** The "NiHao" catcalling entry and any real discrimination content do not belong in the game tiles. They get a separate page ("The not-so-funny part") with sourcing, including the Amsterdam book itself as receipt #1.
- **Source the artifact.** A dedicated page for the Amsterdam 750 book — quote, photo, publisher link. It's the thing journalists will reference.

## Pre-launch cleanup

Blockers before v1 can ship:
- [ ] Remove Docsy boilerplate: `README 2.md`, default About page content, debug `text-*` lines on homepage.
- [ ] Fix `hugo.yaml`: `baseURL`, `github_repo`, copyright URL (currently still point to Google's docsy-example).
- [ ] Deploy target: Netlify or Cloudflare Pages from the GitHub repo.
- [ ] Favicon, OG image, Twitter card for shareable links.
- [ ] Individual tile permalinks so people can share one tile at a time.

## Distribution

- **Dutch translation is the real strategic move.** EN + 中文 reaches Chinese-in-NL and expats; NL reaches the audience that read the book. Docsy multilingual is already wired.
- **Contribution form** linked from the homepage (Google Form or Formspree → GitHub issue). Do not rely on raw GitHub PRs — filters out 95% of contributors.
- **Launch channels:** Chinese-in-NL WeChat/Xiaohongshu groups, r/Netherlands, Dutch Twitter/Bluesky. Each expansion = repeat launch.

## Open questions

- **Dice roll: random or guided?** Random is authentic to the format; guided (deterministic route on first visit) guarantees every visitor sees the counter-punch tile. Probably random with a "see all tiles" fallback.
- **Dutch translation at v1 or after?** Strategic value says v1. Effort says after. Likely after, unless a native-Dutch collaborator appears.
- **Self-imposed freeze discipline.** If editions can't actually be frozen on a solo project, fall back to a dated "Living Edition" with a visible changelog.


## Next steps
Your next steps (from PLAN.md)

  1. Fill tile 39 — the counter-punch.
  2. Fill ~14 more themed tiles for v1 (edit data/tiles/v1.yaml, each ~5 min).
  3. Rewrite the end-overlay copy in layouts/_partials/game/end-overlay.html — there's a
  placeholder // TODO there now.
  4. Push to GitHub, go to repo Settings → Pages → Source = "GitHub Actions".
  5. When you buy the domain: update baseURL in hugo.yaml, add static/CNAME with the domain,
  set DNS records, enable HTTPS in repo settings.


    1. PostHog — Open-source, self-hostable, free tier (1M events/mo). Built for product/event
  analytics. You fire custom events like posthog.capture('dice_roll', {value: 4, tile:
  'goose'}) and get funnels, session replays, heatmaps. Probably the best fit here.
  2. Mixpanel — Free tier (20M events/mo). Purpose-built for event tracking. Similar custom
  events approach. Hosted only, but generous free plan.
  3. Amplitude — Similar to Mixpanel, free tier available. Strong for understanding user flows
   through a game.
  4. Custom + Supabase/Firebase — Roll your own: log events to a simple database table. Full    control, no third-party scripts. Firebase has a generous free tier and works well for
  lightweight game telemetry.
  5. GA4 custom events — GA4 can do custom events (gtag('event', 'roll_dice', {...})), but the
   reporting UI is clunky for game-style event data. Workable if you want to keep it simple.

  What I'd recommend: For a Ganzenbord game, PostHog hits the sweet spot — free, one script
  tag, custom events are trivial to add, and you get session replay (watch people actually
  play the game) for free. No cookie banner needed if you disable cookies in the config.

  Want me to wire one of these into the game?