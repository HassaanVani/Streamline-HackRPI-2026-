"""Acquisition only: the solver never calls the network."""
import hashlib
import json
from datetime import datetime, timezone
import httpx
import numpy as np
from .geometry import Corridor
from .physics import wind_components

URL = 'https://api.open-meteo.com/v1/gfs'


def fetch(corridor: Corridor, valid_time: str):
    xx,yy = np.meshgrid(np.linspace(0,1,12), np.linspace(-2*corridor.width,2*corridor.width,12))
    points = corridor.points(xx,yy).reshape(-1,2)
    responses, queries, us, vs = [], [], [], []
    for start in range(0,len(points),48):
        batch = points[start:start+48]
        query = dict(latitude=','.join(f'{p[1]:.5f}' for p in batch),
                     longitude=','.join(f'{p[0]:.5f}' for p in batch),
                     hourly='wind_speed_250hPa,wind_direction_250hPa',models='gfs_global',
                     wind_speed_unit='ms',timezone='UTC',start_hour=valid_time[:16],end_hour=valid_time[:16])
        r = httpx.get(URL,params=query,timeout=20)
        if r.status_code == 429:
            raise ValueError('PROVIDER_LIMIT: Weather provider quota reached. Open a saved example or try later.')
        r.raise_for_status()
        payload = r.json()
        items = payload if isinstance(payload,list) else [payload]
        if len(items) != len(batch):
            raise ValueError('PROVIDER_CONTRACT: Unexpected weather location count.')
        for item in items:
            hourly, units = item.get('hourly',{}),item.get('hourly_units',{})
            if units.get('wind_speed_250hPa') != 'm/s' or units.get('wind_direction_250hPa') != '°' or item.get('utc_offset_seconds') != 0:
                raise ValueError('PROVIDER_CONTRACT: Unexpected weather units or timezone.')
            try:
                index = hourly['time'].index(valid_time[:16])
                speed, direction = hourly['wind_speed_250hPa'][index],hourly['wind_direction_250hPa'][index]
                if speed is None or direction is None or not np.isfinite(speed) or not np.isfinite(direction) or speed < 0:
                    raise ValueError()
            except (KeyError,ValueError,IndexError,TypeError):
                raise ValueError('MISSING_WIND: Pressure-level winds are unavailable for this forecast time.')
            u,v = wind_components(speed,direction)
            us.append(float(u)); vs.append(float(v))
        queries.append(query); responses.append(payload)
    raw = json.dumps(responses,sort_keys=True,separators=(',',':')).encode()
    return dict(u_mps=np.array(us).reshape(12,12).tolist(),v_mps=np.array(vs).reshape(12,12).tolist(),
                width_rad=2*corridor.width,points=points.tolist(),
                provenance=dict(provider='Open-Meteo',model='gfs_global',source_url=URL,
                    valid_time=valid_time,pressure_hpa=250,retrieved_at=datetime.now(timezone.utc).isoformat(),
                    run_id=None,payload_hash=hashlib.sha256(raw).hexdigest(),request_parameters=queries,
                    attribution='Weather data by Open-Meteo (CC BY 4.0), NOAA GFS',
                    license_url='https://open-meteo.com/en/terms',weather_locations=144),raw_responses=responses)
