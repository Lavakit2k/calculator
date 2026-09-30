import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// Base-Pfad für GitHub Pages: BASE_PATH=/repo-name/ npm run build
const base = process.env.BASE_PATH ?? '/';

export default defineConfig({
  base,
  plugins: [react()],
});
