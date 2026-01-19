/**
 * Type definitions for ChartGPU React wrapper
 * Story 6.18: Wrapper types for the new ChartGPU component
 */

import type { CSSProperties } from 'react';
import type {
  ChartGPUOptions,
  ChartGPUInstance,
  ChartGPUEventPayload,
  ThemeConfig,
  DataPoint,
} from 'chartgpu';

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
   * Optional theme configuration.
   * Can be either a string identifier or a full ThemeConfig object.
   */
  theme?: string | ThemeConfig;

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
  onMouseOut?: () => void;

  /**
   * Callback invoked when the chart zoom range changes.
   *
   * @param range - The new zoom range with start and end values
   */
  onZoomChange?: (range: { start: number; end: number }) => void;
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
   * Append new data points to an existing series.
   * This is more efficient than replacing the entire dataset.
   *
   * @param seriesIndex - Zero-based index of the series to update
   * @param newPoints - Array of data points to append
   */
  appendData(seriesIndex: number, newPoints: DataPoint[]): void;

  /**
   * Replace the entire chart options.
   * Note: This replaces the full options object, not a partial update.
   *
   * @param options - New complete chart configuration
   */
  setOption(options: ChartGPUOptions): void;
}

/**
 * Re-export ThemeConfig for convenience.
 * This allows consumers to import all types from the wrapper package.
 */
export type { ThemeConfig, ChartGPUOptions, DataPoint } from 'chartgpu';
