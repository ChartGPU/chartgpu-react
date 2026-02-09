import { useEffect, useRef } from 'react';
import type { CSSProperties } from 'react';
import type { ChartGPUOptions, ChartGPUInstance } from 'chartgpu';
import { ChartGPU } from './ChartGPU';

export interface ChartGPUChartProps {
  /**
   * Chart configuration options
   */
  options: ChartGPUOptions;

  /**
   * Optional CSS class name for the container
   */
  className?: string;

  /**
   * Optional inline styles for the container
   */
  style?: CSSProperties;

  /**
   * Optional callback when chart instance is created
   */
  onInit?: (instance: ChartGPUInstance) => void;

  /**
   * Optional callback when chart instance is disposed
   */
  onDispose?: () => void;
}

/**
 * React wrapper for ChartGPU.
 *
 * This component handles:
 * - Async chart creation on mount
 * - Safe disposal on unmount (prevents state updates after unmount)
 * - Options updates via setOption() when props change
 * - Automatic resize handling
 *
 * Example usage:
 * ```tsx
 * <ChartGPUChart
 *   options={{
 *     series: [
 *       {
 *         type: 'line',
 *         data: [
 *           { x: 0, y: 0 },
 *           { x: 1, y: 1 },
 *           { x: 2, y: 4 },
 *         ],
 *       },
 *     ],
 *   }}
 *   style={{ width: '100%', height: '400px' }}
 * />
 * ```
 */
/**
 * @deprecated Use `ChartGPU` instead. `ChartGPUChart` is kept for backward compatibility.
 * Will be removed in a future major version.
 */
export function ChartGPUChart({
  options,
  className,
  style,
  onInit,
  onDispose,
}: ChartGPUChartProps): JSX.Element {
  const didInitRef = useRef(false);

  useEffect(() => {
    return () => {
      if (didInitRef.current) {
        onDispose?.();
      }
    };
  }, [onDispose]);

  return (
    <ChartGPU
      className={className}
      style={{
        position: 'relative',
        width: '100%',
        height: '400px',
        ...style,
      }}
      options={options}
      onReady={(instance: ChartGPUInstance) => {
        didInitRef.current = true;
        onInit?.(instance);
      }}
    />
  );
}
