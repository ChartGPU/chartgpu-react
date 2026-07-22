import { useCallback, useEffect, useMemo, useRef, type CSSProperties, type ReactElement } from 'react';
import type { ChartGPUOptions, ChartGPUInstance } from '@chartgpu/chartgpu';
import { ChartGPU } from './ChartGPU';

const DEFAULT_STYLE: CSSProperties = {
  position: 'relative',
  width: '100%',
  height: '400px',
};

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
}: ChartGPUChartProps): ReactElement {
  const didInitRef = useRef(false);

  const onInitRef = useRef(onInit);
  onInitRef.current = onInit;

  const handleReady = useCallback((instance: ChartGPUInstance) => {
    didInitRef.current = true;
    onInitRef.current?.(instance);
  }, []);

  const mergedStyle = useMemo(
    () => (style ? { ...DEFAULT_STYLE, ...style } : DEFAULT_STYLE),
    [style]
  );

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
      style={mergedStyle}
      options={options}
      onReady={handleReady}
    />
  );
}
