import hashlib
import json
import sys
import time
import numpy as np
from . import MODEL_VERSION
from .data import DATA, airports, config
from .geometry import Corridor
from .physics import WindField
from .routing import solve, evaluate
from .weather import fetch


def compute(request, weather=None):
    started = time.monotonic()
    lookup = {a['id']:a for a in airports()}
    origin,destination = lookup[request['origin_id']],lookup[request['destination_id']]
    corridor = Corridor([origin['longitude_deg'],origin['latitude_deg']],
                        [destination['longitude_deg'],destination['latitude_deg']])
    if weather is None:
        # Disposable on-disk cache is shared by successive isolated solver processes.
        # The key includes every acquisition input; no weather time substitution.
        cache_key=hashlib.sha256(json.dumps(dict(origin_id=request['origin_id'],
            destination_id=request['destination_id'],valid_time=config()['valid_time'],
            model='gfs_global',pressure_hpa=250,samples=[12,12],width_rad=2*corridor.width),sort_keys=True).encode()).hexdigest()
        cache_dir=DATA.parent/'.cache'/'weather'
        cache_dir.mkdir(parents=True,exist_ok=True)
        cache_path=cache_dir/f'{cache_key}.json'
        if cache_path.exists():
            weather=json.loads(cache_path.read_text())
        else:
            weather=fetch(corridor,config()['valid_time'])
            temporary=cache_path.with_suffix('.tmp')
            temporary.write_text(json.dumps(weather,allow_nan=False))
            temporary.replace(cache_path)
            for stale in sorted(cache_dir.glob('*.json'),key=lambda p:p.stat().st_mtime)[:-64]:
                stale.unlink()
    field = WindField(weather,corridor,request.get('wind_enabled',True))
    if weather['provenance']['valid_time'] != config()['valid_time']:
        raise ValueError('WEATHER_TIME_MISMATCH: The saved wind field does not match the published forecast time.')
    route,baseline,boundary = solve(corridor,field)
    width = corridor.width
    if boundary:
        width *= 1.9
        route,baseline,boundary = solve(corridor,field,width=width)
    coarse = evaluate(route,field)
    fine,_,fine_boundary = solve(corridor,field,128,65,width=width)
    fine_metrics = evaluate(fine,field)
    change = abs(fine_metrics['modeled_duration_s']-coarse['modeled_duration_s'])/coarse['modeled_duration_s']
    reference = evaluate(baseline,field)
    # All compared values use the exact displayed polylines and one evaluator.
    warnings = ['FUEL_PROFILE_UNAVAILABLE','OPERATIONAL_FEASIBILITY_NOT_ASSESSED']
    if boundary or fine_boundary:
        warnings.append('DOMAIN_BOUNDARY')
    if change > .01:
        warnings.append('RESOLUTION_SENSITIVE')
    if np.any(np.abs(route[:,1])>85) or np.any(np.abs(baseline[:,1])>85):
        warnings.append('MAP_PROJECTION_LIMIT')
    delta = reference['modeled_duration_s']-coarse['modeled_duration_s']
    stable = not boundary and not fine_boundary and change <= .01
    meaningful = stable and delta/reference['modeled_duration_s'] > max(.002,change)
    metrics = {'great_circle':reference,'wind_optimized':coarse}
    for value in metrics.values():
        value['fuel_index'] = 100*value['modeled_duration_s']/reference['modeled_duration_s']
    features = [dict(type='Feature',id=kind,properties=dict(kind=kind,feasibility='not_assessed',display_label=label),
                     geometry=dict(type='LineString',coordinates=coords.tolist()))
                for kind,label,coords in [('great_circle','Shortest-distance path',baseline),
                                         ('wind_optimized','Hypothetical wind-based alternative',route)]]
    identity = dict(request,valid_time=weather['provenance']['valid_time'],model_version=MODEL_VERSION,
                    payload_hash=weather['provenance']['payload_hash'])
    scenario_id = hashlib.sha256(json.dumps(identity,sort_keys=True).encode()).hexdigest()[:20]
    return dict(scenario_id=scenario_id,status='complete',model_version=MODEL_VERSION,
                origin=origin,destination=destination,wind_enabled=request.get('wind_enabled',True),
                data_mode='computed_forecast',routes=dict(type='FeatureCollection',features=features),metrics=metrics,
                comparison_baseline_id='great_circle',comparison=dict(time_difference_s=delta,
                  percent_difference=100*delta/reference['modeled_duration_s'],meaningful=meaningful,stable=stable),
                assumptions=dict(tas_mps=230,pressure_hpa=250,wind_model='Frozen forecast time slice',
                   fuel_method='Relative time-based fuel index; baseline = 100',solver='Directed Dijkstra',
                   grid=[64,33],validation_grid=[128,65],weather_grid=[12,12],
                   feasibility='not_assessed',extent='Modeled cruise between airport coordinates; excludes climb and descent',
                   exclusions=['Airways and restricted airspace','Oceanic clearances and traffic','Aircraft-specific performance',
                               'Climb, descent, taxi and reserves','Storms and turbulence','Contrails and non-CO₂ effects']),
                provenance=weather['provenance'],warnings=warnings,
                validation=dict(resolution_change_percent=change*100,boundary=boundary or fine_boundary,
                                solve_duration_s=time.monotonic()-started),
                winds=dict(units='m/s',valid_time=weather['provenance']['valid_time'],
                           samples=[dict(lon=p[0],lat=p[1],u_mps=u if field.enabled else 0,v_mps=v if field.enabled else 0)
                                    for p,u,v in zip(weather['points'],np.array(weather['u_mps']).ravel().tolist(),
                                                      np.array(weather['v_mps']).ravel().tolist())]))


if __name__ == '__main__':
    try:
        request = json.load(sys.stdin)
        # Server-selected fixture only; public input cannot select arbitrary paths.
        fixture = request.pop('_fixture',None)
        weather = json.loads((DATA/'weather'/fixture).read_text()) if fixture else None
        print(json.dumps(compute(request,weather),allow_nan=False))
    except Exception as exc:
        message = str(exc)
        code,text = message.split(': ',1) if ': ' in message else ('COMPUTATION_FAILED','Weather or routing computation failed. Try a saved example.')
        print(json.dumps(dict(error=dict(code=code,message=text,retryable=code in ['PROVIDER_LIMIT','COMPUTATION_FAILED']))))
        sys.exit(1)
