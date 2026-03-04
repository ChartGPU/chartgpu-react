/**
 * Tests for ChartGPU.tsx — verifying the createdWithOptionsRef race-condition fix.
 *
 * The fix: ChartGPU.create() is async. When it resolves, React schedules a
 * setOption effect. Without the fix, that effect would redundantly call
 * setOption(options) even though create() already initialised with those
 * options, potentially crashing during the internal init sequence.
 *
 * createdWithOptionsRef snapshots { options, theme } before the async create
 * call. The first post-create invocation of the setOption effect is
 * unconditionally skipped (issue #16).
 */

import { render, act, waitFor } from '@testing-library/react';
import { vi, describe, it, expect, beforeEach } from 'vitest';
import { ChartGPU } from '../ChartGPU';
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
    hitTest: vi.fn(() => ({
      isInGrid: false,
      canvasX: NaN,
      canvasY: NaN,
      gridX: NaN,
      gridY: NaN,
      match: null,
    })),
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

// ---------------------------------------------------------------------------
// Import the mock after vi.mock so the factory has run
// ---------------------------------------------------------------------------
import { ChartGPU as ChartGPULib } from '@chartgpu/chartgpu';

const mockCreate = vi.mocked(ChartGPULib.create);

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function makeOptions(label = 'a'): ChartGPUOptions {
  // Return a fresh object reference each time; label differentiates them.
  return { _testLabel: label } as unknown as ChartGPUOptions;
}

/**
 * Wait for the chart instance to be fully initialized by checking that
 * event handlers have been registered (on() called), which proves that
 * setChart() ran and effects depending on `chart` state fired.
 */
async function waitForChartInit() {
  await waitFor(() => {
    expect(mockInstance.on).toHaveBeenCalled();
  });
}

// ---------------------------------------------------------------------------
// Setup
// ---------------------------------------------------------------------------

beforeEach(() => {
  vi.clearAllMocks();
  mockInstance = makeMockInstance();

  // Default: resolve asynchronously on next tick (simulates real async gap).
  mockCreate.mockImplementation((() => {
    return new Promise<ReturnType<typeof makeMockInstance>>((resolve) => {
      setTimeout(() => resolve(mockInstance), 0);
    });
  }) as any);
});

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe('ChartGPU component — createdWithOptionsRef race-condition fix', () => {
  it('does not call setOption redundantly on initial mount', async () => {
    const opts = makeOptions('initial');

    render(<ChartGPU options={opts} />);

    // Wait for async create to resolve and chart state to be set.
    await waitForChartInit();

    // create was called once
    expect(mockCreate).toHaveBeenCalledTimes(1);

    // setOption must NOT have been called — first post-create invocation is
    // unconditionally skipped (issue #16).
    expect(mockInstance.setOption).not.toHaveBeenCalled();
  });

  it('calls setOption when options change after init', async () => {
    const opts1 = makeOptions('first');
    const opts2 = makeOptions('second');

    const { rerender } = render(<ChartGPU options={opts1} />);

    // Wait for chart to be fully initialized.
    await waitForChartInit();
    expect(mockInstance.setOption).not.toHaveBeenCalled();

    // Change options.
    rerender(<ChartGPU options={opts2} />);

    await waitFor(() => {
      expect(mockInstance.setOption).toHaveBeenCalledTimes(1);
    });
    expect(mockInstance.setOption).toHaveBeenCalledWith(opts2);
  });

  it('calls setOption when theme changes after init', async () => {
    const opts = makeOptions('theme-test');

    const { rerender } = render(<ChartGPU options={opts} theme="dark" />);

    // Wait for chart to be fully initialized.
    await waitForChartInit();

    // setOption must not have been called yet (unconditional skip on first
    // post-create invocation).
    expect(mockInstance.setOption).not.toHaveBeenCalled();

    // Change the theme.
    rerender(<ChartGPU options={opts} theme="light" />);

    await waitFor(() => {
      expect(mockInstance.setOption).toHaveBeenCalledTimes(1);
    });
    // theme is merged into the options object passed to setOption
    expect(mockInstance.setOption).toHaveBeenCalledWith({ ...opts, theme: 'light' });
  });

  it('does not call setOption during async create even when options change (mid-flight)', async () => {
    const opts1 = makeOptions('inflight-initial');
    const opts2 = makeOptions('inflight-updated');

    // Override create to hold until we manually resolve it — giving us control
    // over when the promise settles relative to the rerender.
    let manualResolve: (instance: ReturnType<typeof makeMockInstance>) => void;
    mockCreate.mockImplementationOnce((() => {
      return new Promise<ReturnType<typeof makeMockInstance>>((resolve) => {
        manualResolve = resolve;
      });
    }) as any);

    const { rerender } = render(<ChartGPU options={opts1} />);

    // Before create resolves, update options to opts2.
    rerender(<ChartGPU options={opts2} />);

    // Now resolve create — the component will call setChart(instance), which
    // triggers the setOption effect. The first post-create invocation is
    // unconditionally skipped (issue #16).
    await act(async () => {
      manualResolve!(mockInstance);
    });

    await waitForChartInit();

    // Unconditional skip: setOption is never called on the first post-create
    // invocation, even when options changed mid-flight (issue #16).
    expect(mockInstance.setOption).not.toHaveBeenCalled();
  });
});
