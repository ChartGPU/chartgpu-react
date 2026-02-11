import {
  useEffect,
  useRef,
  useState,
  useImperativeHandle,
  forwardRef,
  useCallback,
} from 'react';
import { ChartGPU as ChartGPULib } from '@chartgpu/chartgpu';
import type {
  ChartGPUProps,
  ChartGPUHandle,
  ChartInstance,
  ClickParams,
  MouseOverParams,
} from './types';
import type { ChartGPUOptions, ChartGPUZoomRangeChangePayload } from '@chartgpu/chartgpu';

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
 * - Zoom change detection via event subscription
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
      onCrosshairMove,
      onZoomChange,
    },
    ref
  ) => {
    const containerRef = useRef<HTMLDivElement>(null);
    const instanceRef = useRef<ChartInstance | null>(null);
    const [chart, setChart] = useState<ChartInstance | null>(null);
    const mountedRef = useRef<boolean>(false);
    const resizeObserverRef = useRef<ResizeObserver | null>(null);

    // Expose imperative handle
    useImperativeHandle(
      ref,
      () => ({
        getChart: () => instanceRef.current,
        getContainer: () => containerRef.current,
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
        setZoomRange: (start: number, end: number) => {
          const instance = instanceRef.current;
          if (instance && !instance.disposed) {
            instance.setZoomRange(start, end);
          }
        },
        setInteractionX: (x: number | null, source?: unknown) => {
          const instance = instanceRef.current;
          if (instance && !instance.disposed) {
            instance.setInteractionX(x, source);
          }
        },
        getInteractionX: () => {
          const instance = instanceRef.current;
          if (instance && !instance.disposed) {
            return instance.getInteractionX();
          }
          return null;
        },
        hitTest: (e: PointerEvent | MouseEvent) => {
          const instance = instanceRef.current;
          if (!instance || instance.disposed) {
            return {
              isInGrid: false,
              canvasX: NaN,
              canvasY: NaN,
              gridX: NaN,
              gridY: NaN,
              match: null,
            };
          }
          return instance.hitTest(e);
        },
      }),
      []
    );

    // Build effective options with theme override if provided
    const getEffectiveOptions = useCallback((): ChartGPUOptions => {
      if (theme !== undefined) {
        return {
          ...options,
          theme,
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
            setChart(chartInstance);
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
        setChart(null);
      };
    }, []); // eslint-disable-line react-hooks/exhaustive-deps

    // Update chart when options or theme change
    useEffect(() => {
      const instance = chart;
      if (!instance || instance.disposed) return;

      const effectiveOptions = getEffectiveOptions();
      instance.setOption(effectiveOptions);
    }, [chart, options, theme, getEffectiveOptions]);

    // Register/unregister click event handler
    useEffect(() => {
      const instance = chart;
      if (!instance || instance.disposed || !onClick) return;

      const handler = (payload: ClickParams) => {
        onClick(payload);
      };

      instance.on('click', handler);

      return () => {
        try {
          instance.off('click', handler);
        } catch {
          // instance may already be disposed; swallow
        }
      };
    }, [chart, onClick]);

    // Register/unregister mouseover event handler
    useEffect(() => {
      const instance = chart;
      if (!instance || instance.disposed || !onMouseOver) return;

      const handler = (payload: MouseOverParams) => {
        onMouseOver(payload);
      };

      instance.on('mouseover', handler);

      return () => {
        try {
          instance.off('mouseover', handler);
        } catch {
          // instance may already be disposed; swallow
        }
      };
    }, [chart, onMouseOver]);

    // Register/unregister mouseout event handler
    useEffect(() => {
      const instance = chart;
      if (!instance || instance.disposed || !onMouseOut) return;

      const handler = (payload: ClickParams) => {
        onMouseOut(payload);
      };

      instance.on('mouseout', handler);

      return () => {
        try {
          instance.off('mouseout', handler);
        } catch {
          // instance may already be disposed; swallow
        }
      };
    }, [chart, onMouseOut]);

    // Register/unregister crosshairMove event handler
    useEffect(() => {
      const instance = chart;
      if (!instance || instance.disposed || !onCrosshairMove) return;

      const handler = (payload: Parameters<NonNullable<ChartGPUProps['onCrosshairMove']>>[0]) => {
        onCrosshairMove(payload);
      };

      instance.on('crosshairMove', handler);

      return () => {
        try {
          instance.off('crosshairMove', handler);
        } catch {
          // instance may already be disposed; swallow
        }
      };
    }, [chart, onCrosshairMove]);

    // Set up ResizeObserver for responsive sizing (debounced 100ms)
    useEffect(() => {
      const instance = chart;
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
      // Intentionally omitting containerRef.current from dependencies
      // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [chart]); // Re-run when instance changes

    // Register/unregister zoomRangeChange event handler.
    // Also emits the current zoom range once on subscribe (initial hydration)
    // so consumers don't need to wait for user interaction to receive the first value.
    useEffect(() => {
      const instance = chart;
      if (!instance || instance.disposed || !onZoomChange) return;

      const handler = (payload: ChartGPUZoomRangeChangePayload) => {
        // Map upstream payload to ZoomRange (strip `source`)
        onZoomChange({ start: payload.start, end: payload.end });
      };

      instance.on('zoomRangeChange', handler);

      // Hydrate: fire once with the current zoom range (if non-null)
      const current = instance.getZoomRange();
      if (current) {
        onZoomChange({ start: current.start, end: current.end });
      }

      return () => {
        try {
          instance.off('zoomRangeChange', handler);
        } catch {
          // instance may already be disposed; swallow
        }
      };
    }, [chart, onZoomChange]);

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
