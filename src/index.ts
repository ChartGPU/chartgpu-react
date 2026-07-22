/**
 * chartgpu-react
 * React bindings for ChartGPU — WebGPU-powered high-performance charts
 * Compatible with @chartgpu/chartgpu ^0.3.6
 */

// Primary ChartGPU component
export { ChartGPU } from './ChartGPU';

// Wrapper types for the ChartGPU component
export type {
  ChartGPUProps,
  ChartGPUHandle,
  ChartInstance,
  ClickParams,
  MouseOverParams,
  ZoomRange,
  CartesianSeriesData,
  InterleavedXYData,
  XYArraysData,
  ChartGPUDataAppendPayload,
  ChartGPUAppendDataOptions,
} from './types';

// useChartGPU hook
export { useChartGPU } from './useChartGPU';
export type { UseChartGPUResult } from './useChartGPU';

// Shared GPU context hook (multi-chart dashboards)
export { useGPUContext } from './useGPUContext';
export type { UseGPUContextResult } from './useGPUContext';

// Chart sync hook (connectCharts)
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
export { createChart, connectCharts } from '@chartgpu/chartgpu';
export { createAnnotationAuthoring } from './createAnnotationAuthoring';
export { createPipelineCache, destroyPipelineCache, getPipelineCacheStats } from '@chartgpu/chartgpu';

// Re-export types from @chartgpu/chartgpu for convenience
// This provides a single import point for all ChartGPU types
export type {
  // Core instance and options
  ChartGPUInstance,
  ChartGPUOptions,
  ChartGPUCreateContext,

  // Event payloads
  ChartGPUEventPayload,
  ChartGPUCrosshairMovePayload,
  ChartGPUZoomRangeChangePayload,
  ChartGPUDeviceLostPayload,
  ZoomChangeSourceKind,
  RenderMode,

  // Hit testing
  ChartGPUHitTestResult,
  ChartGPUHitTestMatch,

  // Chart sync
  ChartSyncOptions,

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
  OhlcSeriesConfig,
  HeatmapSeriesConfig,
  BandSeriesConfig,
  ErrorBarSeriesConfig,
  ImpulseSeriesConfig,
  PointCloud3DSeriesConfig,
  Surface3DSeriesConfig,
  SeriesConfig,
  SeriesType,
  SeriesSampling,

  // Style configurations
  LineStyleConfig,
  AreaStyleConfig,

  // Data types
  DataPoint,
  OHLCDataPoint,
  ScatterPointTuple,
  HeatmapData,
  HeatmapUpdate,
  BandSeriesData,
  ErrorBarSeriesData,
  PointCloud3DData,
  Surface3DGridData,
  Surface3DUpdate,

  // Zoom / interaction
  DataZoomConfig,

  // Legend
  LegendConfig,
  LegendPosition,

  // Animation
  AnimationConfig,

  // Tooltip
  TooltipConfig,
  TooltipParams,

  // Performance
  PerformanceMetrics,
  PipelineCache,
  PipelineCacheStats,

  // Theme configuration
  ThemeConfig,
  ThemeName,

  // Axis and grid configurations
  AxisConfig,
  GridConfig,
  GridLinesConfig,
  GridLinesDirectionConfig,

  // 3D
  CoordinateSystem,
  Chart3DCameraOptions,
  Interaction3DOptions,
  Axes3DOptions,
} from '@chartgpu/chartgpu';
