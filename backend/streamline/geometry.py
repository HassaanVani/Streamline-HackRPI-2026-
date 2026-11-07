"""Spherical geometry. Public coordinate order is longitude, latitude (degrees)."""
import numpy as np

R = 6_371_008.8


def xyz(coords):
    lon, lat = np.moveaxis(np.radians(np.asarray(coords, dtype=float)), -1, 0)
    return np.stack((np.cos(lat)*np.cos(lon), np.cos(lat)*np.sin(lon), np.sin(lat)), axis=-1)


def lonlat(v):
    v = np.asarray(v)
    return np.stack((np.degrees(np.arctan2(v[..., 1], v[..., 0])),
                     np.degrees(np.arctan2(v[..., 2], np.hypot(v[..., 0], v[..., 1])))), axis=-1)


def distance(a, b):
    a, b = xyz(a), xyz(b)
    return R * np.arctan2(np.linalg.norm(np.cross(a, b), axis=-1), np.sum(a*b, axis=-1))


def bearing(a, b):
    a, b = np.radians(a), np.radians(b)
    dl = b[..., 0] - a[..., 0]
    return np.arctan2(np.sin(dl)*np.cos(b[..., 1]),
                      np.cos(a[..., 1])*np.sin(b[..., 1])-np.sin(a[..., 1])*np.cos(b[..., 1])*np.cos(dl))


def interpolate(a, b, t):
    a, b = xyz(a), xyz(b)
    omega = np.arctan2(np.linalg.norm(np.cross(a, b), axis=-1), np.sum(a*b, axis=-1))
    den = np.where(omega < 1e-10, 1., np.sin(omega))
    v = (np.sin((1-t)*omega)/den)[..., None]*a + (np.sin(t*omega)/den)[..., None]*b
    return lonlat(np.where((omega < 1e-10)[..., None], a, v))


class Corridor:
    def __init__(self, origin, destination):
        self.a, b = xyz(origin), xyz(destination)
        n = np.cross(self.a, b)
        self.angle = float(np.arctan2(np.linalg.norm(n), np.dot(self.a, b)))
        if self.angle < 1e-6:
            raise ValueError('AIRPORTS_TOO_CLOSE: Choose airports at least 7 meters apart.')
        if np.pi - self.angle < 0.01:
            raise ValueError('DOMAIN_UNSUPPORTED: Near-antipodal journeys have no unique reference corridor.')
        self.n = n / np.linalg.norm(n)
        self.t = np.cross(self.n, self.a)

    def points(self, x, y):
        x, y = np.broadcast_arrays(np.asarray(x)*self.angle, np.asarray(y))
        center = np.cos(x)[..., None]*self.a + np.sin(x)[..., None]*self.t
        return lonlat(np.cos(y)[..., None]*center + np.sin(y)[..., None]*self.n)

    def parameters(self, points):
        p = xyz(points)
        return (np.arctan2(p@self.t, p@self.a)/self.angle,
                np.arcsin(np.clip(p@self.n, -1, 1)))

    @property
    def width(self):
        return min(0.18, max(0.008, self.angle * 0.12))
