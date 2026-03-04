/**
 * Tests for useChartGPU.ts — verifying the createdWithOptionsRef race-condition fix.
 *
 * The fix: ChartGPU.create() is async. When it resolves, React schedules a
 * setOption effect. Without the fix, that effect would redundantly call
 * setOption(options) even though create() already initialised with those
 * options, potentially crashing during the internal init sequence.
 *
 * createdWithOptionsRef is set before the async create call. The first
 * post-create invocation of the setOption effect is unconditionally skipped
 * (issue #16) to avoid racing with internal async initialization.
 */

import { renderHook, act, waitFor } from '@testing-library/react';
import { vi, describe, it, expect, beforeEach } from 'vitest';
import { useRef } from 'react';
import { useChartGPU } from '../useChartGPU';
import type { ChartGPUOptions } from '@chartgpu/chartgpu';

// ---------------------------------------------------------------------------
// Mock @chartgpu/chartgpu
// ---------------------------------------------------------------------------

function makeMockInstance() {
  return {
    disposed: false,
    dispose: vi.fn(function (this: { disposed: boolean }) {
      this.disposed = true;
    }),
    setOption: vi.fn(),
    resize: vi.fn(),
    on: vi.fn(),
    off: vi.fn(),
    getZoomRange: vi.fn(() => null),
    appendData: vi.fn(),
    renderFrame: vi.fn(() => false),
    needsRender: vi.fn(() => false),
    getRenderMode: vi.fn(() => 'auto' as const),
    setRenderMode: vi.fn(),
    setZoomRange: vi.fn(),
    setInteractionX: vi.fn(),
    getInteractionX: vi.fn(() => null),
    hitTest: vi.fn(),
  };
}

let mockInstance: ReturnType<typeof makeMockInstance>;

vi.mock('@chartgpu/chartgpu', () => {
  return {
    ChartGPU: {
      create: vi.fn(),
    },
  };
});

import { ChartGPU as ChartGPULib } from '@chartgpu/chartgpu';

const mockCreate = vi.mocked(ChartGPULib.create);

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function makeOptions(label = 'a'): ChartGPUOptions {
  return { _testLabel: label } as unknown as ChartGPUOptions;
}

/**
 * Wrapper that provides a stable containerRef pointing to a real DOM element.
 * useChartGPU requires a RefObject<HTMLElement> and checks navigator.gpu, so
 * we also need to stub that.
 */
function renderUseChartGPU(initialOptions: ChartGPUOptions) {
  const container = document.createElement('div');
  document.body.appendChild(container);

  const { result, rerender, unmount } = renderHook(
    ({ options }: { options: ChartGPUOptions }) => {
      const containerRef = useRef<HTMLElement>(container);
      return useChartGPU(containerRef, options);
    },
    { initialProps: { options: initialOptions } }
  );

  return {
    result,
    rerender: (options: ChartGPUOptions) => rerender({ options }),
    unmount: () => {
      unmount();
      container.remove();
    },
  };
}

// ---------------------------------------------------------------------------
// Setup
// ---------------------------------------------------------------------------

beforeEach(() => {
  vi.clearAllMocks();
  mockInstance = makeMockInstance();

  // Default: resolve asynchronously on next tick.
  mockCreate.mockImplementation((() => {
    return new Promise<ReturnType<typeof makeMockInstance>>((resolve) => {
      setTimeout(() => resolve(mockInstance), 0);
    });
  }) as any);
});

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe('useChartGPU hook — createdWithOptionsRef race-condition fix', () => {
  it('does not call setOption redundantly on initial mount', async () => {
    const opts = makeOptions('initial');

    const { result, unmount } = renderUseChartGPU(opts);

    // Wait for the chart to become ready (create promise resolved).
    await waitFor(() => {
      expect(result.current.isReady).toBe(true);
    });

    // setOption must NOT have been called — options haven't changed.
    expect(mockInstance.setOption).not.toHaveBeenCalled();

    unmount();
  });

  it('calls setOption when options change after init', async () => {
    const opts1 = makeOptions('first');
    const opts2 = makeOptions('second');

    const { result, rerender, unmount } = renderUseChartGPU(opts1);

    await waitFor(() => {
      expect(result.current.isReady).toBe(true);
    });

    // Confirm no premature setOption calls.
    expect(mockInstance.setOption).not.toHaveBeenCalled();

    // Change options.
    await act(async () => {
      rerender(opts2);
    });

    expect(mockInstance.setOption).toHaveBeenCalledTimes(1);
    expect(mockInstance.setOption).toHaveBeenCalledWith(opts2);

    unmount();
  });

  it('does not call setOption during async create even when options change (mid-flight)', async () => {
    const opts1 = makeOptions('inflight-initial');
    const opts2 = makeOptions('inflight-updated');

    // Hold create until we manually release it.
    let manualResolve: (instance: ReturnType<typeof makeMockInstance>) => void;
    mockCreate.mockImplementationOnce((() => {
      return new Promise<ReturnType<typeof makeMockInstance>>((resolve) => {
        manualResolve = resolve;
      });
    }) as any);

    const { rerender, result, unmount } = renderUseChartGPU(opts1);

    // Before create resolves, update options.
    act(() => {
      rerender(opts2);
    });

    // Resolve create — options now differ from snapshot (opts1 vs opts2).
    await act(async () => {
      manualResolve!(mockInstance);
      await new Promise((r) => setTimeout(r, 10));
    });

    await waitFor(() => {
      expect(result.current.isReady).toBe(true);
    });

    // Unconditional skip: setOption is never called on the first post-create
    // invocation, even when options changed mid-flight (issue #16).
    expect(mockInstance.setOption).not.toHaveBeenCalled();

    unmount();
  });
});
