import { useEffect, useRef, useState } from 'react';
import { ChartGPU as ChartGPULib } from '@chartgpu/chartgpu';
import type { ChartGPUCreateContext, ChartGPUOptions } from '@chartgpu/chartgpu';
import type { ChartInstance } from './types';
import { debounce } from './utils';

/**
 * Result object returned by the useChartGPU hook.
 */
export interface UseChartGPUResult {
  /**
   * The ChartGPU instance once initialized, null before initialization.
   */
  chart: ChartInstance | null;

  /**
   * True when the chart has been successfully initialized and is ready to use.
   */
  isReady: boolean;

  /**
   * Error object if initialization failed or WebGPU is not supported.
   * Null when no error has occurred.
   */
  error: Error | null;
}

/**
 * React hook for managing a ChartGPU instance.
 *
 * Provides lifecycle management, automatic resize handling, and error handling
 * for ChartGPU charts in React applications.
 *
 * Features:
 * - Async initialization with StrictMode safety
 * - WebGPU support detection
 * - Automatic resize handling via ResizeObserver (debounced 100ms)
 * - Options updates via setOption
 * - Proper cleanup on unmount
 *
 * @param containerRef - React ref to the container element where the chart will be rendered
 * @param options - ChartGPU configuration options
 * @returns Object containing chart instance, ready state, and error state
 *
 * @example
 * ```tsx
 * const containerRef = useRef<HTMLDivElement>(null);
 * const { chart, isReady, error } = useChartGPU(containerRef, {
 *   series: [{ type: 'line', data: [...] }],
 *   xAxis: { type: 'linear' },
 *   yAxis: { type: 'linear' }
 * });
 *
 * if (error) return <div>WebGPU not supported</div>;
 * if (!isReady) return <div>Loading...</div>;
 *
 * return <div ref={containerRef} style={{ width: '100%', height: '400px' }} />;
 * ```
 */
export function useChartGPU(
  containerRef: React.RefObject<HTMLElement>,
  options: ChartGPUOptions,
  gpuContext?: ChartGPUCreateContext
): UseChartGPUResult {
  const [chart, setChart] = useState<ChartInstance | null>(null);
  const [error, setError] = useState<Error | null>(null);

  const mountedRef = useRef<boolean>(false);
  const gpuContextRef = useRef(gpuContext);

  // Initialize chart on mount
  useEffect(() => {
    // WebGPU support check
    if (!('gpu' in navigator)) {
      setError(new Error('WebGPU not supported in this browser'));
      return;
    }

    if (!containerRef.current) {
      return;
    }

    mountedRef.current = true;
    let chartInstance: ChartInstance | null = null;

    const initChart = async () => {
      try {
        if (!containerRef.current) return;

        const ctx = gpuContextRef.current;
        chartInstance = ctx
          ? await ChartGPULib.create(containerRef.current, options, ctx)
          : await ChartGPULib.create(containerRef.current, options);

        // StrictMode safety: only update state if still mounted
        if (mountedRef.current) {
          setChart(chartInstance);
          setError(null);
        } else {
          // Component unmounted during async create - dispose immediately
          chartInstance.dispose();
        }
      } catch (err) {
        if (mountedRef.current) {
          // Normalize error to Error instance
          const normalizedError =
            err instanceof Error ? err : new Error(String(err));
          setError(normalizedError);
        }
      }
    };

    initChart();

    // Cleanup on unmount
    return () => {
      mountedRef.current = false;

      if (chartInstance && !chartInstance.disposed) {
        chartInstance.dispose();
      }
    };
    // Intentionally omitting containerRef.current from dependencies to avoid re-initialization
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Update chart when options change
  useEffect(() => {
    if (!chart || chart.disposed) return;

    chart.setOption(options);
  }, [chart, options]);

  // Set up ResizeObserver for responsive sizing (debounced 100ms)
  useEffect(() => {
    const container = containerRef.current;
    if (!chart || chart.disposed || !container) return;

    const debouncedResize = debounce(() => {
      if (chart && !chart.disposed) {
        chart.resize();
      }
    }, 100);

    const observer = new ResizeObserver(() => {
      debouncedResize();
    });

    observer.observe(container);

    return () => {
      observer.disconnect();
    };
    // Intentionally omitting containerRef.current from dependencies
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [chart]);

  return { chart, isReady: chart !== null, error };
}
