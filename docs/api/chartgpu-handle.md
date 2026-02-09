# `ChartGPUHandle` (imperative ref API)

`ChartGPUHandle` is the `ref` type exposed by the [`ChartGPU` component](./chartgpu-component.md). It provides a small, safe imperative surface for:

- accessing the underlying `ChartGPUInstance`
- accessing the container element
- streaming/append updates (`appendData`)
- replacing options (`setOption`)

Related:

- [`ChartGPU` component](./chartgpu-component.md)
- [Streaming recipe](../recipes/streaming.md)
- [Annotation authoring recipe](../recipes/annotation-authoring.md)
- LLM entrypoint: [`llm-context.md`](./llm-context.md)

## Import

```ts
import { ChartGPU } from 'chartgpu-react';
import type { ChartGPUHandle } from 'chartgpu-react';
```

## Methods

### `getChart(): ChartGPUInstance | null`

Returns the underlying `chartgpu` instance once initialized, otherwise `null`.

Notes:

- The wrapper returns `null` when the chart has not initialized yet.
- The wrapper guards calls using `instance && !instance.disposed` internally for `appendData`/`setOption`, but `getChart()` itself can return a disposed instance if your code retains it—always check `disposed` before using it.

### `getContainer(): HTMLDivElement | null`

Returns the container `<div>` used to mount the chart.

Common use case: pass it to helpers like `createAnnotationAuthoring(container, chart, ...)`.

### `appendData(seriesIndex: number, newPoints: DataPoint[] | OHLCDataPoint[]): void`

Appends points to an existing series, delegating to `ChartGPUInstance.appendData(...)`.

- **`seriesIndex`**: zero-based index into `options.series`.
- **`newPoints`**: array of new points. For candlesticks, use `OHLCDataPoint[]`.

This is typically more efficient than replacing the entire `options.series[n].data` array.

### `setOption(options: ChartGPUOptions): void`

Replaces the chart options, delegating to `ChartGPUInstance.setOption(options)`.

Important: `setOption` is treated as a **full replacement**, not a partial merge.

## Example: streaming with `appendData`

```tsx
import { useEffect, useMemo, useRef } from 'react';
import { ChartGPU } from 'chartgpu-react';
import type { ChartGPUHandle, ChartGPUOptions } from 'chartgpu-react';
import type { OHLCDataPoint } from 'chartgpu-react';

export function StreamingCandles() {
  const ref = useRef<ChartGPUHandle>(null);

  const options: ChartGPUOptions = useMemo(
    () => ({
      xAxis: { type: 'time' },
      yAxis: { type: 'value' },
      autoScroll: true,
      dataZoom: [{ type: 'inside' }, { type: 'slider' }],
      series: [
        {
          type: 'candlestick',
          sampling: 'ohlc',
          data: [],
        },
      ],
    }),
    []
  );

  useEffect(() => {
    const timer = window.setInterval(() => {
      const next: OHLCDataPoint = {
        timestamp: Date.now(),
        open: 100,
        close: 101,
        high: 102,
        low: 99,
      };
      ref.current?.appendData(0, [next]);
    }, 500);
    return () => window.clearInterval(timer);
  }, []);

  return <ChartGPU ref={ref} options={options} style={{ height: 420 }} theme="dark" />;
}
```

