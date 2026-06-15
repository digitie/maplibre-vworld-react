import { useState } from 'react';
import { VWorldMapView } from 'vworld-map-web';
import type { VWorldLayerType } from 'vworld-map-web';

// Injected at build time from the environment — never hardcode the VWorld key
// (AGENTS.md). Copy .env.example to .env.local and set VITE_VWORLD_API_KEY.
// When empty, VWorldMapView renders its missing-api-key fallback.
const VWORLD_API_KEY = import.meta.env.VITE_VWORLD_API_KEY ?? '';

function App() {
  const [layerType, setLayerType] = useState<VWorldLayerType>('Base');

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100vh', width: '100vw' }}>
      <div style={{ padding: '10px', backgroundColor: '#f0f0f0', display: 'flex', gap: '10px', alignItems: 'center' }}>
        <strong>VWorld MapLibre (Web)</strong>
        <button onClick={() => setLayerType('Base')}>Base</button>
        <button onClick={() => setLayerType('Satellite')}>Satellite</button>
        <button onClick={() => setLayerType('Hybrid')}>Hybrid</button>
        <button onClick={() => setLayerType('midnight')}>Midnight</button>
      </div>
      <div style={{ flex: 1 }}>
        <VWorldMapView
          apiKey={VWORLD_API_KEY}
          layerType={layerType}
          center={[126.9780, 37.5665]}
          zoom={14}
        />
      </div>
    </div>
  );
}

export default App;
