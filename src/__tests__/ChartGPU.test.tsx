/**
 * Tests for ChartGPU.tsx — race-condition fix (issue #16), 0.3.x handle
 * forwarding, gpuContext create path, and event prop wiring.
 */

import { createRef, type ComponentProps } from 'react';
import { render, act, waitFor } from '@testing-library/react';
import { vi, describe, it, expect, beforeEach } from 'vitest';
import { ChartGPU } from '../ChartGPU';
import type { ChartGPUHandle } from '../types';
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

async function renderWithHandle(props: ComponentProps<typeof ChartGPU> = { options: makeOptions() }) {
  const ref = createRef<ChartGPUHandle>();
  const result = render(<ChartGPU ref={ref} {...props} />);
  await waitForChartInit();
  expect(ref.current).not.toBeNull();
  return { ref, ...result };
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

describe('ChartGPU handle — appendData (0.3.x maxPoints)', () => {
  it('forwards seriesIndex, points, and { maxPoints } to the instance', async () => {
    const { ref } = await renderWithHandle();
    const points = [{ x: 1, y: 2 }];

    ref.current!.appendData(0, points, { maxPoints: 50_000 });

    expect(mockInstance.appendData).toHaveBeenCalledTimes(1);
    expect(mockInstance.appendData).toHaveBeenCalledWith(0, points, { maxPoints: 50_000 });
  });

  it('forwards a two-arg call (options may be undefined)', async () => {
    const { ref } = await renderWithHandle();
    const points = [{ x: 3, y: 4 }];

    ref.current!.appendData(1, points);

    expect(mockInstance.appendData).toHaveBeenCalledTimes(1);
    // Implementation always passes the options parameter (undefined when omitted).
    expect(mockInstance.appendData).toHaveBeenCalledWith(1, points, undefined);
  });

  it('no-ops after the instance is disposed without throwing', async () => {
    const { ref } = await renderWithHandle();
    mockInstance.disposed = true;

    expect(() => {
      ref.current!.appendData(0, [{ x: 1, y: 2 }], { maxPoints: 100 });
    }).not.toThrow();
    expect(mockInstance.appendData).not.toHaveBeenCalled();
  });

  it('no-ops after unmount without throwing', async () => {
    const { ref, unmount } = await renderWithHandle();
    // React clears ref.current on unmount; keep the handle object to exercise no-ops.
    const handle = ref.current!;
    unmount();

    expect(() => {
      handle.appendData(0, [{ x: 1, y: 2 }], { maxPoints: 100 });
    }).not.toThrow();
    expect(mockInstance.appendData).not.toHaveBeenCalled();
  });
});

describe('ChartGPU handle — setZoomRange source', () => {
  it('forwards start, end, and source to the instance', async () => {
    const { ref } = await renderWithHandle();

    ref.current!.setZoomRange(10, 90, 'test-source');

    expect(mockInstance.setZoomRange).toHaveBeenCalledTimes(1);
    expect(mockInstance.setZoomRange).toHaveBeenCalledWith(10, 90, 'test-source');
  });

  it('forwards a two-arg call (source may be undefined)', async () => {
    const { ref } = await renderWithHandle();

    ref.current!.setZoomRange(0, 100);

    expect(mockInstance.setZoomRange).toHaveBeenCalledTimes(1);
    expect(mockInstance.setZoomRange).toHaveBeenCalledWith(0, 100, undefined);
  });
});

describe('ChartGPU handle — external render methods', () => {
  it('forwards setRenderMode / getRenderMode / needsRender / renderFrame when ready', async () => {
    mockInstance.getRenderMode.mockReturnValue('auto');
    mockInstance.needsRender.mockReturnValue(true);
    mockInstance.renderFrame.mockReturnValue(true);

    const { ref } = await renderWithHandle();

    ref.current!.setRenderMode('external');
    expect(mockInstance.setRenderMode).toHaveBeenCalledTimes(1);
    expect(mockInstance.setRenderMode).toHaveBeenCalledWith('external');

    expect(ref.current!.getRenderMode()).toBe('auto');
    expect(mockInstance.getRenderMode).toHaveBeenCalledTimes(1);

    expect(ref.current!.needsRender()).toBe(true);
    expect(mockInstance.needsRender).toHaveBeenCalledTimes(1);

    expect(ref.current!.renderFrame()).toBe(true);
    expect(mockInstance.renderFrame).toHaveBeenCalledTimes(1);
  });

  it('returns disposed defaults when the instance is null (unmount)', async () => {
    const { ref, unmount } = await renderWithHandle();
    const handle = ref.current!;
    unmount();

    expect(handle.needsRender()).toBe(false);
    expect(handle.renderFrame()).toBe(false);
    expect(handle.getRenderMode()).toBe('auto');
    // setRenderMode should no-op without throwing
    expect(() => handle.setRenderMode('external')).not.toThrow();
    expect(mockInstance.setRenderMode).not.toHaveBeenCalled();
    expect(mockInstance.needsRender).not.toHaveBeenCalled();
    expect(mockInstance.renderFrame).not.toHaveBeenCalled();
    expect(mockInstance.getRenderMode).not.toHaveBeenCalled();
  });

  it('returns disposed defaults when the live instance has disposed: true', async () => {
    mockInstance.needsRender.mockReturnValue(true);
    mockInstance.renderFrame.mockReturnValue(true);
    mockInstance.getRenderMode.mockReturnValue('external' as never);

    const { ref } = await renderWithHandle();
    // Instance still referenced by the handle, but marked disposed (short-circuit path).
    mockInstance.disposed = true;

    expect(ref.current!.needsRender()).toBe(false);
    expect(ref.current!.renderFrame()).toBe(false);
    expect(ref.current!.getRenderMode()).toBe('auto');
    expect(() => ref.current!.setRenderMode('auto')).not.toThrow();

    expect(mockInstance.needsRender).not.toHaveBeenCalled();
    expect(mockInstance.renderFrame).not.toHaveBeenCalled();
    expect(mockInstance.getRenderMode).not.toHaveBeenCalled();
    expect(mockInstance.setRenderMode).not.toHaveBeenCalled();
  });
});

describe('ChartGPU — gpuContext create path', () => {
  it('passes gpuContext as the third argument to ChartGPU.create', async () => {
    const gpuContext = {
      adapter: { id: 'adapter' } as any,
      device: { id: 'device' } as any,
      pipelineCache: { id: 'cache' } as any,
    };

    render(<ChartGPU options={makeOptions('ctx')} gpuContext={gpuContext} />);
    await waitForChartInit();

    expect(mockCreate).toHaveBeenCalledTimes(1);
    const args = mockCreate.mock.calls[0];
    expect(args).toHaveLength(3);
    expect(args[0]).toBeInstanceOf(HTMLElement);
    expect(args[1]).toEqual(expect.objectContaining({ _testLabel: 'ctx' }));
    expect(args[2]).toBe(gpuContext);
  });

  it('calls create with two args when gpuContext is not provided', async () => {
    render(<ChartGPU options={makeOptions('no-ctx')} />);
    await waitForChartInit();

    expect(mockCreate).toHaveBeenCalledTimes(1);
    const args = mockCreate.mock.calls[0];
    expect(args).toHaveLength(2);
    expect(args[0]).toBeInstanceOf(HTMLElement);
    expect(args[1]).toEqual(expect.objectContaining({ _testLabel: 'no-ctx' }));
  });
});

describe('ChartGPU events — onDataAppend / onDeviceLost', () => {
  it('subscribes to dataAppend and deviceLost and invokes prop handlers', async () => {
    const onDataAppend = vi.fn();
    const onDeviceLost = vi.fn();

    render(
      <ChartGPU
        options={makeOptions('events')}
        onDataAppend={onDataAppend}
        onDeviceLost={onDeviceLost}
      />
    );
    await waitForChartInit();

    const onCalls = mockInstance.on.mock.calls as Array<[string, (...args: unknown[]) => void]>;
    const dataAppendCall = onCalls.find(([event]) => event === 'dataAppend');
    const deviceLostCall = onCalls.find(([event]) => event === 'deviceLost');

    expect(dataAppendCall).toBeDefined();
    expect(typeof dataAppendCall![1]).toBe('function');
    expect(deviceLostCall).toBeDefined();
    expect(typeof deviceLostCall![1]).toBe('function');

    const appendPayload = {
      seriesIndex: 0,
      count: 3,
      xExtent: { min: 0, max: 2 },
    };
    const lostPayload = { reason: 'destroyed' };

    dataAppendCall![1](appendPayload);
    deviceLostCall![1](lostPayload);

    expect(onDataAppend).toHaveBeenCalledTimes(1);
    expect(onDataAppend).toHaveBeenCalledWith(appendPayload);
    expect(onDeviceLost).toHaveBeenCalledTimes(1);
    expect(onDeviceLost).toHaveBeenCalledWith(lostPayload);
  });

  it('unsubscribes dataAppend and deviceLost handlers on unmount', async () => {
    const { unmount } = render(
      <ChartGPU
        options={makeOptions('cleanup')}
        onDataAppend={() => {}}
        onDeviceLost={() => {}}
      />
    );
    await waitForChartInit();

    const dataAppendOn = (mockInstance.on.mock.calls as Array<[string, unknown]>).find(
      ([event]) => event === 'dataAppend'
    );
    const deviceLostOn = (mockInstance.on.mock.calls as Array<[string, unknown]>).find(
      ([event]) => event === 'deviceLost'
    );
    expect(dataAppendOn).toBeDefined();
    expect(deviceLostOn).toBeDefined();

    unmount();

    const offCalls = mockInstance.off.mock.calls as Array<[string, unknown]>;
    expect(offCalls).toContainEqual(['dataAppend', dataAppendOn![1]]);
    expect(offCalls).toContainEqual(['deviceLost', deviceLostOn![1]]);
  });
});

describe('ChartGPU handle — smoke surface', () => {
  it('forwards getChart, getContainer, setOption, interaction X, and hitTest', async () => {
    const hitResult = {
      isInGrid: true,
      canvasX: 10,
      canvasY: 20,
      gridX: 1,
      gridY: 2,
      match: { seriesIndex: 0, dataIndex: 1 },
    };
    mockInstance.getInteractionX.mockReturnValue(42 as never);
    mockInstance.hitTest.mockReturnValue(hitResult as never);

    const { ref } = await renderWithHandle();

    expect(ref.current!.getChart()).toBe(mockInstance);

    const container = ref.current!.getContainer();
    expect(container).toBeInstanceOf(HTMLDivElement);

    const nextOpts = makeOptions('handle-setOption');
    ref.current!.setOption(nextOpts);
    expect(mockInstance.setOption).toHaveBeenCalledWith(nextOpts);

    ref.current!.setInteractionX(1);
    expect(mockInstance.setInteractionX).toHaveBeenCalledWith(1, undefined);

    ref.current!.setInteractionX(null);
    expect(mockInstance.setInteractionX).toHaveBeenCalledWith(null, undefined);

    expect(ref.current!.getInteractionX()).toBe(42);
    expect(mockInstance.getInteractionX).toHaveBeenCalled();

    const event = new MouseEvent('click');
    expect(ref.current!.hitTest(event)).toBe(hitResult);
    expect(mockInstance.hitTest).toHaveBeenCalledWith(event);
  });

  it('returns null chart / empty hitTest after unmount', async () => {
    const { ref, unmount } = await renderWithHandle();
    const handle = ref.current!;
    unmount();

    expect(handle.getChart()).toBeNull();
    expect(handle.getInteractionX()).toBeNull();

    const empty = handle.hitTest(new MouseEvent('click'));
    expect(empty).toEqual({
      isInGrid: false,
      canvasX: NaN,
      canvasY: NaN,
      gridX: NaN,
      gridY: NaN,
      match: null,
    });
    expect(mockInstance.hitTest).not.toHaveBeenCalled();
  });
});
