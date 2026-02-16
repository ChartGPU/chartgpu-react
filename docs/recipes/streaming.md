# Recipe: streaming / append data (`appendData`)

For realtime charts, prefer `appendData(...)` over rebuilding your entire `options` object.

You can append:

- **Cartesian series data**: `DataPoint[]`, `XYArraysData`, or `InterleavedXYData` for XY series (e.g. line, scatter)
- **OHLC**: `OHLCDataPoint[]` for candlesticks

Related:

- [`ChartGPUHandle`](../api/chartgpu-handle.md)
- [`ChartGPU` component](../api/chartgpu-component.md)

## Line streaming (DataPoint)

```tsx
import { useEffect, useMemo, useRef } from 'react';
import { ChartGPU } from 'chartgpu-react';
import type { ChartGPUHandle, ChartGPUOptions, DataPoint } from 'chartgpu-react';

export function StreamingLine() {
  const ref = useRef<ChartGPUHandle>(null);

  const options: ChartGPUOptions = useMemo(
    () => ({
      series: [{ type: 'line', data: [] }],
      xAxis: { type: 'value' },
      yAxis: { type: 'value' },
      dataZoom: [{ type: 'inside' }, { type: 'slider' }],
      autoScroll: true,
    }),
    []
  );

  useEffect(() => {
    let x = 0;
    const timer = window.setInterval(() => {
      const next: DataPoint = { x, y: Math.sin(x * 0.05) };
      ref.current?.appendData(0, [next]);
      x++;
    }, 50);
    return () => window.clearInterval(timer);
  }, []);

  return <ChartGPU ref={ref} options={options} style={{ height: 360 }} theme="dark" />;
}
```

## Candlestick streaming (OHLCDataPoint)

```tsx
import { useEffect, useMemo, useRef } from 'react';
import { ChartGPU } from 'chartgpu-react';
import type { ChartGPUHandle, ChartGPUOptions, OHLCDataPoint } from 'chartgpu-react';

export function StreamingCandles() {
  const ref = useRef<ChartGPUHandle>(null);

  const options: ChartGPUOptions = useMemo(
    () => ({
      xAxis: { type: 'time' },
      yAxis: { type: 'value' },
      tooltip: { show: true, trigger: 'axis' },
      dataZoom: [{ type: 'inside', start: 80, end: 100 }, { type: 'slider', start: 80, end: 100 }],
      autoScroll: true,
      series: [{ type: 'candlestick', sampling: 'ohlc', data: [] }],
    }),
    []
  );

  useEffect(() => {
    let last = 100;
    const timer = window.setInterval(() => {
      const open = last;
      const close = open + (Math.random() - 0.5) * 2;
      const high = Math.max(open, close) + Math.random();
      const low = Math.min(open, close) - Math.random();
      last = close;

      const next: OHLCDataPoint = {
        timestamp: Date.now(),
        open,
        close,
        high,
        low,
      };

      ref.current?.appendData(0, [next]);
    }, 500);
    return () => window.clearInterval(timer);
  }, []);

  return <ChartGPU ref={ref} options={options} style={{ height: 420 }} theme="dark" />;
}
```

## Notes

- `seriesIndex` is the index into `options.series`.
- `appendData` assumes the series at that index is compatible with the points you append (e.g. `OHLCDataPoint[]` for candlesticks, `DataPoint[]` or array-like formats for line/scatter).
- `options` updates are full replacements; streaming is best done via `appendData` to avoid reallocating large arrays.

