import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  resolve: {
    // The monorepo hoists more than one React copy (web-example pulls 19.2.7,
    // the RN/Expo workspace pins 19.2.3 at the root). Dedupe so the dev bundle
    // resolves a single react / react-dom and avoids the "Incompatible React
    // versions" runtime crash.
    dedupe: ['react', 'react-dom'],
  },
  optimizeDeps: {
    // vworld-map-* are workspace packages emitted as CommonJS; force Vite to
    // pre-bundle them so their named ESM exports (VWorldMapView, …) resolve in
    // the dev server instead of failing with "does not provide an export".
    include: ['vworld-map-web', 'vworld-map-core'],
  },
})
