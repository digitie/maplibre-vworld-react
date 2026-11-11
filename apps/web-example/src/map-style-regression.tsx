import { useState } from "react";
import { createRoot } from "react-dom/client";
import type { Map as LibreMap, StyleSpecification } from "maplibre-gl";
import { VWorldMapView, PinMarker } from "vworld-map-web";
const firstStyle:StyleSpecification={version:8,sources:{},layers:[{id:"background",type:"background",paint:{"background-color":"#ffffff"}}]};
const secondStyle:StyleSpecification={version:8,sources:{},layers:[{id:"background",type:"background",paint:{"background-color":"#ddeeff"}}]};
declare global { interface Window { styleProbe:{map:LibreMap|null;firstMap:LibreMap|null;loads:number} } }
window.styleProbe={map:null,firstMap:null,loads:0};
export function Fixture(){
 const [alternate,setAlternate]=useState(false);
 return <><button onClick={()=>setAlternate(value=>!value)}>스타일 변경</button><div className="map-shell">
  <VWorldMapView apiKey="" mapStyle={alternate?secondStyle:firstStyle} center={[127,37.5]} zoom={10} maxZoom={22} navigation={false} geolocate={false} scale={false} onLoad={map=>{window.styleProbe.map=map;window.styleProbe.firstMap??=map;window.styleProbe.loads++;}}>
   <PinMarker lngLat={[127,37.5]} ariaLabel="로컬 마커" onClick={()=>undefined}/>
  </VWorldMapView>
 </div><VWorldMapView apiKey="" fallback={info=><p role="status">{info.reason}</p>}/></>;
}
createRoot(document.getElementById("root")!).render(<Fixture/>);
