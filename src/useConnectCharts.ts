import { useEffect, useRef } from 'react';
import { connectCharts } from 'chartgpu';
import type { ChartGPUInstance } from 'chartgpu';

type DisconnectCharts = ReturnType<typeof connectCharts>;

/**
 * React hook to connect multiple ChartGPU instances for synced crosshair/tooltip x.
 *
 * Safety:
 * - Will not connect until all instances exist and are not disposed.
 * - Automatically disconnects on unmount and when the set of instances changes.
 */
export function useConnectCharts(
  charts: ReadonlyArray<ChartGPUInstance | null | undefined>
): void {
  const disconnectRef = useRef<DisconnectCharts | null>(null);
  const idsRef = useRef<WeakMap<object, number>>(new WeakMap());
  const nextIdRef = useRef(1);

  const getId = (obj: object): number => {
    const existing = idsRef.current.get(obj);
    if (existing !== undefined) return existing;
    const id = nextIdRef.current++;
    idsRef.current.set(obj, id);
    return id;
  };

  // Build a stable signature so callers can pass new arrays without forcing reconnect.
  const signature = charts
    .map((c) => {
      if (!c) return 'null';
      const id = getId(c);
      return `${id}:${c.disposed ? 1 : 0}`;
    })
    .join('|');

  useEffect(() => {
    // Always tear down any previous connection first.
    if (disconnectRef.current) {
      disconnectRef.current();
      disconnectRef.current = null;
    }

    if (charts.length === 0) return;

    const resolved: ChartGPUInstance[] = [];
    for (const c of charts) {
      if (!c || c.disposed) return;
      resolved.push(c);
    }

    try {
      const disconnect = connectCharts(resolved);
      disconnectRef.current = disconnect;
      return () => {
        disconnect();
        disconnectRef.current = null;
      };
    } catch (err) {
      // Avoid crashing render trees if upstream throws (e.g. mismatched chart state).
      // Consumers can still manually call connectCharts if they need error handling.
      console.error('useConnectCharts: failed to connect charts', err);
      return;
    }
    // `charts` is intentionally not a dependency; `signature` captures identity + disposed state.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [signature]);
}

