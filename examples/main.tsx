import React, { useState, useCallback } from 'react';
import { createRoot } from 'react-dom/client';
import { ChartGPUChart } from '../src/ChartGPUChart';
import type { ChartGPUOptions, ChartGPUInstance } from '../src';

function LineChartExample() {
  const [chartInstance, setChartInstance] = useState<ChartGPUInstance | null>(null);
  const [error, setError] = useState<string | null>(null);

  // Generate sample data
  const generateLineData = useCallback((points: number = 5000000) => {
    const data = [];
    for (let i = 0; i < points; i++) {
      const x = i;
      const y = Math.sin(i * 0.1) * 50 + Math.random() * 10;
      data.push({ x, y });
    }
    return data;
  }, []);

  const options: ChartGPUOptions = {
    series: [
      {
        type: 'line',
        name: 'Sample Line Series',
        data: generateLineData(),
        lineStyle: {
          width: 2,
          color: '#667eea',
        },
        areaStyle: {
          color: 'rgba(102, 126, 234, 0.2)',
        },
      },
    ],
    xAxis: {
      type: 'value',
    },
    yAxis: {
      type: 'value',
    },
    grid: {
      left: 60,
      right: 40,
      top: 40,
      bottom: 40,
    },
    tooltip: {
      show: true,
    },
  };

  const handleInit = useCallback((instance: ChartGPUInstance) => {
    console.log('Chart initialized:', instance);
    setChartInstance(instance);
    setError(null);
  }, []);

  const handleDispose = useCallback(() => {
    console.log('Chart disposed');
    setChartInstance(null);
  }, []);

  const handleError = useCallback((err: Error) => {
    console.error('Chart error:', err);
    setError(err.message);
  }, []);

  return (
    <div className="example-section">
      <h2 className="example-title">Line Chart with Area Fill</h2>
      
      <div className="info-box">
        <strong>Features:</strong> Line series with area fill, smooth animation, WebGPU-accelerated rendering
        <br />
        <strong>Data Points:</strong> 100 points with sine wave pattern
        <br />
        {chartInstance && !chartInstance.disposed && (
          <strong style={{ color: '#90ee90' }}>✓ Chart Active</strong>
        )}
      </div>

      {error && (
        <div className="error-message">
          <strong>Error:</strong> {error}
          <br />
          <small>
            WebGPU may not be available in your browser. 
            Chrome/Edge 113+, Safari 18+ required.
          </small>
        </div>
      )}

      <div className="chart-container">
        <ChartGPUChart
          options={options}
          style={{
            width: '100%',
            height: '400px',
          }}
          onInit={handleInit}
          onDispose={handleDispose}
        />
      </div>
    </div>
  );
}

function MultiSeriesExample() {
  const options: ChartGPUOptions = {
    series: [
      {
        type: 'line',
        name: 'Revenue',
        data: Array.from({ length: 500000 }, (_, i) => ({
          x: i,
          y: 100 + Math.random() * 5000000 + i * 2,
        })),
        lineStyle: {
          width: 2,
          color: '#667eea',
        },
      },
      {
        type: 'line',
        name: 'Expenses',
        data: Array.from({ length: 500000 }, (_, i) => ({
          x: i,
          y: 80 + Math.random() * 60 + i * 1.5,
        })),
        lineStyle: {
          width: 2,
          color: '#f093fb',
        },
      },
      {
        type: 'line',
        name: 'Profit',
        data: Array.from({ length: 500000 }, (_, i) => ({
          x: i,
          y: 20 + Math.random() * 40 + i * 0.5,
        })),
        lineStyle: {
          width: 2,
          color: '#4facfe',
        },
      },
    ],
    xAxis: {
      type: 'value',
    },
    yAxis: {
      type: 'value',
    },
    grid: {
      left: 60,
      right: 40,
      top: 40,
      bottom: 40,
    },
    tooltip: {
      show: true,
    },
  };

  return (
    <div className="example-section">
      <h2 className="example-title">Multi-Series Line Chart</h2>
      
      <div className="info-box">
        <strong>Features:</strong> Multiple line series, automatic color scheme, efficient WebGPU rendering
        <br />
        <strong>Series:</strong> Revenue, Expenses, Profit
      </div>

      <div className="chart-container">
        <ChartGPUChart
          options={options}
          style={{
            width: '100%',
            height: '400px',
          }}
        />
      </div>
    </div>
  );
}

function App() {
  return (
    <>
      <LineChartExample />
      <MultiSeriesExample />
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
