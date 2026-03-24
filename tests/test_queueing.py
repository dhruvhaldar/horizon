import pytest
from horizon.queueing import mmc_queue, jackson_network

def test_mmc_queue_stability():
    with pytest.raises(ValueError):
        mmc_queue(10, 5, 2) # lambda=10, mu=5, c=2 => rho = 10 / 10 = 1, unstable

def test_mmc_queue_metrics():
    res = mmc_queue(2, 3, 1) # M/M/1
    assert res['rho'] == pytest.approx(2/3)
    assert res['L'] == pytest.approx(2)
    assert res['W'] == pytest.approx(1)

def test_jackson_network():
    gamma = [10, 5]
    p = [[0, 0.5], [0, 0]]
    mu = [20, 15]

    # Node 0: lambda_0 = 10 + 0 = 10
    # Node 1: lambda_1 = 5 + 0.5 * lambda_0 = 10
    res = jackson_network(gamma, p, mu)

    assert res['nodes']['node_0']['lambda'] == pytest.approx(10)
    assert res['nodes']['node_1']['lambda'] == pytest.approx(10)

    # Node 0 M/M/1: L = rho / (1-rho) = (10/20) / (1 - 10/20) = 1
    assert res['nodes']['node_0']['L'] == pytest.approx(1)

    # Node 1 M/M/1: L = (10/15) / (1 - 10/15) = 2
    assert res['nodes']['node_1']['L'] == pytest.approx(2)

    assert res['total_L'] == pytest.approx(3)
    assert res['total_W'] == pytest.approx(3 / 15)

def test_queue_dos_protection():
    from fastapi.testclient import TestClient
    from api.index import app
    client = TestClient(app)

    # Valid input within bounds
    res_valid = client.post('/api/queue', json={
        "gamma": [1.0],
        "p": [[0.0]],
        "mu": [2.0],
        "c": [100]
    })
    assert res_valid.status_code == 200

    # Invalid input exceeding bounds
    res_invalid = client.post('/api/queue', json={
        "gamma": [1.0],
        "p": [[0.0]],
        "mu": [2.0],
        "c": [101]
    })
    assert res_invalid.status_code == 400
    assert "Maximum number of servers (c) exceeded" in res_invalid.json()['detail']
