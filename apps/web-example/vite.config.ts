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
    // vworld-map-core is a workspace package emitted as CommonJS; force Vite to
    // pre-bundle it so its named ESM exports resolve in the dev server instead
    // of failing with "does not provide an export". vworld-map-web is native
    // ESM (see its package.json) and does not need this.
    include: ['vworld-map-core'],
    // maplibre-gl v6 spawns its tile-parsing Worker via `new Worker(new
    // URL('maplibre-gl-worker.mjs', import.meta.url))`. esbuild's dep
    // optimizer (used for the deps above) rewrites that URL to a synthetic
    // module id and never emits the corresponding chunk under
    // node_modules/.vite/deps, so the Worker constructor 404s at runtime
    // ("... maplibre-gl-worker.mjs ... does not exist ..."). Excluding it
    // leaves maplibre-gl's own ESM build untouched, where the URL resolves
    // correctly.
    exclude: ['maplibre-gl'],
  },
})
