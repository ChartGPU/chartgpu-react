/**
 * Tests for useGPUContext — shared adapter/device + pipeline cache init paths.
 * Stubs navigator.gpu; never requires a real WebGPU device.
 */

import { StrictMode } from 'react';
import { renderHook, waitFor, act } from '@testing-library/react';
import { vi, describe, it, expect, beforeEach, afterEach } from 'vitest';
import { useGPUContext } from '../useGPUContext';

// ---------------------------------------------------------------------------
// Mock @chartgpu/chartgpu
// ---------------------------------------------------------------------------

const mockCreatePipelineCache = vi.fn();

vi.mock('@chartgpu/chartgpu', () => {
  return {
    createPipelineCache: (...args: unknown[]) => mockCreatePipelineCache(...args),
  };
});

// ---------------------------------------------------------------------------
// GPU stubs
// ---------------------------------------------------------------------------

const originalGpuDescriptor = Object.getOwnPropertyDescriptor(navigator, 'gpu');

function stubGpu(gpu: unknown) {
  Object.defineProperty(navigator, 'gpu', {
    value: gpu,
    configurable: true,
    writable: true,
  });
}

function restoreGpu() {
  if (originalGpuDescriptor) {
    Object.defineProperty(navigator, 'gpu', originalGpuDescriptor);
  } else {
    // setup.ts installs a default stub; reinstall empty object if needed
    Object.defineProperty(navigator, 'gpu', {
      value: {},
      configurable: true,
      writable: true,
    });
  }
}

// ---------------------------------------------------------------------------
// Setup
// ---------------------------------------------------------------------------

beforeEach(() => {
  vi.clearAllMocks();
  mockCreatePipelineCache.mockReturnValue({ id: 'pipeline-cache' });
});

afterEach(() => {
  restoreGpu();
});

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe('useGPUContext', () => {
  it('happy path: acquires adapter/device/cache and sets isReady', async () => {
    const adapter = {
      requestDevice: vi.fn(async () => ({ id: 'device' })),
    };
    const requestAdapter = vi.fn(async () => adapter);
    stubGpu({ requestAdapter });

    const { result } = renderHook(() => useGPUContext());

    await waitFor(() => {
      expect(result.current.isReady).toBe(true);
    });

    expect(result.current.error).toBeNull();
    expect(result.current.adapter).toBe(adapter);
    expect(result.current.device).toEqual({ id: 'device' });
    expect(result.current.pipelineCache).toEqual({ id: 'pipeline-cache' });
    expect(requestAdapter).toHaveBeenCalledWith({ powerPreference: 'high-performance' });
    expect(adapter.requestDevice).toHaveBeenCalledTimes(1);
    expect(mockCreatePipelineCache).toHaveBeenCalledTimes(1);
    expect(mockCreatePipelineCache).toHaveBeenCalledWith({ id: 'device' });
  });

  it('sets a WebGPU error when navigator.gpu is absent', async () => {
    stubGpu(undefined);

    const { result } = renderHook(() => useGPUContext());

    await waitFor(() => {
      expect(result.current.error).not.toBeNull();
    });

    expect(result.current.error!.message).toMatch(/WebGPU/i);
    expect(result.current.isReady).toBe(false);
    expect(result.current.adapter).toBeNull();
    expect(result.current.device).toBeNull();
    expect(result.current.pipelineCache).toBeNull();
    expect(mockCreatePipelineCache).not.toHaveBeenCalled();
  });

  it('errors when requestAdapter resolves null', async () => {
    const requestAdapter = vi.fn(async () => null);
    stubGpu({ requestAdapter });

    const { result } = renderHook(() => useGPUContext());

    await waitFor(() => {
      expect(result.current.error).not.toBeNull();
    });

    expect(result.current.error!.message).toBe('Failed to acquire GPUAdapter');
    expect(result.current.isReady).toBe(false);
    expect(result.current.adapter).toBeNull();
    expect(mockCreatePipelineCache).not.toHaveBeenCalled();
  });

  it('cancels state updates when unmounted mid-init', async () => {
    let resolveAdapter: (value: unknown) => void;
    const adapterPromise = new Promise((resolve) => {
      resolveAdapter = resolve;
    });
    const requestDevice = vi.fn(async () => ({ id: 'device-late' }));
    const requestAdapter = vi.fn(() => adapterPromise);
    stubGpu({ requestAdapter });

    const consoleError = vi.spyOn(console, 'error').mockImplementation(() => {});

    const { result, unmount } = renderHook(() => useGPUContext());

    // Still pending — no ready state yet.
    expect(result.current.isReady).toBe(false);
    expect(result.current.error).toBeNull();

    unmount();

    // Resolve after unmount; init continues but setState must be gated by cancelled.
    await act(async () => {
      resolveAdapter!({ requestDevice });
    });

    // Flush the full async chain (requestDevice → createPipelineCache → .then).
    await waitFor(() => {
      expect(requestDevice).toHaveBeenCalledTimes(1);
      expect(mockCreatePipelineCache).toHaveBeenCalledTimes(1);
    });

    // Allow any remaining microtasks/macrotasks from the .then handler to settle.
    await act(async () => {
      await Promise.resolve();
    });

    // State must remain frozen at pre-init defaults — proves cancelled path ran.
    expect(result.current.isReady).toBe(false);
    expect(result.current.error).toBeNull();
    expect(result.current.adapter).toBeNull();
    expect(result.current.device).toBeNull();
    expect(result.current.pipelineCache).toBeNull();

    // React must not warn about setState on an unmounted component.
    const stateUpdateWarnings = consoleError.mock.calls.filter((args) =>
      args.some(
        (a) =>
          typeof a === 'string' &&
          (/unmounted|Can't perform a React state update|memory leak/i.test(a) ||
            /not mounted/i.test(a))
      )
    );
    expect(stateUpdateWarnings).toHaveLength(0);
    consoleError.mockRestore();
  });

  it('StrictMode double effect initializes only once (shared init promise)', async () => {
    const adapter = {
      requestDevice: vi.fn(async () => ({ id: 'device' })),
    };
    const requestAdapter = vi.fn(async () => adapter);
    stubGpu({ requestAdapter });

    const { result } = renderHook(() => useGPUContext(), {
      // React 18/19 StrictMode double-invokes effects in development.
      wrapper: ({ children }) => <StrictMode>{children}</StrictMode>,
    });

    await waitFor(() => {
      expect(result.current.isReady).toBe(true);
    });

    expect(requestAdapter).toHaveBeenCalledTimes(1);
    expect(mockCreatePipelineCache).toHaveBeenCalledTimes(1);
  });
});
