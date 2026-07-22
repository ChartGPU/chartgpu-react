import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { resolve } from 'path';

export default defineConfig(({ command }) => {
  // Dev mode: serve examples
  if (command === 'serve') {
    return {
      plugins: [react()],
      root: '.',
      publicDir: false,
      server: {
        port: 3000,
        open: '/examples/index.html',
      },
    };
  }

  // Build mode: library JS only (declarations via `tsc -p tsconfig.build.json`)
  // Note: vite-plugin-dts is incompatible with TypeScript 7's slim package API.
  return {
    plugins: [react()],
    build: {
      lib: {
        entry: resolve(__dirname, 'src/index.ts'),
        formats: ['es'],
        fileName: () => 'index.js',
      },
      rollupOptions: {
        external: ['react', 'react-dom', 'react/jsx-runtime', '@chartgpu/chartgpu'],
        output: {
          preserveModules: false,
        },
      },
      outDir: 'dist',
      emptyOutDir: true,
      sourcemap: true,
    },
  };
});
