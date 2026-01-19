import {
  useEffect,
  useRef,
  useImperativeHandle,
  forwardRef,
  useCallback,
} from 'react';
import { ChartGPU as ChartGPULib } from 'chartgpu';
import type {
  ChartGPUProps,
  ChartGPUHandle,
  ChartInstance,
  ClickParams,
  MouseOverParams,
} from './types';
import type { ChartGPUOptions } from 'chartgpu';

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
 * ChartGPU React component.
 *
 * A modern React wrapper for the ChartGPU library with full lifecycle management,
 * event handling, and imperative API access via ref.
 *
 * Features:
 * - Async initialization with StrictMode safety
 * - Automatic resize handling via ResizeObserver
 * - Theme support with options override
 * - Declarative event handlers
 * - Zoom change detection via polling
 * - Imperative methods via forwardRef
 *
 * Example usage:
 * ```tsx
 * const chartRef = useRef<ChartGPUHandle>(null);
 *
 * <ChartGPU
 *   ref={chartRef}
 *   options={{ series: [...], xAxis: {...}, yAxis: {...} }}
 *   theme="dark"
 *   onReady={(chart) => console.log('Chart ready:', chart)}
 *   onClick={(params) => console.log('Clicked:', params)}
 * />
 * ```
 */
export const ChartGPU = forwardRef<ChartGPUHandle, ChartGPUProps>(
  (
    {
      options,
      theme,
      style,
      className,
      onReady,
      onClick,
      onMouseOver,
      onMouseOut,
      onZoomChange,
    },
    ref
  ) => {
    const containerRef = useRef<HTMLDivElement>(null);
    const instanceRef = useRef<ChartInstance | null>(null);
    const mountedRef = useRef<boolean>(false);
    const resizeObserverRef = useRef<ResizeObserver | null>(null);
    const zoomPollIntervalRef = useRef<ReturnType<typeof setInterval> | null>(
      null
    );
    const lastZoomRangeRef = useRef<{ start: number; end: number } | null>(
      null
    );

    // Expose imperative handle
    useImperativeHandle(
      ref,
      () => ({
        getChart: () => instanceRef.current,
        appendData: (seriesIndex: number, newPoints) => {
          const instance = instanceRef.current;
          if (instance && !instance.disposed) {
            instance.appendData(seriesIndex, newPoints);
          }
        },
        setOption: (newOptions: ChartGPUOptions) => {
          const instance = instanceRef.current;
          if (instance && !instance.disposed) {
            instance.setOption(newOptions);
          }
        },
      }),
      []
    );

    // Build effective options with theme override if provided
    const getEffectiveOptions = useCallback((): ChartGPUOptions => {
      if (theme !== undefined) {
        return {
          ...options,
          theme: theme as ChartGPUOptions['theme'],
        };
      }
      return options;
    }, [options, theme]);

    // Initialize chart on mount
    useEffect(() => {
      if (!containerRef.current) return;

      mountedRef.current = true;
      let chartInstance: ChartInstance | null = null;

      const initChart = async () => {
        try {
          if (!containerRef.current) return;

          const effectiveOptions = getEffectiveOptions();
          chartInstance = await ChartGPULib.create(
            containerRef.current,
            effectiveOptions
          );

          // StrictMode safety: only update state if still mounted
          if (mountedRef.current) {
            instanceRef.current = chartInstance;
            onReady?.(chartInstance);
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
        }
      };
    }, []); // eslint-disable-line react-hooks/exhaustive-deps

    // Update chart when options or theme change
    useEffect(() => {
      const instance = instanceRef.current;
      if (!instance || instance.disposed) return;

      const effectiveOptions = getEffectiveOptions();
      instance.setOption(effectiveOptions);
    }, [options, theme, getEffectiveOptions]);

    // Register/unregister click event handler
    useEffect(() => {
      const instance = instanceRef.current;
      if (!instance || instance.disposed || !onClick) return;

      const handler = (payload: ClickParams) => {
        onClick(payload);
      };

      instance.on('click', handler);

      return () => {
        if (instance && !instance.disposed) {
          instance.off('click', handler);
        }
      };
    }, [onClick]);

    // Register/unregister mouseover event handler
    useEffect(() => {
      const instance = instanceRef.current;
      if (!instance || instance.disposed || !onMouseOver) return;

      const handler = (payload: MouseOverParams) => {
        onMouseOver(payload);
      };

      instance.on('mouseover', handler);

      return () => {
        if (instance && !instance.disposed) {
          instance.off('mouseover', handler);
        }
      };
    }, [onMouseOver]);

    // Register/unregister mouseout event handler
    useEffect(() => {
      const instance = instanceRef.current;
      if (!instance || instance.disposed || !onMouseOut) return;

      const handler = () => {
        onMouseOut();
      };

      instance.on('mouseout', handler);

      return () => {
        if (instance && !instance.disposed) {
          instance.off('mouseout', handler);
        }
      };
    }, [onMouseOut]);

    // Set up ResizeObserver for responsive sizing (debounced 100ms)
    useEffect(() => {
      const instance = instanceRef.current;
      const container = containerRef.current;
      if (!instance || instance.disposed || !container) return;

      const debouncedResize = debounce(() => {
        if (instance && !instance.disposed) {
          instance.resize();
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
    }, [instanceRef.current]); // Re-run when instance changes

    // Set up zoom change polling (100ms interval)
    useEffect(() => {
      const instance = instanceRef.current;
      if (!instance || instance.disposed || !onZoomChange) return;

      const checkZoomChange = () => {
        if (!instance || instance.disposed) return;

        const currentRange = instance.getZoomRange();
        const lastRange = lastZoomRangeRef.current;

        // Check if zoom range changed
        if (currentRange !== null) {
          if (
            lastRange === null ||
            lastRange.start !== currentRange.start ||
            lastRange.end !== currentRange.end
          ) {
            lastZoomRangeRef.current = currentRange;
            onZoomChange(currentRange);
          }
        } else {
          // Range is null (no zoom), reset last range
          if (lastRange !== null) {
            lastZoomRangeRef.current = null;
          }
        }
      };

      const intervalId = setInterval(checkZoomChange, 100);
      zoomPollIntervalRef.current = intervalId;

      // Initial check
      checkZoomChange();

      return () => {
        if (zoomPollIntervalRef.current) {
          clearInterval(zoomPollIntervalRef.current);
          zoomPollIntervalRef.current = null;
        }
        lastZoomRangeRef.current = null;
      };
    }, [onZoomChange, instanceRef.current]); // Re-run when instance or callback changes

    return (
      <div
        ref={containerRef}
        className={className}
        style={style}
      />
    );
  }
);

ChartGPU.displayName = 'ChartGPU';
