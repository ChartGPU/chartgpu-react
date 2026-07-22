import React, { useCallback, useEffect, useMemo, useRef, useState, type ReactNode } from 'react';
import { createRoot } from 'react-dom/client';
import { ChartGPU, useGPUContext, useConnectCharts } from '../src';
import type {
  ChartGPUCreateContext,
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

type ExampleStatus = 'idle' | 'loading' | 'ok' | 'error';

const DEMO_THEME = {
  backgroundColor: '#05060a',
  gridLineColor: 'rgba(255,255,255,0.06)',
  axisLineColor: 'rgba(224,224,224,0.14)',
  axisTickColor: 'rgba(224,224,224,0.22)',
  textColor: 'rgba(224,224,224,0.82)',
} as const;

function generateLineData(points: number, seed: number): Array<{ x: number; y: number }> {
  const data: Array<{ x: number; y: number }> = [];
  for (let i = 0; i < points; i++) {
    data.push({
      x: i,
      y: Math.sin(i * 0.02 + seed) * 50 + Math.cos(i * 0.01 + seed) * 10,
    });
  }
  return data;
}

function ExampleCard(props: {
  id: string;
  index: string;
  title: string;
  description: string;
  tags?: string[];
  status?: ExampleStatus;
  statusLabel?: string;
  meta?: ReactNode;
  stack?: boolean;
  featured?: boolean;
  tall?: boolean;
  bleed?: boolean;
  children: ReactNode;
}) {
  const {
    id,
    index,
    title,
    description,
    tags = [],
    status = 'idle',
    statusLabel,
    meta,
    stack,
    featured,
    tall,
    bleed,
    children,
  } = props;

  const statusClass =
    status === 'ok'
      ? 'example-status example-status--ok'
      : status === 'error'
        ? 'example-status example-status--error'
        : status === 'loading'
          ? 'example-status example-status--loading'
          : 'example-status';

  const resolvedLabel =
    statusLabel ??
    (status === 'ok'
      ? 'Live'
      : status === 'loading'
        ? 'Initializing…'
        : status === 'error'
          ? 'Unavailable'
          : 'Ready');

  const className = [
    'example',
    featured ? 'example--featured' : '',
    tall ? 'example--tall' : '',
  ]
    .filter(Boolean)
    .join(' ');

  const canvasClass = [
    'example-canvas',
    stack ? 'example-canvas--stack' : '',
    bleed ? 'example-canvas--bleed' : '',
  ]
    .filter(Boolean)
    .join(' ');

  return (
    <article className={className} id={id}>
      <header className="example-header">
        <div className="example-header__main">
          <p className="example-id">{index}</p>
          <h2 className="example-title">{title}</h2>
          <p className="example-desc">{description}</p>
        </div>
        <div className={statusClass} aria-live="polite">
          <span className="example-status__dot" aria-hidden="true" />
          {resolvedLabel}
        </div>
      </header>

      {meta ? <div className="example-meta">{meta}</div> : null}

      {tags.length > 0 ? (
        <div className="example-tags">
          {tags.map((tag) => (
            <span key={tag} className="example-tag">
              {tag}
            </span>
          ))}
        </div>
      ) : null}

      <div className={canvasClass}>{children}</div>
    </article>
  );
}

function ChartHost(props: { children: ReactNode; style?: React.CSSProperties }) {
  return (
    <div className="chart-host" style={props.style}>
      {props.children}
    </div>
  );
}

// ─── 3D terrain + LiDAR (hero plate) ─────────────────────────────────────────

const SURF_COLS = 96;
const SURF_ROWS = 64;
const SEED_CLOUD = 14_000;

function heightAt(u: number, v: number, t: number): number {
  const g1 = Math.exp(-((u - 0.25) ** 2 + (v + 0.15) ** 2) / 0.12);
  const g2 = 0.65 * Math.exp(-((u + 0.35) ** 2 + (v - 0.3) ** 2) / 0.09);
  const ridge = 0.2 * Math.sin((u + t) * 5) * Math.cos(v * 4);
  return g1 + g2 + ridge - 0.15 * (u * u + v * v);
}

function fillTerrain(y: Float32Array, columns: number, rows: number, t = 0): void {
  for (let j = 0; j < rows; j++) {
    for (let i = 0; i < columns; i++) {
      const u = (i / Math.max(1, columns - 1)) * 2 - 1;
      const v = (j / Math.max(1, rows - 1)) * 2 - 1;
      y[j * columns + i] = heightAt(u, v, t);
    }
  }
}

function makeSeedCloud(
  n: number,
  yField: Float32Array,
  columns: number,
  rows: number,
  xStart: number,
  xStep: number,
  zStart: number,
  zStep: number
) {
  const x = new Float32Array(n);
  const y = new Float32Array(n);
  const z = new Float32Array(n);
  const value = new Float32Array(n);
  for (let i = 0; i < n; i++) {
    const ii = Math.floor(Math.random() * columns);
    const jj = Math.floor(Math.random() * rows);
    const wx = xStart + ii * xStep;
    const wz = zStart + jj * zStep;
    const h = yField[jj * columns + ii]! + (Math.random() - 0.5) * 0.08;
    x[i] = wx + (Math.random() - 0.5) * 0.04;
    y[i] = h + 0.05;
    z[i] = wz + (Math.random() - 0.5) * 0.04;
    value[i] = h;
  }
  return { x, y, z, value };
}

function Hero3DExample() {
  const plateRef = useRef<HTMLElement | null>(null);
  const [ready, setReady] = useState(false);
  const chartRef = useRef<ChartGPUHandle>(null);
  const yFieldRef = useRef(new Float32Array(SURF_COLS * SURF_ROWS));
  const surfaceXStartRef = useRef(-1);
  const streamTRef = useRef(0);

  const surfaceData = useMemo(() => {
    fillTerrain(yFieldRef.current, SURF_COLS, SURF_ROWS, 0);
    return {
      xStart: -1,
      xStep: 2 / Math.max(1, SURF_COLS - 1),
      zStart: -1,
      zStep: 2 / Math.max(1, SURF_ROWS - 1),
      columns: SURF_COLS,
      rows: SURF_ROWS,
      y: yFieldRef.current,
    };
  }, []);

  const cloudData = useMemo(() => {
    const arrays = makeSeedCloud(
      SEED_CLOUD,
      yFieldRef.current,
      SURF_COLS,
      SURF_ROWS,
      surfaceData.xStart,
      surfaceData.xStep,
      surfaceData.zStart,
      surfaceData.zStep
    );
    return arrays;
  }, [surfaceData]);

  const options: ChartGPUOptions = useMemo(
    () => ({
      coordinateSystem: 'cartesian3d',
      theme: DEMO_THEME,
      legend: { show: false },
      tooltip: { show: true },
      // Wheel zoom would capture the page scroll on a full-viewport hero.
      interaction3d: { orbit: true, pan: true, zoom: false },
      camera: {
        type: 'perspective',
        eye: [2.4, 1.6, 2.2],
        target: [0, 0.15, 0],
        up: [0, 1, 0],
        fovY: Math.PI / 4,
      },
      axes3d: {
        showBox: true,
        showGrid: true,
        labelMode: 'auto',
        x: { name: 'X (m)', tickCount: 5 },
        y: { name: 'Height', tickCount: 5 },
        z: { name: 'Y (m)', tickCount: 5 },
      },
      series: [
        {
          type: 'surface3d',
          name: 'Terrain',
          data: surfaceData,
          colormap: 'viridis',
          lighting: 0.72,
          opacity: 1,
          contours: {
            show: true,
            levels: 10,
            color: '#e2e8f0',
            width: 1.5,
            opacity: 0.85,
          },
        },
        {
          type: 'pointCloud3d',
          name: 'LiDAR',
          data: cloudData,
          pointStyle: { size: 2.5, color: '#38bdf8', opacity: 0.92 },
          colorBy: { colormap: 'plasma', min: -0.2, max: 1.2 },
        },
      ],
    }),
    [surfaceData, cloudData]
  );

  const onReady = useCallback((chart: ChartGPUInstance) => {
    chart.setCamera?.({
      type: 'perspective',
      eye: [2.4, 1.6, 2.2],
      target: [0, 0.15, 0],
      up: [0, 1, 0],
      fovY: Math.PI / 4,
    });
    setReady(true);
    plateRef.current?.classList.add('is-ready');
  }, []);

  // Live surface strip (always on for the hero)
  useEffect(() => {
    if (!ready) return;

    let raf = 0;
    const tick = () => {
      const c = chartRef.current?.getChart() ?? null;
      if (c && !c.disposed && c.updateSurface3D) {
        streamTRef.current += 0.006;
        const col = new Float32Array(SURF_ROWS);
        const nextI = SURF_COLS;
        const uEdge =
          -1 + (nextI / Math.max(1, SURF_COLS - 1)) * 2 + streamTRef.current * 0.08;
        for (let r = 0; r < SURF_ROWS; r++) {
          const v = (r / Math.max(1, SURF_ROWS - 1)) * 2 - 1;
          col[r] = heightAt(uEdge, v, streamTRef.current);
        }
        const yField = yFieldRef.current;
        for (let r = 0; r < SURF_ROWS; r++) {
          const row = r * SURF_COLS;
          yField.copyWithin(row, row + 1, row + SURF_COLS);
          yField[row + SURF_COLS - 1] = col[r]!;
        }
        const dx = surfaceData.xStep;
        surfaceXStartRef.current += dx;
        c.updateSurface3D(0, {
          mode: 'appendColumns',
          columns: 1,
          y: col,
          scrollX: true,
        });
        const cam = c.getCamera?.();
        if (cam?.eye && cam.target) {
          c.setCamera?.({
            eye: [cam.eye[0]! + dx, cam.eye[1]!, cam.eye[2]!],
            target: [cam.target[0]! + dx, cam.target[1]!, cam.target[2]!],
          });
        }
      }
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [ready, surfaceData.xStep]);

  // Bind plate ref for is-ready class
  useEffect(() => {
    plateRef.current = document.getElementById('hero');
  }, []);

  return (
    <>
      <div className="plate-hero__status">Initializing WebGPU 3D…</div>
      <div className="plate-hero__caption">
        <p className="plate-hero__meta">cartesian3d</p>
        <h2 className="plate-hero__title">surface3d + pointCloud3d</h2>
        <p className="plate-hero__note">
          Drag to orbit · scroll the page to leave · live updateSurface3D strip
        </p>
      </div>
      <ChartGPU
        ref={chartRef}
        options={options}
        style={{ width: '100%', height: '100%' }}
        theme="dark"
        onReady={onReady}
      />
    </>
  );
}

// ─── 3D helix point cloud ────────────────────────────────────────────────────

function makeHelixCloud(n: number) {
  const x = new Float32Array(n);
  const y = new Float32Array(n);
  const z = new Float32Array(n);
  const value = new Float32Array(n);
  for (let i = 0; i < n; i++) {
    const t = i / n;
    const ang = t * Math.PI * 10;
    const r = 0.25 + t * 1.35;
    const nx = (Math.random() - 0.5) * 0.12;
    const ny = (Math.random() - 0.5) * 0.12;
    const nz = (Math.random() - 0.5) * 0.12;
    x[i] = Math.cos(ang) * r + nx;
    y[i] = (t - 0.5) * 2.8 + ny;
    z[i] = Math.sin(ang) * r + nz;
    value[i] = Math.hypot(x[i]!, z[i]!);
  }
  return { x, y, z, value };
}

function PointCloud3DExample() {
  const [ready, setReady] = useState(false);
  const POINT_COUNT = 80_000;
  const cloud = useMemo(() => makeHelixCloud(POINT_COUNT), []);

  const options: ChartGPUOptions = useMemo(
    () => ({
      coordinateSystem: 'cartesian3d',
      theme: DEMO_THEME,
      legend: { show: false },
      tooltip: { show: true },
      camera: { type: 'perspective' },
      axes3d: {
        showBox: true,
        showGrid: true,
        labelMode: 'auto',
        x: { name: 'X' },
        y: { name: 'Y' },
        z: { name: 'Z' },
      },
      series: [
        {
          type: 'pointCloud3d',
          name: 'Helix',
          data: cloud,
          pointStyle: { size: 2.2, color: '#38bdf8', opacity: 0.9 },
          colorBy: { colormap: 'viridis', min: 0, max: 1.8 },
        },
      ],
    }),
    [cloud]
  );

  return (
    <ExampleCard
      id="point-cloud-3d"
      index="02 · 3D"
      title="pointCloud3d"
      description={`${POINT_COUNT.toLocaleString()} XYZ points with colorBy colormap. coordinateSystem: cartesian3d.`}
      tags={['pointCloud3d', 'colorBy', 'cartesian3d']}
      status={ready ? 'ok' : 'loading'}
      statusLabel={ready ? `${POINT_COUNT.toLocaleString()} pts` : 'Mounting…'}
      featured
      tall
      bleed
    >
      <ChartHost style={{ height: 'min(58vh, 520px)' }}>
        <ChartGPU
          options={options}
          style={{ width: '100%', height: 'min(58vh, 520px)' }}
          theme="dark"
          onReady={() => setReady(true)}
        />
      </ChartHost>
    </ExampleCard>
  );
}

// ─── Scatter density ─────────────────────────────────────────────────────────

function generateScatterPoints(count: number, seed: number): ScatterPointTuple[] {
  const mulberry32 = (a: number) => () => {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };

  const rand = mulberry32(Math.floor(seed * 1_000_000));
  const normal = () => {
    const u1 = Math.max(1e-12, rand());
    const u2 = rand();
    const r = Math.sqrt(-2.0 * Math.log(u1));
    const theta = 2.0 * Math.PI * u2;
    return r * Math.cos(theta);
  };
  const clamp = (v: number, lo: number, hi: number) => Math.min(hi, Math.max(lo, v));

  const points: ScatterPointTuple[] = [];
  for (let i = 0; i < count; i++) {
    const blob = rand() < 0.55 ? 0 : rand() < 0.7 ? 1 : 2;
    const centers = [
      [30, 55, 9, 11],
      [68, 38, 6, 8],
      [50, 72, 5, 4],
    ] as const;
    const [cx, cy, sx, sy] = centers[blob]!;
    points.push([clamp(cx + normal() * sx, 0, 100), clamp(cy + normal() * sy, 0, 100)]);
  }
  return points;
}

function ScatterDensityExample() {
  const POINT_COUNT = 500_000;
  const scatterData = useMemo(() => generateScatterPoints(POINT_COUNT, 0.42), []);
  const [ready, setReady] = useState(false);

  const options: ChartGPUOptions = useMemo(
    () => ({
      theme: DEMO_THEME,
      series: [
        {
          type: 'scatter',
          name: 'Density',
          data: scatterData,
          mode: 'density',
          binSize: 2,
          densityColormap: 'inferno',
          densityNormalization: 'log',
          sampling: 'none',
        },
      ],
      xAxis: { type: 'value' },
      yAxis: { type: 'value' },
      tooltip: { show: true, trigger: 'axis' },
      dataZoom: [{ type: 'inside' }],
      grid: { left: 56, right: 28, top: 28, bottom: 40 },
    }),
    [scatterData]
  );

  return (
    <ExampleCard
      id="scatter-density"
      index="03 · Density"
      title="Scatter density"
      description={`scatter + mode: 'density' · ${POINT_COUNT.toLocaleString()} points · binSize 2 · inferno / log.`}
      tags={["mode: density", 'binSize', 'densityColormap: inferno']}
      status={ready ? 'ok' : 'loading'}
      statusLabel={ready ? `${POINT_COUNT.toLocaleString()} pts` : 'Binning…'}
      featured
      tall
    >
      <ChartHost style={{ height: 'min(52vh, 480px)' }}>
        <ChartGPU
          options={options}
          style={{ width: '100%', height: 'min(52vh, 480px)' }}
          theme="dark"
          onReady={() => setReady(true)}
        />
      </ChartHost>
    </ExampleCard>
  );
}

// ─── Live spectrogram ────────────────────────────────────────────────────────

const TIME_BINS = 256;
const FREQ_BINS = 128;
const DT = 0.02;
const DF = 8;

function fillSpectrogramColumn(column: Float32Array, t: number): void {
  const rows = column.length;
  for (let j = 0; j < rows; j++) {
    const fNorm = j / Math.max(1, rows - 1);
    const chirp = 0.15 + 0.7 * (0.5 + 0.5 * Math.sin(t * 0.7));
    const main = Math.exp(-((fNorm - chirp) ** 2) / 0.0015);
    const harm = 0.45 * Math.exp(-((fNorm - chirp * 0.55) ** 2) / 0.002);
    const noise = 0.04 * Math.random();
    column[j] = -100 + Math.min(1, main + harm + noise) * 100;
  }
}

function SpectrogramExample() {
  const chartRef = useRef<ChartGPUHandle>(null);
  const [ready, setReady] = useState(false);
  const liveT = useRef(0);
  const z = useMemo(() => {
    const buf = new Float32Array(TIME_BINS * FREQ_BINS);
    buf.fill(-100);
    return buf;
  }, []);

  const heatmapData = useMemo(
    () => ({
      xStart: 0,
      xStep: DT,
      yStart: 20,
      yStep: DF,
      columns: TIME_BINS,
      rows: FREQ_BINS,
      z,
    }),
    [z]
  );

  const options: ChartGPUOptions = useMemo(
    () => ({
      theme: DEMO_THEME,
      animation: { duration: 0 },
      grid: { left: 64, right: 24, top: 28, bottom: 48 },
      xAxis: { type: 'value', name: 'Time (s)' },
      yAxis: { type: 'value', name: 'Frequency (Hz)' },
      tooltip: { show: true, trigger: 'item' },
      series: [
        {
          type: 'heatmap',
          name: 'Spectrogram',
          data: heatmapData,
          colormap: 'viridis',
          zMin: -100,
          zMax: 0,
          opacity: 1,
          cellAnchor: 'corner',
          nullHandling: 'transparent',
        },
      ],
    }),
    [heatmapData]
  );

  useEffect(() => {
    if (!ready) return;
    const column = new Float32Array(FREQ_BINS);
    const timer = window.setInterval(() => {
      const c = chartRef.current?.getChart();
      if (!c || c.disposed || !c.updateHeatmap) return;
      liveT.current += DT;
      fillSpectrogramColumn(column, liveT.current);
      c.updateHeatmap(0, {
        mode: 'appendColumns',
        columns: 1,
        z: column,
        scrollX: true,
      });
    }, 40);
    return () => window.clearInterval(timer);
  }, [ready]);

  return (
    <ExampleCard
      id="spectrogram"
      index="04 · Heatmap"
      title="Spectrogram stream"
      description={`type: 'heatmap' · ${TIME_BINS}×${FREQ_BINS} · updateHeatmap({ mode: 'appendColumns' }) @ ~25 Hz.`}
      tags={['type: heatmap', 'updateHeatmap', 'appendColumns']}
      status={ready ? 'ok' : 'loading'}
      statusLabel={ready ? 'Streaming' : 'Mounting…'}
      featured
      tall
    >
      <ChartHost style={{ height: 'min(48vh, 440px)' }}>
        <ChartGPU
          ref={chartRef}
          options={options}
          style={{ width: '100%', height: 'min(48vh, 440px)' }}
          theme="dark"
          onReady={() => setReady(true)}
        />
      </ChartHost>
    </ExampleCard>
  );
}

// ─── Streaming APM multi-chart ───────────────────────────────────────────────

function StreamingAPMExample() {
  const { adapter, device, pipelineCache, isReady, error } = useGPUContext();
  const aRef = useRef<ChartGPUHandle>(null);
  const bRef = useRef<ChartGPUHandle>(null);
  const cRef = useRef<ChartGPUHandle>(null);
  const [chartA, setChartA] = useState<ChartGPUInstance | null>(null);
  const [chartB, setChartB] = useState<ChartGPUInstance | null>(null);
  const [chartC, setChartC] = useState<ChartGPUInstance | null>(null);

  useConnectCharts([chartA, chartB, chartC], { syncZoom: true });

  const gpuContext = useMemo<ChartGPUCreateContext | undefined>(() => {
    if (!adapter || !device) return undefined;
    return pipelineCache ? { adapter, device, pipelineCache } : { adapter, device };
  }, [adapter, device, pipelineCache]);

  const mkOptions = (name: string, color: string, seed: number, area?: string): ChartGPUOptions => ({
    theme: DEMO_THEME,
    autoScroll: true,
    series: [
      {
        type: 'line',
        name,
        data: generateLineData(280, seed),
        lineStyle: { width: 2, color },
        ...(area ? { areaStyle: { color: area } } : {}),
      },
    ],
    xAxis: { type: 'value' },
    yAxis: { type: 'value' },
    tooltip: { show: true, trigger: 'axis' },
    dataZoom: [{ type: 'inside', start: 70, end: 100 }],
    grid: { left: 52, right: 20, top: 28, bottom: 24 },
    legend: { show: true },
  });

  const optionsA = useMemo(() => mkOptions('p99 latency', '#4facfe', 0.1), []);
  const optionsB = useMemo(
    () => mkOptions('throughput', '#c9a227', 1.7, 'rgba(201,162,39,0.12)'),
    []
  );
  const optionsC = useMemo(
    () => mkOptions('error rate', '#f093fb', 2.8, 'rgba(240,147,251,0.1)'),
    []
  );

  useEffect(() => {
    if (!isReady) return;
    let x = 280;
    const timer = window.setInterval(() => {
      x += 1;
      const maxPoints = 500;
      aRef.current?.appendData(
        0,
        [{ x, y: 40 + Math.sin(x * 0.03) * 25 + Math.random() * 5 }],
        { maxPoints }
      );
      bRef.current?.appendData(
        0,
        [{ x, y: 55 + Math.cos(x * 0.02) * 22 + Math.random() * 6 }],
        { maxPoints }
      );
      cRef.current?.appendData(
        0,
        [{ x, y: 8 + Math.abs(Math.sin(x * 0.05)) * 6 + Math.random() * 2 }],
        { maxPoints }
      );
    }, 80);
    return () => window.clearInterval(timer);
  }, [isReady]);

  const status: ExampleStatus = error ? 'error' : isReady ? 'ok' : 'loading';

  return (
    <ExampleCard
      id="streaming-apm"
      index="05 · Multi-chart"
      title="Streaming multi-chart"
      description="useGPUContext + useConnectCharts({ syncZoom: true }) + appendData with maxPoints."
      tags={['useGPUContext', 'useConnectCharts', 'appendData', 'maxPoints']}
      status={status}
      statusLabel={error ? 'WebGPU unavailable' : isReady ? 'Streaming' : 'GPU…'}
      featured
      stack
      meta={error ? <p>{error.message}</p> : undefined}
    >
      {gpuContext ? (
        <>
          <ChartHost>
            <ChartGPU
              ref={aRef}
              options={optionsA}
              gpuContext={gpuContext}
              onReady={setChartA}
              style={{ width: '100%', height: '160px' }}
              theme="dark"
            />
          </ChartHost>
          <ChartHost>
            <ChartGPU
              ref={bRef}
              options={optionsB}
              gpuContext={gpuContext}
              onReady={setChartB}
              style={{ width: '100%', height: '160px' }}
              theme="dark"
            />
          </ChartHost>
          <ChartHost>
            <ChartGPU
              ref={cRef}
              options={optionsC}
              gpuContext={gpuContext}
              onReady={setChartC}
              style={{ width: '100%', height: '160px' }}
              theme="dark"
            />
          </ChartHost>
        </>
      ) : (
        <div className="example-empty">
          {error ? 'WebGPU unavailable.' : 'Initializing shared GPU context…'}
        </div>
      )}
    </ExampleCard>
  );
}

// ─── Confidence band ─────────────────────────────────────────────────────────

function BandConfidenceExample() {
  const n = 200;
  const series = useMemo(() => {
    const x = new Float64Array(n);
    const mean = new Float64Array(n);
    const lo = new Float64Array(n);
    const hi = new Float64Array(n);
    for (let i = 0; i < n; i++) {
      const t = i / (n - 1);
      x[i] = t * 10;
      const m = Math.sin(t * Math.PI * 2.2) * 0.45 + Math.cos(t * Math.PI * 0.8) * 0.2 + 0.5;
      const s = 0.08 + 0.06 * Math.sin(t * 6);
      mean[i] = m;
      lo[i] = m - s;
      hi[i] = m + s;
    }
    return { x, mean, lo, hi };
  }, []);

  const options: ChartGPUOptions = useMemo(
    () => ({
      theme: DEMO_THEME,
      animation: false,
      grid: { left: 56, right: 24, top: 28, bottom: 44 },
      xAxis: { type: 'value', name: 't' },
      yAxis: { type: 'value', name: 'Value' },
      tooltip: { show: true, trigger: 'axis' },
      legend: { show: true },
      dataZoom: [{ type: 'inside' }],
      series: [
        {
          type: 'band',
          name: '±1σ',
          data: { x: series.x, y: series.lo, y1: series.hi },
          areaStyle: { color: '#38bdf8', opacity: 0.28 },
          lineStyle: { width: 1.2, color: '#38bdf8', opacity: 0.7 },
          lineStyleY1: { width: 1.2, color: '#f472b6', opacity: 0.7 },
          sampling: 'none',
        },
        {
          type: 'line',
          name: 'Mean',
          data: { x: series.x, y: series.mean },
          lineStyle: { width: 2.2, color: '#f8fafc' },
          sampling: 'none',
        },
      ],
    }),
    [series]
  );

  return (
    <ExampleCard
      id="band-confidence"
      index="06 · Band"
      title="Band series"
      description="type: 'band' with data { x, y, y1 }, lineStyle / lineStyleY1, plus mean line overlay."
      tags={['type: band', 'lineStyleY1', 'areaStyle']}
      status="ok"
      statusLabel="Static"
    >
      <ChartHost>
        <ChartGPU options={options} style={{ width: '100%', height: '320px' }} theme="dark" />
      </ChartHost>
    </ExampleCard>
  );
}

// ─── Candlestick streaming ───────────────────────────────────────────────────

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
    out.push({
      timestamp: ts,
      open,
      close,
      high: Math.max(open, close) + 0.6,
      low: Math.min(open, close) - 0.6,
    });
    lastClose = close;
  }
  return out;
}

function CandlestickExample() {
  const ref = useRef<ChartGPUHandle>(null);
  const initial = useMemo(() => seedCandles(100, 1000, 100), []);
  const last = initial[initial.length - 1]!;
  const lastCloseRef = useRef(last.close);
  const lastTsRef = useRef(last.timestamp);

  const options: ChartGPUOptions = useMemo(
    () => ({
      theme: DEMO_THEME,
      legend: { show: false },
      xAxis: { type: 'time' },
      yAxis: { type: 'value' },
      tooltip: { show: true, trigger: 'axis' },
      dataZoom: [
        { type: 'inside', start: 75, end: 100 },
        { type: 'slider', start: 75, end: 100 },
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
      // Extra right gutter for the auto priceLabel badge + last candle wick.
      grid: { left: 56, right: 72, top: 28, bottom: 52 },
    }),
    [initial]
  );

  useEffect(() => {
    const timer = window.setInterval(() => {
      const open = lastCloseRef.current;
      const close = open + (Math.random() - 0.5) * 2;
      const high = Math.max(open, close) + Math.random() * 1.2;
      const low = Math.min(open, close) - Math.random() * 1.2;
      const timestamp = lastTsRef.current + 1000;
      lastTsRef.current = timestamp;
      lastCloseRef.current = close;
      ref.current?.appendData(0, [{ timestamp, open, close, high, low }]);
    }, 450);
    return () => window.clearInterval(timer);
  }, []);

  return (
    <ExampleCard
      id="candlestick"
      index="07 · Candles"
      title="Candlestick appendData"
      description="type: 'candlestick', sampling: 'ohlc', autoScroll, appendData every 450ms."
      tags={['candlestick', 'appendData', "sampling: ohlc"]}
      status="ok"
      statusLabel="Streaming"
    >
      <ChartHost style={{ overflow: 'visible' }}>
        <ChartGPU ref={ref} options={options} style={{ width: '100%', height: '360px' }} theme="dark" />
      </ChartHost>
    </ExampleCard>
  );
}

// ─── Synced hooks (React-specific) ───────────────────────────────────────────

function SyncedHooksExample() {
  const { adapter, device, pipelineCache, isReady, error } = useGPUContext();
  const [a, setA] = useState<ChartGPUInstance | null>(null);
  const [b, setB] = useState<ChartGPUInstance | null>(null);
  useConnectCharts([a, b], { syncZoom: true });

  const gpuContext = useMemo<ChartGPUCreateContext | undefined>(() => {
    if (!adapter || !device) return undefined;
    return pipelineCache ? { adapter, device, pipelineCache } : { adapter, device };
  }, [adapter, device, pipelineCache]);

  const top = useMemo(
    (): ChartGPUOptions => ({
      theme: DEMO_THEME,
      series: [
        {
          type: 'line',
          name: 'Alpha',
          data: generateLineData(1200, 0.2),
          lineStyle: { width: 2, color: '#4facfe' },
          areaStyle: { color: 'rgba(79,172,254,0.1)' },
        },
      ],
      xAxis: { type: 'value' },
      yAxis: { type: 'value' },
      tooltip: { show: true, trigger: 'axis' },
      dataZoom: [{ type: 'inside' }],
      grid: { left: 52, right: 24, top: 28, bottom: 28 },
    }),
    []
  );

  const bottom = useMemo(
    (): ChartGPUOptions => ({
      theme: DEMO_THEME,
      series: [
        {
          type: 'line',
          name: 'Beta',
          data: generateLineData(1200, 1.4),
          lineStyle: { width: 2, color: '#c9a227' },
        },
      ],
      xAxis: { type: 'value' },
      yAxis: { type: 'value' },
      tooltip: { show: true, trigger: 'axis' },
      dataZoom: [{ type: 'inside' }],
      grid: { left: 52, right: 24, top: 28, bottom: 28 },
    }),
    []
  );

  if (error) {
    return (
      <ExampleCard
        id="synced-hooks"
        index="08 · Sync"
        title="useConnectCharts"
        description="useGPUContext + useConnectCharts([a, b], { syncZoom: true })."
        tags={['useGPUContext', 'useConnectCharts']}
        status="error"
        statusLabel="WebGPU unavailable"
        meta={<p>{error.message}</p>}
      >
        <div className="example-empty">WebGPU not supported.</div>
      </ExampleCard>
    );
  }

  return (
    <ExampleCard
      id="synced-hooks"
      index="08 · Sync"
      title="useConnectCharts"
      description="useGPUContext + useConnectCharts([a, b], { syncZoom: true })."
      tags={['useGPUContext', 'useConnectCharts', 'gpuContext']}
      status={isReady ? 'ok' : 'loading'}
      statusLabel={isReady ? 'Synced' : 'GPU…'}
      stack
    >
      {gpuContext && isReady ? (
        <>
          <ChartHost>
            <ChartGPU
              options={top}
              gpuContext={gpuContext}
              onReady={setA}
              style={{ width: '100%', height: '200px' }}
              theme="dark"
            />
          </ChartHost>
          <ChartHost>
            <ChartGPU
              options={bottom}
              gpuContext={gpuContext}
              onReady={setB}
              style={{ width: '100%', height: '200px' }}
              theme="dark"
            />
          </ChartHost>
        </>
      ) : (
        <div className="example-empty">Initializing GPU…</div>
      )}
    </ExampleCard>
  );
}

// ─── Mount ───────────────────────────────────────────────────────────────────

function DemosApp() {
  return (
    <>
      <PointCloud3DExample />
      <ScatterDensityExample />
      <SpectrogramExample />
      <StreamingAPMExample />
      <div className="pair">
        <BandConfidenceExample />
        <CandlestickExample />
      </div>
      <SyncedHooksExample />
    </>
  );
}

const heroRoot = document.getElementById('hero-root');
if (heroRoot) {
  createRoot(heroRoot).render(<Hero3DExample />);
}

const rootElement = document.getElementById('root');
if (rootElement) {
  createRoot(rootElement).render(<DemosApp />);
} else {
  console.error('Root element not found');
}
