import { useEffect, useRef, useState } from 'react';
import { ArrowDown, ArrowLeftRight, ArrowRight, Check, ChevronDown, ChevronRight, Cloud, Download, ExternalLink, Globe2, Info, LoaderCircle, Plane, RotateCcw, Route, Wind, X } from 'lucide-react';
import AirportSearch from './AirportSearch';
import FlightMap from './FlightMap';
import type { Airport, Example, Job, Scenario } from './types';

const API=(import.meta as unknown as {env:Record<string,string>}).env.VITE_API_BASE_URL||'';
const minutes=(seconds:number)=>`${Math.round(seconds/60).toLocaleString()} min`;
const hours=(seconds:number)=>`${Math.floor(Math.round(seconds/60)/60)}h ${String(Math.round(seconds/60)%60).padStart(2,'0')}m`;
const utc=(time:string)=>new Date(time).toLocaleString('en-US',{month:'short',day:'numeric',hour:'2-digit',minute:'2-digit',hour12:false,timeZone:'UTC'})+' UTC';
const warningText:Record<string,string>={DOMAIN_BOUNDARY:'This path reaches the model boundary. The comparison may change in a wider region.',RESOLUTION_SENSITIVE:'Results change by more than 1% on the finer grid. No meaningful improvement is claimed.',MAP_PROJECTION_LIMIT:'This polar path extends beyond the map’s 85° display limit. Metrics use the full spherical path; the map is clipped.'};

async function getJSON<T>(url:string,signal?:AbortSignal):Promise<T>{
  const r=await fetch(url,{signal});
  if(!r.ok){let message='The service is unavailable. Saved examples are still available.';try{message=(await r.json()).error.message}catch{/* non-JSON host response */}throw new Error(message)}
  return r.json();
}

export default function App(){
  const [airports,setAirports]=useState<Airport[]>([]),[examples,setExamples]=useState<Example[]>([]);
  const [scenario,setScenario]=useState<Scenario|null>(null),[origin,setOrigin]=useState<Airport|null>(null),[destination,setDestination]=useState<Airport|null>(null);
  const [windEnabled,setWindEnabled]=useState(true),[showWinds,setShowWinds]=useState(true),[showAlternative,setShowAlternative]=useState(false);
  const [loading,setLoading]=useState('Opening saved journey'),[error,setError]=useState(''),[methodology,setMethodology]=useState(false),[segment,setSegment]=useState(0);
  const controller=useRef<AbortController|null>(null),dialog=useRef<HTMLDialogElement>(null),methodButton=useRef<HTMLButtonElement>(null);
  const [airportError,setAirportError]=useState(false);
  useEffect(()=>{
    const abort=new AbortController();
    getJSON<Airport[]>('/airports.json',abort.signal).then(setAirports).catch(e=>{if(e.name!=='AbortError')setAirportError(true)});
    getJSON<Example[]>('/examples.json',abort.signal).then(async list=>{
      setExamples(list);const example=list.find(e=>e.origin_id==='KJFK'&&e.destination_id==='EGLL'&&e.wind_enabled)!;
      const result=await getJSON<Scenario>(`/examples/${example.scenario_id}.json`,abort.signal);
      setScenario(result);setOrigin(result.origin);setDestination(result.destination);setLoading('');
    }).catch(e=>{if(e.name!=='AbortError'){setError('Could not open the saved journey. Reload to try again.');setLoading('')}});
    return()=>{abort.abort();controller.current?.abort()};
  },[]);
  useEffect(()=>{
    if(methodology){dialog.current?.showModal();}else if(dialog.current?.open){dialog.current.close();methodButton.current?.focus()}
  },[methodology]);
  function apply(result:Scenario,reveal:boolean){setScenario(result);setOrigin(result.origin);setDestination(result.destination);setWindEnabled(result.wind_enabled);setShowAlternative(reveal);setSegment(0);}
  async function compare(a=origin,b=destination,wind=windEnabled,reveal=true){
    if(!a||!b)return;
    controller.current?.abort();const abort=new AbortController();controller.current=abort;
    setError('');setLoading('Opening saved comparison');
    try{
      const saved=examples.find(e=>e.origin_id===a.id&&e.destination_id===b.id&&e.wind_enabled===wind);
      if(saved){apply(await getJSON<Scenario>(`/examples/${saved.scenario_id}.json`,abort.signal),reveal);return;}
      setLoading('Loading winds · first request may wake the cloud service');
      const response=await fetch(`${API}/api/v1/scenarios`,{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({origin_id:a.id,destination_id:b.id,wind_enabled:wind}),signal:abort.signal});
      if(!response.headers.get('content-type')?.includes('application/json'))throw new Error('The cloud service is starting or unavailable. Try again shortly, or open a saved journey.');
      const payload=await response.json();
      if(!response.ok)throw new Error(payload.error?.message||'The comparison service is unavailable.');
      let result:Scenario|Job=payload;
      const deadline=Date.now()+160_000;
      while(result.status==='queued'||result.status==='running'){
        if(Date.now()>deadline)throw new Error('This comparison is taking too long. Try again or open a saved example.');
        setLoading(result.stage);
        await new Promise<void>((resolve,reject)=>{const timer=setTimeout(resolve,1200);abort.signal.addEventListener('abort',()=>{clearTimeout(timer);reject(new DOMException('Aborted','AbortError'))},{once:true})});
        result=await getJSON<Scenario|Job>(`${API}${result.result_url}`,abort.signal);
      }
      if(result.status==='failed')throw new Error(result.error?.message||'This journey could not be compared.');
      apply(result as Scenario,reveal);
    }catch(e){if((e as Error).name!=='AbortError')setError((e as Error).message||'Unable to connect. Try a saved journey below.');}
    finally{if(controller.current===abort)setLoading('');}
  }
  function cancel(){controller.current?.abort();setLoading('');setError('Comparison cancelled in this browser. You can open a saved journey.');}
  const dirty=!!scenario&&(origin?.id!==scenario.origin.id||destination?.id!==scenario.destination.id);
  const base=scenario?.metrics.great_circle,alt=scenario?.metrics.wind_optimized;
  const selected=scenario?.metrics[showAlternative?'wind_optimized':'great_circle'].segment_metrics;
  const selectedSegment=selected?.[Math.min(segment,selected.length-1)];
  const featured=examples.filter(e=>e.featured&&e.wind_enabled);
  const calm=examples.find(e=>e.origin_id===scenario?.origin.id&&e.destination_id===scenario?.destination.id&&!e.wind_enabled);
  const [calmTime,setCalmTime]=useState<number|null>(null);
  useEffect(()=>{
    let live=true;setCalmTime(null);
    if(calm)getJSON<Scenario>(`/examples/${calm.scenario_id}.json`).then(r=>{if(live)setCalmTime(r.metrics.great_circle.modeled_duration_s)}).catch(()=>{});
    return()=>{live=false};
  },[calm?.scenario_id]);
  function download(){if(!scenario)return;const blob=new Blob([JSON.stringify(scenario,null,2)],{type:'application/json'});const url=URL.createObjectURL(blob);const a=document.createElement('a');a.href=url;a.download=`streamline-${scenario.scenario_id}.json`;a.click();URL.revokeObjectURL(url)}
  return <><a className="skip-link" href="#comparison">Skip to comparison</a><header className="topbar"><a className="brand" href="/" aria-label="Streamline home"><span className="brand-mark"><Wind size={26} strokeWidth={1.8}/></span>streamline<span className="brand-dot">.</span></a><nav aria-label="Main"><span className="nav-active">Flight explorer</span><button onClick={()=>setMethodology(true)}>The science <ExternalLink size={12}/></button></nav><span className="header-note"><Cloud size={16}/>A little perspective, from above.</span><a className="github-link" href="https://github.com/HassaanVani/Streamline-HackRPI-2026-" target="_blank" rel="noreferrer">Built at HackRPI <ArrowRight size={14}/></a></header>
  <main className="workspace"><aside className="explorer"><div className="intro"><div className="eyebrow"><span/>FLIGHT EXPLORER</div><h1>See the air.<br/><span>Rethink the route.</span></h1><p>A plane flies through moving air.<br/>Explore how wind shapes the way we fly.</p></div>
    <form className="journey-form" onSubmit={e=>{e.preventDefault();void compare()}}><div className="form-title"><span>Your journey</span><span className="worldwide"><Globe2 size={12}/>Worldwide</span></div><AirportSearch label="From" value={origin} onChange={setOrigin} airports={airports}/><div className="swap-row"><span/><button type="button" disabled={!!loading} onClick={()=>{const a=origin;setOrigin(destination);setDestination(a);void compare(destination,a,windEnabled,showAlternative)}} aria-label="Reverse journey"><ArrowLeftRight size={14}/></button></div><AirportSearch label="To" value={destination} onChange={setDestination} airports={airports}/>
    {airportError&&<p className="inline-note">Airport search could not load. Saved journeys remain available.</p>}
    <button className="primary-button" type="submit" disabled={!!loading||!origin||!destination||origin.id===destination.id}>{loading?<LoaderCircle className="spin" size={16}/>:<Route size={17}/>}<span>{loading?'Comparing your journey…':'Explore a wind-based alternative'}</span>{!loading&&<ArrowRight size={16}/>}</button>
    {loading&&<div className="loading-state" role="status"><span>{loading}</span>{controller.current&&<button type="button" onClick={cancel}>Cancel</button>}</div>}
    {error&&<div className="error-state" role="alert">{error}<button type="button" onClick={()=>void compare(scenario?.origin,scenario?.destination,scenario?.wind_enabled)}>Reopen displayed journey</button></div>}
    </form>
    <section className="saved-journeys"><div className="section-label">START WITH A STORY <ArrowDown size={12}/></div>{featured.map((e,i)=><button key={e.scenario_id} disabled={!!loading} onClick={()=>{const a=airports.find(a=>a.id===e.origin_id),b=airports.find(a=>a.id===e.destination_id);if(a&&b)void compare(a,b,true,false);else {setLoading('Opening saved journey');getJSON<Scenario>(`/examples/${e.scenario_id}.json`).then(r=>apply(r,false)).catch(e=>setError(e.message)).finally(()=>setLoading(''))}}} className={`story-card ${scenario?.origin.id===e.origin_id&&scenario.destination.id===e.destination_id?'current':''}`}><span className="story-icon">{i===0?<Plane size={19}/>:<Globe2 size={19}/>}</span><span><strong>{e.label}</strong><small>{i===0?'Across the North Atlantic':'When the shortest path holds up'}</small></span><ChevronRight size={15}/></button>)}</section>
    <div className="sidebar-foot"><span className="tiny-cloud"><Cloud size={20}/></span><p>A what-if, with the assumptions in view.<br/><button ref={methodButton} onClick={()=>setMethodology(true)}>See how it works <ArrowRight size={12}/></button></p></div>
  </aside>
  <div className="visual-workspace"><FlightMap scenario={scenario} showWinds={showWinds} onToggleWinds={()=>setShowWinds(!showWinds)} showAlternative={showAlternative} segment={segment}/>
    <div className="floating-route">{scenario&&<><span className="route-code">{scenario.origin.iata||scenario.origin.id}</span><span className="route-dots">······ <Plane size={15}/> ······</span><span className="route-code">{scenario.destination.iata||scenario.destination.id}</span><span className="route-mode">{scenario.data_mode==='saved_forecast'?'Saved forecast example':'Computed from forecast'}</span></>}</div>
    <section className="comparison" id="comparison" tabIndex={-1} aria-label="Route comparison"><div className="comparison-top"><div><span className="eyebrow">SAME JOURNEY. DIFFERENT PERSPECTIVE.</span><h2>{dirty?'Displayed comparison':showAlternative?'Let the wind tell its side.':'First, the shortest way there.'}</h2></div><div className="wind-switch"><span><Wind size={15}/>Model winds</span><button role="switch" aria-checked={windEnabled} aria-label="Include winds in the model" disabled={!!loading||!scenario} onClick={()=>void compare(scenario?.origin,scenario?.destination,!windEnabled,showAlternative)}><i/></button></div></div>
      {scenario&&base&&alt?<><div className="comparison-subtitle">{scenario.origin.iata||scenario.origin.id} → {scenario.destination.iata||scenario.destination.id} · {windEnabled?'Frozen forecast winds':'Zero-wind counterfactual'} · {utc(scenario.provenance.valid_time)}{dirty&&<strong> · Explore to update the selected airports</strong>}</div>
      <div className={`metrics-grid ${showAlternative?'has-alternative':''}`}><div className="metric-labels"><span>MODELED CRUISE</span><span>Distance</span><span>Relative fuel index <button onClick={()=>setMethodology(true)} aria-label="Explain relative fuel index"><Info size={12}/></button></span></div><div className="metric-route"><div className="metric-route-title"><i className="baseline-line"/>Shortest distance</div><strong>{hours(base.modeled_duration_s)}</strong><span>{Math.round(base.distance_m/1000).toLocaleString()} km</span><span>100 <small>baseline</small></span></div>{showAlternative?<div className="metric-route optimized"><div className="metric-route-title"><i className="alternative-line"/>Wind-based alternative</div><strong>{hours(alt.modeled_duration_s)}</strong><span>{Math.round(alt.distance_m/1000).toLocaleString()} km</span><span>{alt.fuel_index.toFixed(1)} <small>relative index</small></span></div>:<div className="reveal-card"><Wind size={25}/><p>Could moving air<br/>change the route?</p><button onClick={()=>setShowAlternative(true)}>Reveal the comparison <ArrowRight size={13}/></button></div>}</div>
      <div className="insight"><span className="insight-icon">{showAlternative?<Check size={16}/>:<Wind size={17}/>}</span><p>{showAlternative?scenario.comparison.meaningful?<>About <strong>{minutes(Math.abs(scenario.comparison.time_difference_s))} {scenario.comparison.time_difference_s>=0?'less':'more'}</strong> modeled cruise time ({Math.abs(scenario.comparison.percent_difference).toFixed(1)}%) compared with the shortest-distance path.</>:<>No meaningful difference under these assumptions. Sometimes the shortest route holds up.</>:calmTime&&windEnabled?<>On this path, winds change modeled time by about <strong>{minutes(Math.abs(base.modeled_duration_s-calmTime))}</strong> versus still air. Try reversing the journey.</>:<>Wind changes ground speed. The shortest distance and shortest modeled time can be different.</>}</p></div>
      {scenario.warnings.filter(w=>warningText[w]).map(w=><p className="model-warning" key={w}><Info size={14}/>{warningText[w]}</p>)}
      <details className="segment-details"><summary>Inspect the air along the path <ChevronDown size={14}/></summary><label htmlFor="segment">Segment {segment+1} of {selected?.length}</label><input id="segment" type="range" min="0" max={(selected?.length||1)-1} value={segment} onChange={e=>setSegment(Number(e.target.value))}/>{selectedSegment&&<div className="segment-values"><span>Along route <b>{selectedSegment.along_mps.toFixed(1)} m/s</b></span><span>Crosswind <b>{Math.abs(selectedSegment.cross_mps).toFixed(1)} m/s</b></span><span>Ground speed <b>{selectedSegment.ground_speed_mps.toFixed(1)} m/s</b></span></div>}</details>
      <div className="comparison-footer"><span><Info size={12}/>Hypothetical cruise model · operational feasibility not assessed</span><button onClick={()=>setMethodology(true)}>Assumptions & sources <ArrowRight size={12}/></button></div></>:<div className="empty-comparison">{loading||'Choose a journey to begin.'}</div>}
    </section>
  </div></main><footer className="page-footer"><span>Made for curious minds, not flight decks.</span><span>OurAirports · Open-Meteo / NOAA GFS · 250 hPa · illustrative airspeed 230 m/s</span><span>HACKRPI 2026 <Cloud size={12}/></span></footer>
  <dialog ref={dialog} className="methodology" onCancel={()=>setMethodology(false)} onClick={e=>{if(e.target===dialog.current)setMethodology(false)}} aria-labelledby="method-title"><div className="drawer-header"><span className="eyebrow">BEHIND THE COMPARISON</span><button onClick={()=>setMethodology(false)} aria-label="Close methodology"><X size={20}/></button></div><h2 id="method-title">A model you can look inside.</h2><p className="drawer-intro">We make the moving air visible, then ask a deliberately simplified question: which path takes less time through this frozen wind field?</p>{scenario&&<><dl className="assumptions"><div><dt>Wind source</dt><dd>{scenario.provenance.provider} · NOAA GFS</dd></div><div><dt>Valid time</dt><dd>{utc(scenario.provenance.valid_time)}</dd></div><div><dt>Retrieved</dt><dd>{utc(scenario.provenance.retrieved_at)}</dd></div><div><dt>Pressure surface</dt><dd>250 hPa — not a fixed geometric altitude</dd></div><div><dt>True airspeed</dt><dd>230 m/s · illustrative, constant</dd></div><div><dt>Search</dt><dd>Directed Dijkstra · 64 × 33 nodes</dd></div><div><dt>Weather samples</dt><dd>12 × 12 · interpolated vector components</dd></div><div><dt>Resolution check</dt><dd>128 × 65 · {scenario.validation.resolution_change_percent.toFixed(3)}% change</dd></div><div><dt>Modeled extent</dt><dd>{scenario.assumptions.extent}</dd></div></dl><h3>How the comparison works</h3><p>Both paths use the same wind field and airspeed. We account for the heading needed to counter crosswind and sum travel time along each displayed segment. The alternative is the shortest modeled time found on this grid, not a global optimum or a cleared flight plan.</p><h3>A relative index, not measured fuel</h3><p>With a constant fuel flow, fuel use is proportional to time. The shortest-distance baseline is 100. This index adds no independent environmental evidence; kilograms of fuel and CO₂ are unavailable without a defensible aircraft profile.</p><h3>What this leaves out</h3><ul>{scenario.assumptions.exclusions.map(x=><li key={x}>{x}</li>)}</ul><p>Airlines already optimize under real constraints this model does not know. A modeled difference is not evidence of avoidable emissions or airline inefficiency. Neither path is an observed flight.</p><h3>Sources and reproducibility</h3><p><a href="https://open-meteo.com/en/docs/gfs-api" target="_blank" rel="noreferrer">Open-Meteo GFS documentation <ExternalLink size={12}/></a><br/><a href="https://open-meteo.com/en/terms" target="_blank" rel="noreferrer">Weather: CC BY 4.0 · Open-Meteo / NOAA GFS</a><br/><a href="https://ourairports.com/data/" target="_blank" rel="noreferrer">Airports: OurAirports · public domain</a></p><p className="hash">Model {scenario.model_version}<br/>Scenario {scenario.scenario_id}<br/>Payload SHA-256 {scenario.provenance.payload_hash}</p><button className="download-button" onClick={download}><Download size={16}/>Download exact scenario JSON</button></>}</dialog></>
}
