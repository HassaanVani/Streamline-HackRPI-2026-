import asyncio
import json
import pytest
from fastapi.testclient import TestClient
from streamline.api import app
from streamline.data import DATA
from streamline.models import ScenarioResult


@pytest.fixture
def client():
    with TestClient(app) as c:
        yield c


def test_saved_replay_and_provenance(client):
    response=client.post('/api/v1/scenarios',json=dict(origin_id='KJFK',destination_id='EGLL',wind_enabled=True))
    assert response.status_code==200
    result=ScenarioResult.model_validate(response.json())
    assert result.provenance.model=='gfs_global'
    assert result.metrics['great_circle'].fuel_kg is None
    assert result.metrics['wind_optimized'].modeled_duration_s<=result.metrics['great_circle'].modeled_duration_s+1e-7
    assert client.get(f'/api/v1/scenarios/{result.scenario_id}/winds').json()['units']=='m/s'
    assert client.get('/api/v1/health').json()['ready']


def test_saved_reverse_and_wind_off(client):
    results=[client.post('/api/v1/scenarios',json=dict(origin_id=a,destination_id=b,wind_enabled=wind)).json()
             for a,b,wind in [('KJFK','EGLL',True),('EGLL','KJFK',True),('KJFK','EGLL',False)]]
    assert len(set(r['scenario_id'] for r in results))==3
    calm=results[-1]
    assert calm['comparison']['percent_difference']==pytest.approx(0,abs=1e-8)
    assert all(s['u_mps']==s['v_mps']==0 for s in calm['winds']['samples'])
    assert results[0]['metrics']['great_circle']['modeled_duration_s']!=results[1]['metrics']['great_circle']['modeled_duration_s']


def test_invalid_input_and_restart(client):
    for payload in [dict(origin_id='KJFK',destination_id='KJFK'),dict(origin_id='nope',destination_id='EGLL'),dict(origin_id='KJFK',destination_id='EGLL',_fixture='/etc/passwd')]:
        r=client.post('/api/v1/scenarios',json=payload)
        assert r.status_code==422
        assert r.json()['request_id']
    assert client.get('/api/v1/airports',params={'q':'x'*101}).status_code==422
    r=client.get('/api/v1/scenarios/unknown-after-restart')
    assert r.status_code==404 and r.json()['error']['retryable']
    assert client.get('/api/v1/airports',params={'q':'JFK'}).json()[0]['id']=='KJFK'


def test_bounded_queue_and_deduplication(client,monkeypatch):
    async def slow(payload):
        await asyncio.sleep(30)
    monkeypatch.setattr('streamline.api.execute',slow)
    first=dict(origin_id='KJFK',destination_id='RJTT')
    r=client.post('/api/v1/scenarios',json=first)
    assert r.status_code==202
    assert client.post('/api/v1/scenarios',json=first).json()['scenario_id']==r.json()['scenario_id']
    assert client.post('/api/v1/scenarios',json=dict(origin_id='KJFK',destination_id='YSSY')).status_code==202
    assert client.post('/api/v1/scenarios',json=dict(origin_id='EGLL',destination_id='YSSY')).status_code==202
    busy=client.post('/api/v1/scenarios',json=dict(origin_id='EGLL',destination_id='RJTT'))
    assert busy.status_code==429 and busy.json()['error']['code']=='BUSY'
    assert client.get('/api/v1/health').status_code==200


@pytest.mark.parametrize('code',['SOLVER_TIMEOUT','PROVIDER_LIMIT','MISSING_WIND','NO_MODEL_PATH'])
def test_failure_states(client,monkeypatch,code):
    async def fail(payload):
        return {'error':dict(code=code,message='Test failure',retryable=True)}
    monkeypatch.setattr('streamline.api.execute',fail)
    r=client.post('/api/v1/scenarios',json=dict(origin_id='KJFK',destination_id='RJTT'))
    url=r.json()['result_url']
    import time
    for _ in range(30):
        result=client.get(url).json()
        if result['status']=='failed':break
        time.sleep(.01)
    assert result['status']=='failed' and result['error']['code']==code


def test_all_fixtures_validate():
    for path in (DATA/'examples').glob('*.json'):
        result=ScenarioResult.model_validate(json.loads(path.read_text()))
        assert result.provenance.payload_hash
        assert result.comparison.stable or not result.comparison.meaningful


def test_deadline_terminates_subprocess(monkeypatch):
    from streamline import api
    class FakeProcess:
        returncode=None
        killed=False
        async def communicate(self,payload):
            await asyncio.sleep(10)
        def kill(self):
            self.killed=True
        async def wait(self):
            self.returncode=-9
    process=FakeProcess()
    async def create(*args,**kwargs):return process
    original_wait_for=asyncio.wait_for
    async def fast_deadline(awaitable,timeout):return await original_wait_for(awaitable,.01)
    monkeypatch.setattr(asyncio,'create_subprocess_exec',create)
    monkeypatch.setattr(asyncio,'wait_for',fast_deadline)
    result=asyncio.run(api.execute({'origin_id':'KJFK','destination_id':'EGLL'}))
    assert result['error']['code']=='SOLVER_TIMEOUT'
    assert process.killed and process.returncode==-9
