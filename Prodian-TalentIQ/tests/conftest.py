import os
import tempfile
import pytest
from fastapi.testclient import TestClient
os.environ['TALENTIQ_DB_PATH']=tempfile.mktemp(prefix='talentiq_test_',suffix='.sqlite')
os.environ['TALENTIQ_SESSION_SECRET']='test-secret-only-for-tests-not-for-deployment'
os.environ['TALENTIQ_DEMO_PASSWORD']='UnitTest#2026'
os.environ['TALENTIQ_TELA_KEY']='test-tela-secret'
os.environ['TALENTIQ_LAB_MODE']='true'
from backend.app import app

@pytest.fixture
def client():
    return TestClient(app)

@pytest.fixture
def hr(client):
    r=client.post('/api/auth/login',json={'username':'hr','password':'UnitTest#2026'})
    assert r.status_code==200
    return client

@pytest.fixture
def admin(client):
    r=client.post('/api/auth/login',json={'username':'admin','password':'UnitTest#2026'})
    assert r.status_code==200
    return client
