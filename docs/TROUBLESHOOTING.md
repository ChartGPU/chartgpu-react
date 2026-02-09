# Troubleshooting

## WebGPU not supported (`navigator.gpu` is undefined)

Symptoms:

- You see errors like “WebGPU not supported in this browser”.
- The chart never becomes ready.

Fix:

- Use a browser with WebGPU enabled (Chrome/Edge 113+, Safari 18+).
- Check enterprise policies / flags that may disable WebGPU.
- Try a fresh browser profile (extensions can interfere with GPU features).

Notes:

- `useChartGPU` performs a WebGPU support check (`'gpu' in navigator`) and surfaces an `error`.
- The `ChartGPU` component does **not** do a pre-check; if `chartgpu` throws during create, it logs a console error.

## Chart renders blank / 0px height

Symptoms:

- No visible chart, but no obvious error.

Fix:

- Ensure the container has an explicit, non-zero height:
  - `style={{ height: 400 }}` or CSS `height: 400px`
  - If you use flex layouts, make sure parent containers allow the child to grow.

Both the component and hook attach a `ResizeObserver` and call `chart.resize()` (debounced), but they cannot recover from a permanently `0px` container.

## SSR / frameworks (Next.js, Remix)

Symptoms:

- `ReferenceError: navigator is not defined`
- Hydration mismatch when rendering charts on the server

Fix:

- Render charts client-side only:
  - Next.js: dynamic import with `ssr: false`, or render behind a `useEffect` flag.
  - Ensure any code path that touches WebGPU only runs in the browser.

## React 18 StrictMode double-invocation (dev only)

Symptoms:

- You see create/dispose happen twice during development.

Cause:

- React StrictMode runs effects twice in development to find unsafe side effects.

Notes:

- `ChartGPU` and `useChartGPU` are written to be safe under this behavior (async create race + cleanup ordering).
- Avoid caching chart instances outside React state/refs; prefer `onReady` and `ref` access.

## ResizeObserver warnings / loops

Symptoms:

- Warnings like “ResizeObserver loop limit exceeded”.

Mitigations:

- Avoid layout thrash (e.g. updating container size synchronously in response to resize).
- Prefer stable container sizing and let the chart resize inside it.
- The wrapper debounces resize calls (100ms) to reduce churn.

