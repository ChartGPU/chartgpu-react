import React, { useEffect, useMemo, useRef, useState } from 'react';
import { createRoot } from 'react-dom/client';
import { ChartGPU, connectCharts, createAnnotationAuthoring, useGPUContext, useConnectCharts } from '../src';
import type {
  ChartGPUCrosshairMovePayload,
  ChartGPUCreateContext,
  ChartGPUDataAppendPayload,
  ChartGPUDeviceLostPayload,
  ChartGPUHandle,
  ChartGPUInstance,
  ChartGPUOptions,
  ScatterPointTuple,
} from '../src';
import type { OHLCDataPoint } from '@chartgpu/chartgpu';

type Candle = Extract<
  OHLCDataPoint,
  { timestamp: number; open: number; close: number; low: number; high: number }
>;

function generateLineData(points: number, seed: number): Array<{ x: number; y: number }> {
  const data: Array<{ x: number; y: number }> = [];
  for (let i = 0; i < points; i++) {
    const x = i;
    const y = Math.sin(i * 0.02 + seed) * 50 + Math.cos(i * 0.01 + seed) * 10;
    data.push({ x, y });
  }
  return data;
}

function CrosshairMoveExample() {
  const [chart, setChart] = useState<ChartGPUInstance | null>(null);
  const [crosshairX, setCrosshairX] = useState<number | null>(null);

  const options: ChartGPUOptions = useMemo(
    () => ({
      series: [
        {
          type: 'line',
          name: 'Signal',
          data: generateLineData(2000, 0.3),
          lineStyle: { width: 2, color: '#667eea' },
          areaStyle: { color: 'rgba(102, 126, 234, 0.15)' },
        },
      ],
      xAxis: { type: 'value' },
      yAxis: { type: 'value' },
      tooltip: { show: true, trigger: 'axis' },
      dataZoom: [{ type: 'inside' }, { type: 'slider' }],
      grid: { left: 60, right: 40, top: 40, bottom: 40 },
    }),
    []
  );

  return (
    <div className="example-section">
      <h2 className="example-title">Crosshair move + dataZoom</h2>
      
      <div className="info-box">
        <strong>Features:</strong> <code>'crosshairMove'</code> event, tooltip, inside+slider zoom
        <br />
        <strong>Crosshair X:</strong>{' '}
        {crosshairX === null ? <em>none</em> : crosshairX.toFixed(2)}
        <br />
        {chart && !chart.disposed && (
          <strong style={{ color: '#90ee90' }}>✓ Chart Active</strong>
        )}
      </div>

      <div className="chart-container">
        <ChartGPU
          options={options}
          style={{
            width: '100%',
            height: '400px',
          }}
          onReady={setChart}
          onCrosshairMove={(p: ChartGPUCrosshairMovePayload) => setCrosshairX(p.x)}
          theme="dark"
        />
      </div>
    </div>
  );
}

function ConnectedChartsExample() {
  const [topChart, setTopChart] = useState<ChartGPUInstance | null>(null);
  const [bottomChart, setBottomChart] = useState<ChartGPUInstance | null>(null);

  const topOptions: ChartGPUOptions = useMemo(
    () => ({
      series: [
        {
          type: 'line',
          name: 'Top',
          data: generateLineData(1000, 0.1),
          lineStyle: { width: 2, color: '#4facfe' },
        },
      ],
      xAxis: { type: 'value' },
      yAxis: { type: 'value' },
      tooltip: { show: true, trigger: 'axis' },
      grid: { left: 60, right: 40, top: 40, bottom: 40 },
    }),
    []
  );

  const bottomOptions: ChartGPUOptions = useMemo(
    () => ({
      series: [
        {
          type: 'line',
          name: 'Bottom',
          data: generateLineData(1000, 1.2),
          lineStyle: { width: 2, color: '#f093fb' },
          areaStyle: { color: 'rgba(240, 147, 251, 0.12)' },
        },
      ],
      xAxis: { type: 'value' },
      yAxis: { type: 'value' },
      tooltip: { show: true, trigger: 'axis' },
      grid: { left: 60, right: 40, top: 40, bottom: 40 },
    }),
    []
  );

  useEffect(() => {
    if (!topChart || topChart.disposed) return;
    if (!bottomChart || bottomChart.disposed) return;

    const disconnect = connectCharts([topChart, bottomChart]);
    return () => disconnect();
  }, [topChart, bottomChart]);

  return (
    <div className="example-section">
      <h2 className="example-title">connectCharts (sync crosshair)</h2>
      
      <div className="info-box">
        <strong>Features:</strong> Shared interaction-x between two charts via <code>connectCharts</code>
        <br />
        <strong>Try it:</strong> Move your mouse over either chart
      </div>

      <div className="chart-container">
        <ChartGPU
          options={topOptions}
          style={{
            width: '100%',
            height: '220px',
          }}
          onReady={setTopChart}
          theme="dark"
        />
        <div style={{ height: 12 }} />
        <ChartGPU
          options={bottomOptions}
          style={{
            width: '100%',
            height: '220px',
          }}
          onReady={setBottomChart}
          theme="dark"
        />
      </div>
    </div>
  );
}

function SyncedDashboardExample() {
  const { adapter, device, pipelineCache, isReady, error } = useGPUContext();

  const [chartA, setChartA] = useState<ChartGPUInstance | null>(null);
  const [chartB, setChartB] = useState<ChartGPUInstance | null>(null);
  const [chartC, setChartC] = useState<ChartGPUInstance | null>(null);

  // Sync crosshair and zoom across all three charts
  useConnectCharts([chartA, chartB, chartC], { syncZoom: true });

  const optionsA: ChartGPUOptions = useMemo(
    () => ({
      series: [
        {
          type: 'line',
          name: 'Series A',
          data: generateLineData(500, 0.5),
          lineStyle: { width: 2, color: '#4facfe' },
        },
      ],
      xAxis: { type: 'value' },
      yAxis: { type: 'value' },
      tooltip: { show: true, trigger: 'axis' },
      dataZoom: [{ type: 'inside' }],
      grid: { left: 60, right: 40, top: 40, bottom: 30 },
    }),
    []
  );

  const optionsB: ChartGPUOptions = useMemo(
    () => ({
      series: [
        {
          type: 'line',
          name: 'Series B',
          data: generateLineData(500, 2.1),
          lineStyle: { width: 2, color: '#f093fb' },
          areaStyle: { color: 'rgba(240, 147, 251, 0.12)' },
        },
      ],
      xAxis: { type: 'value' },
      yAxis: { type: 'value' },
      tooltip: { show: true, trigger: 'axis' },
      dataZoom: [{ type: 'inside' }],
      grid: { left: 60, right: 40, top: 40, bottom: 30 },
    }),
    []
  );

  const optionsC: ChartGPUOptions = useMemo(
    () => ({
      series: [
        {
          type: 'line',
          name: 'Series C',
          data: generateLineData(500, 4.0),
          lineStyle: { width: 2, color: '#40d17c' },
        },
      ],
      xAxis: { type: 'value' },
      yAxis: { type: 'value' },
      tooltip: { show: true, trigger: 'axis' },
      dataZoom: [{ type: 'inside' }],
      grid: { left: 60, right: 40, top: 40, bottom: 30 },
    }),
    []
  );

  if (error) return (
    <div className="example-section">
      <h2 className="example-title">Synced dashboard (shared GPU + useConnectCharts)</h2>
      <div className="info-box">
        <span style={{ color: '#ff6b6b' }}>WebGPU not supported: {error.message}</span>
      </div>
    </div>
  );

  if (!isReady) return (
    <div className="example-section">
      <h2 className="example-title">Synced dashboard (shared GPU + useConnectCharts)</h2>
      <div className="info-box">Initializing GPU...</div>
    </div>
  );

  const gpuContext = { adapter: adapter!, device: device!, pipelineCache: pipelineCache! };

  return (
    <div className="example-section">
      <h2 className="example-title">Synced dashboard (shared GPU + useConnectCharts)</h2>

      <div className="info-box">
        <strong>Features:</strong> <code>useGPUContext()</code> + <code>useConnectCharts()</code> +{' '}
        <code>gpuContext</code> prop
        <br />
        <strong>Try it:</strong> Move crosshair or zoom on any chart — all three stay in sync
      </div>

      <div className="chart-container">
        <ChartGPU
          options={optionsA}
          gpuContext={gpuContext}
          onReady={setChartA}
          style={{ width: '100%', height: '200px' }}
          theme="dark"
        />
        <div style={{ height: 8 }} />
        <ChartGPU
          options={optionsB}
          gpuContext={gpuContext}
          onReady={setChartB}
          style={{ width: '100%', height: '200px' }}
          theme="dark"
        />
        <div style={{ height: 8 }} />
        <ChartGPU
          options={optionsC}
          gpuContext={gpuContext}
          onReady={setChartC}
          style={{ width: '100%', height: '200px' }}
          theme="dark"
        />
      </div>
    </div>
  );
}

function StreamingSyncedDashboardExample() {
  const { adapter, device, pipelineCache, isReady, error } = useGPUContext();

  const [chartA, setChartA] = useState<ChartGPUInstance | null>(null);
  const [chartB, setChartB] = useState<ChartGPUInstance | null>(null);
  const [chartC, setChartC] = useState<ChartGPUInstance | null>(null);

  const refA = useRef<ChartGPUHandle>(null);
  const refB = useRef<ChartGPUHandle>(null);
  const refC = useRef<ChartGPUHandle>(null);

  // Sync crosshair and zoom across all three charts
  useConnectCharts([chartA, chartB, chartC], { syncZoom: true });

  const optionsA: ChartGPUOptions = useMemo(
    () => ({
      autoScroll: true,
      series: [
        {
          type: 'line',
          name: 'latency(ms)',
          data: generateLineData(200, 0.1),
          lineStyle: { width: 2, color: '#4facfe' },
        },
      ],
      xAxis: { type: 'value' },
      yAxis: { type: 'value' },
      tooltip: { show: true, trigger: 'axis' },
      dataZoom: [{ type: 'inside', start: 70, end: 100 }],
      grid: { left: 60, right: 40, top: 40, bottom: 30 },
    }),
    []
  );

  const optionsB: ChartGPUOptions = useMemo(
    () => ({
      autoScroll: true,
      series: [
        {
          type: 'line',
          name: 'throughput',
          data: generateLineData(200, 1.7),
          lineStyle: { width: 2, color: '#f093fb' },
          areaStyle: { color: 'rgba(240, 147, 251, 0.12)' },
        },
      ],
      xAxis: { type: 'value' },
      yAxis: { type: 'value' },
      tooltip: { show: true, trigger: 'axis' },
      dataZoom: [{ type: 'inside', start: 70, end: 100 }],
      grid: { left: 60, right: 40, top: 40, bottom: 30 },
    }),
    []
  );

  const optionsC: ChartGPUOptions = useMemo(
    () => ({
      autoScroll: true,
      series: [
        {
          type: 'line',
          name: 'errors',
          data: generateLineData(200, 3.2),
          lineStyle: { width: 2, color: '#ff6b6b' },
        },
      ],
      xAxis: { type: 'value' },
      yAxis: { type: 'value' },
      tooltip: { show: true, trigger: 'axis' },
      dataZoom: [{ type: 'inside', start: 70, end: 100 }],
      grid: { left: 60, right: 40, top: 40, bottom: 30 },
    }),
    []
  );

  // Stream data into all three charts via refs
  const xRef = useRef(200);
  useEffect(() => {
    const timer = window.setInterval(() => {
      const x = xRef.current++;
      refA.current?.appendData(0, [{ x, y: 40 + Math.sin(x * 0.03) * 25 + Math.random() * 5 }]);
      refB.current?.appendData(0, [{ x, y: 55 + Math.cos(x * 0.02) * 22 + Math.random() * 6 }]);
      refC.current?.appendData(0, [{ x, y: 10 + Math.abs(Math.sin(x * 0.05)) * 8 + Math.random() * 3 }]);
    }, 120);

    return () => window.clearInterval(timer);
  }, []);

  if (error) return (
    <div className="example-section">
      <h2 className="example-title">Streaming synced dashboard (shared GPU + useConnectCharts + appendData)</h2>
      <div className="info-box">
        <span style={{ color: '#ff6b6b' }}>WebGPU not supported: {error.message}</span>
      </div>
    </div>
  );

  if (!isReady) return (
    <div className="example-section">
      <h2 className="example-title">Streaming synced dashboard (shared GPU + useConnectCharts + appendData)</h2>
      <div className="info-box">Initializing GPU...</div>
    </div>
  );

  const gpuContext = { adapter: adapter!, device: device!, pipelineCache: pipelineCache! };

  return (
    <div className="example-section">
      <h2 className="example-title">Streaming synced dashboard (shared GPU + useConnectCharts + appendData)</h2>

      <div className="info-box">
        <strong>Features:</strong> <code>useGPUContext()</code> + <code>useConnectCharts()</code> +{' '}
        <code>appendData</code> streaming
        <br />
        <strong>Try it:</strong> Move crosshair or zoom on any chart while data streams — all three stay in sync
      </div>

      <div className="chart-container">
        <ChartGPU
          ref={refA}
          options={optionsA}
          gpuContext={gpuContext}
          onReady={setChartA}
          style={{ width: '100%', height: '180px' }}
          theme="dark"
        />
        <div style={{ height: 8 }} />
        <ChartGPU
          ref={refB}
          options={optionsB}
          gpuContext={gpuContext}
          onReady={setChartB}
          style={{ width: '100%', height: '180px' }}
          theme="dark"
        />
        <div style={{ height: 8 }} />
        <ChartGPU
          ref={refC}
          options={optionsC}
          gpuContext={gpuContext}
          onReady={setChartC}
          style={{ width: '100%', height: '180px' }}
          theme="dark"
        />
      </div>
    </div>
  );
}

function ExternalRenderModeExample() {
  const ref = useRef<ChartGPUHandle>(null);
  const [mode, setMode] = useState<'auto' | 'external'>('external');

  const initial = useMemo(() => generateLineData(300, 0.9), []);
  const lastXRef = useRef<number>(initial.length);

  const options: ChartGPUOptions = useMemo(
    () => ({
      renderMode: 'external',
      autoScroll: true,
      series: [
        {
          type: 'line',
          name: 'External loop',
          data: initial,
          lineStyle: { width: 2, color: '#ffd166' },
        },
      ],
      xAxis: { type: 'value' },
      yAxis: { type: 'value' },
      tooltip: { show: true, trigger: 'axis' },
      dataZoom: [{ type: 'inside', start: 70, end: 100 }, { type: 'slider', start: 70, end: 100 }],
      grid: { left: 60, right: 40, top: 40, bottom: 40 },
    }),
    [initial]
  );

  // App-owned render loop (requestAnimationFrame). Only runs in external mode.
  useEffect(() => {
    if (mode !== 'external') return;

    let rafId = 0;
    const loop = () => {
      const h = ref.current;
      if (h && h.needsRender()) {
        h.renderFrame();
      }
      rafId = window.requestAnimationFrame(loop);
    };
    rafId = window.requestAnimationFrame(loop);
    return () => window.cancelAnimationFrame(rafId);
  }, [mode]);

  // Stream data to force the chart dirty.
  useEffect(() => {
    const timer = window.setInterval(() => {
      const x = lastXRef.current++;
      const y = Math.sin(x * 0.02) * 40 + Math.cos(x * 0.013) * 12;
      ref.current?.appendData(0, [{ x, y }]);
    }, 120);

    return () => window.clearInterval(timer);
  }, []);

  return (
    <div className="example-section">
      <h2 className="example-title">External render mode (app-owned RAF loop)</h2>

      <div className="info-box">
        <strong>Features:</strong> <code>renderMode: 'external'</code>,{' '}
        <code>needsRender()</code> + <code>renderFrame()</code>
        <br />
        <strong>Mode:</strong> <code>{mode}</code>{' '}
        <button
          style={{ marginLeft: 10 }}
          onClick={() => {
            const next = mode === 'external' ? 'auto' : 'external';
            setMode(next);
            ref.current?.setRenderMode(next);
          }}
        >
          Toggle
        </button>
      </div>

      <div className="chart-container">
        <ChartGPU
          ref={ref}
          options={options}
          style={{ width: '100%', height: '320px' }}
          theme="dark"
        />
      </div>
    </div>
  );
}

function StreamingDashboardExample() {
  const { adapter, device, pipelineCache, isReady, error } = useGPUContext();

  const gpuContext = useMemo<ChartGPUCreateContext | undefined>(() => {
    if (!adapter || !device) return undefined;
    return pipelineCache
      ? { adapter, device, pipelineCache }
      : { adapter, device };
  }, [adapter, device, pipelineCache]);

  const [lastAppend, setLastAppend] = useState<ChartGPUDataAppendPayload | null>(null);
  const [lost, setLost] = useState<ChartGPUDeviceLostPayload | null>(null);

  const aRef = useRef<ChartGPUHandle>(null);
  const bRef = useRef<ChartGPUHandle>(null);
  const cRef = useRef<ChartGPUHandle>(null);

  const aOptions: ChartGPUOptions = useMemo(
    () => ({
      autoScroll: true,
      series: [
        {
          type: 'line',
          name: 'latency(ms)',
          data: generateLineData(300, 0.1),
          lineStyle: { width: 2, color: '#4facfe' },
        },
      ],
      xAxis: { type: 'value' },
      yAxis: { type: 'value' },
      tooltip: { show: true, trigger: 'axis' },
      dataZoom: [{ type: 'inside', start: 70, end: 100 }],
      grid: { left: 60, right: 40, top: 40, bottom: 30 },
    }),
    []
  );

  const bOptions: ChartGPUOptions = useMemo(
    () => ({
      autoScroll: true,
      series: [
        {
          type: 'line',
          name: 'cpu(%)',
          data: generateLineData(300, 1.7),
          lineStyle: { width: 2, color: '#f093fb' },
          areaStyle: { color: 'rgba(240, 147, 251, 0.12)' },
        },
      ],
      xAxis: { type: 'value' },
      yAxis: { type: 'value' },
      tooltip: { show: true, trigger: 'axis' },
      dataZoom: [{ type: 'inside', start: 70, end: 100 }],
      grid: { left: 60, right: 40, top: 40, bottom: 30 },
    }),
    []
  );

  const cOptions: ChartGPUOptions = useMemo(
    () => ({
      autoScroll: true,
      series: [
        {
          type: 'line',
          name: 'mem(%)',
          data: generateLineData(300, 3.2),
          lineStyle: { width: 2, color: '#40d17c' },
          areaStyle: { color: 'rgba(64, 209, 124, 0.12)' },
        },
      ],
      xAxis: { type: 'value' },
      yAxis: { type: 'value' },
      tooltip: { show: true, trigger: 'axis' },
      dataZoom: [{ type: 'inside', start: 70, end: 100 }],
      grid: { left: 60, right: 40, top: 40, bottom: 30 },
    }),
    []
  );

  // Stream data into all charts. Demonstrates multi-chart sharing via gpuContext.
  useEffect(() => {
    let x = 300;
    const timer = window.setInterval(() => {
      x += 1;
      aRef.current?.appendData(0, [{ x, y: 40 + Math.sin(x * 0.03) * 25 + Math.random() * 5 }]);
      bRef.current?.appendData(0, [{ x, y: 55 + Math.cos(x * 0.02) * 22 + Math.random() * 6 }]);
      cRef.current?.appendData(0, [{ x, y: 50 + Math.sin(x * 0.017) * 18 + Math.random() * 4 }]);
    }, 140);

    return () => window.clearInterval(timer);
  }, []);

  return (
    <div className="example-section">
      <h2 className="example-title">Streaming multi-chart dashboard (shared GPUDevice + pipeline cache)</h2>

      <div className="info-box">
        <strong>Features:</strong> <code>useGPUContext()</code> + <code>gpuContext</code> prop,{' '}
        <code>onDataAppend</code>, <code>onDeviceLost</code>
        <br />
        <strong>GPU context:</strong>{' '}
        {error ? (
          <span style={{ color: '#ff6b6b' }}>{error.message}</span>
        ) : isReady ? (
          <span style={{ color: '#90ee90' }}>ready</span>
        ) : (
          <span>initializing…</span>
        )}
        {lost && (
          <>
            <br />
            <strong style={{ color: '#ff6b6b' }}>Device lost:</strong>{' '}
            <code>{lost.reason}</code> {lost.message ? `— ${lost.message}` : ''}
          </>
        )}
        {lastAppend && (
          <>
            <br />
            <strong>Last append:</strong>{' '}
            series <code>{lastAppend.seriesIndex}</code>, count <code>{lastAppend.count}</code>, xExtent{' '}
            <code>
              [{lastAppend.xExtent.min.toFixed(2)}, {lastAppend.xExtent.max.toFixed(2)}]
            </code>
          </>
        )}
      </div>

      <div className="chart-container">
        {gpuContext ? (
          <>
            <ChartGPU
              ref={aRef}
              options={aOptions}
              gpuContext={gpuContext}
              style={{ width: '100%', height: '180px' }}
              theme="dark"
              onDataAppend={(p) => setLastAppend(p)}
              onDeviceLost={(p) => setLost(p)}
            />
            <div style={{ height: 12 }} />
            <ChartGPU
              ref={bRef}
              options={bOptions}
              gpuContext={gpuContext}
              style={{ width: '100%', height: '180px' }}
              theme="dark"
              onDataAppend={(p) => setLastAppend(p)}
              onDeviceLost={(p) => setLost(p)}
            />
            <div style={{ height: 12 }} />
            <ChartGPU
              ref={cRef}
              options={cOptions}
              gpuContext={gpuContext}
              style={{ width: '100%', height: '180px' }}
              theme="dark"
              onDataAppend={(p) => setLastAppend(p)}
              onDeviceLost={(p) => setLost(p)}
            />
          </>
        ) : (
          <div style={{ padding: 16, opacity: 0.8 }}>
            {error ? 'WebGPU unavailable.' : isReady ? 'Preparing shared context…' : 'Initializing WebGPU…'}
          </div>
        )}
      </div>
    </div>
  );
}

function AnnotationAuthoringExample() {
  const chartRef = useRef<ChartGPUHandle>(null);
  const [chart, setChart] = useState<ChartGPUInstance | null>(null);

  const options: ChartGPUOptions = useMemo(
    () => ({
      series: [
        {
          type: 'line',
          name: 'Annotate me',
          data: generateLineData(800, 0.6),
          lineStyle: { width: 2, color: '#40d17c' },
        },
      ],
      xAxis: { type: 'value' },
      yAxis: { type: 'value' },
      tooltip: { show: true, trigger: 'axis' },
      dataZoom: [{ type: 'inside' }, { type: 'slider' }],
      // Note: annotations are managed by createAnnotationAuthoring, so we don't
      // include them in options to avoid overwriting them when options update.
      grid: { left: 60, right: 40, top: 40, bottom: 40 },
    }),
    []
  );

  useEffect(() => {
    const container = chartRef.current?.getContainer();
    const instance = chartRef.current?.getChart();
    if (!container || !instance || instance.disposed) return;

    const authoring = createAnnotationAuthoring(container, instance, {
      enableContextMenu: true,
      menuZIndex: 1000,
    });

    // Important: dispose authoring before the chart disposes.
    return () => authoring.dispose();
  }, [chart]);

  return (
    <div className="example-section">
      <h2 className="example-title">Annotation authoring</h2>

      <div className="info-box">
        <strong>Features:</strong> Right-click context menu + drag + undo/redo via{' '}
        <code>createAnnotationAuthoring</code>
        <br />
        <strong>Try it:</strong> Right-click in the plot area to add annotations, right-click existing annotations to edit
      </div>

      <div className="chart-container">
        <ChartGPU
          ref={chartRef}
          options={options}
          style={{ width: '100%', height: '400px' }}
          onReady={setChart}
          theme="dark"
        />
      </div>
    </div>
  );
}

function seedCandles(count: number, intervalMs: number, startPrice: number): Candle[] {
  const now = Date.now();
  const startTs = now - count * intervalMs;
  const out: Candle[] = [];

  let lastClose = startPrice;
  for (let i = 0; i < count; i++) {
    const ts = startTs + i * intervalMs;
    const open = lastClose;
    const delta = (Math.sin(i * 0.35) + Math.cos(i * 0.22)) * 0.8;
    const close = open + delta;
    const high = Math.max(open, close) + 0.6;
    const low = Math.min(open, close) - 0.6;
    out.push({ timestamp: ts, open, close, high, low });
    lastClose = close;
  }

  return out;
}

function CandlestickStreamingExample() {
  const ref = useRef<ChartGPUHandle>(null);
  const initial = useMemo(() => seedCandles(80, 1000, 100), []);
  const last = initial[initial.length - 1]!;
  const lastCloseRef = useRef<number>(last.close);
  const lastTsRef = useRef<number>(last.timestamp);

  const options: ChartGPUOptions = useMemo(
    () => ({
      xAxis: { type: 'time' },
      yAxis: { type: 'value' },
      tooltip: { show: true, trigger: 'axis' },
      dataZoom: [
        { type: 'inside', start: 80, end: 100 },
        { type: 'slider', start: 80, end: 100 },
      ],
      autoScroll: true,
      series: [
        {
          type: 'candlestick',
          name: 'OHLC',
          sampling: 'ohlc',
          data: initial,
        },
      ],
      grid: { left: 60, right: 40, top: 40, bottom: 40 },
    }),
    [initial]
  );

  useEffect(() => {
    const timer = window.setInterval(() => {
      const open = lastCloseRef.current;
      const drift = (Math.random() - 0.5) * 2;
      const close = open + drift;
      const high = Math.max(open, close) + Math.random() * 1.2;
      const low = Math.min(open, close) - Math.random() * 1.2;

      const timestamp = lastTsRef.current + 1000;
      lastTsRef.current = timestamp;
      lastCloseRef.current = close;

      const next: Candle = { timestamp, open, close, high, low };
      ref.current?.appendData(0, [next]);
    }, 500);

    return () => window.clearInterval(timer);
  }, []);

  return (
    <div className="example-section">
      <h2 className="example-title">Candlestick streaming (appendData)</h2>

      <div className="info-box">
        <strong>Features:</strong> Candlestick series + OHLC sampling + streaming{' '}
        <code>appendData</code> (v0.2.3)
        <br />
        <strong>Note:</strong> Auto-scroll keeps the view pinned when zoomed to the end
      </div>

      <div className="chart-container">
        <ChartGPU
          ref={ref}
          options={options}
          style={{ width: '100%', height: '420px' }}
          theme="dark"
        />
      </div>
    </div>
  );
}

function generateScatterPoints(count: number, seed: number): ScatterPointTuple[] {
  // Deterministic RNG so the example is stable across hot reloads.
  const mulberry32 = (a: number) => () => {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };

  const rand = mulberry32(Math.floor(seed * 1_000_000));
  const normal = () => {
    // Box–Muller transform
    const u1 = Math.max(1e-12, rand());
    const u2 = rand();
    const r = Math.sqrt(-2.0 * Math.log(u1));
    const theta = 2.0 * Math.PI * u2;
    return r * Math.cos(theta);
  };

  const clamp = (v: number, lo: number, hi: number) => Math.min(hi, Math.max(lo, v));

  const points: ScatterPointTuple[] = [];
  for (let i = 0; i < count; i++) {
    // Two Gaussian blobs so density mode shows structure.
    const blob = rand() < 0.6 ? 0 : 1;
    const cx = blob === 0 ? 35 : 70;
    const cy = blob === 0 ? 55 : 35;
    const sx = blob === 0 ? 8 : 5;
    const sy = blob === 0 ? 10 : 7;

    const x = clamp(cx + normal() * sx, 0, 100);
    const y = clamp(cy + normal() * sy, 0, 100);
    points.push([x, y]);
  }

  return points;
}

function ScatterDensityExample() {
  const POINT_COUNT = 250_000;

  const scatterData = useMemo(() => generateScatterPoints(POINT_COUNT, 0.42), []);

  const options: ChartGPUOptions = useMemo(
    () => ({
      series: [
        {
          type: 'scatter',
          name: 'Density',
          data: scatterData,
          mode: 'density',
          binSize: 2,
          densityColormap: 'viridis',
          densityNormalization: 'log',
          sampling: 'none',
        },
      ],
      xAxis: { type: 'value' },
      yAxis: { type: 'value' },
      tooltip: { show: true, trigger: 'axis' },
      grid: { left: 60, right: 40, top: 40, bottom: 40 },
    }),
    [scatterData]
  );

  return (
    <div className="example-section">
      <h2 className="example-title">Scatter density</h2>

      <div className="info-box">
        <strong>Features:</strong> Scatter series with <code>mode: 'density'</code>, density colormap, binning
        <br />
        <strong>Point count:</strong> {POINT_COUNT.toLocaleString()} (adjust in code to increase)
      </div>

      <div className="chart-container">
        <ChartGPU
          options={options}
          style={{ width: '100%', height: '400px' }}
          theme="dark"
        />
      </div>
    </div>
  );
}

function App() {
  return (
    <>
      <CrosshairMoveExample />
      <ConnectedChartsExample />
      <SyncedDashboardExample />
      <StreamingSyncedDashboardExample />
      <ExternalRenderModeExample />
      <StreamingDashboardExample />
      <AnnotationAuthoringExample />
      <CandlestickStreamingExample />
      <ScatterDensityExample />
    </>
  );
}

// Mount React app
const rootElement = document.getElementById('root');
if (rootElement) {
  const root = createRoot(rootElement);
  root.render(<App />);
} else {
  console.error('Root element not found');
}
