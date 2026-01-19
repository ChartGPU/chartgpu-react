# chartgpu-react

React bindings for [ChartGPU](https://github.com/huntergemmer/chart-gpu) - a WebGPU-powered charting library delivering high-performance data visualization.

## Features

- **WebGPU-Accelerated**: Leverages GPU compute and rendering for exceptional performance
- **React 18+**: Built with modern React patterns (hooks, functional components)
- **Type-Safe**: Full TypeScript support with comprehensive type definitions
- **Production-Ready**: Handles async initialization, cleanup, and edge cases safely
- **Flexible API**: Declarative options-based configuration

## Installation

```bash
npm install chartgpu-react chartgpu react react-dom
```

## Requirements

- React 18.0.0 or higher
- Browser with WebGPU support:
  - Chrome/Edge 113+
  - Safari 18+
  - Firefox (not yet supported)

Check browser compatibility at [caniuse.com/webgpu](https://caniuse.com/webgpu)

## Quick Start

```tsx
import { ChartGPUChart } from 'chartgpu-react';

function MyChart() {
  const options = {
    series: [
      {
        type: 'line',
        data: [
          { x: 0, y: 0 },
          { x: 1, y: 1 },
          { x: 2, y: 4 },
          { x: 3, y: 9 },
        ],
        lineStyle: {
          width: 2,
          color: '#667eea',
        },
      },
    ],
    xAxis: { type: 'value' },
    yAxis: { type: 'value' },
  };

  return (
    <ChartGPUChart
      options={options}
      style={{ width: '100%', height: '400px' }}
    />
  );
}
```

## Component API

### `ChartGPUChart`

Main React component wrapping ChartGPU functionality.

#### Props

| Prop | Type | Required | Description |
|------|------|----------|-------------|
| `options` | `ChartGPUOptions` | Yes | Chart configuration (series, axes, styling) |
| `className` | `string` | No | CSS class name for the container div |
| `style` | `React.CSSProperties` | No | Inline styles for the container div |
| `onInit` | `(instance: ChartGPUInstance) => void` | No | Callback fired when chart instance is created |
| `onDispose` | `() => void` | No | Callback fired when chart instance is disposed |

#### Behavior

**Lifecycle Management:**
- Creates ChartGPU instance on mount via `ChartGPU.create()`
- Safely handles async initialization race conditions
- Automatically disposes instance on unmount
- Prevents state updates after component unmount

**Options Updates:**
- Calls `instance.setOption(options)` when `options` prop changes
- Triggers automatic re-render of the chart

**Resize Handling:**
- Listens to window resize events
- Calls `instance.resize()` automatically
- Ensures chart maintains correct dimensions

## Examples

### Multi-Series Line Chart

```tsx
import { ChartGPUChart } from 'chartgpu-react';

function MultiSeriesExample() {
  const options = {
    series: [
      {
        type: 'line',
        name: 'Revenue',
        data: generateData(50),
        lineStyle: { color: '#667eea', width: 2 },
      },
      {
        type: 'line',
        name: 'Expenses',
        data: generateData(50),
        lineStyle: { color: '#f093fb', width: 2 },
      },
    ],
    xAxis: { type: 'value' },
    yAxis: { type: 'value' },
    grid: { left: 60, right: 40, top: 40, bottom: 40 },
    tooltip: { show: true },
  };

  return (
    <ChartGPUChart
      options={options}
      style={{ width: '100%', height: '400px' }}
    />
  );
}
```

### Area Chart with Gradient

```tsx
function AreaChartExample() {
  const options = {
    series: [
      {
        type: 'line',
        data: generateSineWave(100),
        lineStyle: { color: '#667eea', width: 2 },
        areaStyle: { color: 'rgba(102, 126, 234, 0.2)' },
      },
    ],
    xAxis: { type: 'value' },
    yAxis: { type: 'value' },
  };

  return <ChartGPUChart options={options} style={{ height: '300px' }} />;
}
```

### Using Chart Instance Callbacks

```tsx
function ChartWithCallbacks() {
  const handleInit = (instance: ChartGPUInstance) => {
    console.log('Chart initialized:', instance);
    
    // Add event listeners
    instance.on('click', (payload) => {
      console.log('Chart clicked:', payload);
    });
  };

  const handleDispose = () => {
    console.log('Chart cleaned up');
  };

  return (
    <ChartGPUChart
      options={options}
      onInit={handleInit}
      onDispose={handleDispose}
      style={{ height: '400px' }}
    />
  );
}
```

## Development

```bash
# Install dependencies
npm install

# Run type checking
npm run typecheck

# Build library
npm run build

# Run examples in dev mode
npm run dev
```

The dev server will start at `http://localhost:3000` and open the examples page automatically.

### Local Development with Linked ChartGPU

To develop `chartgpu-react` against a local version of the `chartgpu` package (useful for testing changes across both repositories):

```bash
# 1. Link the chartgpu package from the sibling repo
cd ../chart-gpu
npm link

# 2. Link chartgpu into this project
cd ../chartgpu-react
npm link chartgpu

# 3. Build and run - will use the linked local package
npm run build
npm run dev
```

**Note:** After linking, `npm run build` and `npm run dev` will resolve imports to your local `chartgpu` package instead of the published version. This allows you to test changes in both repos simultaneously.

To unlink and return to the published package:

```bash
npm unlink chartgpu
npm install
```

## Type Exports

The package re-exports common types from ChartGPU for convenience:

```typescript
import type {
  ChartGPUInstance,
  ChartGPUOptions,
  ChartGPUEventPayload,
  ChartGPUCrosshairMovePayload,
  AreaSeriesConfig,
  LineSeriesConfig,
  BarSeriesConfig,
  PieSeriesConfig,
  ScatterSeriesConfig,
  SeriesConfig,
  DataPoint,
} from 'chartgpu-react';
```

## Technical Details

### Async Initialization Safety

The component uses a mounted ref pattern to prevent React state updates after unmount:

```typescript
useEffect(() => {
  mountedRef.current = true;
  
  const initChart = async () => {
    const instance = await ChartGPU.create(container, options);
    
    // Only update state if still mounted
    if (mountedRef.current) {
      instanceRef.current = instance;
    } else {
      // Dispose immediately if unmounted during async create
      instance.dispose();
    }
  };
  
  initChart();
  
  return () => {
    mountedRef.current = false;
    instanceRef.current?.dispose();
  };
}, []);
```

This pattern ensures:
1. No memory leaks from orphaned chart instances
2. No React warnings about setState on unmounted components
3. Clean resource cleanup even if creation takes time

### Options Updates

Options changes trigger `setOption()` on the existing instance rather than recreating the chart:

```typescript
useEffect(() => {
  instanceRef.current?.setOption(options);
}, [options]);
```

This provides better performance for dynamic data updates.

## Browser Compatibility

WebGPU is required. Check support at runtime:

```typescript
const checkSupport = async () => {
  if (!('gpu' in navigator)) {
    console.warn('WebGPU not supported');
    return false;
  }
  return true;
};
```

## License

MIT

## Related Projects

- [ChartGPU](https://github.com/huntergemmer/chart-gpu) - Core WebGPU charting library
