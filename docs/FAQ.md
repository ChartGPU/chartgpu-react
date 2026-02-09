# FAQ

## Is WebGPU required?

Yes. `chartgpu-react` is a wrapper around `chartgpu`, which requires WebGPU (`navigator.gpu`).

If WebGPU is not available, chart creation will fail. See [Troubleshooting](./TROUBLESHOOTING.md#webgpu-not-supported-navigatorgpu-is-undefined).

## Why is my chart blank?

Most commonly:

- The container has **no height** (e.g. `height: 0` or only `width: 100%`).
- WebGPU is not supported / blocked in the current browser/profile.

See [Sizing](./GETTING_STARTED.md#sizing-important).

## How do I append/stream data efficiently?

Use the imperative ref API:

- `ChartGPUHandle.appendData(seriesIndex, newPoints)`

See [Streaming recipe](./recipes/streaming.md).

## How do I connect multiple charts (sync crosshair/tooltip)?

Use:

- `useConnectCharts([chartA, chartB, ...])` (recommended in React), or
- `connectCharts([chartA, chartB, ...])` (manual)

See [Chart sync recipe](./recipes/chart-sync.md).

## Why isn’t `onZoomChange` firing?

`onZoomChange` only fires when the underlying chart reports a non-null zoom range (`chart.getZoomRange()`).

Common causes:

- `dataZoom` is not enabled in your `options`.
- You are not interacting with zoom controls (inside/slider) so the range never changes.

See [dataZoom basics](./recipes/datazoom-basics.md).

## Can I use this with SSR (Next.js / Remix)?

Not directly during server rendering. WebGPU APIs (and `navigator`) are browser-only.

Render charts **client-side only** (e.g. dynamic import / `useEffect` gated render). See [SSR pitfalls](./TROUBLESHOOTING.md#ssr--frameworks-nextjs-remix).

