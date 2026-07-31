# Changelog

## 0.3.1

Aligned with **@chartgpu/chartgpu ^0.3.9**.

### Dependencies

- Peer / dev: `@chartgpu/chartgpu` **^0.3.9** (was ^0.3.6)

### Docs

- README redesigned to match the ChartGPU core repository layout (cleaner header, overview, install, features, browser support tables)
- Version pins updated in getting started, examples, and source comments

## 0.3.0

Aligned with **@chartgpu/chartgpu ^0.3.6** and modern React/TypeScript tooling.

### Dependencies

- Peer: `@chartgpu/chartgpu` **^0.3.6** (was ^0.2.8)
- Peer: React **≥18** (dev/tested on **React 19.2**)
- Dev: **TypeScript 7.0**, Vite 7, Vitest 4, `@types/react` 19

### API

- `ChartGPUHandle.appendData` accepts optional `{ maxPoints }` for FIFO / fixed-capacity streaming (ChartGPU 0.3.x)
- `ChartGPUHandle.setZoomRange` passes optional `source` through to core
- `CartesianSeriesData` allows `null` gaps (matches core)
- Expanded type re-exports: heatmap, band, errorBar, impulse, OHLC, 3D series, `ZoomChangeSourceKind`, etc.
- New exported type: `ChartGPUAppendDataOptions`

### Tooling

- Build: Vite (ESM bundle) + `tsc` declaration emit  
  (`vite-plugin-dts` is incompatible with TypeScript 7’s slim package API)
- Package name restored to **`chartgpu-react`** for npmjs.org (GitHub Packages still scopes at publish)
- Test coverage for handle/hooks 0.3.x: `appendData`/`maxPoints`, `setZoomRange` source, external render, `useConnectCharts`, `useGPUContext`, `gpuContext` create path, `onDataAppend`/`onDeviceLost`, export smoke

### Examples

- Streaming multi-chart demos use `appendData(..., { maxPoints })`
