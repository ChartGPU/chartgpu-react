# chartgpu-react

<p align="center">
  React bindings for <a href="https://github.com/ChartGPU/ChartGPU">ChartGPU</a> — WebGPU-powered charting for high-performance data visualization.
</p>

<div align="center">

[![Documentation](https://img.shields.io/badge/Documentation-Getting%20Started-blue?style=for-the-badge)](https://github.com/chartgpu/chartgpu-react/blob/main/docs/GETTING_STARTED.md)
[![API Reference](https://img.shields.io/badge/API-Reference-blue?style=for-the-badge)](https://github.com/chartgpu/chartgpu-react/blob/main/docs/API.md)
[![Examples](https://img.shields.io/badge/Examples-Run%20Locally-blue?style=for-the-badge)](https://github.com/chartgpu/chartgpu-react/tree/main/examples)

[![npm version](https://img.shields.io/npm/v/chartgpu-react?style=for-the-badge&color=blue)](https://www.npmjs.com/package/chartgpu-react)
[![NPM Downloads](https://img.shields.io/npm/dm/chartgpu-react?style=for-the-badge&color=%2368cc49)](https://www.npmjs.com/package/chartgpu-react)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg?style=for-the-badge)](https://www.npmjs.com/package/chartgpu-react)

</div>

`chartgpu-react` is a **thin React + TypeScript wrapper** around the [`chartgpu`](https://www.npmjs.com/package/chartgpu) core library.

## Highlights

- **`ChartGPU` component (recommended)**: async create/dispose lifecycle + debounced `ResizeObserver` sizing
- **Event props**: `onClick`, `onCrosshairMove`, `onZoomChange`, etc.
- **Imperative `ref` API**: `ChartGPUHandle` (`getChart`, `getContainer`, `appendData`, `setOption`)
- **Hooks**: `useChartGPU(...)`, `useConnectCharts(...)`
- **Helper re-exports (from `chartgpu`)**: `createChart`, `connectCharts`, `createAnnotationAuthoring`

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
npm install chartgpu-react chartgpu react react-dom
```

### Requirements

- React 18.0.0 or higher
- Browser with WebGPU support:
  - Chrome/Edge 113+
  - Safari 18+
  - Firefox (not yet supported)

Check browser compatibility at [caniuse.com/webgpu](https://caniuse.com/webgpu).

## What this package provides

- **`ChartGPU`** React component (recommended)
  - lifecycle management (async create + dispose)
  - `ResizeObserver` resize (debounced)
  - event props: `onClick`, `onCrosshairMove`, `onZoomChange`, etc.
  - imperative `ref` API: `ChartGPUHandle` (`getChart`, `getContainer`, `appendData`, `setOption`)
- **Hooks**
  - `useChartGPU(containerRef, options)` — create/manage a chart instance
  - `useConnectCharts([chartA, chartB, ...])` — sync crosshair/interaction-x across charts
- **Deprecated**
  - `ChartGPUChart` (legacy adapter; use `ChartGPU` instead)
- **Helper re-exports** (from peer dependency `chartgpu`)
  - `createChart`, `connectCharts`, `createAnnotationAuthoring`

For details, start with the [API reference](./docs/API.md).

## Feature snippets (ChartGPU core)

These snippets use helpers and events from the `chartgpu` core library (peer dependency of `chartgpu-react`).

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
import { connectCharts } from 'chartgpu';

// When you have two ChartGPUInstance objects:
const disconnect = connectCharts([chartA, chartB]);

// Later:
disconnect();
```

If you prefer a hook-driven approach, you can use `onReady` (or `useChartGPU`) to capture instances, then call `connectCharts(...)` once both are available.

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
import type { OHLCDataPoint } from 'chartgpu';

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

To develop `chartgpu-react` against a local version of the `chartgpu` package (useful for testing changes across both repositories):

```bash
# 1. Link the chartgpu package from the sibling repo
cd ../chart-gpu
npm link

# 2. Link chartgpu into this project
cd ../chartgpu-react
npm link chartgpu

# 3. Build and run - will use the linked local package
npm run build
npm run dev
```

**Note:** After linking, `npm run build` and `npm run dev` will resolve imports to your local `chartgpu` package instead of the published version. This allows you to test changes in both repos simultaneously.

To unlink and return to the published package:

```bash
npm unlink chartgpu
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
  AreaSeriesConfig,
  LineSeriesConfig,
  BarSeriesConfig,
  PieSeriesConfig,
  ScatterSeriesConfig,
  SeriesConfig,
  DataPoint,
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

Issues and pull requests are welcome. If you’re planning a larger change, open an issue first so we can discuss direction.

## License

MIT

## Related Projects

- [ChartGPU](https://github.com/ChartGPU/ChartGPU) - Core WebGPU charting library
