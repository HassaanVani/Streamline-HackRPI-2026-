import httpx
import pytest
from streamline.geometry import Corridor
from streamline.weather import fetch


def test_quota_failure(monkeypatch):
    monkeypatch.setattr(httpx,'get',lambda *a,**kw:httpx.Response(429))
    with pytest.raises(ValueError,match='PROVIDER_LIMIT'):
        fetch(Corridor([0,0],[10,10]),'2026-11-07T17:00:00Z')


def test_contract_change(monkeypatch):
    monkeypatch.setattr(httpx,'get',lambda *a,**kw:httpx.Response(200,json={},request=httpx.Request('GET','https://example.test')))
    with pytest.raises(ValueError,match='PROVIDER_CONTRACT'):
        fetch(Corridor([0,0],[10,10]),'2026-11-07T17:00:00Z')
