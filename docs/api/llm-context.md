# chartgpu-react — LLM / Context7 documentation entrypoint

This repository provides **React bindings** for the [`@chartgpu/chartgpu`](https://www.npmjs.com/package/@chartgpu/chartgpu) WebGPU charting library.

The goal of this `llm-context.md` file is to give Context7 (and other LLM tooling) a **single, stable entrypoint** that maps common tasks to the right documentation pages and source files.

## Audience

- React + TypeScript developers integrating ChartGPU into web apps

## Quick API map (what this package exports)

- **React components**
  - `ChartGPU` (recommended)
  - `ChartGPUChart` (legacy / deprecated, thin adapter)
- **Hooks**
  - `useChartGPU(containerRef, options, gpuContext?)` — imperative hook for creating and managing a ChartGPU instance (optionally share GPU resources)
  - `useGPUContext()` — create a shared `GPUAdapter` + `GPUDevice` + `PipelineCache` for multi-chart dashboards (ChartGPU v0.2.7+)
  - `useConnectCharts([chartA, chartB, ...], syncOptions?)` — connect multiple charts for synced crosshair/tooltip (optionally sync zoom)
- **Core helpers**
  - `createChart` (re-exported from `@chartgpu/chartgpu`)
  - `connectCharts` (re-exported from `@chartgpu/chartgpu`)
  - Pipeline cache (re-exported from `@chartgpu/chartgpu`, ChartGPU v0.2.7+): `createPipelineCache`, `getPipelineCacheStats`, `destroyPipelineCache`
  - `createAnnotationAuthoring` (wrapper around `@chartgpu/chartgpu`'s helper; includes a legacy fix for text annotation context-menu hit-testing, now fixed upstream in v0.2.5)
- **Types**
  - Wrapper types: `ChartGPUProps`, `ChartGPUHandle`, `ZoomRange`
  - Wrapper streaming/dashboard types: `ChartGPUDataAppendPayload`, `CartesianSeriesData`, `XYArraysData`, `InterleavedXYData`
  - Re-exported core types: `ChartGPUOptions`, `ChartGPUInstance`, `ChartGPUEventPayload`, `ChartGPUCrosshairMovePayload`,
    `ChartGPUZoomRangeChangePayload`, `ChartGPUCreateContext`, `ChartGPUDeviceLostPayload`, `RenderMode`, `PipelineCache`, `PipelineCacheStats`,
    `ChartSyncOptions`, `ChartGPUHitTestResult`, `DataPoint`, `OHLCDataPoint`, `AnnotationConfig`, `DataZoomConfig`, etc.

## Notable v0.2.7+ additions exposed by this wrapper

- **Shared GPU context**: pass `gpuContext` to `<ChartGPU />` or `useChartGPU(...)`
- **External render mode**: set `options.renderMode = 'external'`, then drive frames via `ChartGPUHandle.needsRender()` / `renderFrame()`
- **Streaming event**: `onDataAppend` mirrors the upstream `'dataAppend'` event from `appendData(...)`
- **Device loss**: `onDeviceLost` mirrors the upstream `'deviceLost'` event (most relevant for shared `GPUDevice`)

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
- **Multi-chart dashboards (shared GPU device + pipeline cache)**
  - Source: `src/useGPUContext.ts`, `src/types.ts`, `src/ChartGPU.tsx`, `src/useChartGPU.ts`
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
- Hooks: `src/useChartGPU.ts`, `src/useGPUContext.ts`, `src/useConnectCharts.ts`
- Public wrapper types: `src/types.ts`
