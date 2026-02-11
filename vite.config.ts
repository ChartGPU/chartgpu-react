import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import dts from 'vite-plugin-dts';
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

  // Build mode: library output
  return {
    plugins: [
      react(),
      dts({
        insertTypesEntry: true,
        rollupTypes: true,
        tsconfigPath: './tsconfig.build.json',
      }),
    ],
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
    },
  };
});
