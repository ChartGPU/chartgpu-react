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
 * - Call `useGPUContext()` once in a parent component.
 * - Pass `{ adapter, device, pipelineCache }` to each `<ChartGPU gpuContext={...} />`
 *   or to `useChartGPU(containerRef, options, gpuContext)`.
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

  // StrictMode safety: avoid double-initializing in dev (effect is invoked twice).
  const startedRef = useRef(false);

  useEffect(() => {
    if (startedRef.current) return;
    startedRef.current = true;

    let cancelled = false;

    const init = async () => {
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

        if (cancelled) return;

        setState({ adapter: nextAdapter, device: nextDevice, pipelineCache: nextCache, error: null });
      } catch (err) {
        if (cancelled) return;
        const normalized = err instanceof Error ? err : new Error(String(err));
        setState({ adapter: null, device: null, pipelineCache: null, error: normalized });
      }
    };

    init();

    return () => {
      cancelled = true;
    };
  }, []);

  return {
    ...state,
    isReady: state.adapter !== null && state.device !== null,
  };
}

