# Hooks

This package provides two hooks:

- `useChartGPU(containerRef, options, gpuContext?)` — create/manage a `ChartGPUInstance` (3rd param optional shared context; init-only)
- `useConnectCharts(charts, syncOptions?)` — connect instances for synced crosshair/interaction-x (and optionally zoom)

Related:

- [`ChartGPU` component](./chartgpu-component.md)
- [Chart sync recipe](../recipes/chart-sync.md)
- LLM entrypoint: [`llm-context.md`](./llm-context.md)

## `useChartGPU(containerRef, options, gpuContext?)`

Creates a `@chartgpu/chartgpu` chart instance inside a DOM element that you control.

### Import

```ts
import { useChartGPU } from 'chartgpu-react';
import type { ChartGPUOptions, ChartGPUCreateContext } from 'chartgpu-react';
```

### Signature

```ts
function useChartGPU(
  containerRef: React.RefObject<HTMLElement>,
  options: ChartGPUOptions,
  gpuContext?: ChartGPUCreateContext
): {
  chart: ChartGPUInstance | null;
  isReady: boolean;
  error: Error | null;
}
```

The 3rd parameter `gpuContext` is **init-only**: it is only read during chart creation. Changing it after mount has no effect.

### Behavior

- On mount:
  - checks WebGPU support (`'gpu' in navigator`)
  - calls `ChartGPU.create(containerRef.current, options, gpuContext?)`
  - sets `chart`, `isReady`, and `error` accordingly
- On `options` change:
  - calls `chart.setOption(options)` (full replacement)
- On unmount:
  - disposes the chart instance (if created)
  - disconnects the `ResizeObserver`
- Installs a `ResizeObserver` and calls `chart.resize()` (debounced 100ms)
- Safe in React 18 StrictMode dev (async create + cleanup ordering)

### Example

```tsx
import { useMemo, useRef } from 'react';
import { useChartGPU } from 'chartgpu-react';
import type { ChartGPUOptions } from 'chartgpu-react';

export function HookChart() {
  const containerRef = useRef<HTMLDivElement>(null);

  const options: ChartGPUOptions = useMemo(
    () => ({
      series: [{ type: 'line', data: [{ x: 0, y: 0 }, { x: 1, y: 2 }] }],
      xAxis: { type: 'value' },
      yAxis: { type: 'value' },
    }),
    []
  );

  const { isReady, error } = useChartGPU(containerRef, options);

  if (error) return <div>WebGPU not supported</div>;

  return (
    <>
      {!isReady && <div>Loading…</div>}
      <div ref={containerRef} style={{ width: '100%', height: 360 }} />
    </>
  );
}
```

## `useConnectCharts(charts, syncOptions?)`

Connects multiple `ChartGPUInstance`s so they share interaction state (crosshair/tooltip x). Optionally syncs zoom/pan across charts.

This hook is a React-friendly wrapper around the upstream helper `connectCharts(...)`.

### Import

```ts
import { useConnectCharts } from 'chartgpu-react';
import type { ChartGPUInstance, ChartSyncOptions } from 'chartgpu-react';
```

### Signature

```ts
function useConnectCharts(
  charts: ReadonlyArray<ChartGPUInstance | null | undefined>,
  syncOptions?: ChartSyncOptions
): void;
```

### `ChartSyncOptions`

```ts
type ChartSyncOptions = Readonly<{
  syncCrosshair?: boolean; // default true
  syncZoom?: boolean;      // default false
}>;
```

- **`syncCrosshair`** (default `true`): sync crosshair + tooltip x across charts.
- **`syncZoom`** (default `false`): sync zoom/pan range across charts.

### Behavior

- Does nothing until all provided instances exist and are **not disposed**
- Automatically disconnects when:
  - the hook unmounts, or
  - the identity/disposed state of instances changes, or
  - `syncOptions` changes
- Reconnection is based on **option values**, not object identity — you can pass a new `syncOptions` object each render and the hook will only reconnect when the actual `syncCrosshair`/`syncZoom` values change
- If `connectCharts(...)` throws, the hook logs an error (dev builds only) and avoids crashing your component tree

### Example: synced crosshair (default)

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
    }),
    []
  );

  const optionsB: ChartGPUOptions = useMemo(
    () => ({
      series: [{ type: 'line', data: [{ x: 0, y: 3 }, { x: 1, y: 1 }] }],
      xAxis: { type: 'value' },
      yAxis: { type: 'value' },
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

### Example: synced zoom

```tsx
useConnectCharts([a, b], { syncZoom: true });
```

This syncs both crosshair and zoom across the connected charts. To sync only zoom without crosshair:

```tsx
useConnectCharts([a, b], { syncCrosshair: false, syncZoom: true });
```
