import { useEffect, useRef, useState } from 'react';
import { ChartGPU as ChartGPULib } from 'chartgpu';
import type { ChartGPUOptions } from 'chartgpu';
import type { ChartInstance } from './types';

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
 * Debounce utility for throttling frequent calls.
 */
function debounce<T extends (...args: any[]) => void>(
  fn: T,
  delayMs: number
): (...args: Parameters<T>) => void {
  let timeoutId: ReturnType<typeof setTimeout> | null = null;
  return (...args: Parameters<T>) => {
    if (timeoutId !== null) {
      clearTimeout(timeoutId);
    }
    timeoutId = setTimeout(() => {
      fn(...args);
    }, delayMs);
  };
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
  options: ChartGPUOptions
): UseChartGPUResult {
  const [chart, setChart] = useState<ChartInstance | null>(null);
  const [isReady, setIsReady] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  const mountedRef = useRef<boolean>(false);
  const resizeObserverRef = useRef<ResizeObserver | null>(null);

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

        chartInstance = await ChartGPULib.create(
          containerRef.current,
          options
        );

        // StrictMode safety: only update state if still mounted
        if (mountedRef.current) {
          setChart(chartInstance);
          setIsReady(true);
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
          setIsReady(false);
        }
      }
    };

    initChart();

    // Cleanup on unmount
    return () => {
      mountedRef.current = false;
      setIsReady(false);

      if (chartInstance && !chartInstance.disposed) {
        chartInstance.dispose();
      }

      if (resizeObserverRef.current) {
        resizeObserverRef.current.disconnect();
        resizeObserverRef.current = null;
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
    resizeObserverRef.current = observer;

    return () => {
      observer.disconnect();
      resizeObserverRef.current = null;
    };
    // Intentionally omitting containerRef.current from dependencies
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [chart]);

  return { chart, isReady, error };
}
