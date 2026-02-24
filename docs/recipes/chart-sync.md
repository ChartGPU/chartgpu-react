# Recipe: chart sync (connect charts)

To sync crosshair/tooltip x across multiple charts, connect their `ChartGPUInstance`s.

You can do this:

- manually with `connectCharts(...)`, or
- with the React hook `useConnectCharts(...)` (recommended in React apps)

Both accept an optional `ChartSyncOptions` parameter to control what is synced.

Related:

- [`useConnectCharts`](../api/hooks.md#useconnectchartscharts-syncoptions)
- [Crosshair move recipe](./crosshair-move.md)
- [dataZoom basics](./datazoom-basics.md)

## Option A: `useConnectCharts` (recommended)

```tsx
import { useMemo, useState } from 'react';
import { ChartGPU, useConnectCharts } from 'chartgpu-react';
import type { ChartGPUInstance, ChartGPUOptions } from 'chartgpu-react';

export function SyncedCharts() {
  const [a, setA] = useState<ChartGPUInstance | null>(null);
  const [b, setB] = useState<ChartGPUInstance | null>(null);

  useConnectCharts([a, b]);

  const optionsA: ChartGPUOptions = useMemo(
    () => ({
      series: [{ type: 'line', data: [{ x: 0, y: 1 }, { x: 1, y: 2 }] }],
      xAxis: { type: 'value' },
      yAxis: { type: 'value' },
      tooltip: { show: true, trigger: 'axis' },
    }),
    []
  );

  const optionsB: ChartGPUOptions = useMemo(
    () => ({
      series: [{ type: 'line', data: [{ x: 0, y: 3 }, { x: 1, y: 1 }] }],
      xAxis: { type: 'value' },
      yAxis: { type: 'value' },
      tooltip: { show: true, trigger: 'axis' },
    }),
    []
  );

  return (
    <>
      <ChartGPU options={optionsA} onReady={setA} style={{ height: 220 }} theme="dark" />
      <div style={{ height: 12 }} />
      <ChartGPU options={optionsB} onReady={setB} style={{ height: 220 }} theme="dark" />
    </>
  );
}
```

### Zoom sync

To also sync zoom/pan across charts, pass `syncOptions`:

```tsx
useConnectCharts([a, b], { syncZoom: true });
```

This keeps both crosshair and zoom range in sync. To sync only zoom:

```tsx
useConnectCharts([a, b], { syncCrosshair: false, syncZoom: true });
```

## Option B: manual `connectCharts(...)`

`connectCharts` is a helper from the peer dependency `@chartgpu/chartgpu`. `chartgpu-react` re-exports it for convenience:

```ts
import { connectCharts } from 'chartgpu-react';
```

Manual wiring example:

```tsx
import { useEffect, useMemo, useState } from 'react';
import { ChartGPU, connectCharts } from 'chartgpu-react';
import type { ChartGPUInstance, ChartGPUOptions } from 'chartgpu-react';

export function ManualSync() {
  const [a, setA] = useState<ChartGPUInstance | null>(null);
  const [b, setB] = useState<ChartGPUInstance | null>(null);

  useEffect(() => {
    if (!a || a.disposed) return;
    if (!b || b.disposed) return;
    // Pass syncOptions as the second argument (optional)
    const disconnect = connectCharts([a, b], { syncZoom: true });
    return () => disconnect();
  }, [a, b]);

  const options: ChartGPUOptions = useMemo(
    () => ({
      series: [{ type: 'line', data: [{ x: 0, y: 0 }, { x: 1, y: 1 }] }],
      xAxis: { type: 'value' },
      yAxis: { type: 'value' },
      tooltip: { show: true, trigger: 'axis' },
    }),
    []
  );

  return (
    <>
      <ChartGPU options={options} onReady={setA} style={{ height: 220 }} theme="dark" />
      <div style={{ height: 12 }} />
      <ChartGPU options={options} onReady={setB} style={{ height: 220 }} theme="dark" />
    </>
  );
}
```

## `ChartSyncOptions`

```ts
type ChartSyncOptions = Readonly<{
  syncCrosshair?: boolean; // default true
  syncZoom?: boolean;      // default false
}>;
```

- **`syncCrosshair`** (default `true`): sync crosshair + tooltip x across charts.
- **`syncZoom`** (default `false`): sync zoom/pan range across charts.

## Complete dashboard: shared GPU + synced interaction

For multi-chart dashboards, combine `useGPUContext` (shared GPU resources) with `useConnectCharts` (synced interaction). This avoids duplicate GPU device allocation and keeps crosshair/zoom in sync across all charts.

See also: [`useGPUContext` hook docs](../api/hooks.md#usegpucontext)

```tsx
import { useMemo, useState } from 'react';
import { ChartGPU, useGPUContext, useConnectCharts } from 'chartgpu-react';
import type { ChartGPUInstance, ChartGPUOptions } from 'chartgpu-react';

export function SyncedDashboard() {
  const { adapter, device, pipelineCache, isReady, error } = useGPUContext();

  const [chartA, setChartA] = useState<ChartGPUInstance | null>(null);
  const [chartB, setChartB] = useState<ChartGPUInstance | null>(null);
  const [chartC, setChartC] = useState<ChartGPUInstance | null>(null);

  // Sync crosshair and zoom across all three charts
  useConnectCharts([chartA, chartB, chartC], { syncZoom: true });

  const optionsA: ChartGPUOptions = useMemo(
    () => ({
      series: [{ type: 'line', data: [{ x: 0, y: 1 }, { x: 1, y: 3 }] }],
      xAxis: { type: 'value' },
      yAxis: { type: 'value' },
      tooltip: { show: true, trigger: 'axis' },
      dataZoom: { enabled: true },
    }),
    []
  );

  const optionsB: ChartGPUOptions = useMemo(
    () => ({
      series: [{ type: 'bar', data: [{ x: 0, y: 5 }, { x: 1, y: 2 }] }],
      xAxis: { type: 'value' },
      yAxis: { type: 'value' },
      tooltip: { show: true, trigger: 'axis' },
      dataZoom: { enabled: true },
    }),
    []
  );

  const optionsC: ChartGPUOptions = useMemo(
    () => ({
      series: [{ type: 'line', data: [{ x: 0, y: 4 }, { x: 1, y: 1 }] }],
      xAxis: { type: 'value' },
      yAxis: { type: 'value' },
      tooltip: { show: true, trigger: 'axis' },
      dataZoom: { enabled: true },
    }),
    []
  );

  if (error) return <div>WebGPU not supported: {error.message}</div>;
  if (!isReady) return <div>Initializing GPU...</div>;

  const gpuContext = { adapter: adapter!, device: device!, pipelineCache: pipelineCache! };

  return (
    <>
      <ChartGPU options={optionsA} gpuContext={gpuContext} onReady={setChartA} style={{ height: 200 }} theme="dark" />
      <div style={{ height: 8 }} />
      <ChartGPU options={optionsB} gpuContext={gpuContext} onReady={setChartB} style={{ height: 200 }} theme="dark" />
      <div style={{ height: 8 }} />
      <ChartGPU options={optionsC} gpuContext={gpuContext} onReady={setChartC} style={{ height: 200 }} theme="dark" />
    </>
  );
}
```

Key points:

- `useGPUContext()` runs once in the parent and shares a single `GPUDevice` + `PipelineCache` across all charts, reducing shader compilation overhead.
- `useConnectCharts` keeps crosshair and zoom in sync. It only activates once all chart instances are ready.
- The `gpuContext` prop is **init-only** on each `<ChartGPU>` -- it is read once during chart creation and cannot be changed after mount.

## Notes

- Always disconnect on cleanup to avoid leaking listeners.
- Only connect charts that are initialized and not disposed.
- When `syncZoom` is enabled, all connected charts should have compatible `dataZoom` configs for best results.
