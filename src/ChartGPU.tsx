import {
  useEffect,
  useRef,
  useState,
  useImperativeHandle,
  forwardRef,
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
import { debounce } from './utils';

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
      gpuContext,
      theme,
      style,
      className,
      onReady,
      onClick,
      onMouseOver,
      onMouseOut,
      onCrosshairMove,
      onDataAppend,
      onDeviceLost,
      onZoomChange,
    },
    ref
  ) => {
    const containerRef = useRef<HTMLDivElement>(null);
    const instanceRef = useRef<ChartInstance | null>(null);
    const [chart, setChart] = useState<ChartInstance | null>(null);
    const mountedRef = useRef<boolean>(false);
    const gpuContextRef = useRef(gpuContext);

    // --- Callback refs: keep handlers in refs so effects never re-subscribe ---
    const onReadyRef = useRef(onReady);
    onReadyRef.current = onReady;

    const onClickRef = useRef(onClick);
    onClickRef.current = onClick;

    const onMouseOverRef = useRef(onMouseOver);
    onMouseOverRef.current = onMouseOver;

    const onMouseOutRef = useRef(onMouseOut);
    onMouseOutRef.current = onMouseOut;

    const onCrosshairMoveRef = useRef(onCrosshairMove);
    onCrosshairMoveRef.current = onCrosshairMove;

    const onDataAppendRef = useRef(onDataAppend);
    onDataAppendRef.current = onDataAppend;

    const onDeviceLostRef = useRef(onDeviceLost);
    onDeviceLostRef.current = onDeviceLost;

    const onZoomChangeRef = useRef(onZoomChange);
    onZoomChangeRef.current = onZoomChange;

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
        renderFrame: () => {
          const instance = instanceRef.current;
          if (instance && !instance.disposed) {
            return instance.renderFrame();
          }
          return false;
        },
        needsRender: () => {
          const instance = instanceRef.current;
          if (instance && !instance.disposed) {
            return instance.needsRender();
          }
          return false;
        },
        getRenderMode: () => {
          const instance = instanceRef.current;
          if (instance && !instance.disposed) {
            return instance.getRenderMode();
          }
          return 'auto';
        },
        setRenderMode: (mode) => {
          const instance = instanceRef.current;
          if (instance && !instance.disposed) {
            instance.setRenderMode(mode);
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

    // Initialize chart on mount
    useEffect(() => {
      if (!containerRef.current) return;

      mountedRef.current = true;
      let chartInstance: ChartInstance | null = null;

      const initChart = async () => {
        try {
          if (!containerRef.current) return;

          const effectiveOptions = theme !== undefined ? { ...options, theme } : options;
          const ctx = gpuContextRef.current;
          chartInstance = ctx
            ? await ChartGPULib.create(containerRef.current, effectiveOptions, ctx)
            : await ChartGPULib.create(containerRef.current, effectiveOptions);

          // StrictMode safety: only update state if still mounted
          if (mountedRef.current) {
            instanceRef.current = chartInstance;
            setChart(chartInstance);
            onReadyRef.current?.(chartInstance);
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

      const effectiveOptions = theme !== undefined ? { ...options, theme } : options;
      instance.setOption(effectiveOptions);
    }, [chart, options, theme]);

    // Register/unregister click event handler
    useEffect(() => {
      const instance = chart;
      if (!instance || instance.disposed) return;

      const handler = (payload: ClickParams) => {
        onClickRef.current?.(payload);
      };

      instance.on('click', handler);

      return () => {
        try {
          instance.off('click', handler);
        } catch {
          // instance may already be disposed; swallow
        }
      };
    }, [chart]);

    // Register/unregister mouseover event handler
    useEffect(() => {
      const instance = chart;
      if (!instance || instance.disposed) return;

      const handler = (payload: MouseOverParams) => {
        onMouseOverRef.current?.(payload);
      };

      instance.on('mouseover', handler);

      return () => {
        try {
          instance.off('mouseover', handler);
        } catch {
          // instance may already be disposed; swallow
        }
      };
    }, [chart]);

    // Register/unregister mouseout event handler
    useEffect(() => {
      const instance = chart;
      if (!instance || instance.disposed) return;

      const handler = (payload: ClickParams) => {
        onMouseOutRef.current?.(payload);
      };

      instance.on('mouseout', handler);

      return () => {
        try {
          instance.off('mouseout', handler);
        } catch {
          // instance may already be disposed; swallow
        }
      };
    }, [chart]);

    // Register/unregister crosshairMove event handler
    useEffect(() => {
      const instance = chart;
      if (!instance || instance.disposed) return;

      const handler = (payload: Parameters<NonNullable<ChartGPUProps['onCrosshairMove']>>[0]) => {
        onCrosshairMoveRef.current?.(payload);
      };

      instance.on('crosshairMove', handler);

      return () => {
        try {
          instance.off('crosshairMove', handler);
        } catch {
          // instance may already be disposed; swallow
        }
      };
    }, [chart]);

    // Register/unregister dataAppend event handler
    useEffect(() => {
      const instance = chart;
      if (!instance || instance.disposed) return;

      const handler = (payload: Parameters<NonNullable<ChartGPUProps['onDataAppend']>>[0]) => {
        onDataAppendRef.current?.(payload);
      };

      instance.on('dataAppend', handler);

      return () => {
        try {
          instance.off('dataAppend', handler);
        } catch {
          // instance may already be disposed; swallow
        }
      };
    }, [chart]);

    // Register/unregister deviceLost event handler
    useEffect(() => {
      const instance = chart;
      if (!instance || instance.disposed) return;

      const handler = (payload: Parameters<NonNullable<ChartGPUProps['onDeviceLost']>>[0]) => {
        onDeviceLostRef.current?.(payload);
      };

      instance.on('deviceLost', handler);

      return () => {
        try {
          instance.off('deviceLost', handler);
        } catch {
          // instance may already be disposed; swallow
        }
      };
    }, [chart]);

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

      return () => {
        observer.disconnect();
      };
      // Intentionally omitting containerRef.current from dependencies
      // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [chart]); // Re-run when instance changes

    // Register/unregister zoomRangeChange event handler.
    // Also emits the current zoom range once on subscribe (initial hydration)
    // so consumers don't need to wait for user interaction to receive the first value.
    useEffect(() => {
      const instance = chart;
      if (!instance || instance.disposed) return;

      const handler = (payload: ChartGPUZoomRangeChangePayload) => {
        // Map upstream payload to ZoomRange (strip `source`)
        onZoomChangeRef.current?.({ start: payload.start, end: payload.end });
      };

      instance.on('zoomRangeChange', handler);

      // Hydrate: fire once with the current zoom range (if non-null)
      const current = instance.getZoomRange();
      if (current) {
        onZoomChangeRef.current?.({ start: current.start, end: current.end });
      }

      return () => {
        try {
          instance.off('zoomRangeChange', handler);
        } catch {
          // instance may already be disposed; swallow
        }
      };
    }, [chart]);

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
