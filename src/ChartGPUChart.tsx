import { useEffect, useRef, useCallback } from 'react';
import type { CSSProperties } from 'react';
import { ChartGPU } from 'chartgpu';
import type { ChartGPUOptions, ChartGPUInstance } from 'chartgpu';

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
export function ChartGPUChart({
  options,
  className,
  style,
  onInit,
  onDispose,
}: ChartGPUChartProps): JSX.Element {
  const containerRef = useRef<HTMLDivElement>(null);
  const instanceRef = useRef<ChartGPUInstance | null>(null);
  const mountedRef = useRef<boolean>(false);

  // Initialize chart on mount
  useEffect(() => {
    if (!containerRef.current) return;

    mountedRef.current = true;
    let chartInstance: ChartGPUInstance | null = null;

    const initChart = async () => {
      try {
        if (!containerRef.current) return;

        // Create ChartGPU instance
        chartInstance = await ChartGPU.create(containerRef.current, options);

        // Only update state if still mounted
        if (mountedRef.current) {
          instanceRef.current = chartInstance;
          onInit?.(chartInstance);
        } else {
          // Component unmounted during async create - dispose immediately
          chartInstance.dispose();
        }
      } catch (error) {
        if (mountedRef.current) {
          console.error('Failed to create ChartGPU instance:', error);
        }
      }
    };

    initChart();

    // Cleanup on unmount
    return () => {
      mountedRef.current = false;

      if (instanceRef.current && !instanceRef.current.disposed) {
        instanceRef.current.dispose();
        instanceRef.current = null;
        onDispose?.();
      }
    };
  }, []); // Empty deps - only run on mount/unmount

  // Update chart options when they change
  useEffect(() => {
    const instance = instanceRef.current;
    if (!instance || instance.disposed) return;

    // setOption will trigger a re-render internally
    instance.setOption(options);
  }, [options]);

  // Handle window resize
  const handleResize = useCallback(() => {
    const instance = instanceRef.current;
    if (!instance || instance.disposed) return;
    instance.resize();
  }, []);

  useEffect(() => {
    window.addEventListener('resize', handleResize);
    return () => {
      window.removeEventListener('resize', handleResize);
    };
  }, [handleResize]);

  return (
    <div
      ref={containerRef}
      className={className}
      style={{
        position: 'relative',
        width: '100%',
        height: '400px',
        ...style,
      }}
    />
  );
}
