import numpy as np
from .geometry import bearing, distance, interpolate

TAS = 230.0


def wind_components(speed, direction):
    theta = np.radians(direction)
    return -np.asarray(speed)*np.sin(theta), -np.asarray(speed)*np.cos(theta)


def ground_speed(u, v, heading, tas=TAS):
    along = u*np.sin(heading) + v*np.cos(heading)
    cross = u*np.cos(heading) - v*np.sin(heading)
    valid = np.isfinite(u) & np.isfinite(v) & (np.abs(cross) <= tas)
    speed = along + np.sqrt(np.maximum(0, tas*tas-cross*cross))
    return np.where(valid & (speed > 1e-9), speed, np.nan)


class WindField:
    def __init__(self, data, corridor, enabled=True):
        self.data, self.corridor, self.enabled = data, corridor, enabled
        self.u, self.v = np.asarray(data['u_mps']), np.asarray(data['v_mps'])
        self.width = data['width_rad']

    def sample(self, points):
        x, y = self.corridor.parameters(points)
        ny, nx = self.u.shape
        sx = x*(nx-1)
        sy = (y/self.width+1)*(ny-1)/2
        valid = (sx >= -1e-7) & (sx <= nx-1+1e-7) & (sy >= -1e-7) & (sy <= ny-1+1e-7)
        sx, sy = np.clip(sx, 0, nx-1), np.clip(sy, 0, ny-1)
        ix, iy = np.minimum(sx.astype(int), nx-2), np.minimum(sy.astype(int), ny-2)
        fx, fy = sx-ix, sy-iy
        def blend(arr):
            out = (arr[iy, ix]*(1-fx)*(1-fy) + arr[iy, ix+1]*fx*(1-fy)
                   + arr[iy+1, ix]*(1-fx)*fy + arr[iy+1, ix+1]*fx*fy)
            return np.where(valid, out if self.enabled else np.zeros_like(out), np.nan)
        return blend(self.u), blend(self.v)


def edge_times(a, b, field, tas=TAS):
    """Three-point Gauss quadrature along each geodesic segment."""
    d = distance(a, b)
    total = np.zeros_like(d)
    for t, weight in ((0.1127016654, 5/18), (0.5, 8/18), (0.8872983346, 5/18)):
        p = interpolate(a, b, t)
        u, v = field.sample(p)
        speed = ground_speed(u, v, bearing(p, b), tas)
        total += weight*d/speed
    return np.where(np.isfinite(total), total, np.inf)
