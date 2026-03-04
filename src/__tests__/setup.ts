import '@testing-library/jest-dom';

// jsdom does not implement ResizeObserver. Provide a no-op stub so components
// that create a ResizeObserver don't throw during tests.
globalThis.ResizeObserver = class ResizeObserver {
  observe() {}
  unobserve() {}
  disconnect() {}
};

// jsdom does not implement navigator.gpu. Provide a stub so the WebGPU
// support check in useChartGPU passes by default.
Object.defineProperty(navigator, 'gpu', {
  value: {},
  configurable: true,
  writable: true,
});
