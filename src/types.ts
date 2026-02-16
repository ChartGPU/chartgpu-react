/**
 * Type definitions for ChartGPU React wrapper
 * Story 6.18: Wrapper types for the new ChartGPU component
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
 * Mirrors the upstream shape used by ChartGPU's `appendData(...)`.
 */
export type XYArraysData = Readonly<{
  x: ArrayLike<number>;
  y: ArrayLike<number>;
  size?: ArrayLike<number>;
}>;

/**
 * Pre-interleaved XY cartesian data as a typed array view.
 * Data must be laid out as [x0, y0, x1, y1, ...].
 *
 * Note: This is a type-level convenience for `appendData(...)`. It matches
 * ChartGPU's public behavior but is not currently exported as a named type
 * from `@chartgpu/chartgpu` due to its package `exports` map.
 */
export type InterleavedXYData = ArrayBufferView;

/**
 * Union type for cartesian series data formats supported by `appendData(...)`.
 * Mirrors the upstream `CartesianSeriesData` type used internally by ChartGPU.
 */
export type CartesianSeriesData =
  | ReadonlyArray<DataPoint>
  | XYArraysData
  | InterleavedXYData;

/**
 * Payload emitted by the ChartGPU `'dataAppend'` event.
 *
 * Note: ChartGPU emits this event in v0.2.7+ but does not currently export the
 * payload type from its package root due to its package `exports` map.
 * We provide this wrapper type so React consumers can strongly type `onDataAppend`.
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
 * This preserves backwards-compatibility for userland handlers.
 */
type BivariantCallback<T extends (...args: any[]) => any> = {
  bivarianceHack(...args: Parameters<T>): ReturnType<T>;
}['bivarianceHack'];

/**
 * Type alias for the ChartGPU instance.
 * This provides a more React-friendly name while maintaining compatibility
 * with the underlying chartgpu library.
 */
export type ChartInstance = ChartGPUInstance;

/**
 * Event parameters for chart click events.
 * Wraps the underlying ChartGPUEventPayload with a React-friendly name.
 */
export type ClickParams = ChartGPUEventPayload;

/**
 * Event parameters for chart mouseover events.
 * Wraps the underlying ChartGPUEventPayload with a React-friendly name.
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
 *
 * This component provides a declarative React wrapper around the imperative
 * ChartGPU library, handling initialization, updates, and cleanup.
 */
export interface ChartGPUProps {
  /**
   * Chart configuration options (required).
   * Note: setOption() replaces the entire options object, not partial updates.
   */
  options: ChartGPUOptions;

  /**
   * Optional shared GPU context for multi-chart dashboards (ChartGPU v0.2.7+).
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
   * Provides access to the underlying ChartGPU instance.
   *
   * @param chart - The initialized ChartGPU instance
   */
  onReady?: (chart: ChartInstance) => void;

  /**
   * Callback invoked when a chart element is clicked.
   *
   * @param params - Event payload containing click details
   */
  onClick?: (params: ClickParams) => void;

  /**
   * Callback invoked when the mouse hovers over a chart element.
   *
   * @param params - Event payload containing mouseover details
   */
  onMouseOver?: (params: MouseOverParams) => void;

  /**
   * Callback invoked when the mouse leaves a chart element.
   */
  onMouseOut?: (params: ChartGPUEventPayload) => void;

  /**
   * Callback invoked when the crosshair moves.
   *
   * @param payload - Crosshair move payload containing domain-space x and optional source
   */
  onCrosshairMove?: (payload: ChartGPUCrosshairMovePayload) => void;

  /**
   * Callback invoked when data is appended via `appendData(...)` (ChartGPU v0.2.7+).
   * Useful for coordinated streaming dashboards and cross-chart synchronization.
   */
  onDataAppend?: (payload: ChartGPUDataAppendPayload) => void;

  /**
   * Callback invoked when a shared GPU device is lost (ChartGPU v0.2.7+).
   * Most useful when using `gpuContext` to share a `GPUDevice` across charts.
   */
  onDeviceLost?: (payload: ChartGPUDeviceLostPayload) => void;

  /**
   * Callback invoked when the chart zoom range changes.
   *
   * @param range - The new zoom range with start and end values
   */
  onZoomChange?: BivariantCallback<(range: ZoomRange) => void>;
}

/**
 * Imperative handle interface for the ChartGPU component.
 *
 * Exposed via React.forwardRef to allow parent components to interact
 * directly with the chart instance using imperative methods.
 *
 * Example usage:
 * ```tsx
 * const chartRef = useRef<ChartGPUHandle>(null);
 *
 * // Later:
 * chartRef.current?.appendData(0, [{ x: 10, y: 20 }]);
 * ```
 */
export interface ChartGPUHandle {
  /**
   * Get the underlying ChartGPU instance.
   * Returns null if the chart hasn't been initialized yet or has been disposed.
   *
   * @returns The ChartGPU instance or null
   */
  getChart(): ChartGPUInstance | null;

  /**
   * Get the container element used to mount the chart.
   * Useful for wiring up helpers like `createAnnotationAuthoring(...)`.
   */
  getContainer(): HTMLDivElement | null;

  /**
   * Append new data points to an existing series.
   * This is more efficient than replacing the entire dataset.
   *
   * @param seriesIndex - Zero-based index of the series to update
   * @param newPoints - Array of data points to append
   */
  appendData(seriesIndex: number, newPoints: CartesianSeriesData | OHLCDataPoint[]): void;

  /**
   * Render a single frame (external render mode only).
   *
   * @returns true if a frame was rendered, false if already clean
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
   * Note: This replaces the full options object, not a partial update.
   *
   * @param options - New complete chart configuration
   */
  setOption(options: ChartGPUOptions): void;

  /**
   * Programmatically set the zoom range (percent-space).
   * No-op when zoom is disabled on the chart.
   *
   * @param start - Start of zoom range (0-100)
   * @param end - End of zoom range (0-100)
   */
  setZoomRange(start: number, end: number): void;

  /**
   * Programmatically drive the crosshair / tooltip to a domain-space x value.
   * Passing `null` clears the crosshair.
   *
   * @param x - Domain-space x value, or null to clear
   * @param source - Optional source identifier (useful for sync disambiguation)
   */
  setInteractionX(x: number | null, source?: unknown): void;

  /**
   * Read the current interaction x (domain units), or `null` when inactive.
   */
  getInteractionX(): number | null;

  /**
   * Perform hit-testing on a pointer or mouse event.
   * Returns coordinates and matched chart element (if any).
   *
   * @param e - Pointer or mouse event to test
   * @returns Hit-test result with coordinates and optional match
   */
  hitTest(e: PointerEvent | MouseEvent): ChartGPUHitTestResult;
}

/**
 * Re-export ThemeConfig for convenience.
 * This allows consumers to import all types from the wrapper package.
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
