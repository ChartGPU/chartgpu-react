<p align="center">
  <img src="docs/assets/chartgpu.png" alt="ChartGPU" width="360">
</p>

<p align="center">
  React bindings for <a href="https://github.com/ChartGPU/ChartGPU">ChartGPU</a> —
  WebGPU charts for large datasets, real-time streaming, multi-chart dashboards, and 3D series.
  MIT licensed.
</p>

<p align="center">
  <a href="https://www.npmjs.com/package/chartgpu-react"><img src="https://img.shields.io/npm/v/chartgpu-react" alt="npm"></a>
  <a href="https://github.com/ChartGPU/chartgpu-react/blob/main/LICENSE"><img src="https://img.shields.io/badge/license-MIT-yellow" alt="MIT"></a>
  <a href="https://chartgpu.io/docs/getting-started/"><img src="https://img.shields.io/badge/docs-getting%20started-blue" alt="docs"></a>
  <a href="https://chartgpu.io"><img src="https://img.shields.io/badge/demo-chartgpu.io-brightgreen" alt="demo"></a>
  <a href="https://github.com/mikbry/awesome-webgpu"><img src="https://awesome.re/mentioned-badge.svg" alt="Featured in Awesome WebGPU" height="20" /></a>
</p>

<p align="center">
  <a href="https://chartgpu.io">Live demo</a> ·
  <a href="https://chartgpu.io/docs/">Docs</a> ·
  <a href="./docs/API.md">React API</a> ·
  <a href="https://github.com/ChartGPU/ChartGPU">Core library</a>
</p>

---

## Overview

`chartgpu-react` is a thin React + TypeScript wrapper around [`@chartgpu/chartgpu`](https://www.npmjs.com/package/@chartgpu/chartgpu). Core charting stays in ChartGPU; this package handles:

- Async create/dispose lifecycle and debounced resize
- Declarative event props and imperative `ChartGPUHandle` ref
- Shared-device multi-chart via `useGPUContext` / `gpuContext`
- Chart sync via `useConnectCharts` / `connectCharts`

ChartGPU renders with **WebGPU** (not Canvas2D or WebGL). There is **no WebGL/Canvas fallback**. Unsupported browsers must be gated by the host app.

Demo and product docs: [chartgpu.io](https://chartgpu.io) · [streaming dashboards](https://chartgpu.io/docs/streaming-dashboards/)

---

## Install

```bash
npm install chartgpu-react @chartgpu/chartgpu react react-dom
```

Peer dependency: **`@chartgpu/chartgpu` ^0.3.9**. React 18 or 19.

### Minimal example

```tsx
import { ChartGPU } from 'chartgpu-react';
import type { ChartGPUOptions } from 'chartgpu-react';

function MyChart() {
  const options: ChartGPUOptions = {
    series: [{
      type: 'line',
      data: {
        x: new Float64Array([0, 1, 2]),
        y: new Float64Array([1, 3, 2]),
      },
    }],
  };

  return <ChartGPU options={options} style={{ width: '100%', height: 400 }} />;
}
```

Prefer column-shaped x/y at scale; object / `[x,y]` tuples are fine for small demos. Requires a WebGPU-capable browser (see [Browser support](#browser-support)).

---

## Features

- **React lifecycle** — async create/dispose, StrictMode-safe, debounced `ResizeObserver` sizing
- **Streaming** — `ref.appendData(..., { maxPoints })` FIFO ring; heatmap/surface stream APIs on core (`updateHeatmap`, `updateSurface3D`)
- **Multi-chart** — `useGPUContext` + `gpuContext` prop (≥3 charts recommended); zoom sync via `useConnectCharts` / `connectCharts`
- **Events and refs** — `onClick`, `onCrosshairMove`, `onZoomChange`, `onDataAppend`, `onDeviceLost`, …; full `ChartGPUHandle` imperative API
- **External render mode** — app-owned rAF with `renderMode: 'external'`, `needsRender()`, `renderFrame()`
- **Series via core** — line, area, bar, scatter, pie, candlestick, ohlc, heatmap, band, errorBar, impulse, step, stacked mountain, 3D (`pointCloud3d`, `surface3d`)
- **MIT commercial embed** — wrapper and core density (FIFO, zoom, multi-chart, finance series) stay open under MIT

Core architecture: [ChartGPU ARCHITECTURE](https://github.com/ChartGPU/ChartGPU/blob/main/docs/ARCHITECTURE.md). Performance: [chartgpu.io/docs/performance](https://chartgpu.io/docs/performance/).

---

## What this package provides

- **`ChartGPU`** component (recommended): create/dispose, resize, event props, `gpuContext`, `ref` / `ChartGPUHandle`
- **Hooks:** `useChartGPU`, `useGPUContext`, `useConnectCharts`
- **Deprecated:** `ChartGPUChart` (use `ChartGPU`)
- **Re-exports from core:** `createChart`, `connectCharts`, `createAnnotationAuthoring`, `createPipelineCache`, `getPipelineCacheStats`, `destroyPipelineCache`

Details: [API reference](./docs/API.md) · [Getting started](./docs/GETTING_STARTED.md)

---

## Streaming append with FIFO (`maxPoints`)

```tsx
import { useEffect, useRef } from 'react';
import { ChartGPU } from 'chartgpu-react';
import type { ChartGPUHandle } from 'chartgpu-react';

function StreamingChart() {
  const ref = useRef<ChartGPUHandle>(null);
  const t = useRef(0);

  useEffect(() => {
    const id = window.setInterval(() => {
      const x0 = t.current;
      const x = new Float64Array([x0, x0 + 1, x0 + 2]);
      const y = new Float64Array([
        Math.sin(x0 * 0.05),
        Math.sin((x0 + 1) * 0.05),
        Math.sin((x0 + 2) * 0.05),
      ]);
      t.current += 3;
      ref.current?.appendData(0, { x, y }, { maxPoints: 50_000 });
    }, 16);
    return () => window.clearInterval(id);
  }, []);

  return (
    <ChartGPU
      ref={ref}
      options={{
        autoScroll: true,
        series: [{
          type: 'line',
          data: { x: new Float64Array(0), y: new Float64Array(0) },
        }],
      }}
      style={{ width: '100%', height: 320 }}
    />
  );
}
```

---

## Multi-chart (shared device)

For three or more charts on one page, create a single adapter/device/pipeline cache and pass it into each chart. Charts do not destroy a shared device on dispose.

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
      <ChartGPU options={optionsA} gpuContext={gpuContext} style={{ height: 240 }} />
      <ChartGPU options={optionsB} gpuContext={gpuContext} style={{ height: 240 }} />
      <ChartGPU options={optionsC} gpuContext={gpuContext} style={{ height: 240 }} />
    </>
  );
}
```

Recipes: [streaming dashboards](https://chartgpu.io/docs/streaming-dashboards/) · [chart-sync](./docs/recipes/chart-sync.md) · [core multi-chart cookbook](https://github.com/ChartGPU/ChartGPU/blob/main/docs/guides/multichart-dashboard-cookbook.md)

---

## More snippets

### Crosshair / interaction X

```tsx
import { ChartGPU } from 'chartgpu-react';
import type { ChartGPUCrosshairMovePayload } from 'chartgpu-react';

<ChartGPU
  options={options}
  onCrosshairMove={(p: ChartGPUCrosshairMovePayload) => {
    console.log('crosshair x:', p.x, 'source:', p.source);
  }}
/>;
```

### Connect charts (sync crosshair / zoom)

```tsx
import { connectCharts } from 'chartgpu-react';

const disconnect = connectCharts([chartA, chartB], { syncZoom: true });
// later: disconnect();
```

Prefer `useConnectCharts(...)` when instances come from `onReady` / `useChartGPU`.

### External render mode (app-owned rAF)

```tsx
import { useEffect, useRef } from 'react';
import { ChartGPU } from 'chartgpu-react';
import type { ChartGPUHandle } from 'chartgpu-react';

function ExternalLoop({ options }) {
  const ref = useRef<ChartGPUHandle>(null);

  useEffect(() => {
    let raf = 0;
    const loop = () => {
      if (ref.current?.needsRender()) ref.current.renderFrame();
      raf = requestAnimationFrame(loop);
    };
    raf = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(raf);
  }, []);

  return <ChartGPU ref={ref} options={{ ...options, renderMode: 'external' }} />;
}
```

### Annotation authoring

```tsx
import { useEffect, useRef, useState } from 'react';
import { ChartGPU, createAnnotationAuthoring } from 'chartgpu-react';
import type { ChartGPUHandle, ChartGPUInstance } from 'chartgpu-react';

function AnnotationAuthoringExample({ options }) {
  const chartRef = useRef<ChartGPUHandle>(null);
  const [chart, setChart] = useState<ChartGPUInstance | null>(null);

  useEffect(() => {
    const container = chartRef.current?.getContainer();
    const instance = chartRef.current?.getChart();
    if (!container || !instance) return;

    const authoring = createAnnotationAuthoring(container, instance, {
      enableContextMenu: true,
    });
    return () => authoring.dispose();
  }, [chart]);

  return <ChartGPU ref={chartRef} options={options} onReady={setChart} />;
}
```

### Candlestick streaming

```tsx
import { useEffect, useRef } from 'react';
import { ChartGPU } from 'chartgpu-react';
import type { ChartGPUHandle, ChartGPUOptions, OHLCDataPoint } from 'chartgpu-react';

function CandlestickStreaming() {
  const ref = useRef<ChartGPUHandle>(null);

  const options: ChartGPUOptions = {
    xAxis: { type: 'time' },
    dataZoom: [{ type: 'inside' }, { type: 'slider' }],
    autoScroll: true,
    series: [{ type: 'candlestick', sampling: 'ohlc', data: [] }],
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

---

## Browser support

WebGPU only. No WebGL path.

| Browser | Support |
|---------|---------|
| Chrome / Edge | 113+ |
| Safari | 18+ |
| Firefox | Windows 114+; macOS 145+; Linux incomplete — see [gpuweb status](https://github.com/gpuweb/gpuweb/wiki/Implementation-Status) |

Detect `navigator.gpu` before creating charts. Do not leave an unsupported user on a blank canvas without UI.

```ts
if (!navigator.gpu) {
  // fail closed: show UI, do not leave an empty chart
}
```

If you need Canvas/SVG or dual WebGL+WebGPU backends, use a library that ships those fallbacks.

---

## Documentation

### chartgpu.io (core product)

| Resource | Description |
|----------|-------------|
| [Docs hub](https://chartgpu.io/docs/) | Guides and series docs |
| [Getting started](https://chartgpu.io/docs/getting-started/) | Install and first chart |
| [API reference](https://chartgpu.io/docs/api/) | `create`, options, streaming, interaction, 3D |
| [Streaming dashboards](https://chartgpu.io/docs/streaming-dashboards/) | Shared device, multi-chart |
| [Performance](https://chartgpu.io/docs/performance/) | Density, sampling, GPU sharing |
| [Theming](https://chartgpu.io/docs/theming/) | Dark / light / custom |

### This repository (React)

| Resource | Description |
|----------|-------------|
| [Getting started](./docs/GETTING_STARTED.md) | React install and first component |
| [API](./docs/API.md) | Component, hooks, handle |
| [Recipes](./docs/recipes/) | Crosshair, sync, streaming, annotations, dataZoom |

```bash
npm install
npm run dev
# http://localhost:3000/examples/index.html
```

See [`examples/main.tsx`](./examples/main.tsx).

---

## Development

```bash
npm install
npm run typecheck
npm run build
npm run test
npm run dev
```

### Local development with linked ChartGPU

```bash
# From sibling ChartGPU clone (directory name may vary)
cd ../ChartGPU
npm link

cd ../chartgpu-react
npm link @chartgpu/chartgpu
npm run build
npm run dev
```

Unlink:

```bash
npm unlink @chartgpu/chartgpu
npm install
```

---

## Type exports

```ts
import type {
  ChartGPUInstance,
  ChartGPUOptions,
  ChartGPUEventPayload,
  ChartGPUCrosshairMovePayload,
  ChartGPUZoomRangeChangePayload,
  ChartGPUHitTestResult,
  ChartGPUHitTestMatch,
  ChartSyncOptions,
  LineSeriesConfig,
  AreaSeriesConfig,
  BarSeriesConfig,
  ScatterSeriesConfig,
  PieSeriesConfig,
  SeriesConfig,
  DataPoint,
  OHLCDataPoint,
  TooltipConfig,
  PerformanceMetrics,
} from 'chartgpu-react';
```

---

## Contributing

Issues and pull requests welcome. For larger changes, open an issue first.

## License

[MIT](LICENSE). Free for commercial use. ChartGPU core keeps density, FIFO, multi-chart, and finance series in the open core.

## Related

- [ChartGPU](https://github.com/ChartGPU/ChartGPU) — core WebGPU charting library
- [chartgpu.io](https://chartgpu.io) — demos and docs
