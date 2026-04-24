<script lang="ts">
  import { onMount } from 'svelte';

  const TOTAL_TILES = 63;
  const PATH_COLOR = 'rgba(0, 0, 0, 0.12)';
  const ARROW_COLOR = 'rgba(0, 0, 0, 0.22)';

  interface Point {
    x: number;
    y: number;
    w: number;
    h: number;
  }

  interface ArrowPoint {
    x: number;
    y: number;
    angle: number;
  }

  let svgEl: SVGSVGElement | undefined = $state();
  let pathD = $state('');
  let arrows = $state<ArrowPoint[]>([]);
  let svgW = $state(0);
  let svgH = $state(0);
  let mounted = $state(false);

  function measure(): Point[] {
    const wrap = document.querySelector<HTMLElement>('.gb__board-wrap');
    if (!wrap) return [];
    const wrapRect = wrap.getBoundingClientRect();
    const pts: Point[] = [];
    for (let id = 1; id <= TOTAL_TILES; id++) {
      const el = wrap.querySelector<HTMLElement>(`[data-tile="${id}"] .tile, a.tile[data-tile="${id}"]`);
      if (!el) continue;
      const r = el.getBoundingClientRect();
      pts.push({
        x: r.left - wrapRect.left + wrap.scrollLeft + r.width / 2,
        y: r.top - wrapRect.top + wrap.scrollTop + r.height / 2,
        w: r.width,
        h: r.height,
      });
    }
    return pts;
  }

  function computePath(pts: Point[]): void {
    if (pts.length < 2) return;

    const wrap = document.querySelector<HTMLElement>('.gb__board-wrap');
    if (!wrap) return;
    svgW = wrap.scrollWidth;
    svgH = wrap.scrollHeight;

    const CR = pts[0].h * 0.42;

    let d = `M${pts[0].x.toFixed(1)},${pts[0].y.toFixed(1)}`;
    const arrowPts: ArrowPoint[] = [];

    for (let i = 1; i < pts.length - 1; i++) {
      const prev = pts[i - 1];
      const cur = pts[i];
      const next = pts[i + 1];

      const dx1 = cur.x - prev.x;
      const dy1 = cur.y - prev.y;
      const dx2 = next.x - cur.x;
      const dy2 = next.y - cur.y;
      const len1 = Math.hypot(dx1, dy1) || 1;
      const len2 = Math.hypot(dx2, dy2) || 1;

      const cross = Math.abs(dx1 * dy2 - dy1 * dx2);
      const isCorner = cross > len1 * len2 * 0.25;

      if (isCorner) {
        const r = Math.min(CR, len1 / 2, len2 / 2);
        const bx = cur.x - (dx1 / len1) * r;
        const by = cur.y - (dy1 / len1) * r;
        const ax = cur.x + (dx2 / len2) * r;
        const ay = cur.y + (dy2 / len2) * r;
        d += ` L${bx.toFixed(1)},${by.toFixed(1)} Q${cur.x.toFixed(1)},${cur.y.toFixed(1)} ${ax.toFixed(1)},${ay.toFixed(1)}`;
      } else {
        d += ` L${cur.x.toFixed(1)},${cur.y.toFixed(1)}`;
        if (i % 3 === 1) {
          const angle = (Math.atan2(dy1, dx1) * 180) / Math.PI;
          arrowPts.push({
            x: (prev.x + cur.x) / 2,
            y: (prev.y + cur.y) / 2,
            angle,
          });
        }
      }
    }

    const last = pts[pts.length - 1];
    d += ` L${last.x.toFixed(1)},${last.y.toFixed(1)}`;

    pathD = d;
    arrows = arrowPts;
  }

  function update(): void {
    const pts = measure();
    if (pts.length > 0) computePath(pts);
  }

  onMount(() => {
    const wrap = document.querySelector<HTMLElement>('.gb__board-wrap');
    if (wrap && svgEl) {
      wrap.insertBefore(svgEl, wrap.firstChild);
    }

    requestAnimationFrame(() => {
      update();
      mounted = true;
    });

    const onResize = () => update();
    window.addEventListener('resize', onResize);
    return () => window.removeEventListener('resize', onResize);
  });
</script>

<svg
  bind:this={svgEl}
  class="gb__board-path"
  width={svgW}
  height={svgH}
  viewBox="0 0 {svgW} {svgH}"
  style:opacity={mounted ? 1 : 0}
>
  {#if pathD}
    <path
      d={pathD}
      fill="none"
      stroke={PATH_COLOR}
      stroke-width="2"
      stroke-dasharray="5 3"
      stroke-linecap="round"
      stroke-linejoin="round"
    />
    {#each arrows as ap}
      <g transform="translate({ap.x},{ap.y}) rotate({ap.angle})">
        <polygon points="-5,-3.5 5,0 -5,3.5" fill={ARROW_COLOR} />
      </g>
    {/each}
  {/if}
</svg>
