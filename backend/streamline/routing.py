import heapq
import numpy as np
from .geometry import distance
from .physics import edge_times, bearing

OFFSETS = [(1,0), (0,1), (1,1), (1,-1), (2,1), (1,2), (2,-1), (1,-2)]
OFFSETS += [(-x,-y) for x,y in OFFSETS]


def solve(corridor, field, nx=64, ny=33, width=None, astar=False):
    width = width or corridor.width
    xx, yy = np.meshgrid(np.linspace(0,1,nx), np.linspace(-width,width,ny))
    coords = corridor.points(xx, yy).reshape(-1,2)
    ids = np.arange(nx*ny).reshape(ny,nx)
    starts, ends = [], []
    for dx, dy in OFFSETS:
        x0, x1 = max(0,-dx), min(nx,nx-dx)
        y0, y1 = max(0,-dy), min(ny,ny-dy)
        starts.extend(ids[y0:y1,x0:x1].ravel())
        ends.extend(ids[y0+dy:y1+dy,x0+dx:x1+dx].ravel())
    starts, ends = np.array(starts), np.array(ends)
    costs = edge_times(coords[starts], coords[ends], field)
    adjacency = [[] for _ in coords]
    for a,b,c in zip(starts, ends, costs):
        if np.isfinite(c):
            adjacency[a].append((int(b),float(c)))
    start, end = (ny//2)*nx, (ny//2)*nx+nx-1
    heuristic = np.zeros(len(coords))
    if astar:
        # Bilinear vectors are convex combinations, so max sampled magnitude bounds the field.
        bound = float(np.nanmax(np.hypot(field.u, field.v))) if field.enabled else 0
        heuristic = distance(coords, coords[end])/(230+bound)
    best, previous = {start:0.}, {}
    queue = [(float(heuristic[start]),0.,start)]
    while queue:
        _, cost, node = heapq.heappop(queue)
        if cost > best[node]:
            continue
        if node == end:
            break
        for neighbor, step in adjacency[node]:
            candidate = cost+step
            if candidate < best.get(neighbor,float('inf')):
                best[neighbor], previous[neighbor] = candidate,node
                heapq.heappush(queue,(candidate+float(heuristic[neighbor]),candidate,neighbor))
    if end not in best:
        raise ValueError('NO_MODEL_PATH: No path has valid wind and forward progress in this corridor.')
    path = [end]
    while path[-1] != start:
        path.append(previous[path[-1]])
    path.reverse()
    boundary = any(i//nx in (0,ny-1) for i in path)
    baseline = coords[ids[ny//2]]
    return coords[path], baseline, boundary


def evaluate(coords, field):
    a,b = coords[:-1],coords[1:]
    distances = distance(a,b)
    times = edge_times(a,b,field)
    if not np.all(np.isfinite(times)):
        raise ValueError('MISSING_WIND: The reference path contains unavailable or invalid wind.')
    from .geometry import interpolate
    mid = interpolate(a,b,0.5)
    u,v = field.sample(mid)
    h = bearing(mid,b)
    along, cross = u*np.sin(h)+v*np.cos(h), u*np.cos(h)-v*np.sin(h)
    segments = [dict(lon=float(p[0]),lat=float(p[1]),wind_mps=float(np.hypot(uu,vv)),
                     along_mps=float(al),cross_mps=float(cr),ground_speed_mps=float(d/t),
                     modeled_duration_s=float(t))
                for p,uu,vv,al,cr,d,t in zip(mid,u,v,along,cross,distances,times)]
    return dict(distance_m=float(sum(distances)),modeled_duration_s=float(sum(times)),
                fuel_kg=None,co2_kg=None,segment_metrics=segments)
