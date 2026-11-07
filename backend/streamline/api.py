import asyncio
from collections import OrderedDict, deque
from contextlib import asynccontextmanager, suppress
import hashlib
import json
import logging
import os
import sys
import time
import uuid
from pathlib import Path
from fastapi import FastAPI, Request, HTTPException, Query
from fastapi.exceptions import RequestValidationError
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from fastapi.staticfiles import StaticFiles
from . import MODEL_VERSION
from .data import DATA, airports, config
from .geometry import Corridor
from .models import Airport, ScenarioRequest, ScenarioResult, Job, Example, Winds, ErrorResponse

log = logging.getLogger('streamline')
ERRORS = {str(code):{'model':ErrorResponse} for code in (404,422,429,503,504)}


async def execute(payload):
    """Isolate work so a deadline actually terminates CPU work and HTTP acquisition."""
    process = await asyncio.create_subprocess_exec(sys.executable,'-m','streamline.compute',
        stdin=asyncio.subprocess.PIPE,stdout=asyncio.subprocess.PIPE,stderr=asyncio.subprocess.PIPE,
        cwd=str(Path(__file__).resolve().parents[1]))
    try:
        stdout,stderr = await asyncio.wait_for(process.communicate(json.dumps(payload).encode()),90)
        result = json.loads(stdout)
        if process.returncode and 'error' not in result:
            raise ValueError('Invalid computation response')
        return result
    except asyncio.TimeoutError:
        return {'error':{'code':'SOLVER_TIMEOUT','message':'The comparison exceeded 90 seconds. Open a saved example or choose another journey.','retryable':True}}
    except asyncio.CancelledError:
        raise
    except Exception:
        log.exception('compute_process_failed')
        return {'error':{'code':'COMPUTATION_FAILED','message':'The computation could not complete. Try a saved example.','retryable':True}}
    finally:
        if process.returncode is None:
            process.kill()
            await process.wait()


class Service:
    def __init__(self):
        self.queue = asyncio.Queue(maxsize=2)
        self.jobs = OrderedDict()
        self.active = False
        self.calls = deque()
        self.saved = {}
        self.lookup = {a['id']:a for a in airports()}
        self.examples = json.loads((DATA/'examples.json').read_text())
        for e in self.examples:
            self.saved[e['scenario_id']]=json.loads((DATA/'examples'/f"{e['scenario_id']}.json").read_text())

    async def worker(self):
        while True:
            key,payload = await self.queue.get()
            self.active = True
            self.jobs[key].update(status='running',stage='Loading winds and comparing paths')
            started=time.monotonic()
            try:
                result = await execute(payload)
                if 'error' in result:
                    self.jobs[key].update(status='failed',stage='Comparison unavailable',error=result['error'])
                else:
                    result=ScenarioResult.model_validate(result).model_dump()
                    # Public polling identity remains stable before and after completion.
                    result['scenario_id']=key
                    self.jobs[key]=result
                log.info('scenario_finished id=%s duration_s=%.3f status=%s',key,time.monotonic()-started,self.jobs[key]['status'])
            except Exception:
                log.exception('scenario_failed id=%s',key)
                self.jobs[key].update(status='failed',stage='Comparison unavailable',error=dict(code='COMPUTATION_FAILED',message='Unable to complete this comparison.',retryable=True))
            finally:
                self.active=False
                self.queue.task_done()


@asynccontextmanager
async def lifespan(app):
    app.state.service=Service()
    worker=asyncio.create_task(app.state.service.worker())
    yield
    worker.cancel()
    with suppress(asyncio.CancelledError):
        await worker


app=FastAPI(title='Streamline API',version='1.0.0',lifespan=lifespan)
app.add_middleware(CORSMiddleware,allow_origins=os.getenv('CORS_ORIGINS','http://localhost:5173,http://127.0.0.1:5173').split(','),allow_origin_regex=os.getenv('CORS_ORIGIN_REGEX'),allow_methods=['GET','POST'],allow_headers=['Content-Type'])


@app.middleware('http')
async def request_id(request,call_next):
    request.state.request_id=uuid.uuid4().hex[:12]
    response=await call_next(request)
    response.headers['X-Request-ID']=request.state.request_id
    response.headers['X-Content-Type-Options']='nosniff'
    return response


def fail(status,code,message,retryable=False):
    raise HTTPException(status,detail=dict(code=code,message=message,retryable=retryable))


@app.exception_handler(HTTPException)
async def http_error(request,exc):
    detail=exc.detail if isinstance(exc.detail,dict) else dict(code='HTTP_ERROR',message=str(exc.detail),retryable=False)
    return JSONResponse(status_code=exc.status_code,content=dict(error=detail,request_id=request.state.request_id))


@app.exception_handler(RequestValidationError)
async def validation_error(request,exc):
    return JSONResponse(status_code=422,content=dict(error=dict(code='INVALID_INPUT',message='Check airport identifiers and request fields.',retryable=False),request_id=request.state.request_id))


@app.get('/api/v1/airports',response_model=list[Airport],responses=ERRORS)
def airport_search(request:Request,q:str=Query('',max_length=100)):
    q=q.strip().casefold()
    if len(q)<2:
        return []
    matches=[a for a in request.app.state.service.lookup.values() if q in ' '.join(str(a.get(k) or '') for k in ('id','iata','icao','name','municipality')).casefold()]
    matches.sort(key=lambda a:(not any(q==str(a.get(k) or '').casefold() for k in ('id','iata','icao')),not a['scheduled_service'],a['name']))
    return matches[:20]


@app.get('/api/v1/examples',response_model=list[Example])
def examples(request:Request):
    return request.app.state.service.examples


@app.post('/api/v1/scenarios',response_model=ScenarioResult|Job,responses={**ERRORS,202:{'model':Job}})
async def create_scenario(body:ScenarioRequest,request:Request):
    service=request.app.state.service
    if body.origin_id not in service.lookup or body.destination_id not in service.lookup:
        fail(422,'UNKNOWN_AIRPORT','Select two airports from the search results.')
    if body.origin_id==body.destination_id:
        fail(422,'SAME_AIRPORT','Choose different departure and arrival airports.')
    a,b=service.lookup[body.origin_id],service.lookup[body.destination_id]
    try:
        Corridor([a['longitude_deg'],a['latitude_deg']],[b['longitude_deg'],b['latitude_deg']])
    except ValueError as e:
        code,message=str(e).split(': ',1)
        fail(422,code,message)
    for example in service.examples:
        if all(example[k]==v for k,v in body.model_dump().items()):
            return service.saved[example['scenario_id']]
    identity=json.dumps(dict(**body.model_dump(),valid_time=config()['valid_time'],version=MODEL_VERSION),sort_keys=True)
    key=hashlib.sha256(identity.encode()).hexdigest()[:20]
    if key in service.jobs:
        job=service.jobs[key]
        if job['status']=='failed':
            del service.jobs[key]
        else:
            return JSONResponse(job,status_code=200 if job['status']=='complete' else 202)
    # Includes active and waiting work, even before the worker gets scheduled.
    outstanding=sum(j['status'] in ('queued','running') for j in service.jobs.values())
    if outstanding>=3 or service.queue.full():
        fail(429,'BUSY','The comparison service is busy. Try again shortly or open a saved example.',True)
    now=time.monotonic()
    while service.calls and service.calls[0]<now-86400:
        service.calls.popleft()
    if len(service.calls)>=24 or sum(t>now-3600 for t in service.calls)>=6:
        fail(429,'APP_LIMIT','The free weather acquisition budget is exhausted. Saved examples remain available.',True)
    service.calls.append(now)
    payload=body.model_dump()
    fixture=f'{body.origin_id}-{body.destination_id}.json'
    if (DATA/'weather'/fixture).is_file():
        payload['_fixture']=fixture
    job=dict(scenario_id=key,status='queued',result_url=f'/api/v1/scenarios/{key}',stage='Waiting to compare',error=None)
    service.jobs[key]=job
    while len(service.jobs)>128:
        service.jobs.popitem(last=False)
    service.queue.put_nowait((key,payload))
    return JSONResponse(job,status_code=202)


def get_result(service,id):
    result=service.saved.get(id) or service.jobs.get(id)
    if not result:
        fail(404,'SCENARIO_NOT_FOUND','This temporary comparison is unavailable after a restart. Submit again or open a saved example.',True)
    return result


@app.get('/api/v1/scenarios/{id}',response_model=ScenarioResult|Job,responses=ERRORS)
def scenario(id:str,request:Request):
    return get_result(request.app.state.service,id)


@app.get('/api/v1/scenarios/{id}/winds',response_model=Winds,responses=ERRORS)
def winds(id:str,request:Request):
    result=get_result(request.app.state.service,id)
    if result['status']!='complete':
        fail(503,'RESULT_NOT_READY','Wind samples are available after the comparison completes.',True)
    return result['winds']


@app.get('/api/v1/health')
def health(request:Request):
    service=request.app.state.service
    return dict(ready=bool(service.saved),model_version=MODEL_VERSION,fixture_count=len(service.saved),
                forecast_valid_time=config()['valid_time'],active=service.active,waiting=service.queue.qsize())


# Production uses one origin for static assets and API, so CORS is unnecessary.
# Vite supplies the frontend in development; Docker supplies the built directory.
static_dir=os.getenv('STREAMLINE_STATIC_DIR')
if static_dir:
    app.mount('/',StaticFiles(directory=static_dir,html=True),name='frontend')
