import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const projectRoot = path.dirname(fileURLToPath(import.meta.url));

export default defineConfig({
  root: path.join(projectRoot, 'apps/desktop'),
  build: {
    outDir: path.join(projectRoot, 'dist/client'),
    emptyOutDir: true,
  },
  optimizeDeps: {
    include: ['react', 'react-dom/client'],
  },
  server: {
    host: '0.0.0.0',
    allowedHosts: ['terminal.local'],
    warmup: {
      clientFiles: ['./src/main.tsx'],
    },
  },
  plugins: [react()],
});
