# API reference (chartgpu-react)

This package is a **React wrapper** around the `chartgpu` core library. Most runtime behavior lives in `chartgpu`; this repo primarily provides:

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

- **`useChartGPU(containerRef, options)`** — create/manage an instance imperatively
- **`useConnectCharts([chartA, chartB, ...])`** — keep crosshair/interaction-x in sync

See [`docs/api/hooks.md`](./api/hooks.md).

### Helper re-exports (from peer dependency `chartgpu`)

`chartgpu-react` exposes these helpers so you can often import everything from one package:

- `createChart`
- `connectCharts`
- `createAnnotationAuthoring`

- `createChart` / `connectCharts` are re-exported directly from `chartgpu`.
- `createAnnotationAuthoring` is a thin wrapper around `chartgpu`’s helper that includes a small fix for `chartgpu@0.2.3`: the upstream authoring context menu hit-testing does not recognize `type: "text"` annotations, so **Edit** may not appear for text notes.

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

- `ChartGPUProps` — props for the `ChartGPU` component
- `ChartGPUHandle` — imperative ref API
- `ChartInstance` — alias for `chartgpu`’s `ChartGPUInstance`
- `ClickParams`, `MouseOverParams` — aliases for event payloads
- `ZoomRange` — derived from `ChartGPUInstance['getZoomRange']` (non-null range)

### Re-exported core types (from peer dependency `chartgpu`)

From `src/index.ts`, this package re-exports a curated set of `chartgpu` types so consumers can do:

```ts
import type { ChartGPUOptions, ChartGPUInstance, DataPoint } from 'chartgpu-react';
```

Currently re-exported:

- **Core**: `ChartGPUInstance`, `ChartGPUOptions`
- **Events**: `ChartGPUEventPayload`, `ChartGPUCrosshairMovePayload`
- **Annotation authoring**: `AnnotationAuthoringInstance`, `AnnotationAuthoringOptions`, `AnnotationConfig`
- **Series config**: `AreaSeriesConfig`, `LineSeriesConfig`, `BarSeriesConfig`, `PieSeriesConfig`, `ScatterSeriesConfig`, `CandlestickSeriesConfig`, `SeriesConfig`
- **Data**: `DataPoint`, `OHLCDataPoint`
- **Interaction/zoom**: `DataZoomConfig`
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

- `appendData` streaming
- access to the underlying `ChartGPUInstance`
- access to the container element (e.g. for annotation authoring UI overlays)

See [`ChartGPUHandle` docs](./api/chartgpu-handle.md).

### 3) Hook-based imperative creation (`useChartGPU`)

Use `useChartGPU` when you want to control rendering of the container element yourself, or integrate chart creation into a custom layout.

See [`useChartGPU` docs](./api/hooks.md#usechartgpu).

### 4) Connecting charts (`useConnectCharts` / `connectCharts`)

To sync crosshair / interaction-x across multiple charts, use:

- `useConnectCharts([chartA, chartB, ...])` (React-friendly)
- or `connectCharts([chartA, chartB, ...])` (manual)

See [Chart sync recipe](./recipes/chart-sync.md).

## Recipes

Step-by-step guides for common use cases:

- [Crosshair move](./recipes/crosshair-move.md) — handling `onCrosshairMove` events
- [Chart sync](./recipes/chart-sync.md) — syncing multiple charts with `connectCharts` / `useConnectCharts`
- [Annotation authoring](./recipes/annotation-authoring.md) — interactive annotation creation
- [Streaming](./recipes/streaming.md) — realtime data updates with `appendData`
- [dataZoom basics](./recipes/datazoom-basics.md) — zoom and pan with `dataZoom` + `onZoomChange`
- [Scatter density](./recipes/scatter-density.md) — density heatmaps for large scatter datasets

