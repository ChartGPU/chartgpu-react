# Getting started

`chartgpu-react` is a **thin React + TypeScript wrapper** around the [`@chartgpu/chartgpu`](https://www.npmjs.com/package/@chartgpu/chartgpu) WebGPU charting library.

## Install

```bash
npm install chartgpu-react @chartgpu/chartgpu react react-dom
```

## Requirements

- **React**: 18+
- **WebGPU**: a browser with `navigator.gpu` support (Chrome/Edge 113+, Safari 18+)

If WebGPU is not available, chart creation will fail.

## Quick start (recommended: `ChartGPU` component)

```tsx
import { ChartGPU } from 'chartgpu-react';
import type { ChartGPUOptions } from 'chartgpu-react';

const options: ChartGPUOptions = {
  series: [
    {
      type: 'line',
      data: [
        { x: 0, y: 0 },
        { x: 1, y: 1 },
        { x: 2, y: 4 },
      ],
    },
  ],
  xAxis: { type: 'value' },
  yAxis: { type: 'value' },
};

export function MyChart() {
  return (
    <ChartGPU
      options={options}
      style={{ width: '100%', height: 400 }}
      theme="dark"
    />
  );
}
```

## Sizing (important)

The chart renders into a container `<div>`. Make sure it has a **non-zero height**:

- Prefer `style={{ height: 400 }}` or a CSS class with explicit height.
- If the container height is `0`, the chart may render blank even though it initialized.

The component and hook both attach a `ResizeObserver` and call `chart.resize()` (debounced).

## Updating data & options

- **Replace options**: updating the `options` prop calls `chart.setOption(options)` (full replacement, not a partial merge).
- **Stream/append**: for realtime charts, prefer `ChartGPUHandle.appendData(...)` instead of rebuilding `options.series[].data`.

See [Streaming recipe](./recipes/streaming.md).

## React 18 StrictMode

In development, React 18 StrictMode intentionally runs effects twice (mount → unmount → mount). `ChartGPU` and `useChartGPU` are written to be safe under this behavior (async create + cleanup ordering).

## Next steps

- [API reference](./API.md)
- Component details: [`ChartGPU`](./api/chartgpu-component.md), [`ChartGPUHandle`](./api/chartgpu-handle.md)
- Hooks: [`useChartGPU` and `useConnectCharts`](./api/hooks.md)
- Recipes: [crosshair move](./recipes/crosshair-move.md), [chart sync](./recipes/chart-sync.md), [annotation authoring](./recipes/annotation-authoring.md), [streaming](./recipes/streaming.md), [dataZoom basics](./recipes/datazoom-basics.md), [scatter density](./recipes/scatter-density.md)
- [Troubleshooting](./TROUBLESHOOTING.md) and [FAQ](./FAQ.md)

