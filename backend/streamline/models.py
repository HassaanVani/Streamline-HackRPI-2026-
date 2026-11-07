from typing import Literal
from pydantic import BaseModel, ConfigDict, Field


class Airport(BaseModel):
    id: str
    ident: str
    iata: str | None
    icao: str | None
    name: str
    latitude_deg: float
    longitude_deg: float
    country: str
    municipality: str
    snapshot_id: str
    scheduled_service: bool


class ScenarioRequest(BaseModel):
    model_config = ConfigDict(extra='forbid')
    origin_id: str = Field(min_length=1,max_length=16,pattern=r'^[A-Za-z0-9-]+$')
    destination_id: str = Field(min_length=1,max_length=16,pattern=r'^[A-Za-z0-9-]+$')
    wind_enabled: bool = True


class Segment(BaseModel):
    lon: float
    lat: float
    wind_mps: float
    along_mps: float
    cross_mps: float
    ground_speed_mps: float
    modeled_duration_s: float


class Metrics(BaseModel):
    distance_m: float
    modeled_duration_s: float
    fuel_kg: float | None
    co2_kg: float | None
    fuel_index: float
    segment_metrics: list[Segment]


class Geometry(BaseModel):
    type: Literal['LineString']
    coordinates: list[list[float]]


class RouteProperties(BaseModel):
    kind: Literal['great_circle','wind_optimized']
    feasibility: Literal['not_assessed']
    display_label: str


class Feature(BaseModel):
    type: Literal['Feature']
    id: str
    properties: RouteProperties
    geometry: Geometry


class Routes(BaseModel):
    type: Literal['FeatureCollection']
    features: list[Feature]


class Comparison(BaseModel):
    time_difference_s: float
    percent_difference: float
    meaningful: bool
    stable: bool


class Assumptions(BaseModel):
    tas_mps: float
    pressure_hpa: int
    wind_model: str
    fuel_method: str
    solver: str
    grid: list[int]
    validation_grid: list[int]
    weather_grid: list[int]
    feasibility: str
    extent: str
    exclusions: list[str]


class Provenance(BaseModel):
    provider: str
    model: str
    source_url: str
    valid_time: str
    pressure_hpa: int
    retrieved_at: str
    run_id: str | None
    payload_hash: str
    request_parameters: list[dict[str,str]]
    attribution: str
    license_url: str
    weather_locations: int


class WindSample(BaseModel):
    lon: float
    lat: float
    u_mps: float
    v_mps: float


class Winds(BaseModel):
    units: Literal['m/s']
    valid_time: str
    samples: list[WindSample]


class Validation(BaseModel):
    resolution_change_percent: float
    boundary: bool
    solve_duration_s: float


class ScenarioResult(BaseModel):
    scenario_id: str
    status: Literal['complete']
    model_version: str
    origin: Airport
    destination: Airport
    wind_enabled: bool
    data_mode: Literal['saved_forecast','computed_forecast']
    routes: Routes
    metrics: dict[str,Metrics]
    comparison_baseline_id: str
    comparison: Comparison
    assumptions: Assumptions
    provenance: Provenance
    warnings: list[str]
    validation: Validation
    winds: Winds


class ErrorDetail(BaseModel):
    code: str
    message: str
    retryable: bool


class ErrorResponse(BaseModel):
    error: ErrorDetail
    request_id: str


class Job(BaseModel):
    scenario_id: str
    status: Literal['queued','running','failed']
    result_url: str
    stage: str
    error: ErrorDetail | None = None


class Example(BaseModel):
    scenario_id: str
    origin_id: str
    destination_id: str
    wind_enabled: bool
    label: str
    percent_difference: float
    valid_time: str
    data_mode: str
    attribution: str
    featured: bool
