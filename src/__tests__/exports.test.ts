/**
 * Export smoke test — fails CI if documented public surface is renamed/removed.
 * Runtime values are asserted; types are compile-only imports (typecheck gate).
 */

import { describe, it, expect, vi } from 'vitest';

// Mock peer package so re-exports resolve without a real WebGPU runtime.
vi.mock('@chartgpu/chartgpu', () => {
  return {
    ChartGPU: { create: vi.fn() },
    createChart: vi.fn(),
    connectCharts: vi.fn(),
    createPipelineCache: vi.fn(),
    destroyPipelineCache: vi.fn(),
    getPipelineCacheStats: vi.fn(),
  };
});

import * as pkg from '../index';

// Compile-only: ensure 0.3.x types remain importable from the package root.
import type {
  ChartGPUAppendDataOptions,
  ChartGPUHandle,
  ChartGPUProps,
  ChartGPUCreateContext,
  HeatmapUpdate,
  RenderMode,
  ChartSyncOptions,
  UseGPUContextResult,
  UseChartGPUResult,
} from '../index';

// Keep type imports "used" for noUnusedLocals without runtime cost.
type _Surface = [
  ChartGPUAppendDataOptions,
  ChartGPUHandle,
  ChartGPUProps,
  ChartGPUCreateContext,
  HeatmapUpdate,
  RenderMode,
  ChartSyncOptions,
  UseGPUContextResult,
  UseChartGPUResult,
];
const _typesOk: _Surface | undefined = undefined;
void _typesOk;

describe('package exports', () => {
  it('exports the primary React component and hooks', () => {
    // forwardRef components are objects (exotic component), not plain functions
    expect(pkg.ChartGPU).toBeTruthy();
    expect(typeof pkg.ChartGPU === 'function' || typeof pkg.ChartGPU === 'object').toBe(true);

    expect(pkg.useChartGPU).toBeTypeOf('function');
    expect(pkg.useGPUContext).toBeTypeOf('function');
    expect(pkg.useConnectCharts).toBeTypeOf('function');
  });

  it('re-exports documented ChartGPU helpers', () => {
    expect(pkg.connectCharts).toBeTypeOf('function');
    expect(pkg.createChart).toBeTypeOf('function');
    expect(pkg.createPipelineCache).toBeTypeOf('function');
    expect(pkg.destroyPipelineCache).toBeTypeOf('function');
    expect(pkg.getPipelineCacheStats).toBeTypeOf('function');
    expect(pkg.createAnnotationAuthoring).toBeTypeOf('function');
  });

  it('still exports the deprecated ChartGPUChart adapter', () => {
    expect(pkg.ChartGPUChart).toBeTruthy();
    expect(typeof pkg.ChartGPUChart === 'function' || typeof pkg.ChartGPUChart === 'object').toBe(
      true
    );
  });
});
