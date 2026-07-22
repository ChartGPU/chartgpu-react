<p align="center" style="margin-bottom:0; margin-top:20px;">
  <img src="docs/assets/chartgpu.png" alt="ChartGPU" width="400">
</p>

<p align="center">
  React bindings for <a href="https://github.com/ChartGPU/ChartGPU">ChartGPU</a> — The fastest open-source charting library — 50M points at 60 FPS.
</p>

<div align="center">

[<img src="docs/assets/powered-by-webgpu.svg" alt="Powered by WebGPU" height="28" />](https://forthebadge.com)
[![Documentation](https://img.shields.io/badge/Documentation-Getting%20Started-blue?style=for-the-badge)](https://github.com/chartgpu/chartgpu-react/blob/main/docs/GETTING_STARTED.md)
[![API Reference](https://img.shields.io/badge/API-Reference-blue?style=for-the-badge)](https://github.com/chartgpu/chartgpu-react/blob/main/docs/API.md)
[![Examples](https://img.shields.io/badge/Examples-Run%20Locally-blue?style=for-the-badge)](https://github.com/chartgpu/chartgpu-react/tree/main/examples)
[![npm version](https://img.shields.io/npm/v/chartgpu-react?style=for-the-badge&color=blue)](https://www.npmjs.com/package/chartgpu-react)
[![NPM Downloads](https://img.shields.io/npm/dm/chartgpu-react?style=for-the-badge&color=%2368cc49)](https://www.npmjs.com/package/chartgpu-react)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg?style=for-the-badge)](https://www.npmjs.com/package/chartgpu-react)

[<img src="https://hackerbadge.now.sh/api?id=46706528" alt="Featured on Hacker News" height="30" />](https://news.ycombinator.com/item?id=46706528)

[<img src="https://awesome.re/mentioned-badge.svg" alt="Featured in Awesome WebGPU" style="height: 30px;" />](https://github.com/mikbry/awesome-webgpu)


</div>

`chartgpu-react` is a **thin React + TypeScript wrapper** around the [`@chartgpu/chartgpu`](https://www.npmjs.com/package/@chartgpu/chartgpu) core library.

## Highlights

- **`ChartGPU` component (recommended)**: async create/dispose lifecycle + debounced `ResizeObserver` sizing
- **Event props**: `onClick`, `onCrosshairMove`, `onZoomChange`, `onDataAppend`, `onDeviceLost`, etc.
- **Imperative `ref` API**: `ChartGPUHandle` (`getChart`, `getContainer`, `appendData` with optional `{ maxPoints }` FIFO, `setOption`, `setZoomRange`, `setInteractionX`, `getInteractionX`, `hitTest`, `needsRender`, `renderFrame`, `getRenderMode`, `setRenderMode`)
- **Hooks**: `useChartGPU(...)`, `useGPUContext()`, `useConnectCharts(..., syncOptions?)`
- **Multi-chart + streaming**: share a `GPUDevice` via `gpuContext` / `useGPUContext`, sync with `useConnectCharts`, stream with `appendData(..., { maxPoints })`
- **Helper re-exports (from `@chartgpu/chartgpu`)**: `createChart`, `connectCharts`, `createPipelineCache`, `getPipelineCacheStats`, `destroyPipelineCache`, `createAnnotationAuthoring`

## Quick start

```tsx
import { ChartGPU } from 'chartgpu-react';
import type { ChartGPUOptions } from 'chartgpu-react';

function MyChart() {
  const options: ChartGPUOptions = {
    series: [
      {
        type: 'line',
        data: [
          { x: 0, y: 0 },
          { x: 1, y: 1 },
          { x: 2, y: 4 },
          { x: 3, y: 9 },
        ],
        lineStyle: {
          width: 2,
          color: '#667eea',
        },
      },
    ],
    xAxis: { type: 'value' },
    yAxis: { type: 'value' },
  };

  return <ChartGPU options={options} style={{ width: '100%', height: '400px' }} />;
}
```

## Installation

```bash
npm install chartgpu-react @chartgpu/chartgpu react react-dom
```

Peer dependency: **`@chartgpu/chartgpu` ^0.3.6** (aligned with this package’s 0.3.x line).

### Requirements

- **React 18 or 19** (`react` / `react-dom` ≥ 18)
- **TypeScript 5+** for consumers (this package is built and typechecked with **TypeScript 7**)
- Browser with WebGPU support:
  - Chrome/Edge 113+
  - Safari 18+
  - Firefox: Windows 114+, Mac 145+, Linux nightly

Check browser compatibility at [caniuse.com/webgpu](https://caniuse.com/webgpu).

## What this package provides

- **`ChartGPU`** React component (recommended)
  - lifecycle management (async create + dispose)
  - `ResizeObserver` resize (debounced)
  - event props: `onClick`, `onCrosshairMove`, `onZoomChange`, `onDataAppend`, `onDeviceLost`, etc.
  - multi-chart dashboards: `gpuContext` prop (share a `GPUDevice` across charts)
  - imperative `ref` API: `ChartGPUHandle` (`getChart`, `getContainer`, `appendData`, `setOption`, `setZoomRange`, `setInteractionX`, `getInteractionX`, `hitTest`, `needsRender`, `renderFrame`, `getRenderMode`, `setRenderMode`)
- **Hooks**
  - `useChartGPU(containerRef, options, gpuContext?)` — create/manage a chart instance (optionally share GPU resources)
  - `useGPUContext()` — create a shared `GPUAdapter` + `GPUDevice` + `PipelineCache` for multi-chart dashboards
  - `useConnectCharts([chartA, chartB, ...], syncOptions?)` — sync crosshair/interaction-x (and optionally zoom) across charts
- **Deprecated**
  - `ChartGPUChart` (legacy adapter; use `ChartGPU` instead)
- **Helper re-exports** (from peer dependency `@chartgpu/chartgpu`)
  - `createChart`, `connectCharts`, `createAnnotationAuthoring`, `createPipelineCache`, `getPipelineCacheStats`, `destroyPipelineCache`

For details, start with the [API reference](./docs/API.md).

## Feature snippets (ChartGPU core)

These snippets use helpers and events from the `@chartgpu/chartgpu` core library (peer dependency of `chartgpu-react`).

### Crosshair / interaction X (`'crosshairMove'`)

```tsx
import { ChartGPU } from 'chartgpu-react';
import type { ChartGPUCrosshairMovePayload } from 'chartgpu-react';

<ChartGPU
  options={options}
  onCrosshairMove={(p: ChartGPUCrosshairMovePayload) => {
    // p.x is the current interaction x (domain units), or null when cleared
    console.log('crosshair x:', p.x, 'source:', p.source);
  }}
/>;
```

### Connect charts (sync crosshair/tooltip)

```tsx
import { connectCharts } from 'chartgpu-react';

// When you have two ChartGPUInstance objects:
const disconnect = connectCharts([chartA, chartB]);

// With zoom sync:
// const disconnect = connectCharts([chartA, chartB], { syncZoom: true });

// Later:
disconnect();
```

If you prefer a hook-driven approach, you can use `onReady` (or `useChartGPU`) to capture instances, then call `useConnectCharts(...)` once both are available.

### Streaming append with FIFO window (`maxPoints`)

```tsx
import { useEffect, useRef } from 'react';
import { ChartGPU } from 'chartgpu-react';
import type { ChartGPUHandle } from 'chartgpu-react';

function StreamingChart() {
  const ref = useRef<ChartGPUHandle>(null);
  const xRef = useRef(0);

  useEffect(() => {
    const id = window.setInterval(() => {
      const x = xRef.current++;
      ref.current?.appendData(0, [{ x, y: Math.sin(x * 0.05) }], { maxPoints: 50_000 });
    }, 16);
    return () => window.clearInterval(id);
  }, []);

  return (
    <ChartGPU
      ref={ref}
      options={{
        autoScroll: true,
        series: [{ type: 'line', data: [], lineStyle: { width: 2, color: '#4facfe' } }],
        xAxis: { type: 'value' },
        yAxis: { type: 'value' },
      }}
      style={{ width: '100%', height: 320 }}
    />
  );
}
```

### External render mode (app-owned render loop)

```tsx
import { useEffect, useRef } from 'react';
import { ChartGPU } from 'chartgpu-react';
import type { ChartGPUHandle } from 'chartgpu-react';

function ExternalLoop() {
  const ref = useRef<ChartGPUHandle>(null);

  useEffect(() => {
    let raf = 0;
    const loop = () => {
      if (ref.current?.needsRender()) {
        ref.current.renderFrame();
      }
      raf = requestAnimationFrame(loop);
    };
    raf = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(raf);
  }, []);

  return <ChartGPU ref={ref} options={{ ...options, renderMode: 'external' }} />;
}
```

### Multi-chart dashboards (shared GPU device + pipeline cache)

```tsx
import { ChartGPU, useGPUContext } from 'chartgpu-react';

function Dashboard() {
  const { adapter, device, pipelineCache, isReady, error } = useGPUContext();

  if (error) return <div>{error.message}</div>;
  if (!isReady || !adapter || !device) return <div>Loading…</div>;

  const gpuContext = pipelineCache
    ? { adapter, device, pipelineCache }
    : { adapter, device };

  return (
    <>
      <ChartGPU options={optionsA} gpuContext={gpuContext} />
      <ChartGPU options={optionsB} gpuContext={gpuContext} />
    </>
  );
}
```

### Annotation authoring UI (`createAnnotationAuthoring`)

```tsx
import { useEffect, useRef, useState } from 'react';
import { ChartGPU } from 'chartgpu-react';
import type { ChartGPUHandle, ChartGPUInstance } from 'chartgpu-react';
import { createAnnotationAuthoring } from 'chartgpu-react';

function AnnotationAuthoringExample() {
  const chartRef = useRef<ChartGPUHandle>(null);
  const [chart, setChart] = useState<ChartGPUInstance | null>(null);

  useEffect(() => {
    const container = chartRef.current?.getContainer();
    const instance = chartRef.current?.getChart();
    if (!container || !instance) return;

    const authoring = createAnnotationAuthoring(container, instance, {
      enableContextMenu: true,
    });

    // IMPORTANT: dispose authoring before disposing the chart
    return () => authoring.dispose();
  }, [chart]);

  return <ChartGPU ref={chartRef} options={options} onReady={setChart} />;
}
```

### Candlestick streaming (`appendData` + `OHLCDataPoint`)

```tsx
import { useEffect, useRef } from 'react';
import { ChartGPU } from 'chartgpu-react';
import type { ChartGPUHandle, ChartGPUOptions } from 'chartgpu-react';
import type { OHLCDataPoint } from 'chartgpu-react';

function CandlestickStreaming() {
  const ref = useRef<ChartGPUHandle>(null);

  const options: ChartGPUOptions = {
    xAxis: { type: 'time' },
    dataZoom: [{ type: 'inside' }, { type: 'slider' }],
    autoScroll: true,
    series: [
      {
        type: 'candlestick',
        sampling: 'ohlc',
        data: [], // start empty; stream in candles below
      },
    ],
  };

  useEffect(() => {
    const timer = window.setInterval(() => {
      const next: OHLCDataPoint = {
        timestamp: Date.now(),
        open: 100,
        close: 102,
        low: 99,
        high: 103,
      };
      ref.current?.appendData(0, [next]);
    }, 500);
    return () => window.clearInterval(timer);
  }, []);

  return <ChartGPU ref={ref} options={options} style={{ height: 360 }} />;
}
```

## Documentation

- **Getting started**: [`docs/GETTING_STARTED.md`](./docs/GETTING_STARTED.md)
- **API reference**: [`docs/API.md`](./docs/API.md)
- **Recipes**:
  - [`onCrosshairMove`](./docs/recipes/crosshair-move.md)
  - [`useConnectCharts` / `connectCharts`](./docs/recipes/chart-sync.md)
  - [`createAnnotationAuthoring`](./docs/recipes/annotation-authoring.md)
  - [`appendData` streaming](./docs/recipes/streaming.md)
  - [`dataZoom` + `onZoomChange`](./docs/recipes/datazoom-basics.md)

## Examples

- Runnable example app: [`examples/main.tsx`](./examples/main.tsx)
- Run locally:
  - `npm install`
  - `npm run dev` (opens `http://localhost:3000/examples/index.html`)

## Development

```bash
# Install dependencies
npm install

# Run type checking
npm run typecheck

# Build library
npm run build

# Run examples in dev mode
npm run dev
```

The dev server will start at `http://localhost:3000` and open the examples page automatically.

### Local development with linked ChartGPU

To develop `chartgpu-react` against a local version of the `@chartgpu/chartgpu` package (useful for testing changes across both repositories):

```bash
# 1. Link the @chartgpu/chartgpu package from the sibling repo
cd ../chart-gpu
npm link

# 2. Link @chartgpu/chartgpu into this project
cd ../chartgpu-react
npm link @chartgpu/chartgpu

# 3. Build and run - will use the linked local package
npm run build
npm run dev
```

**Note:** After linking, `npm run build` and `npm run dev` will resolve imports to your local `@chartgpu/chartgpu` package instead of the published version. This allows you to test changes in both repos simultaneously.

To unlink and return to the published package:

```bash
npm unlink @chartgpu/chartgpu
npm install
```

## Type exports

The package re-exports common types from ChartGPU for convenience:

```typescript
import type {
  ChartGPUInstance,
  ChartGPUOptions,
  ChartGPUEventPayload,
  ChartGPUCrosshairMovePayload,
  ChartGPUZoomRangeChangePayload,
  ChartGPUHitTestResult,
  ChartGPUHitTestMatch,
  ChartSyncOptions,
  AreaSeriesConfig,
  LineSeriesConfig,
  BarSeriesConfig,
  PieSeriesConfig,
  ScatterSeriesConfig,
  SeriesConfig,
  LineStyleConfig,
  AreaStyleConfig,
  DataPoint,
  LegendConfig,
  LegendPosition,
  AnimationConfig,
  TooltipConfig,
  TooltipParams,
  PerformanceMetrics,
} from 'chartgpu-react';
```

## Browser support (WebGPU required)

WebGPU is required. Check support at runtime:

```typescript
const checkSupport = async () => {
  if (!('gpu' in navigator)) {
    console.warn('WebGPU not supported');
    return false;
  }
  return true;
};
```

## Contributing

Issues and pull requests are welcome. If you're planning a larger change, open an issue first so we can discuss direction.

## License

MIT

## Related Projects

- [ChartGPU](https://github.com/ChartGPU/ChartGPU) - Core WebGPU charting library
