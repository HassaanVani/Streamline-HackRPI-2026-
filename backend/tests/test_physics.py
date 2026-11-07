import numpy as np
import pytest
from streamline.geometry import Corridor, distance, interpolate
from streamline.physics import WindField, ground_speed, wind_components, edge_times
from streamline.routing import solve, evaluate


def field(corridor,u=0,v=0):
    return WindField(dict(u_mps=np.full((12,12),u).tolist(),v_mps=np.full((12,12),v).tolist(),width_rad=2*corridor.width),corridor)


@pytest.mark.parametrize('direction,expected',[(0,(0,-30)),(90,(-30,0)),(180,(0,30)),(270,(30,0))])
def test_meteorological_from(direction,expected):
    assert wind_components(30,direction)==pytest.approx(expected,abs=1e-10)


def test_wind_physics():
    assert ground_speed(30,0,np.pi/2)==pytest.approx(260)
    assert ground_speed(30,0,-np.pi/2)==pytest.approx(200)
    assert ground_speed(30,0,0)==pytest.approx(np.sqrt(230**2-30**2))
    assert np.isnan(ground_speed(231,0,0))
    assert np.isnan(ground_speed(-240,0,np.pi/2))
    assert ground_speed(230,10,0)==pytest.approx(10)
    assert np.isnan(ground_speed(230,0,0))
    assert np.isnan(ground_speed(np.nan,0,0))


@pytest.mark.parametrize('a,b',[([-73.78,40.64],[-.45,51.47]),([179,30],[-179,35]),([-20,78],[120,80]),([2.55,49],[8.57,50])])
def test_worldwide_geometry_and_zero_wind(a,b):
    c=Corridor(a,b);f=field(c)
    p=c.points(np.linspace(0,1,64),0)
    assert p[0]==pytest.approx(a)
    assert distance(p[-1],b)<1e-6
    assert np.sum(distance(p[:-1],p[1:]))==pytest.approx(distance(a,b),rel=1e-8)
    assert sum(edge_times(p[:-1],p[1:],f))==pytest.approx(distance(a,b)/230,rel=.001)
    route,baseline,boundary=solve(c,f,32,17)
    assert not boundary
    assert evaluate(route,f)['modeled_duration_s']==pytest.approx(evaluate(baseline,f)['modeled_duration_s'],rel=.001)


def test_vector_interpolation_and_wrap():
    c=Corridor([179,30],[-179,35]);f=field(c,30,-5)
    p=c.points(np.array([.01,.5,.99]),np.array([0,c.width/2,-c.width/2]))
    u,v=f.sample(p)
    np.testing.assert_allclose(u,30);np.testing.assert_allclose(v,-5)
    u,v=wind_components([30,30],[359,1])
    assert abs(np.mean(u))<1e-8 and np.mean(v)<-29


def test_astar_matches_dijkstra_and_baseline_is_candidate():
    c=Corridor([-73.78,40.64],[-.45,51.47]);f=field(c,30,10)
    d,base,_=solve(c,f,32,17)
    a,_,_=solve(c,f,32,17,astar=True)
    dt=evaluate(d,f)['modeled_duration_s']
    assert evaluate(a,f)['modeled_duration_s']==pytest.approx(dt,rel=.0001)
    assert dt<=evaluate(base,f)['modeled_duration_s']+1e-7


def test_missing_wind_is_not_calm():
    c=Corridor([0,30],[15,40]);f=field(c,float('nan'),0)
    with pytest.raises(ValueError,match='NO_MODEL_PATH'):
        solve(c,f,16,9)
    with pytest.raises(ValueError,match='MISSING_WIND'):
        evaluate(c.points(np.linspace(0,1,10),0),f)


def test_antipodal_domain_rejected():
    with pytest.raises(ValueError,match='DOMAIN_UNSUPPORTED'):
        Corridor([0,0],[180,0])
