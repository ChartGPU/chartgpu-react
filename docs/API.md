# API reference (chartgpu-react)

This package is a **React wrapper** around the `@chartgpu/chartgpu` core library. Most runtime behavior lives in `@chartgpu/chartgpu`; this repo primarily provides:

- A React component (`ChartGPU`) with lifecycle + resize management
- A small imperative ref API (`ChartGPUHandle`)
- Two hooks (`useChartGPU`, `useConnectCharts`)
- Convenience re-exports of a few core helpers + types

For an LLM-oriented navigation entrypoint, see [`docs/api/llm-context.md`](./api/llm-context.md).

## Exports at a glance

### React components

- **`ChartGPU`** (recommended) — see [`docs/api/chartgpu-component.md`](./api/chartgpu-component.md)
- **`ChartGPUChart`** (deprecated) — see [`docs/api/legacy-chartgpuchart.md`](./api/legacy-chartgpuchart.md)

### Hooks

- **`useChartGPU(containerRef, options, gpuContext?)`** — create/manage an instance imperatively (3rd param optional shared context; init-only)
- **`useConnectCharts([chartA, chartB, ...], syncOptions?)`** — keep crosshair/interaction-x in sync (optionally sync zoom)

See [`docs/api/hooks.md`](./api/hooks.md).

### Helper re-exports (from peer dependency `@chartgpu/chartgpu`)

`chartgpu-react` exposes these helpers so you can often import everything from one package:

- `createChart`
- `connectCharts`
- `createAnnotationAuthoring`

- `createChart` / `connectCharts` are re-exported directly from `@chartgpu/chartgpu`.
- `createAnnotationAuthoring` is a thin wrapper around `@chartgpu/chartgpu`'s helper that patches text-annotation context-menu hit-testing (broken in `chartgpu@0.2.3`). Upstream v0.2.5 fixes this natively; the wrapper is kept for API stability — the patch is harmless when running against v0.2.5+.

```ts
import { connectCharts, createAnnotationAuthoring } from 'chartgpu-react';
```

Recipes using these helpers:

- [Chart sync](./recipes/chart-sync.md)
- [Annotation authoring](./recipes/annotation-authoring.md)

More recipes:

- [Crosshair move](./recipes/crosshair-move.md)
- [dataZoom basics](./recipes/datazoom-basics.md)
- [Streaming](./recipes/streaming.md)
- [Scatter density](./recipes/scatter-density.md)

### Wrapper types (defined in this repo)

From `src/types.ts`:

- `ChartGPUProps` — props for the `ChartGPU` component. Includes `gpuContext?` (init-only), `onDataAppend?` ↔ `'dataAppend'`, `onDeviceLost?` ↔ `'deviceLost'`
- `ChartGPUHandle` — imperative ref API (`renderFrame`, `needsRender`, `getRenderMode`, `setRenderMode`, `appendData`, etc.)
- `ChartInstance` — alias for `@chartgpu/chartgpu`'s `ChartGPUInstance`
- `ClickParams`, `MouseOverParams` — aliases for event payloads
- `ZoomRange` — derived from `ChartGPUInstance['getZoomRange']` (non-null range)

### Re-exported core types (from peer dependency `@chartgpu/chartgpu`)

From `src/index.ts`, this package re-exports a curated set of `@chartgpu/chartgpu` types so consumers can do:

```ts
import type { ChartGPUOptions, ChartGPUInstance, DataPoint } from 'chartgpu-react';
```

Currently re-exported:

- **Core**: `ChartGPUInstance`, `ChartGPUOptions`
- **Events**: `ChartGPUEventPayload`, `ChartGPUCrosshairMovePayload`, `ChartGPUZoomRangeChangePayload`
- **Hit testing**: `ChartGPUHitTestResult`, `ChartGPUHitTestMatch`
- **Chart sync**: `ChartSyncOptions`
- **Annotation authoring**: `AnnotationAuthoringInstance`, `AnnotationAuthoringOptions`, `AnnotationConfig`
- **Series config**: `AreaSeriesConfig`, `LineSeriesConfig`, `BarSeriesConfig`, `PieSeriesConfig`, `ScatterSeriesConfig`, `CandlestickSeriesConfig`, `SeriesConfig`
- **Style config**: `LineStyleConfig`, `AreaStyleConfig`
- **Data**: `DataPoint`, `OHLCDataPoint`
- **Interaction/zoom**: `DataZoomConfig`
- **Legend**: `LegendConfig`, `LegendPosition`
- **Animation**: `AnimationConfig`
- **Tooltip**: `TooltipConfig`, `TooltipParams`
- **Performance**: `PerformanceMetrics`
- **Themes**: `ThemeConfig`, `ThemeName`
- **Layout**: `AxisConfig`, `GridConfig`

## Common patterns

### 1) Declarative chart with `ChartGPU`

Use the component for most React apps. It manages:

- async creation + cleanup
- `ResizeObserver` resize
- event wiring (`onClick`, `onCrosshairMove`, etc.)

Start here: [`ChartGPU` component docs](./api/chartgpu-component.md).

### 2) Imperative access via `ref` (`ChartGPUHandle`)

Use the ref API when you need:

- `appendData` streaming (Cartesian series data superset + OHLC array)
- access to the underlying `ChartGPUInstance`
- access to the container element (e.g. for annotation authoring UI overlays)
- external render mode: `renderFrame()`, `needsRender()`, `getRenderMode()`, `setRenderMode()`

See [`ChartGPUHandle` docs](./api/chartgpu-handle.md).

### 3) Hook-based imperative creation (`useChartGPU`)

Use `useChartGPU` when you want to control rendering of the container element yourself, or integrate chart creation into a custom layout.

See [`useChartGPU` docs](./api/hooks.md#usechartgpu).

### 4) Connecting charts (`useConnectCharts` / `connectCharts`)

To sync crosshair / interaction-x (and optionally zoom) across multiple charts, use:

- `useConnectCharts([chartA, chartB, ...], syncOptions?)` (React-friendly)
- or `connectCharts([chartA, chartB, ...], syncOptions?)` (manual)

See [Chart sync recipe](./recipes/chart-sync.md).

## Recipes

Step-by-step guides for common use cases:

- [Crosshair move](./recipes/crosshair-move.md) — handling `onCrosshairMove` events
- [Chart sync](./recipes/chart-sync.md) — syncing multiple charts with `connectCharts` / `useConnectCharts`
- [Annotation authoring](./recipes/annotation-authoring.md) — interactive annotation creation
- [Streaming](./recipes/streaming.md) — realtime data updates with `appendData`
- [dataZoom basics](./recipes/datazoom-basics.md) — zoom and pan with `dataZoom` + `onZoomChange`
- [Scatter density](./recipes/scatter-density.md) — density heatmaps for large scatter datasets
