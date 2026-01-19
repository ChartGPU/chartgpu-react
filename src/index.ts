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
} from './types';

// useChartGPU hook (Story 6.19)
export { useChartGPU } from './useChartGPU';
export type { UseChartGPUResult } from './useChartGPU';

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

// Re-export types from chartgpu for convenience
// This provides a single import point for all ChartGPU types
export type {
  // Core instance and options
  ChartGPUInstance,
  ChartGPUOptions,
  
  // Event payloads
  ChartGPUEventPayload,
  ChartGPUCrosshairMovePayload,
  
  // Series configurations
  AreaSeriesConfig,
  LineSeriesConfig,
  BarSeriesConfig,
  PieSeriesConfig,
  ScatterSeriesConfig,
  SeriesConfig,
  
  // Data types
  DataPoint,
  
  // Theme configuration
  ThemeConfig,
  ThemeName,
  
  // Axis and grid configurations
  AxisConfig,
  GridConfig,
} from 'chartgpu';
