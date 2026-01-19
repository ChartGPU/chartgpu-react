/**
 * chartgpu-react
 * React bindings for ChartGPU - WebGPU-powered charting library
 */

export { ChartGPUChart } from './ChartGPUChart';
export type { ChartGPUChartProps } from './ChartGPUChart';

// Re-export types from chartgpu for convenience
export type {
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
} from 'chartgpu';
