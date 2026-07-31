/**
 * Type definitions for ChartGPU React wrapper.
 * Aligned with @chartgpu/chartgpu ^0.3.9.
 */

import type { CSSProperties } from 'react';
import type {
  ChartGPUOptions,
  ChartGPUInstance,
  ChartGPUEventPayload,
  ChartGPUHitTestResult,
  ChartGPUCreateContext,
  ChartGPUDeviceLostPayload,
  DataPoint,
  OHLCDataPoint,
  ChartGPUCrosshairMovePayload,
  RenderMode,
} from '@chartgpu/chartgpu';

/**
 * Separate x/y/size arrays for cartesian series data.
 * Mirrors ChartGPU's internal `XYArraysData` (not yet re-exported from package root).
 */
export type XYArraysData = Readonly<{
  x: ArrayLike<number>;
  y: ArrayLike<number>;
  size?: ArrayLike<number>;
}>;

/**
 * Pre-interleaved XY cartesian data as a typed array view.
 * Layout: [x0, y0, x1, y1, ...].
 */
export type InterleavedXYData = ArrayBufferView;

/**
 * Union type for cartesian series data formats supported by `appendData(...)`.
 * Matches ChartGPU 0.3.x (`DataPoint | null` gaps allowed in object arrays).
 */
export type CartesianSeriesData =
  | ReadonlyArray<DataPoint | null>
  | XYArraysData
  | InterleavedXYData;

/**
 * Optional second argument to `appendData` (ChartGPU 0.3.x).
 * `maxPoints` is opt-in fixed-capacity ring / FIFO window for that call only.
 */
export type ChartGPUAppendDataOptions = Readonly<{
  maxPoints?: number;
}>;

/**
 * Payload emitted by the ChartGPU `'dataAppend'` event.
 * Not re-exported from `@chartgpu/chartgpu` package root; mirrored here for React consumers.
 */
export type ChartGPUDataAppendPayload = Readonly<{
  readonly seriesIndex: number;
  readonly count: number;
  readonly xExtent: {
    readonly min: number;
    readonly max: number;
  };
}>;

/**
 * Bivariant callback helper (matches React's event handler variance behavior).
 */
type BivariantCallback<T extends (...args: never[]) => unknown> = {
  bivarianceHack(...args: Parameters<T>): ReturnType<T>;
}['bivarianceHack'];

/**
 * Type alias for the ChartGPU instance.
 */
export type ChartInstance = ChartGPUInstance;

/**
 * Event parameters for chart click events.
 */
export type ClickParams = ChartGPUEventPayload;

/**
 * Event parameters for chart mouseover events.
 */
export type MouseOverParams = ChartGPUEventPayload;

/**
 * Zoom range type derived from the upstream ChartGPU instance.
 * Note: upstream returns `null` when zoom is disabled; `onZoomChange` only
 * fires for a non-null range.
 */
export type ZoomRange = NonNullable<ReturnType<ChartGPUInstance['getZoomRange']>>;

/**
 * Props interface for the ChartGPU React component.
 */
export interface ChartGPUProps {
  /**
   * Chart configuration options (required).
   * Note: setOption() replaces the entire options object, not partial updates.
   */
  options: ChartGPUOptions;

  /**
   * Optional shared GPU context for multi-chart dashboards.
   *
   * IMPORTANT: This prop is **init-only** (only read during `ChartGPU.create(...)`).
   * Changing it after mount has no effect.
   */
  gpuContext?: ChartGPUCreateContext;

  /**
   * Optional theme configuration.
   * Matches upstream `ChartGPUOptions['theme']` (`'dark' | 'light' | ThemeConfig`).
   */
  theme?: ChartGPUOptions['theme'];

  /**
   * Optional inline styles for the chart container element.
   */
  style?: CSSProperties;

  /**
   * Optional CSS class name for the chart container element.
   */
  className?: string;

  /**
   * Callback invoked when the chart instance is ready after async initialization.
   */
  onReady?: (chart: ChartInstance) => void;

  /**
   * Callback invoked when a chart element is clicked.
   */
  onClick?: (params: ClickParams) => void;

  /**
   * Callback invoked when the mouse hovers over a chart element.
   */
  onMouseOver?: (params: MouseOverParams) => void;

  /**
   * Callback invoked when the mouse leaves a chart element.
   */
  onMouseOut?: (params: ChartGPUEventPayload) => void;

  /**
   * Callback invoked when the crosshair moves.
   */
  onCrosshairMove?: (payload: ChartGPUCrosshairMovePayload) => void;

  /**
   * Callback invoked when data is appended via `appendData(...)`.
   */
  onDataAppend?: (payload: ChartGPUDataAppendPayload) => void;

  /**
   * Callback invoked when a shared GPU device is lost.
   * Most useful when using `gpuContext` to share a `GPUDevice` across charts.
   */
  onDeviceLost?: (payload: ChartGPUDeviceLostPayload) => void;

  /**
   * Callback invoked when the chart zoom range changes.
   */
  onZoomChange?: BivariantCallback<(range: ZoomRange) => void>;
}

/**
 * Imperative handle interface for the ChartGPU component.
 *
 * Example:
 * ```tsx
 * const chartRef = useRef<ChartGPUHandle>(null);
 * chartRef.current?.appendData(0, newPoints, { maxPoints: 50_000 });
 * ```
 */
export interface ChartGPUHandle {
  /**
   * Get the underlying ChartGPU instance.
   * Returns null if the chart hasn't been initialized yet or has been disposed.
   */
  getChart(): ChartGPUInstance | null;

  /**
   * Get the container element used to mount the chart.
   */
  getContainer(): HTMLDivElement | null;

  /**
   * Append new data points to an existing series.
   * Prefer `{ maxPoints }` for FIFO / streaming windows over sliding-window `setOption`.
   */
  appendData(
    seriesIndex: number,
    newPoints: CartesianSeriesData | OHLCDataPoint[],
    options?: ChartGPUAppendDataOptions
  ): void;

  /**
   * Render a single frame (external render mode only).
   */
  renderFrame(): boolean;

  /**
   * Check if the chart needs rendering (has pending changes).
   */
  needsRender(): boolean;

  /**
   * Get the current render mode.
   */
  getRenderMode(): RenderMode;

  /**
   * Set the render mode.
   */
  setRenderMode(mode: RenderMode): void;

  /**
   * Replace the entire chart options.
   */
  setOption(options: ChartGPUOptions): void;

  /**
   * Programmatically set the zoom range (percent-space).
   * No-op when zoom is disabled on the chart.
   */
  setZoomRange(start: number, end: number, source?: unknown): void;

  /**
   * Programmatically drive the crosshair / tooltip to a domain-space x value.
   * Passing `null` clears the crosshair.
   */
  setInteractionX(x: number | null, source?: unknown): void;

  /**
   * Read the current interaction x (domain units), or `null` when inactive.
   */
  getInteractionX(): number | null;

  /**
   * Perform hit-testing on a pointer or mouse event.
   */
  hitTest(e: PointerEvent | MouseEvent): ChartGPUHitTestResult;
}

/**
 * Re-export common core types for convenience.
 */
export type {
  ThemeConfig,
  ChartGPUOptions,
  ChartGPUEventPayload,
  ChartGPUCrosshairMovePayload,
  ChartGPUCreateContext,
  ChartGPUDeviceLostPayload,
  DataPoint,
  OHLCDataPoint,
  RenderMode,
} from '@chartgpu/chartgpu';
