<p align="center" style="margin-bottom:0; margin-top:20px;">
  <img src="docs/assets/chartgpu.png" alt="ChartGPU" width="400">
</p>

<p align="center" style="margin-top:-18px;">
  React bindings for <a href="https://github.com/ChartGPU/ChartGPU">ChartGPU</a>: MIT-licensed WebGPU charts for dense real-time, multi-series and multi-panel dashboards.
</p>

<div align="center">

[<img src="docs/assets/powered-by-webgpu.svg" alt="Powered by WebGPU" height="28" />](#browser-support-webgpu-required)
[![npm version](https://img.shields.io/npm/v/chartgpu-react?style=for-the-badge&color=blue)](https://www.npmjs.com/package/chartgpu-react)
[![NPM Downloads](https://img.shields.io/npm/dm/chartgpu-react?style=for-the-badge&color=%2368cc49)](https://www.npmjs.com/package/chartgpu-react)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg?style=for-the-badge)](https://github.com/ChartGPU/chartgpu-react/blob/main/LICENSE)
[![Live Demo](https://img.shields.io/badge/demo-live-brightgreen?style=for-the-badge)](https://chartgpu.io)
[![Documentation](https://img.shields.io/badge/Documentation-Getting%20Started-blue?style=for-the-badge)](https://chartgpu.io/docs/getting-started/)
[![API Reference](https://img.shields.io/badge/API-Reference-blue?style=for-the-badge)](./docs/API.md)

[<img src="https://hackerbadge.now.sh/api?id=46706528" alt="Featured on Hacker News" height="30" />](https://news.ycombinator.com/item?id=46706528)

[<img src="https://awesome.re/mentioned-badge.svg" alt="Featured in Awesome WebGPU" style="height: 30px;" />](https://github.com/mikbry/awesome-webgpu)

</div>

`chartgpu-react` is a thin React + TypeScript wrapper around [`@chartgpu/chartgpu`](https://www.npmjs.com/package/@chartgpu/chartgpu): lifecycle, resize, events, refs, and multi-chart GPU sharing in React. Core charting stays in ChartGPU (MIT commercial embed, zero npm runtime dependencies in core, WebGPU required, no WebGL fallback).

Use it when Chart.js, ECharts, or uPlot hit streaming or multi-panel walls. Commercial GPU seats often ship WebGL fallback and broader catalog; ChartGPU is the open WebGPU-only embed.

Demo and docs: [chartgpu.io](https://chartgpu.io) · [docs](https://chartgpu.io/docs/) · [streaming dashboards](https://chartgpu.io/docs/streaming-dashboards/) · [core repo](https://github.com/ChartGPU/ChartGPU)

---

## Install

```bash
npm install chartgpu-react @chartgpu/chartgpu react react-dom
```

Peer dependency: **`@chartgpu/chartgpu` ^0.3.6** (aligned with this package’s 0.3.x line). React 18 or 19.

---

## Quick start

```tsx
import { ChartGPU } from 'chartgpu-react';
import type { ChartGPUOptions } from 'chartgpu-react';

function MyChart() {
  const options: ChartGPUOptions = {
    series: [
      {
        type: 'line',
        data: {
          x: new Float64Array([0, 1, 2, 3]),
          y: new Float64Array([0, 1, 4, 9]),
        },
        lineStyle: { width: 2, color: '#667eea' },
      },
    ],
    xAxis: { type: 'value' },
    yAxis: { type: 'value' },
  };

  return <ChartGPU options={options} style={{ width: '100%', height: '400px' }} />;
}
```

Object / `[x,y]` tuples are fine for tiny demos; prefer typed-array columns at scale.

---

## Why chartgpu-react

| | |
|---|---|
| **React lifecycle** | Async create/dispose, debounced `ResizeObserver` sizing |
| **Dense real-time jobs** | Multi-series streaming, multi-panel dashboards, finance, heatmaps (via core) |
| **Shared-device multi-panel** | `useGPUContext` / `gpuContext` prop (recommended for ≥3 charts); `useConnectCharts` / `connectCharts` |
| **Ring FIFO streaming** | `ref.appendData(..., { maxPoints })`; heatmap/surface stream APIs on core |
| **Events and refs** | `onClick`, `onCrosshairMove`, `onZoomChange`, `onDataAppend`, `onDeviceLost`, …; `ChartGPUHandle` imperative API |
| **MIT commercial embed** | MIT wrapper; core density stays free under MIT with no feature gates on FIFO, zoom, multi-chart, or finance series |
| **WebGPU-only** | Same browser gate as core; no WebGL fallback |

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
      const y = new Float64Array([Math.sin(x0 * 0.05), Math.sin((x0 + 1) * 0.05), Math.sin((x0 + 2) * 0.05)]);
      t.current += 3;
      // Density path: column payload + fixed-capacity ring
      ref.current?.appendData(0, { x, y }, { maxPoints: 50_000 });
    }, 16);
    return () => window.clearInterval(id);
  }, []);

  return (
    <ChartGPU
      ref={ref}
      options={{
        autoScroll: true,
        series: [
          {
            type: 'line',
            data: { x: new Float64Array(0), y: new Float64Array(0) },
            lineStyle: { width: 2, color: '#4facfe' },
          },
        ],
        xAxis: { type: 'value' },
        yAxis: { type: 'value' },
      }}
      style={{ width: '100%', height: 320 }}
    />
  );
}
```

---

## Multi-chart dashboards (shared GPU device)

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

Recommended for ≥3 charts. Full recipes: [streaming dashboards](https://chartgpu.io/docs/streaming-dashboards/) · [chart-sync recipe](./docs/recipes/chart-sync.md) · [core multi-chart cookbook](https://github.com/ChartGPU/ChartGPU/blob/main/docs/guides/multichart-dashboard-cookbook.md)

---

## More feature snippets

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

## Documentation

### chartgpu.io (core product)

| | |
|---|---|
| [Docs hub](https://chartgpu.io/docs/) | Guides and series docs |
| [Getting started](https://chartgpu.io/docs/getting-started/) | Install and first chart |
| [Streaming dashboards](https://chartgpu.io/docs/streaming-dashboards/) | Shared device, multi-chart |
| [Performance](https://chartgpu.io/docs/performance/) | Density, sampling, GPU sharing |

### This repository (React)

| | |
|---|---|
| [Getting started](./docs/GETTING_STARTED.md) | React install and first component |
| [API](./docs/API.md) | Component, hooks, handle |
| [Recipes](./docs/recipes/) | Crosshair, sync, streaming, annotations, dataZoom |

---

## Examples

```bash
npm install
npm run dev
# http://localhost:3000/examples/index.html
```

See [`examples/main.tsx`](./examples/main.tsx).

---

## Browser support (WebGPU required)

No WebGL fallback. Gate unsupported browsers in your app (capability detect; never a blank canvas).

| Browser | Notes |
|---------|--------|
| Chrome / Edge | 113+ |
| Safari | 18+ |
| Firefox | Windows 114+, macOS 145+, Linux still incomplete on [gpuweb status](https://github.com/gpuweb/gpuweb/wiki/Implementation-Status) |

```ts
if (!navigator.gpu) {
  // fail closed: show UI, do not leave an empty chart
}
```

WebGPU-only is intentional. Need Canvas/SVG or dual WebGL+WebGPU? Use a stack that ships a fallback.

---

## Development

```bash
npm install
npm run typecheck
npm run build
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

[MIT](LICENSE). Free for commercial embedding. ChartGPU core keeps density, FIFO, multi-chart, and finance series in the open core.

## Related

- [ChartGPU](https://github.com/ChartGPU/ChartGPU) — core WebGPU charting library
- [chartgpu.io](https://chartgpu.io) — demos and docs
