import { useEffect, useRef } from 'react';
import { connectCharts } from '@chartgpu/chartgpu';
import type { ChartGPUInstance, ChartSyncOptions } from '@chartgpu/chartgpu';

type DisconnectCharts = ReturnType<typeof connectCharts>;

/**
 * React hook to connect multiple ChartGPU instances for synced interactions.
 *
 * Supports optional `syncOptions` to control which interactions are synced:
 * - `syncCrosshair` (default `true`): sync crosshair + tooltip x across charts
 * - `syncZoom` (default `false`): sync zoom/pan across charts
 *
 * Safety:
 * - Will not connect until all instances exist and are not disposed.
 * - Automatically disconnects on unmount and when the set of instances or options change.
 */
export function useConnectCharts(
  charts: ReadonlyArray<ChartGPUInstance | null | undefined>,
  syncOptions?: ChartSyncOptions
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
  // Include syncOptions so changes to them trigger reconnection.
  const optionsSig = syncOptions
    ? `cr=${syncOptions.syncCrosshair ?? ''},zm=${syncOptions.syncZoom ?? ''}`
    : '';
  const signature =
    charts
      .map((c) => {
        if (!c) return 'null';
        const id = getId(c);
        return `${id}:${c.disposed ? 1 : 0}`;
      })
      .join('|') + `|${optionsSig}`;

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
      const disconnect = connectCharts(resolved, syncOptions);
      disconnectRef.current = disconnect;
      return () => {
        disconnect();
        disconnectRef.current = null;
      };
    } catch (err) {
      // Avoid crashing render trees if upstream throws (e.g. mismatched chart state).
      // Consumers can still manually call connectCharts if they need error handling.
      // Only log in development; tree-shaken in production builds
      try {
        if (
          // @ts-expect-error -- process may not exist in browser environments
          typeof process === 'undefined' || process.env?.NODE_ENV !== 'production'
        ) {
          // eslint-disable-next-line no-console
          console.error('useConnectCharts: failed to connect charts', err);
        }
      } catch {
        // process access threw; assume dev
        // eslint-disable-next-line no-console
        console.error('useConnectCharts: failed to connect charts', err);
      }
      return;
    }
    // `charts` is intentionally not a dependency; `signature` captures identity + disposed state + options.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [signature]);
}

