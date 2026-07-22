# Getting started

`chartgpu-react` is a **thin React + TypeScript wrapper** around the [`@chartgpu/chartgpu`](https://www.npmjs.com/package/@chartgpu/chartgpu) WebGPU charting library.

## Install

```bash
npm install chartgpu-react @chartgpu/chartgpu react react-dom
```

## Requirements

- **@chartgpu/chartgpu**: ^0.3.6 (peer)
- **React**: 18 or 19
- **WebGPU**: a browser with `navigator.gpu` support (Chrome/Edge 113+, Safari 18+, modern Firefox)

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

In development, React 18 StrictMode intentionally runs effects twice (mount → unmount → mount). `ChartGPU`, `useChartGPU`, and `useGPUContext` are written to be safe under this behavior:

- **`ChartGPU` / `useChartGPU`**: async create + cleanup ordering (dispose if unmounted before create resolves).
- **`useGPUContext`**: a shared init promise so StrictMode remount reuses one adapter/device/`PipelineCache` acquisition instead of requesting a second device.

## Testing (unit coverage map)

Unit tests live under `src/__tests__/` (Vitest + jsdom). They mock `@chartgpu/chartgpu` and do **not** require a real WebGPU device (except `useGPUContext`, which stubs `navigator.gpu`).

| Area | File |
|------|------|
| Create / `setOption` race (issue #16) | `src/__tests__/ChartGPU.test.tsx`, `src/__tests__/useChartGPU.test.tsx` |
| Handle `appendData` + `{ maxPoints }`, `setZoomRange` source, external render | `src/__tests__/ChartGPU.test.tsx` |
| Handle smoke (`getChart`, `setOption`, interaction X, `hitTest`) | `src/__tests__/ChartGPU.test.tsx` |
| Event props (`onDataAppend`, `onDeviceLost`) | `src/__tests__/ChartGPU.test.tsx` |
| `gpuContext` → `ChartGPU.create` third arg | `src/__tests__/ChartGPU.test.tsx`, `src/__tests__/useChartGPU.test.tsx` |
| `useConnectCharts` | `src/__tests__/useConnectCharts.test.tsx` |
| `useGPUContext` | `src/__tests__/useGPUContext.test.tsx` |
| Public export surface | `src/__tests__/exports.test.ts` |

Run: `npm test`, `npm run typecheck`, `npm run build`.

## Next steps

- [API reference](./API.md)
- Component details: [`ChartGPU`](./api/chartgpu-component.md), [`ChartGPUHandle`](./api/chartgpu-handle.md)
- Hooks: [`useChartGPU` and `useConnectCharts`](./api/hooks.md)
- Recipes: [crosshair move](./recipes/crosshair-move.md), [chart sync](./recipes/chart-sync.md), [annotation authoring](./recipes/annotation-authoring.md), [streaming](./recipes/streaming.md), [dataZoom basics](./recipes/datazoom-basics.md), [scatter density](./recipes/scatter-density.md)
- [Troubleshooting](./TROUBLESHOOTING.md) and [FAQ](./FAQ.md)

