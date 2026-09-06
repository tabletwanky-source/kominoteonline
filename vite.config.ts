import path from 'path';
import { createRequire } from 'module';

const require = createRequire(import.meta.url);

// Use require() to load plugins — bypasses rolldown's broken ESM resolution
const tailwindcss = require('@tailwindcss/vite');
const react = require('@vitejs/plugin-react');

export default {
  plugins: [react.default ? react.default() : react(), tailwindcss.default ? tailwindcss.default() : tailwindcss()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, '.'),
    },
  },
  server: {
    hmr: process.env.DISABLE_HMR !== 'true',
    watch: process.env.DISABLE_HMR === 'true' ? null : {},
  },
};
