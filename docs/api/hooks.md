# Hooks

This package provides two hooks:

- `useChartGPU(containerRef, options)` — create/manage a `ChartGPUInstance`
- `useConnectCharts(charts)` — connect instances for synced crosshair/interaction-x

Related:

- [`ChartGPU` component](./chartgpu-component.md)
- [Chart sync recipe](../recipes/chart-sync.md)
- LLM entrypoint: [`llm-context.md`](./llm-context.md)

## `useChartGPU(containerRef, options)`

Creates a `chartgpu` chart instance inside a DOM element that you control.

### Import

```ts
import { useChartGPU } from 'chartgpu-react';
import type { ChartGPUOptions } from 'chartgpu-react';
```

### Signature

```ts
function useChartGPU(
  containerRef: React.RefObject<HTMLElement>,
  options: ChartGPUOptions
): {
  chart: ChartGPUInstance | null;
  isReady: boolean;
  error: Error | null;
}
```

### Behavior

- On mount:
  - checks WebGPU support (`'gpu' in navigator`)
  - calls `ChartGPU.create(containerRef.current, options)`
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

## `useConnectCharts(charts)`

Connects multiple `ChartGPUInstance`s so they share interaction state (crosshair/tooltip x).

This hook is a React-friendly wrapper around the upstream helper `connectCharts(...)`.

### Import

```ts
import { useConnectCharts } from 'chartgpu-react';
import type { ChartGPUInstance } from 'chartgpu-react';
```

### Signature

```ts
function useConnectCharts(
  charts: ReadonlyArray<ChartGPUInstance | null | undefined>
): void;
```

### Behavior

- Does nothing until all provided instances exist and are **not disposed**
- Automatically disconnects when:
  - the hook unmounts, or
  - the identity/disposed state of instances changes
- If `connectCharts(...)` throws, the hook logs an error and avoids crashing your component tree

### Example

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

