/**
 * chartgpu-react
 * React bindings for ChartGPU - WebGPU-powered charting library
 */

// Primary ChartGPU component (Story 6.18)
export { ChartGPU } from './ChartGPU';

// Wrapper types for the ChartGPU component
export type {
  ChartGPUProps,
  ChartGPUHandle,
  ChartInstance,
  ClickParams,
  MouseOverParams,
  ZoomRange,
} from './types';

// useChartGPU hook (Story 6.19)
export { useChartGPU } from './useChartGPU';
export type { UseChartGPUResult } from './useChartGPU';

// Chart sync hook (connectCharts) - ChartGPU v0.2.3+
export { useConnectCharts } from './useConnectCharts';

/**
 * @deprecated Use `ChartGPU` instead. `ChartGPUChart` is kept for backward compatibility.
 * Will be removed in a future major version.
 */
export { ChartGPUChart } from './ChartGPUChart';

/**
 * @deprecated Use `ChartGPUProps` instead. `ChartGPUChartProps` is kept for backward compatibility.
 * Will be removed in a future major version.
 */
export type { ChartGPUChartProps } from './ChartGPUChart';

// Re-export chartgpu helpers (avoid colliding with our `ChartGPU` React component)
export { createChart, connectCharts } from 'chartgpu';
export { createAnnotationAuthoring } from './createAnnotationAuthoring';

// Re-export types from chartgpu for convenience
// This provides a single import point for all ChartGPU types
export type {
  // Core instance and options
  ChartGPUInstance,
  ChartGPUOptions,
  
  // Event payloads
  ChartGPUEventPayload,
  ChartGPUCrosshairMovePayload,
  
  // Annotation authoring
  AnnotationAuthoringInstance,
  AnnotationAuthoringOptions,
  AnnotationConfig,

  // Series configurations
  AreaSeriesConfig,
  LineSeriesConfig,
  BarSeriesConfig,
  PieSeriesConfig,
  ScatterSeriesConfig,
  CandlestickSeriesConfig,
  SeriesConfig,
  
  // Data types
  DataPoint,
  OHLCDataPoint,
  ScatterPointTuple,
  
  // Zoom / interaction
  DataZoomConfig,

  // Theme configuration
  ThemeConfig,
  ThemeName,
  
  // Axis and grid configurations
  AxisConfig,
  GridConfig,
} from 'chartgpu';
