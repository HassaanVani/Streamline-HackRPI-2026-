"""Network smoke checks for the public demo; optional single uncached job."""
import argparse
import datetime
import json
import time
import urllib.request
from pathlib import Path

parser=argparse.ArgumentParser()
parser.add_argument('url')
parser.add_argument('--uncached',action='store_true')
parser.add_argument('--output',type=Path)
args=parser.parse_args()
base=args.url.rstrip('/')
def get(path,data=None):
    request=urllib.request.Request(base+path,data=json.dumps(data).encode() if data else None,headers={'Content-Type':'application/json'} if data else {})
    with urllib.request.urlopen(request,timeout=15) as response:
        body=response.read()
        return json.loads(body) if 'application/json' in response.headers.get('Content-Type','') else body

def scenario(origin,destination,wind):
    value=get('/api/v1/scenarios',dict(origin_id=origin,destination_id=destination,wind_enabled=wind))
    deadline=time.monotonic()+160
    while value['status'] in ['queued','running']:
        if time.monotonic()>deadline: raise TimeoutError('Public computation did not finish within 160 seconds')
        time.sleep(1)
        value=get(value['result_url'])
    if value['status']!='complete': raise RuntimeError(value.get('error'))
    assert value['origin']['id']==origin and value['destination']['id']==destination and value['wind_enabled']==wind
    return value

health=get('/api/v1/health');assert health['ready'] and health['fixture_count']>=12
assert b'<title>Streamline</title>' in get('/')
for asset in ['/streamline-mark.png','/streamline-mark-atc.png']:
    assert get(asset).startswith(b'\x89PNG\r\n\x1a\n')
assert len(get('/examples.json'))>=12
report={'checked_at_utc':datetime.datetime.now(datetime.timezone.utc).isoformat(),'public_url':base,'health':health,'checks':['frontend','both brand assets','saved examples','reverse direction','still air'],'results':{}}
for name,origin,destination,wind in [('east','KJFK','EGLL',True),('west','EGLL','KJFK',True),('still_air','EGLL','KJFK',False)]:
    result=scenario(origin,destination,wind)
    if not wind: assert abs(result['metrics']['great_circle']['modeled_duration_s']-result['metrics']['wind_optimized']['modeled_duration_s'])<1
    report['results'][name]={'scenario_id':result['scenario_id'],'comparison':result['comparison'],'valid_time':result['provenance']['valid_time']}
if args.uncached:
    result=scenario('KBOS','LFPG',True)
    assert result['data_mode']=='computed_forecast'
    report['checks'].append('uncached Boston–Paris computation')
    report['results']['computed']={'scenario_id':result['scenario_id'],'comparison':result['comparison'],'valid_time':result['provenance']['valid_time'],'payload_hash':result['provenance']['payload_hash'],'warnings':result['warnings']}
output=json.dumps(report,indent=2)+'\n'
if args.output: args.output.write_text(output)
print(output)
