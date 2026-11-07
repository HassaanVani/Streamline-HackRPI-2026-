"""Run from repository root: cd backend && uv run python ../scripts/acquire.py"""
import csv
import hashlib
import io
import json
from datetime import datetime, timezone
import sys
import time
import argparse
from pathlib import Path
sys.path.insert(0,str(Path(__file__).resolve().parents[1]/'backend'))
import httpx
from streamline.data import DATA, ROOT
from streamline.geometry import Corridor
from streamline.weather import fetch
from streamline.compute import compute


def write(path,data):
    path.parent.mkdir(parents=True,exist_ok=True)
    path.write_text(json.dumps(data,separators=(',',':'),allow_nan=False))


def main():
    parser=argparse.ArgumentParser()
    parser.add_argument('--refresh',action='store_true',help='Acquire a new forecast snapshot instead of replaying the frozen one.')
    args=parser.parse_args()
    now=datetime.now(timezone.utc)
    # Use the primary OurAirports snapshot, not a derived airport list.
    source='https://davidmegginson.github.io/ourairports-data/airports.csv'
    response=httpx.get(source,timeout=60,follow_redirects=True)
    response.raise_for_status()
    raw=response.content
    airports=[]
    for row in csv.DictReader(io.StringIO(raw.decode('utf-8-sig'))):
        if row['type'] in ('closed','heliport','seaplane_base','balloonport'):
            continue
        airports.append(dict(id=row['ident'],ident=row['ident'],iata=row['iata_code'] or None,
            icao=row.get('icao_code') or row['gps_code'] or None,name=row['name'],
            latitude_deg=float(row['latitude_deg']),longitude_deg=float(row['longitude_deg']),
            country=row['iso_country'],municipality=row['municipality'],
            snapshot_id=now.date().isoformat(),scheduled_service=row['scheduled_service']=='yes'))
    write(DATA/'airports.json',airports)
    write(ROOT/'frontend/public/airports.json',airports)
    write(DATA/'airports-provenance.json',dict(source_url=source,retrieved_at=now.isoformat(),
        payload_hash=hashlib.sha256(raw).hexdigest(),license='Public domain',attribution='OurAirports',
        license_url='https://ourairports.com/data/',count=len(airports)))
    (DATA/'raw/airports.csv').write_bytes(raw)
    valid=now.replace(minute=0,second=0,microsecond=0).isoformat().replace('+00:00','Z')
    if (DATA/'config.json').exists() and not args.refresh:
        valid=json.loads((DATA/'config.json').read_text())['valid_time']
    write(DATA/'config.json',dict(valid_time=valid,model='gfs_global',pressure_hpa=250))
    lookup={a['id']:a for a in airports}
    examples=[]
    # Three measured candidates: select the smaller-difference secondary journey.
    for origin_id,destination_id in [('KJFK','EGLL'),('LFPG','EDDF'),('KSFO','KLAX')]:
        origin,destination=lookup[origin_id],lookup[destination_id]
        corridor=Corridor([origin['longitude_deg'],origin['latitude_deg']],
                          [destination['longitude_deg'],destination['latitude_deg']])
        path=DATA/f'weather/{origin_id}-{destination_id}.json'
        if path.exists() and not args.refresh:
            weather=json.loads(path.read_text())
            if weather['provenance']['valid_time'] != valid:
                raise ValueError('Saved weather time does not match the frozen snapshot. Use --refresh to acquire aligned data.')
        else:
            weather=fetch(corridor,valid)
            write(path,weather)
        for wind_enabled in (True,False):
            req=dict(origin_id=origin_id,destination_id=destination_id,wind_enabled=wind_enabled)
            result=compute(req,weather)
            result['data_mode']='saved_forecast'
            write(ROOT/f"frontend/public/examples/{result['scenario_id']}.json",result)
            write(DATA/f"examples/{result['scenario_id']}.json",result)
            examples.append(dict(scenario_id=result['scenario_id'],origin_id=origin_id,destination_id=destination_id,
                wind_enabled=wind_enabled,label=f"{origin['iata'] or origin_id} → {destination['iata'] or destination_id}",
                percent_difference=result['comparison']['percent_difference'],valid_time=weather['provenance']['valid_time'],
                data_mode='saved_forecast',attribution=weather['provenance']['attribution']))
            print(origin_id,destination_id,wind_enabled,result['comparison'],result['validation'],flush=True)
        # Reverse uses same geographic samples, transformed into reverse corridor order.
        reverse=dict(weather)
        import numpy as np
        reverse['u_mps']=np.asarray(weather['u_mps'])[::-1,::-1].tolist()
        reverse['v_mps']=np.asarray(weather['v_mps'])[::-1,::-1].tolist()
        reverse['points']=list(reversed(weather['points']))
        write(DATA/f'weather/{destination_id}-{origin_id}.json',reverse)
        for wind_enabled in (True,False):
            result=compute(dict(origin_id=destination_id,destination_id=origin_id,wind_enabled=wind_enabled),reverse)
            result['data_mode']='saved_forecast'
            write(ROOT/f"frontend/public/examples/{result['scenario_id']}.json",result)
            write(DATA/f"examples/{result['scenario_id']}.json",result)
            examples.append(dict(scenario_id=result['scenario_id'],origin_id=destination_id,destination_id=origin_id,
                wind_enabled=wind_enabled,label=f"{destination['iata'] or destination_id} → {origin['iata'] or origin_id}",
                percent_difference=result['comparison']['percent_difference'],valid_time=weather['provenance']['valid_time'],
                data_mode='saved_forecast',attribution=weather['provenance']['attribution']))
        time.sleep(2)
    secondary=min([e for e in examples if e['wind_enabled'] and e['origin_id'] in ('LFPG','KSFO')],
                  key=lambda e:abs(e['percent_difference']))
    for example in examples:
        example['featured']=example['origin_id']=='KJFK' or example['scenario_id']==secondary['scenario_id']
    write(DATA/'examples.json',examples)
    write(ROOT/'frontend/public/examples.json',examples)
    print('Airport count:',len(airports),'Featured secondary:',secondary['label'])


if __name__=='__main__':
    main()
