import { useEffect, useRef, useState } from 'react';
import { createPipelineCache } from '@chartgpu/chartgpu';
import type { ChartGPUCreateContext, PipelineCache } from '@chartgpu/chartgpu';

export interface UseGPUContextResult {
  adapter: ChartGPUCreateContext['adapter'] | null;
  device: ChartGPUCreateContext['device'] | null;
  pipelineCache: PipelineCache | null;
  isReady: boolean;
  error: Error | null;
}

/**
 * Convenience hook for creating a shared WebGPU adapter/device + ChartGPU pipeline cache.
 *
 * Intended for multi-chart dashboards (ChartGPU v0.2.7+), where multiple charts share a
 * single `GPUDevice` and optional `PipelineCache` to reduce shader/pipeline compilation overhead.
 *
 * Usage:
 * - Call `useGPUContext()` once in a **long-lived** parent component.
 * - Pass `{ adapter, device, pipelineCache }` to each `<ChartGPU gpuContext={...} />`
 *   or to `useChartGPU(containerRef, options, gpuContext)`.
 *
 * StrictMode: init is deduped via a shared in-flight/completed promise (single
 * `requestAdapter` / `requestDevice` / `createPipelineCache` per hook instance).
 *
 * Lifecycle: does **not** destroy the `GPUDevice` or pipeline cache on unmount.
 * Auto-destroy would race with StrictMode remount (same promise is re-subscribed).
 * Keep this hook mounted for the shared charts’ process lifetime.
 */
interface GPUContextState {
  adapter: ChartGPUCreateContext['adapter'] | null;
  device: ChartGPUCreateContext['device'] | null;
  pipelineCache: PipelineCache | null;
  error: Error | null;
}

export function useGPUContext(): UseGPUContextResult {
  const [state, setState] = useState<GPUContextState>({
    adapter: null,
    device: null,
    pipelineCache: null,
    error: null,
  });

  // StrictMode safety: start GPU init at most once per hook instance.
  // The promise is shared so a remount (StrictMode: effect → cleanup → effect)
  // reuses the same in-flight/completed init instead of requesting a second device.
  const initPromiseRef = useRef<Promise<GPUContextState> | null>(null);

  useEffect(() => {
    let cancelled = false;

    if (!initPromiseRef.current) {
      initPromiseRef.current = (async (): Promise<GPUContextState> => {
        try {
          const gpu = (navigator as unknown as { gpu?: any }).gpu;
          if (!gpu) {
            throw new Error('WebGPU not supported in this browser');
          }

          const nextAdapter = await gpu.requestAdapter({
            powerPreference: 'high-performance',
          });
          if (!nextAdapter) {
            throw new Error('Failed to acquire GPUAdapter');
          }

          const nextDevice = await nextAdapter.requestDevice();
          const nextCache = createPipelineCache(nextDevice);

          return {
            adapter: nextAdapter,
            device: nextDevice,
            pipelineCache: nextCache,
            error: null,
          };
        } catch (err) {
          const normalized = err instanceof Error ? err : new Error(String(err));
          return {
            adapter: null,
            device: null,
            pipelineCache: null,
            error: normalized,
          };
        }
      })();
    }

    initPromiseRef.current.then((next) => {
      if (cancelled) return;
      setState(next);
    });

    return () => {
      cancelled = true;
    };
  }, []);

  return {
    ...state,
    isReady: state.adapter !== null && state.device !== null,
  };
}

