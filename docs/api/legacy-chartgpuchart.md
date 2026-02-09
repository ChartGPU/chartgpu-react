# `ChartGPUChart` (deprecated legacy adapter)

`ChartGPUChart` is a legacy wrapper component kept for backward compatibility.

**New work should use [`ChartGPU`](./chartgpu-component.md)**.

This file documents:

- the `ChartGPUChartProps` surface
- how it maps to `ChartGPU`
- migration guidance

Related:

- [`ChartGPU` component](./chartgpu-component.md)
- [API overview](../API.md)
- LLM entrypoint: [`llm-context.md`](./llm-context.md)

## Status

- Exported as `ChartGPUChart`
- Marked `@deprecated` in `src/index.ts` and `src/ChartGPUChart.tsx`
- Will be removed in a future major version

## Props

`ChartGPUChartProps` (defined in `src/ChartGPUChart.tsx`):

| Prop | Type | Required | Notes |
|---|---|---:|---|
| `options` | `ChartGPUOptions` | ✅ | Same configuration object you pass to `ChartGPU`. |
| `className` | `string` |  | Passed through to `ChartGPU`. |
| `style` | `React.CSSProperties` |  | Merged with a default `{ width: '100%', height: '400px', position: 'relative' }`. |
| `onInit` | `(instance: ChartGPUInstance) => void` |  | Called when `ChartGPU` fires `onReady`. |
| `onDispose` | `() => void` |  | Called on unmount **only if** the chart initialized (`onInit` ran). |

## Migration to `ChartGPU`

### 1) Replace the component

Before:

```tsx
import { ChartGPUChart } from 'chartgpu-react';

<ChartGPUChart options={options} />;
```

After:

```tsx
import { ChartGPU } from 'chartgpu-react';

<ChartGPU options={options} style={{ width: '100%', height: 400 }} />;
```

### 2) Replace `onInit` with `onReady`

Before:

```tsx
<ChartGPUChart options={options} onInit={(chart) => console.log(chart)} />;
```

After:

```tsx
<ChartGPU options={options} onReady={(chart) => console.log(chart)} />;
```

### 3) Replace `onDispose`

`ChartGPU` does not expose an `onDispose` callback. Use a `ref` or `onReady` to retain the instance and dispose any dependent resources in a cleanup:

```tsx
import { useEffect, useState } from 'react';
import { ChartGPU } from 'chartgpu-react';
import type { ChartGPUInstance } from 'chartgpu-react';

export function Example() {
  const [chart, setChart] = useState<ChartGPUInstance | null>(null);

  useEffect(() => {
    return () => {
      // Cleanup any app-level resources tied to the chart here.
      // (The ChartGPU component itself disposes the chart instance automatically.)
      void chart;
    };
  }, [chart]);

  return <ChartGPU options={options} onReady={setChart} style={{ height: 400 }} />;
}
```

## Why deprecate?

`ChartGPU` provides:

- a clearer imperative `ref` API (`ChartGPUHandle`)
- additional event props (`onCrosshairMove`, `onZoomChange`)
- explicit `theme` override support

