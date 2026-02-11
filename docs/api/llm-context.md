# chartgpu-react — LLM / Context7 documentation entrypoint

This repository provides **React bindings** for the [`@chartgpu/chartgpu`](https://www.npmjs.com/package/@chartgpu/chartgpu) WebGPU charting library.

The goal of this `llm-context.md` file is to give Context7 (and other LLM tooling) a **single, stable entrypoint** that maps common tasks to the right documentation pages and source files.

## Audience

- React + TypeScript developers integrating ChartGPU into web apps
- Library consumers who want a thin, type-safe React wrapper with good lifecycle management

## Quick API map (what this package exports)

- **React components**
  - `ChartGPU` (recommended)
  - `ChartGPUChart` (legacy / deprecated, thin adapter)
- **Hooks**
  - `useChartGPU(containerRef, options)` — imperative hook for creating and managing a ChartGPU instance
  - `useConnectCharts([chartA, chartB, ...], syncOptions?)` — connect multiple charts for synced crosshair/tooltip (optionally sync zoom)
- **Core helpers**
  - `createChart` (re-exported from `@chartgpu/chartgpu`)
  - `connectCharts` (re-exported from `@chartgpu/chartgpu`)
  - `createAnnotationAuthoring` (wrapper around `@chartgpu/chartgpu`'s helper; includes a legacy fix for text annotation context-menu hit-testing, now fixed upstream in v0.2.5)
- **Types**
  - Wrapper types: `ChartGPUProps`, `ChartGPUHandle`, `ZoomRange`
  - Re-exported core types: `ChartGPUOptions`, `ChartGPUInstance`, `ChartGPUEventPayload`, `ChartGPUCrosshairMovePayload`,
    `ChartGPUZoomRangeChangePayload`, `ChartSyncOptions`, `ChartGPUHitTestResult`, `DataPoint`, `OHLCDataPoint`, `AnnotationConfig`, `DataZoomConfig`, etc.

## Task → doc page mapping

- **Getting started / install**
  - `docs/GETTING_STARTED.md`
  - `README.md`
- **Using the `ChartGPU` React component**
  - `docs/api/chartgpu-component.md`
  - Source: `src/ChartGPU.tsx`, `src/types.ts`
- **Imperative ref API (`ChartGPUHandle`)**
  - `docs/api/chartgpu-handle.md`
  - Source: `src/types.ts`, `src/ChartGPU.tsx`
- **Hooks (`useChartGPU`, `useConnectCharts`)**
  - `docs/api/hooks.md`
  - Source: `src/useChartGPU.ts`, `src/useConnectCharts.ts`
- **Legacy wrapper (`ChartGPUChart`)**
  - `docs/api/legacy-chartgpuchart.md`
  - Source: `src/ChartGPUChart.tsx`
- **Feature recipes**
  - Crosshair event (`onCrosshairMove`): `docs/recipes/crosshair-move.md`
  - Chart sync (`connectCharts` / `useConnectCharts`): `docs/recipes/chart-sync.md`
  - Annotation authoring (`createAnnotationAuthoring`): `docs/recipes/annotation-authoring.md`
  - Streaming / candlesticks (`appendData` with `OHLCDataPoint`): `docs/recipes/streaming.md`
  - dataZoom basics (`dataZoom` + `onZoomChange`): `docs/recipes/datazoom-basics.md`
  - Scatter density (`scatter` series with `mode='density'`): `docs/recipes/scatter-density.md`

## Source file map

- Public entrypoint: `src/index.ts`
- Component: `src/ChartGPU.tsx`
- Legacy component: `src/ChartGPUChart.tsx`
- Hooks: `src/useChartGPU.ts`, `src/useConnectCharts.ts`
- Public wrapper types: `src/types.ts`
