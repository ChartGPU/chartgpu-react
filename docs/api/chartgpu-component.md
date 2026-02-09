# `ChartGPU` React component

> Recommended wrapper component. For the legacy adapter, see [`ChartGPUChart` (deprecated)](./legacy-chartgpuchart.md).

Related:

- [Getting started](../GETTING_STARTED.md)
- [`ChartGPUHandle` (imperative ref API)](./chartgpu-handle.md)
- [Hooks (`useChartGPU`, `useConnectCharts`)](./hooks.md)
- LLM entrypoint: [`llm-context.md`](./llm-context.md)

## Import

```tsx
import { ChartGPU } from 'chartgpu-react';
import type { ChartGPUProps, ChartGPUHandle, ChartGPUOptions } from 'chartgpu-react';
```

## Props

The props type is `ChartGPUProps` (defined in `src/types.ts`).

| Prop | Type | Required | Notes |
|---|---|---:|---|
| `options` | `ChartGPUOptions` | ✅ | Full chart configuration object. Updates call `setOption(...)` with a full replacement. |
| `theme` | `ChartGPUOptions['theme']` |  | Theme override merged into `options` (`'dark' \| 'light' \| ThemeConfig`). |
| `style` | `React.CSSProperties` |  | Applied to the container `<div>`. Provide an explicit `height`. |
| `className` | `string` |  | Applied to the container `<div>`. |
| `onReady` | `(chart: ChartGPUInstance) => void` |  | Called after async create completes successfully. |
| `onClick` | `(payload: ChartGPUEventPayload) => void` |  | Wires to `chart.on('click', ...)`. |
| `onMouseOver` | `(payload: ChartGPUEventPayload) => void` |  | Wires to `chart.on('mouseover', ...)`. |
| `onMouseOut` | `(payload: ChartGPUEventPayload) => void` |  | Wires to `chart.on('mouseout', ...)`. |
| `onCrosshairMove` | `(payload: ChartGPUCrosshairMovePayload) => void` |  | Wires to `chart.on('crosshairMove', ...)`. |
| `onZoomChange` | `(range: ZoomRange) => void` |  | Fires when `chart.getZoomRange()` changes (polled every 100ms). |

## Imperative ref (`ChartGPUHandle`)

`ChartGPU` supports `ref` via `forwardRef`. The handle exposes:

- `getChart()`
- `getContainer()`
- `appendData(seriesIndex, newPoints)`
- `setOption(options)`

See [`ChartGPUHandle`](./chartgpu-handle.md).

## Lifecycle + behavior

### Async initialization

On mount, the component calls:

```ts
ChartGPU.create(containerDiv, effectiveOptions)
```

Where `effectiveOptions` is `options` with `theme` merged in when provided.

If the component unmounts before async creation completes (common in React 18 StrictMode dev), the newly-created chart instance is disposed immediately to avoid leaks.

### Options updates

Whenever `options` or `theme` changes, the component calls:

```ts
chart.setOption(effectiveOptions)
```

This is a **full replacement** update (not a partial merge).

### Resize behavior

The component installs a `ResizeObserver` on the container and calls:

```ts
chart.resize()
```

Resize calls are debounced (100ms).

### Zoom change events

If you provide `onZoomChange`, the component polls `chart.getZoomRange()` every 100ms and fires the callback when:

- the zoom range transitions from `null` → non-null, or
- `start`/`end` values change.

If zoom is disabled (`null`), no callback is fired.

## Example

```tsx
import { useMemo, useRef, useState } from 'react';
import { ChartGPU } from 'chartgpu-react';
import type { ChartGPUHandle, ChartGPUInstance, ChartGPUOptions } from 'chartgpu-react';

export function Example() {
  const ref = useRef<ChartGPUHandle>(null);
  const [chart, setChart] = useState<ChartGPUInstance | null>(null);

  const options: ChartGPUOptions = useMemo(
    () => ({
      series: [{ type: 'line', data: [{ x: 0, y: 1 }, { x: 1, y: 3 }] }],
      xAxis: { type: 'value' },
      yAxis: { type: 'value' },
    }),
    []
  );

  return (
    <ChartGPU
      ref={ref}
      options={options}
      style={{ width: '100%', height: 360 }}
      theme="dark"
      onReady={(c) => {
        setChart(c);
        console.log('ready', c);
      }}
      onCrosshairMove={(p) => console.log('x:', p.x)}
      onClick={(p) => console.log('clicked', p)}
      onZoomChange={(range) => console.log('zoom', range.start, range.end)}
    />
  );
}
```

