import pytest
from fastapi.testclient import TestClient
from Core.api.main import app

client = TestClient(app)

def test_read_health():
    response = client.get("/health")
    assert response.status_code == 200
    data = response.json()
    assert "status" in data
    assert data["status"] == "online"

def test_overview_stats():
    response = client.get("/overview/stats")
    assert response.status_code == 200
    data = response.json()
    assert "packets" in data

def test_get_flows():
    response = client.get("/flows")
    assert response.status_code == 200
    assert isinstance(response.json(), list)

def test_get_sessions():
    response = client.get("/sessions")
    assert response.status_code == 200
    assert isinstance(response.json(), list)

def test_get_alerts():
    response = client.get("/alerts?tier=personal")
    assert response.status_code == 200
    assert isinstance(response.json(), list)
