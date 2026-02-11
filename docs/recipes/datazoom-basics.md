# Recipe: dataZoom basics + `onZoomChange`

Enable `dataZoom` to allow users to zoom/pan through data. The `ChartGPU` React component can also notify you when the zoom window changes via `onZoomChange`.

Related:

- [`ChartGPU` props](../api/chartgpu-component.md#props)
- [`ChartGPUHandle`](../api/chartgpu-handle.md) — programmatic zoom via `setZoomRange`
- [Crosshair move recipe](./crosshair-move.md)

## Example

```tsx
import { useMemo, useState } from 'react';
import { ChartGPU } from 'chartgpu-react';
import type { ChartGPUOptions, ZoomRange } from 'chartgpu-react';

export function DataZoomExample() {
  const [zoom, setZoom] = useState<ZoomRange | null>(null);

  const options: ChartGPUOptions = useMemo(
    () => ({
      series: [
        {
          type: 'line',
          data: Array.from({ length: 200 }, (_, i) => ({
            x: i,
            y: Math.sin(i * 0.05) * 10,
          })),
        },
      ],
      xAxis: { type: 'value' },
      yAxis: { type: 'value' },
      tooltip: { show: true, trigger: 'axis' },
      dataZoom: [{ type: 'inside' }, { type: 'slider' }],
    }),
    []
  );

  return (
    <>
      <div>
        Zoom: {zoom ? `${zoom.start.toFixed(2)} → ${zoom.end.toFixed(2)}` : 'none'}
      </div>
      <ChartGPU
        options={options}
        style={{ height: 360 }}
        theme="dark"
        onZoomChange={(range) => setZoom(range)}
      />
    </>
  );
}
```

## Notes

- `onZoomChange` subscribes to the native `zoomRangeChange` event on the chart instance (introduced in ChartGPU v0.2.5). No polling is involved.
- If zoom is disabled, `getZoomRange()` returns `null` and the callback will not fire.
- You can programmatically control the zoom range via the imperative ref: `chartRef.current?.setZoomRange(start, end)` (percent-space, 0–100). See [`ChartGPUHandle.setZoomRange`](../api/chartgpu-handle.md#setzoomrangestart-number-end-number-void).
