import {
  createAnnotationAuthoring as createAnnotationAuthoringUpstream,
  type AnnotationAuthoringInstance,
  type AnnotationAuthoringOptions,
  type AnnotationConfig,
  type ChartGPUInstance,
  type ChartGPUOptions,
} from '@chartgpu/chartgpu';

type GridBox = Readonly<{ left: number; right: number; top: number; bottom: number }>;

// Mirrors upstream ChartGPU slider reserve:
// `DATA_ZOOM_SLIDER_HEIGHT_CSS_PX (32) + DATA_ZOOM_SLIDER_MARGIN_TOP_CSS_PX (8)`.
const DATA_ZOOM_SLIDER_RESERVE_CSS_PX = 40;

function hasSliderDataZoom(options: Readonly<ChartGPUOptions>): boolean {
  return options.dataZoom?.some((z: any) => z?.type === 'slider') ?? false;
}

function getGrid(options: Readonly<ChartGPUOptions>): GridBox {
  const g: any = options.grid ?? {};
  const sliderReserve = hasSliderDataZoom(options) ? DATA_ZOOM_SLIDER_RESERVE_CSS_PX : 0;
  const left = isFiniteNumber(g.left) ? g.left : 60;
  const right = isFiniteNumber(g.right) ? g.right : 20;
  const top = isFiniteNumber(g.top) ? g.top : 40;
  const bottomBase = isFiniteNumber(g.bottom) ? g.bottom : 40;
  return {
    left,
    right,
    top,
    bottom: bottomBase + sliderReserve,
  };
}

function isFiniteNumber(v: unknown): v is number {
  return typeof v === 'number' && Number.isFinite(v);
}

function getCartesianX(p: unknown): number | null {
  if (p == null) return null;
  if (Array.isArray(p)) return isFiniteNumber(p[0]) ? p[0] : null;
  if (typeof p === 'object') {
    const x = (p as { x?: unknown }).x;
    return isFiniteNumber(x) ? x : null;
  }
  return null;
}

function getCartesianY(p: unknown): number | null {
  if (p == null) return null;
  if (Array.isArray(p)) return isFiniteNumber(p[1]) ? p[1] : null;
  if (typeof p === 'object') {
    const y = (p as { y?: unknown }).y;
    return isFiniteNumber(y) ? y : null;
  }
  return null;
}

function getCandlestickX(p: unknown): number | null {
  if (p == null) return null;
  if (Array.isArray(p)) return isFiniteNumber(p[0]) ? p[0] : null;
  if (typeof p === 'object') {
    const ts = (p as { timestamp?: unknown }).timestamp;
    return isFiniteNumber(ts) ? ts : null;
  }
  return null;
}

function getCandlestickHigh(p: unknown): number | null {
  if (p == null) return null;
  // Upstream OHLC tuple: [timestamp, open, close, low, high]
  if (Array.isArray(p)) return isFiniteNumber(p[4]) ? p[4] : null;
  if (typeof p === 'object') {
    const hi = (p as { high?: unknown }).high;
    return isFiniteNumber(hi) ? hi : null;
  }
  return null;
}

function getCandlestickLow(p: unknown): number | null {
  if (p == null) return null;
  if (Array.isArray(p)) return isFiniteNumber(p[3]) ? p[3] : null;
  if (typeof p === 'object') {
    const lo = (p as { low?: unknown }).low;
    return isFiniteNumber(lo) ? lo : null;
  }
  return null;
}

function computeXDomain(
  chart: ChartGPUInstance,
  options: Readonly<ChartGPUOptions>
): { min: number; max: number } {
  const xAxisRaw: any = options.xAxis;
  const xAxis = Array.isArray(xAxisRaw) ? xAxisRaw[0] : xAxisRaw;
  let min = isFiniteNumber(xAxis?.min) ? xAxis.min : Number.NaN;
  let max = isFiniteNumber(xAxis?.max) ? xAxis.max : Number.NaN;

  if (!Number.isFinite(min) || !Number.isFinite(max)) {
    const series = (options.series ?? []) as ReadonlyArray<any>;
    let dataMin = Number.POSITIVE_INFINITY;
    let dataMax = Number.NEGATIVE_INFINITY;
    for (const s of series) {
      if (!s || s.type === 'pie') continue;
      const data = (s as any).data ?? [];
      if (s.type === 'candlestick') {
        for (const p of data) {
          const x = getCandlestickX(p);
          if (x == null) continue;
          dataMin = Math.min(dataMin, x);
          dataMax = Math.max(dataMax, x);
        }
      } else {
        for (const p of data) {
          const x = getCartesianX(p);
          if (x == null) continue;
          dataMin = Math.min(dataMin, x);
          dataMax = Math.max(dataMax, x);
        }
      }
    }
    if (!Number.isFinite(min)) min = Number.isFinite(dataMin) ? dataMin : 0;
    if (!Number.isFinite(max)) max = Number.isFinite(dataMax) ? dataMax : 100;
  }

  // Avoid degenerate range
  if (min === max) max = min + 1;

  // Apply zoom window (percent space) like upstream authoring/hit test logic.
  const zoom = chart.getZoomRange();
  if (zoom && isFiniteNumber(min) && isFiniteNumber(max)) {
    const span = max - min;
    const zMin = min + (zoom.start / 100) * span;
    const zMax = min + (zoom.end / 100) * span;
    return { min: zMin, max: zMax };
  }

  return { min, max };
}

function computeYDomain(options: Readonly<ChartGPUOptions>): { min: number; max: number } {
  const yAxisRaw: any = options.yAxis;
  const yAxis = Array.isArray(yAxisRaw) ? yAxisRaw[0] : yAxisRaw;
  let min = isFiniteNumber(yAxis?.min) ? yAxis.min : Number.NaN;
  let max = isFiniteNumber(yAxis?.max) ? yAxis.max : Number.NaN;

  if (!Number.isFinite(min) || !Number.isFinite(max)) {
    const series = (options.series ?? []) as ReadonlyArray<any>;
    let dataMin = Number.POSITIVE_INFINITY;
    let dataMax = Number.NEGATIVE_INFINITY;
    for (const s of series) {
      if (!s || s.type === 'pie') continue;
      const data = (s as any).data ?? [];
      if (s.type === 'candlestick') {
        for (const p of data) {
          const hi = getCandlestickHigh(p);
          const lo = getCandlestickLow(p);
          if (hi != null) dataMax = Math.max(dataMax, hi);
          if (lo != null) dataMin = Math.min(dataMin, lo);
        }
      } else {
        for (const p of data) {
          const y = getCartesianY(p);
          if (y == null) continue;
          dataMin = Math.min(dataMin, y);
          dataMax = Math.max(dataMax, y);
        }
      }
    }
    if (!Number.isFinite(min)) min = Number.isFinite(dataMin) ? dataMin : 0;
    if (!Number.isFinite(max)) max = Number.isFinite(dataMax) ? dataMax : 100;
  }

  // Avoid degenerate range
  if (min === max) max = min + 1;
  return { min, max };
}

function getTextAnchorCssPx(
  chart: ChartGPUInstance,
  canvas: HTMLCanvasElement,
  annotation: Extract<AnnotationConfig, { type: 'text' }>
): { x: number; y: number } | null {
  const rect = canvas.getBoundingClientRect();
  const { left, right, top, bottom } = getGrid(chart.options);

  const width = rect.width;
  const height = rect.height;
  const plotLeft = left;
  const plotRight = width - right;
  const plotTop = top;
  const plotBottom = height - bottom;
  const plotW = plotRight - plotLeft;
  const plotH = plotBottom - plotTop;
  if (!(plotW > 0 && plotH > 0)) return null;

  const pos: any = annotation.position;
  if (!pos || (pos.space !== 'data' && pos.space !== 'plot')) return null;

  if (pos.space === 'plot') {
    const x = plotLeft + (isFiniteNumber(pos.x) ? pos.x : 0) * plotW;
    const y = plotTop + (isFiniteNumber(pos.y) ? pos.y : 0) * plotH;
    return { x, y };
  }

  const xDom = computeXDomain(chart, chart.options);
  const yDom = computeYDomain(chart.options);
  if (!isFiniteNumber(pos.x) || !isFiniteNumber(pos.y)) return null;

  const tx = (pos.x - xDom.min) / (xDom.max - xDom.min || 1);
  const ty = (pos.y - yDom.min) / (yDom.max - yDom.min || 1);

  const x = plotLeft + tx * plotW;
  const y = plotBottom - ty * plotH;
  return { x, y };
}

function findNearbyTextAnnotation(
  chart: ChartGPUInstance,
  canvas: HTMLCanvasElement,
  cssX: number,
  cssY: number,
  toleranceCssPx: number
): { index: number; annotation: Extract<AnnotationConfig, { type: 'text' }> } | null {
  const annotations = chart.options.annotations ?? [];
  let bestIndex: number | null = null;
  let bestDist = Number.POSITIVE_INFINITY;
  for (let i = 0; i < annotations.length; i++) {
    const a = annotations[i] as AnnotationConfig;
    if (!a || a.type !== 'text') continue;
    const anchor = getTextAnchorCssPx(chart, canvas, a as any);
    if (!anchor) continue;
    const dx = cssX - anchor.x;
    const dy = cssY - anchor.y;
    const d = Math.hypot(dx, dy);
    if (d <= toleranceCssPx && d < bestDist) {
      bestDist = d;
      bestIndex = i;
    }
  }
  return bestIndex == null
    ? null
    : {
        index: bestIndex,
        annotation: annotations[bestIndex] as any,
      };
}

function updateTextAnnotation(chart: ChartGPUInstance, index: number, next: AnnotationConfig) {
  const prev = chart.options.annotations ?? [];
  const copy = prev.slice();
  copy[index] = next;
  chart.setOption({ ...chart.options, annotations: copy });
}

function deleteAnnotation(chart: ChartGPUInstance, index: number) {
  const prev = chart.options.annotations ?? [];
  if (index < 0 || index >= prev.length) return;
  const copy = prev.slice();
  copy.splice(index, 1);
  chart.setOption({ ...chart.options, annotations: copy });
}

/**
 * `chartgpu@0.2.3` annotation authoring has a known gap: the built-in context menu's
 * hit-testing does not recognize `type: "text"` annotations, so the "Edit" menu item
 * never appears for text notes.
 *
 * This wrapper keeps upstream behavior, and adds a capture-phase `contextmenu`
 * handler that provides Edit/Delete for nearby text annotations.
 */
export function createAnnotationAuthoring(
  container: HTMLElement,
  chart: ChartGPUInstance,
  options?: AnnotationAuthoringOptions
): AnnotationAuthoringInstance {
  const upstream = createAnnotationAuthoringUpstream(container, chart, options);

  const canvas = container.querySelector('canvas');
  if (!canvas) return upstream;

  const doc = container.ownerDocument;
  const win = doc.defaultView;
  if (!win) return upstream;

  let disposed = false;
  let menu: HTMLDivElement | null = null;

  const hideMenu = () => {
    if (!menu) return;
    menu.style.display = 'none';
    menu.setAttribute('aria-hidden', 'true');
  };

  const ensureMenu = () => {
    if (menu) return menu;
    const el = doc.createElement('div');
    el.style.cssText = [
      'position: fixed',
      'display: none',
      'background-color: #1a1a2e',
      'border: 1px solid #333',
      'border-radius: 8px',
      'box-shadow: 0 4px 12px rgba(0, 0, 0, 0.5)',
      `z-index: ${options?.menuZIndex ?? 1000}`,
      'min-width: 180px',
      'padding: 6px 0',
      'font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
      'font-size: 14px',
      'color: #e0e0e0',
    ].join('; ');
    el.setAttribute('role', 'menu');
    el.setAttribute('aria-label', 'Annotation actions');
    el.setAttribute('aria-hidden', 'true');
    doc.body.appendChild(el);
    menu = el;
    return el;
  };

  const addItem = (root: HTMLElement, label: string, onActivate: () => void) => {
    const item = doc.createElement('button');
    item.type = 'button';
    item.textContent = label;
    item.setAttribute('role', 'menuitem');
    item.style.cssText = [
      'padding: 8px 16px',
      'cursor: pointer',
      'user-select: none',
      'transition: background-color 0.15s',
      'background: transparent',
      'border: none',
      'color: inherit',
      'width: 100%',
      'text-align: left',
      'font: inherit',
    ].join('; ');
    item.addEventListener('mouseenter', () => {
      item.style.backgroundColor = '#2a2a3e';
    });
    item.addEventListener('mouseleave', () => {
      item.style.backgroundColor = 'transparent';
    });
    item.addEventListener('click', () => {
      onActivate();
      hideMenu();
    });
    item.addEventListener('keydown', (e) => {
      if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        onActivate();
        hideMenu();
      }
    });
    root.appendChild(item);
  };

  const onDocumentClick = (e: MouseEvent) => {
    if (!menu) return;
    if (menu.style.display !== 'block') return;
    const t = e.target;
    if (!(t instanceof Node) || !menu.contains(t)) hideMenu();
  };

  const onKeyDown = (e: KeyboardEvent) => {
    if (e.key === 'Escape') hideMenu();
  };

  const onRepositionTriggers = () => hideMenu();

  const onContextMenuCapture = (e: MouseEvent) => {
    if (disposed) return;
    if (chart.disposed) return;
    if (options?.enableContextMenu === false) return;

    // Only intercept for text notes; let upstream handle lines/points.
    const rect = canvas.getBoundingClientRect();
    const hitTest = (chart as any).hitTest?.(e) as
      | { canvasX: number; canvasY: number }
      | undefined;
    const cssX =
      hitTest && isFiniteNumber(hitTest.canvasX) ? hitTest.canvasX : e.clientX - rect.left;
    const cssY =
      hitTest && isFiniteNumber(hitTest.canvasY) ? hitTest.canvasY : e.clientY - rect.top;

    const hit = findNearbyTextAnnotation(chart, canvas, cssX, cssY, 16);
    if (!hit) return;

    // We will handle this contextmenu, so stop the upstream menu.
    e.preventDefault();
    e.stopPropagation();

    const root = ensureMenu();
    root.innerHTML = '';

    addItem(root, 'Edit text note…', () => {
      const current = hit.annotation.text ?? '';
      const nextText = win.prompt('Edit text note', current);
      if (nextText == null) return; // cancelled
      updateTextAnnotation(chart, hit.index, { ...hit.annotation, text: nextText });
    });

    addItem(root, 'Delete text note', () => {
      deleteAnnotation(chart, hit.index);
    });

    root.style.display = 'block';
    root.setAttribute('aria-hidden', 'false');
    root.style.left = `${e.clientX}px`;
    root.style.top = `${e.clientY}px`;
    // Focus the first item for keyboard users.
    (root.querySelector('button') as HTMLButtonElement | null)?.focus();

    // Keep menu on-screen.
    win.requestAnimationFrame(() => {
      if (!menu || menu.style.display !== 'block') return;
      const b = menu.getBoundingClientRect();
      let x = e.clientX;
      let y = e.clientY;
      if (b.right > win.innerWidth) x = Math.max(0, e.clientX - b.width);
      if (b.bottom > win.innerHeight) y = Math.max(0, e.clientY - b.height);
      menu.style.left = `${x}px`;
      menu.style.top = `${y}px`;
    });
  };

  // Capture-phase so we can intercept before upstream handler runs.
  canvas.addEventListener('contextmenu', onContextMenuCapture, true);
  doc.addEventListener('click', onDocumentClick);
  doc.addEventListener('keydown', onKeyDown);
  win.addEventListener('scroll', onRepositionTriggers, { capture: true, passive: true });
  win.addEventListener('resize', onRepositionTriggers);

  const upstreamDispose = upstream.dispose.bind(upstream);

  upstream.dispose = () => {
    if (disposed) return;
    disposed = true;
    canvas.removeEventListener('contextmenu', onContextMenuCapture, true);
    doc.removeEventListener('click', onDocumentClick);
    doc.removeEventListener('keydown', onKeyDown);
    win.removeEventListener('scroll', onRepositionTriggers, { capture: true });
    win.removeEventListener('resize', onRepositionTriggers);
    if (menu) {
      menu.remove();
      menu = null;
    }
    upstreamDispose();
  };

  return upstream;
}

