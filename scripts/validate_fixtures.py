"""Deterministic, network-free replay with numerical acceptance checks."""
import hashlib
import json
import platform
import subprocess
import sys
from pathlib import Path
sys.path.insert(0,str(Path(__file__).resolve().parents[1]/'backend'))
from streamline.data import DATA, ROOT
from streamline.compute import compute

results=[]
for path in sorted((DATA/'examples').glob('*.json')):
    saved=json.loads(path.read_text())
    a,b=saved['origin']['id'],saved['destination']['id']
    weather=json.loads((DATA/'weather'/f'{a}-{b}.json').read_text())
    replay=compute(dict(origin_id=a,destination_id=b,wind_enabled=saved['wind_enabled']),weather)
    for kind in ('great_circle','wind_optimized'):
        for key in ('distance_m','modeled_duration_s','fuel_index'):
            assert abs(saved['metrics'][kind][key]-replay['metrics'][kind][key])<1e-6,(path,kind,key)
    assert replay['metrics']['wind_optimized']['modeled_duration_s']<=replay['metrics']['great_circle']['modeled_duration_s']+1e-7
    results.append(dict(scenario_id=saved['scenario_id'],pair=f'{a}-{b}',wind_enabled=saved['wind_enabled'],
        payload_hash=saved['provenance']['payload_hash'],scenario_file_sha256=hashlib.sha256(path.read_bytes()).hexdigest(),
        replay_duration_s=replay['validation']['solve_duration_s'],
        resolution_change_percent=replay['validation']['resolution_change_percent'],
        comparison=replay['comparison'],warnings=replay['warnings']))
report=dict(platform=platform.platform(),python=platform.python_version(),
            source_commit=subprocess.run(['git','rev-parse','HEAD'],capture_output=True,text=True).stdout.strip() or 'initial-uncommitted-build',
            model_version='static-cruise-v1',fixtures=results)
(ROOT/'docs/fixture-validation.json').write_text(json.dumps(report,indent=2)+'\n')
print(f'Replayed {len(results)} fixtures; all metrics match within 1e-6.')
print('Solve times:',round(min(r['replay_duration_s'] for r in results),3),'to',round(max(r['replay_duration_s'] for r in results),3),'seconds')
