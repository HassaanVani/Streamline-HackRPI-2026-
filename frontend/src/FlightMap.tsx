import { useEffect, useRef, useState } from 'react';
import * as maplibregl from 'maplibre-gl';
import { Compass, Minus, Plus, RotateCcw, Wind } from 'lucide-react';
import type { Scenario } from './types';

function unwrap(coords:number[][]) {
  let last=coords[0][0];
  return coords.map(([lon,lat])=>{while(lon-last>180)lon-=360;while(lon-last< -180)lon+=360;last=lon;return [lon,Math.max(-85,Math.min(85,lat))]});
}

export default function FlightMap({scenario,showWinds,onToggleWinds,showAlternative,segment}:{scenario:Scenario|null,showWinds:boolean,onToggleWinds:()=>void,showAlternative:boolean,segment:number}) {
  const container=useRef<HTMLDivElement>(null),canvas=useRef<HTMLCanvasElement>(null);
  const map=useRef<maplibregl.Map|null>(null);
  const current=useRef({scenario,showWinds,showAlternative,segment});
  current.current={scenario,showWinds,showAlternative,segment};
  const [ready,setReady]=useState(false),[tileFailure,setTileFailure]=useState(false);
  const markers=useRef<maplibregl.Marker[]>([]);
  const draw=useRef(()=>{});
  const fit=useRef(()=>{});
  useEffect(()=>{
    if(!container.current)return;
    setReady(false);
    let m:maplibregl.Map;
    try {
      m=new maplibregl.Map({container:container.current,center:[-35,47],zoom:2.2,minZoom:1,maxZoom:9,dragRotate:false,pitchWithRotate:false,attributionControl:{compact:true},
        style:{version:8,sources:{land:{type:'geojson',data:'/world.geojson',attribution:'<a href="https://www.naturalearthdata.com/about/terms-of-use/">Natural Earth · public domain</a>'}},
          layers:[{id:'background',type:'background',paint:{'background-color':'#192f38'}},{id:'land',type:'fill',source:'land',paint:{'fill-color':'#30464c','fill-opacity':.85}},{id:'borders',type:'line',source:'land',paint:{'line-color':'#5b7679','line-width':.7,'line-opacity':.45}}]}});
    }catch{setTileFailure(true);return;}
    map.current=m;
    m.touchZoomRotate.disableRotation();
    m.on('error',()=>setTileFailure(true));
    draw.current=()=>{
      const c=canvas.current,ctx=c?.getContext('2d');if(!c||!ctx)return;
      const bounds=container.current!.getBoundingClientRect(),dpr=window.devicePixelRatio||1;
      c.width=bounds.width*dpr;c.height=bounds.height*dpr;ctx.scale(dpr,dpr);ctx.clearRect(0,0,bounds.width,bounds.height);
      const state=current.current;
      if(!state.scenario||!state.showWinds)return;
      const center=m.getCenter().lng;
      for(const w of state.scenario.winds.samples){
        const speed=Math.hypot(w.u_mps,w.v_mps);if(speed<.05)continue;
        let lon=w.lon;while(lon-center>180)lon-=360;while(lon-center< -180)lon+=360;
        const p=m.project([lon,Math.max(-85,Math.min(85,w.lat))]);
        if(p.x<0||p.y<0||p.x>bounds.width||p.y>bounds.height)continue;
        const angle=Math.atan2(-w.v_mps,w.u_mps),length=11+Math.min(26,speed*.45);
        ctx.save();ctx.translate(p.x,p.y);ctx.rotate(angle);ctx.strokeStyle=`rgba(158,224,212,${.22+Math.min(.35,speed/150)})`;ctx.lineWidth=1.2;
        ctx.beginPath();ctx.moveTo(-length/2,0);ctx.lineTo(length/2,0);ctx.moveTo(length/2-4,-3);ctx.lineTo(length/2,0);ctx.lineTo(length/2-4,3);ctx.stroke();ctx.restore();
      }
    };
    fit.current=()=>{
      const s=current.current.scenario;if(!s)return;
      const coords=unwrap(s.routes.features[0].geometry.coordinates);
      const bounds=new maplibregl.LngLatBounds(coords[0] as [number,number],coords[0] as [number,number]);
      for(const p of coords)bounds.extend(p as [number,number]);
      // fitBounds retains global padding; reset it before repeated resize fits.
      m.setPadding({top:0,bottom:0,left:0,right:0});
      m.fitBounds(bounds,{padding:{top:145,bottom:95,left:65,right:65},maxZoom:6,duration:0});
    };
    m.on('move',()=>draw.current());m.on('resize',()=>{draw.current();fit.current();});
    m.on('style.load',()=>{
      m.addSource('routes',{type:'geojson',data:{type:'FeatureCollection',features:[]}});
      m.addLayer({id:'baseline',type:'line',source:'routes',filter:['==',['get','kind'],'great_circle'],paint:{'line-color':'#b9c7ce','line-width':2,'line-opacity':.75}});
      m.addLayer({id:'alternative-glow',type:'line',source:'routes',filter:['==',['get','kind'],'wind_optimized'],paint:{'line-color':'#5ce2c2','line-width':10,'line-opacity':.08,'line-blur':4}});
      m.addLayer({id:'alternative',type:'line',source:'routes',filter:['==',['get','kind'],'wind_optimized'],paint:{'line-color':'#71e3c8','line-width':3,'line-dasharray':[3,2]}});
      m.addSource('segment',{type:'geojson',data:{type:'FeatureCollection',features:[]}});
      m.addLayer({id:'segment',type:'circle',source:'segment',paint:{'circle-radius':5,'circle-color':'#fff','circle-stroke-color':'#71e3c8','circle-stroke-width':3}});
      setReady(true);
    });
    return()=>{markers.current.forEach(marker=>marker.remove());m.remove();map.current=null;};
  },[]);
  useEffect(()=>{
    const m=map.current;if(!m||!ready||!scenario)return;
    const features=scenario.routes.features.map(f=>({...f,geometry:{...f.geometry,coordinates:unwrap(f.geometry.coordinates)}}));
    (m.getSource('routes') as maplibregl.GeoJSONSource).setData({type:'FeatureCollection',features} as GeoJSON.FeatureCollection);
    markers.current.forEach(marker=>marker.remove());
    const points=unwrap(scenario.routes.features[0].geometry.coordinates);
    markers.current=[scenario.origin,scenario.destination].map((airport,i)=>{
      const el=document.createElement('div');el.className='airport-marker';el.setAttribute('aria-label',`${airport.iata||airport.id}: ${airport.name}`);
      const dot=document.createElement('i');const label=document.createElement('span');
      label.textContent=airport.iata||airport.id;el.append(dot,label);
      return new maplibregl.Marker({element:el,anchor:'center'}).setLngLat(points[i===0?0:points.length-1] as [number,number]).addTo(m);
    });
    fit.current();draw.current();
  },[scenario,ready]);
  useEffect(()=>{
    const m=map.current;if(!m||!ready)return;
    for(const id of ['alternative','alternative-glow'])m.setLayoutProperty(id,'visibility',showAlternative?'visible':'none');
    const selected=scenario?.metrics[showAlternative?'wind_optimized':'great_circle'].segment_metrics[segment];
    const center=m.getCenter().lng;
    let lon=selected?.lon||0;while(lon-center>180)lon-=360;while(lon-center< -180)lon+=360;
    (m.getSource('segment') as maplibregl.GeoJSONSource).setData({type:'FeatureCollection',features:selected?[{type:'Feature',properties:{},geometry:{type:'Point',coordinates:[lon,selected.lat]}}]:[]});
    draw.current();
  },[scenario,showWinds,showAlternative,segment,ready]);
  return <section className="map-panel" aria-label="Journey map"><div ref={container} className="map-canvas"/><canvas ref={canvas} className="wind-canvas" aria-hidden="true"/>
    <div className="map-heading"><span className="eyebrow">THE ATMOSPHERE, REVEALED</span><h2>There’s more to the journey<br/>than the line on a map.</h2><p>Why might a plane fly this way?</p></div>
    <div className="map-top-right"><span className="map-status"><i/>250 hPa · {scenario&&!scenario.wind_enabled?'zero-wind counterfactual':'frozen wind field'}</span></div>
    <div className="map-controls"><button onClick={()=>map.current?.zoomIn()} aria-label="Zoom in"><Plus size={18}/></button><button onClick={()=>map.current?.zoomOut()} aria-label="Zoom out"><Minus size={18}/></button><button onClick={()=>fit.current()} aria-label="Fit journey"><RotateCcw size={16}/></button></div>
    <div className="map-bottom"><div className="legend"><span><i className="baseline-line"/>Shortest distance</span>{showAlternative&&<span><i className="alternative-line"/>Wind-based alternative</span>}</div><button className={`wind-layer ${showWinds?'selected':''}`} onClick={onToggleWinds} aria-pressed={showWinds}><Wind size={16}/>Wind arrows <span>{showWinds?'On':'Off'}</span></button></div>
    {tileFailure&&<p className="map-error" role="status">Map imagery is unavailable. Route metrics and the full text comparison remain available.</p>}
    <div className="map-coordinate"><Compass size={13}/>WGS84 · MODEL EXPLORER</div>
  </section>
}
