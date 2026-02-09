# Scatter density (binned heatmap)

ChartGPU supports a **scatter density** mode that bins a large point cloud into a screen-space density heatmap. In `chartgpu-react`, you enable this by passing the upstream `ChartGPUOptions` scatter series configuration.

## Example

Key points:

- Use `type: 'scatter'` with `mode: 'density'`
- **Memoize** both the data array and the `options` object to avoid re-uploading large datasets on every React render

```tsx
import { ChartGPU } from 'chartgpu-react';
import type { ChartGPUOptions, ScatterPointTuple } from 'chartgpu-react';
import { useMemo } from 'react';

function generatePoints(count: number): ScatterPointTuple[] {
  const out: ScatterPointTuple[] = [];
  for (let i = 0; i < count; i++) {
    out.push([Math.random() * 100, Math.random() * 100]);
  }
  return out;
}

export function ScatterDensityChart() {
  const data = useMemo(() => generatePoints(250_000), []);

  const options: ChartGPUOptions = useMemo(
    () => ({
      xAxis: { type: 'value' },
      yAxis: { type: 'value' },
      tooltip: { show: true, trigger: 'axis' },
      series: [
        {
          type: 'scatter',
          name: 'Density',
          data,
          mode: 'density',
          binSize: 2,
          densityColormap: 'viridis',
          densityNormalization: 'log',
          sampling: 'none',
        },
      ],
      grid: { left: 60, right: 40, top: 40, bottom: 40 },
    }),
    [data]
  );

  return <ChartGPU options={options} theme="dark" style={{ width: '100%', height: 400 }} />;
}
```

## Performance tips

- **Keep `data` stable**: changing the array reference usually means the chart must ingest/reprocess the full dataset again.
- **Keep `options` stable**: this wrapper calls `chart.setOption(options)` on `options` identity changes.
- For very large datasets, consider a UI that changes only *render settings* (e.g. `binSize`) without regenerating the point list.

