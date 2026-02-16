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
export function useGPUContext(): UseGPUContextResult {
  const [adapter, setAdapter] = useState<ChartGPUCreateContext['adapter'] | null>(null);
  const [device, setDevice] = useState<ChartGPUCreateContext['device'] | null>(null);
  const [pipelineCache, setPipelineCache] = useState<PipelineCache | null>(null);
  const [error, setError] = useState<Error | null>(null);

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

        setAdapter(nextAdapter);
        setDevice(nextDevice);
        setPipelineCache(nextCache);
        setError(null);
      } catch (err) {
        if (cancelled) return;
        const normalized = err instanceof Error ? err : new Error(String(err));
        setError(normalized);
        setAdapter(null);
        setDevice(null);
        setPipelineCache(null);
      }
    };

    init();

    return () => {
      cancelled = true;
    };
  }, []);

  return {
    adapter,
    device,
    pipelineCache,
    isReady: adapter !== null && device !== null,
    error,
  };
}

