# Recipe: annotation authoring (`createAnnotationAuthoring`)

`chartgpu` provides an annotation authoring overlay UI (context menu, drag handles, etc.). `chartgpu-react` re-exports the helper:

```ts
import { createAnnotationAuthoring } from 'chartgpu-react';
```

You need:

- the chart container element (`ChartGPUHandle.getContainer()`), and
- the chart instance (`ChartGPUHandle.getChart()`).

Related:

- [`ChartGPUHandle`](../api/chartgpu-handle.md)
- LLM entrypoint: [`docs/api/llm-context.md`](../api/llm-context.md)

## Example

```tsx
import { useEffect, useMemo, useRef, useState } from 'react';
import { ChartGPU, createAnnotationAuthoring } from 'chartgpu-react';
import type { ChartGPUHandle, ChartGPUInstance, ChartGPUOptions } from 'chartgpu-react';

export function AnnotationAuthoringExample() {
  const ref = useRef<ChartGPUHandle>(null);
  const [chart, setChart] = useState<ChartGPUInstance | null>(null);

  const options: ChartGPUOptions = useMemo(
    () => ({
      series: [{ type: 'line', data: [{ x: 0, y: 1 }, { x: 1, y: 3 }] }],
      xAxis: { type: 'value' },
      yAxis: { type: 'value' },
      tooltip: { show: true, trigger: 'axis' },
      dataZoom: [{ type: 'inside' }, { type: 'slider' }],
      // Note: Do not include 'annotations' in options when using createAnnotationAuthoring.
      // The authoring helper manages annotations via chart.setOption(), and including
      // annotations in the options prop can cause them to be overwritten on re-renders.
    }),
    []
  );

  useEffect(() => {
    const container = ref.current?.getContainer();
    const instance = ref.current?.getChart();
    if (!container || !instance || instance.disposed) return;

    const authoring = createAnnotationAuthoring(container, instance, {
      enableContextMenu: true,
      menuZIndex: 1000,
    });

    // IMPORTANT: dispose authoring before the chart disposes.
    return () => authoring.dispose();
  }, [chart]);

  return (
    <ChartGPU
      ref={ref}
      options={options}
      style={{ width: '100%', height: 420 }}
      theme="dark"
      onReady={setChart}
    />
  );
}
```

## Important notes

### Disposal ordering

If you create an authoring overlay, **dispose it before** the chart instance is disposed:

- ✅ good: `authoring.dispose()` runs in effect cleanup before the component unmount cleanup disposes the chart
- ❌ bad: disposing the chart first can leave overlay listeners pointing at a disposed instance

### Options prop and annotations

**Do not include `annotations` in your `options` prop when using `createAnnotationAuthoring`.** The authoring helper manages annotations programmatically via `chart.setOption()`. If you include `annotations: []` (or any annotations array) in the options prop, the React component's update effect may overwrite annotations added through the authoring UI when options are re-applied.

- ✅ good: Omit `annotations` from options, let `createAnnotationAuthoring` manage them
- ❌ bad: Including `annotations: []` in options can cause added annotations to disappear

### Text note editing (“Edit…” menu)

In `chartgpu@0.2.3`, the upstream authoring context menu’s hit-testing does not recognize `type: "text"` annotations, so the **Edit** menu item may not appear for text notes.

`chartgpu-react` wraps `createAnnotationAuthoring` with a small fix so you can right-click near a text note and still get **Edit/Delete** options.

