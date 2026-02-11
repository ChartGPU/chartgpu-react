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

## Notes

- Always disconnect on cleanup to avoid leaking listeners.
- Only connect charts that are initialized and not disposed.
- When `syncZoom` is enabled, all connected charts should have compatible `dataZoom` configs for best results.
