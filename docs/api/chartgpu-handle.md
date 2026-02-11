# `ChartGPUHandle` (imperative ref API)

`ChartGPUHandle` is the `ref` type exposed by the [`ChartGPU` component](./chartgpu-component.md). It provides a small, safe imperative surface for:

- accessing the underlying `ChartGPUInstance`
- accessing the container element
- streaming/append updates (`appendData`)
- replacing options (`setOption`)
- programmatic zoom control (`setZoomRange`)
- programmatic crosshair/tooltip (`setInteractionX`, `getInteractionX`)
- hit testing (`hitTest`)

Related:

- [`ChartGPU` component](./chartgpu-component.md)
- [Streaming recipe](../recipes/streaming.md)
- [Annotation authoring recipe](../recipes/annotation-authoring.md)
- [dataZoom basics](../recipes/datazoom-basics.md)
- LLM entrypoint: [`llm-context.md`](./llm-context.md)

## Import

```ts
import { ChartGPU } from 'chartgpu-react';
import type { ChartGPUHandle } from 'chartgpu-react';
```

## Methods

### `getChart(): ChartGPUInstance | null`

Returns the underlying `@chartgpu/chartgpu` instance once initialized, otherwise `null`.

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

### `setZoomRange(start: number, end: number): void`

Programmatically sets the zoom range in percent-space.

- **`start`**: start of zoom range (0–100).
- **`end`**: end of zoom range (0–100).

No-op when zoom is disabled on the chart (i.e. no `dataZoom` configured).

### `setInteractionX(x: number | null, source?: unknown): void`

Programmatically drives the crosshair / tooltip to a domain-space x value. Pass `null` to clear the crosshair.

- **`x`**: domain-space x value, or `null` to clear.
- **`source`** (optional): source identifier, useful for sync disambiguation (e.g. avoiding echo loops with `connectCharts`).

### `getInteractionX(): number | null`

Reads the current crosshair / interaction x in domain units. Returns `null` when the crosshair is inactive.

### `hitTest(e: PointerEvent | MouseEvent): ChartGPUHitTestResult`

Performs hit-testing on a pointer or mouse event. Returns coordinates and any matched chart element.

- **`e`**: a native `PointerEvent` or `MouseEvent` from the chart container.
- **Returns**: `ChartGPUHitTestResult` with pixel coordinates, domain-space coordinates, and an optional match object.
- If the chart is not initialized or disposed, returns a sentinel with `isInGrid: false` and `NaN` coordinates.

**React ergonomics note**: React synthetic events (`React.PointerEvent`, `React.MouseEvent`) are not the same as native DOM events. Pass `e.nativeEvent` instead:

```tsx
<div onPointerDown={(e) => {
  const result = chartRef.current?.hitTest(e.nativeEvent);
  // ...
}} />
```

Import the result type if needed:

```ts
import type { ChartGPUHitTestResult } from 'chartgpu-react';
```

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
