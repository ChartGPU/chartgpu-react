# Recipe: crosshair move (`onCrosshairMove`)

Use `onCrosshairMove` to react to the chart’s **interaction-x** (crosshair position).

Related:

- [`ChartGPU` component](../api/chartgpu-component.md)
- [Chart sync recipe](./chart-sync.md)

## Example

```tsx
import { useMemo, useState } from 'react';
import { ChartGPU } from 'chartgpu-react';
import type { ChartGPUCrosshairMovePayload, ChartGPUOptions } from 'chartgpu-react';

export function CrosshairMoveExample() {
  const [x, setX] = useState<number | null>(null);

  const options: ChartGPUOptions = useMemo(
    () => ({
      series: [
        {
          type: 'line',
          data: [
            { x: 0, y: 2 },
            { x: 1, y: 3 },
            { x: 2, y: 1 },
          ],
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
      <div>Crosshair X: {x === null ? 'none' : x.toFixed(2)}</div>
      <ChartGPU
        options={options}
        style={{ width: '100%', height: 360 }}
        theme="dark"
        onCrosshairMove={(p: ChartGPUCrosshairMovePayload) => setX(p.x)}
      />
    </>
  );
}
```

## Notes

- `p.x` is in **domain units** (e.g. time/value), or `null` when the crosshair is cleared.
- The underlying event name in `chartgpu` is `'crosshairMove'`; the wrapper wires it to the `onCrosshairMove` prop.

