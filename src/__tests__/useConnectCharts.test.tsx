/**
 * Tests for useConnectCharts — multi-chart sync wiring around connectCharts().
 */

import { renderHook } from '@testing-library/react';
import { vi, describe, it, expect, beforeEach } from 'vitest';
import { useConnectCharts } from '../useConnectCharts';
import type { ChartGPUInstance } from '@chartgpu/chartgpu';

// ---------------------------------------------------------------------------
// Mock @chartgpu/chartgpu
// ---------------------------------------------------------------------------

const mockDisconnect = vi.fn();
const mockConnectCharts = vi.fn((..._args: unknown[]) => mockDisconnect);

vi.mock('@chartgpu/chartgpu', () => {
  return {
    connectCharts: (charts: unknown, options?: unknown) => mockConnectCharts(charts, options),
  };
});

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function makeMockChart(label: string, disposed = false): ChartGPUInstance {
  return {
    disposed,
    // Minimal identity object; only disposed is read by the hook.
    _label: label,
  } as unknown as ChartGPUInstance;
}

// ---------------------------------------------------------------------------
// Setup
// ---------------------------------------------------------------------------

beforeEach(() => {
  vi.clearAllMocks();
  mockConnectCharts.mockImplementation(() => mockDisconnect);
});

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe('useConnectCharts', () => {
  it('calls connectCharts once with resolved instances and undefined options', () => {
    const a = makeMockChart('a');
    const b = makeMockChart('b');

    renderHook(() => useConnectCharts([a, b]));

    expect(mockConnectCharts).toHaveBeenCalledTimes(1);
    expect(mockConnectCharts).toHaveBeenCalledWith([a, b], undefined);
  });

  it('reconnects when syncOptions change', () => {
    const a = makeMockChart('a');
    const b = makeMockChart('b');

    const { rerender } = renderHook(
      ({ opts }: { opts?: { syncZoom?: boolean } }) => useConnectCharts([a, b], opts),
      { initialProps: { opts: undefined as { syncZoom?: boolean } | undefined } }
    );

    expect(mockConnectCharts).toHaveBeenCalledTimes(1);
    expect(mockConnectCharts).toHaveBeenCalledWith([a, b], undefined);

    rerender({ opts: { syncZoom: true } });

    expect(mockDisconnect).toHaveBeenCalledTimes(1);
    expect(mockConnectCharts).toHaveBeenCalledTimes(2);
    expect(mockConnectCharts).toHaveBeenLastCalledWith([a, b], { syncZoom: true });
  });

  it('does not call connectCharts when any chart is null', () => {
    const a = makeMockChart('a');

    renderHook(() => useConnectCharts([a, null]));

    expect(mockConnectCharts).not.toHaveBeenCalled();
  });

  it('does not call connectCharts when any chart is disposed', () => {
    const a = makeMockChart('a');
    const b = makeMockChart('b', true);

    renderHook(() => useConnectCharts([a, b]));

    expect(mockConnectCharts).not.toHaveBeenCalled();
  });

  it('calls disconnect on unmount', () => {
    const a = makeMockChart('a');
    const b = makeMockChart('b');

    const { unmount } = renderHook(() => useConnectCharts([a, b]));

    expect(mockConnectCharts).toHaveBeenCalledTimes(1);
    unmount();
    expect(mockDisconnect).toHaveBeenCalledTimes(1);
  });

  it('disconnects the old connection and connects new instance identity', () => {
    const a = makeMockChart('a');
    const b1 = makeMockChart('b1');
    const b2 = makeMockChart('b2');

    const { rerender } = renderHook(
      ({ charts }: { charts: Array<ChartGPUInstance | null> }) => useConnectCharts(charts),
      { initialProps: { charts: [a, b1] as Array<ChartGPUInstance | null> } }
    );

    expect(mockConnectCharts).toHaveBeenCalledTimes(1);
    expect(mockConnectCharts).toHaveBeenCalledWith([a, b1], undefined);

    rerender({ charts: [a, b2] });

    expect(mockDisconnect).toHaveBeenCalledTimes(1);
    expect(mockConnectCharts).toHaveBeenCalledTimes(2);
    expect(mockConnectCharts).toHaveBeenLastCalledWith([a, b2], undefined);
  });

  it('does not reconnect when the same instances are passed in a new array', () => {
    const a = makeMockChart('a');
    const b = makeMockChart('b');

    const { rerender } = renderHook(
      ({ charts }: { charts: Array<ChartGPUInstance | null> }) => useConnectCharts(charts),
      { initialProps: { charts: [a, b] as Array<ChartGPUInstance | null> } }
    );

    expect(mockConnectCharts).toHaveBeenCalledTimes(1);

    // New array identity, same chart objects — signature is stable.
    rerender({ charts: [a, b] });

    expect(mockConnectCharts).toHaveBeenCalledTimes(1);
    expect(mockDisconnect).not.toHaveBeenCalled();
  });

  it('disconnects without reconnecting when a live chart becomes disposed', () => {
    const a = makeMockChart('a');
    const b = makeMockChart('b');

    const { rerender } = renderHook(
      ({ charts }: { charts: Array<ChartGPUInstance | null> }) => useConnectCharts(charts),
      { initialProps: { charts: [a, b] as Array<ChartGPUInstance | null> } }
    );

    expect(mockConnectCharts).toHaveBeenCalledTimes(1);
    expect(mockDisconnect).not.toHaveBeenCalled();

    // Same object identities; disposed bit flips → signature changes.
    (b as { disposed: boolean }).disposed = true;
    rerender({ charts: [a, b] });

    // Effect teardown disconnects; early-return because b is disposed → no reconnect.
    expect(mockDisconnect).toHaveBeenCalledTimes(1);
    expect(mockConnectCharts).toHaveBeenCalledTimes(1);
  });

  it('disconnects without reconnecting when a live chart becomes null', () => {
    const a = makeMockChart('a');
    const b = makeMockChart('b');

    const { rerender } = renderHook(
      ({ charts }: { charts: Array<ChartGPUInstance | null> }) => useConnectCharts(charts),
      { initialProps: { charts: [a, b] as Array<ChartGPUInstance | null> } }
    );

    expect(mockConnectCharts).toHaveBeenCalledTimes(1);

    rerender({ charts: [a, null] });

    expect(mockDisconnect).toHaveBeenCalledTimes(1);
    expect(mockConnectCharts).toHaveBeenCalledTimes(1);
  });
});
