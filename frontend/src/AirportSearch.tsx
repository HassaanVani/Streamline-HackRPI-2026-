import { useId, useMemo, useState } from 'react';
import { MapPin, PlaneLanding, PlaneTakeoff } from 'lucide-react';
import type { Airport } from './types';
export default function AirportSearch({label,value,onChange,airports}:{label:string,value:Airport|null,onChange:(a:Airport)=>void,airports:Airport[]}) {
  const id=useId();
  const [query,setQuery]=useState('');
  const [open,setOpen]=useState(false);
  const [active,setActive]=useState(0);
  const matches=useMemo(()=>{
    const q=query.trim().toLowerCase();
    if(q.length<2) return [];
    return airports.filter(a=>`${a.iata||''} ${a.id} ${a.name} ${a.municipality}`.toLowerCase().includes(q))
      .sort((a,b)=>Number(![a.id,a.iata,a.icao].some(v=>v?.toLowerCase()===q))-Number(![b.id,b.iata,b.icao].some(v=>v?.toLowerCase()===q)) || Number(b.scheduled_service)-Number(a.scheduled_service)).slice(0,7);
  },[query,airports]);
  function select(a:Airport){onChange(a);setOpen(false);setQuery('');setActive(0)}
  const Icon=label==='From'?PlaneTakeoff:PlaneLanding;
  return <div className="airport-field"><label htmlFor={id}>{label}</label><div className="airport-input"><Icon size={18}/><input id={id} role="combobox" aria-autocomplete="list" aria-controls={`${id}-options`} aria-expanded={open} aria-activedescendant={open&&matches[active]?`${id}-${active}`:undefined} autoComplete="off"
    placeholder={airports.length?'Search any airport':'Loading worldwide airports…'}
    value={open?query:value?`${value.iata||value.id} · ${value.municipality||value.name}`:''}
    onFocus={()=>{setOpen(true);setQuery('');setActive(0)}} onBlur={()=>setOpen(false)}
    onChange={e=>{setQuery(e.target.value);setActive(0);setOpen(true)}} onKeyDown={e=>{
      if(e.key==='Escape')setOpen(false);
      if(e.key==='ArrowDown'){e.preventDefault();setActive(i=>Math.min(i+1,matches.length-1));}
      if(e.key==='ArrowUp'){e.preventDefault();setActive(i=>Math.max(i-1,0));}
      if(e.key==='Enter'&&open){e.preventDefault();if(matches[active])select(matches[active]);}
    }}/></div>{open&&<div className="airport-options" id={`${id}-options`} role="listbox" aria-label={`${label} airports`}>
      {matches.map((a,i)=><div role="option" aria-selected={i===active} id={`${id}-${i}`} key={a.id} className={i===active?'active':''} onMouseDown={e=>{e.preventDefault();select(a)}}><MapPin size={15}/><span><strong>{a.municipality||a.name}</strong><small>{a.name} · {a.country}</small></span><b>{a.iata||a.id}</b></div>)}
      {!matches.length&&<p>{query.length<2?'Type a city, airport name, or code.':'No matching airports.'}</p>}
    </div>}</div>
}
