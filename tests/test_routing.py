import pytest
from horizon.routing import tsp_approx, job_shop_cpm
from fastapi.testclient import TestClient
from api.index import app

def test_tsp_approx():
    nodes = ['A', 'B', 'C', 'D']
    edges = [
        ('A', 'B', 10),
        ('A', 'C', 15),
        ('A', 'D', 20),
        ('B', 'C', 35),
        ('B', 'D', 25),
        ('C', 'D', 30)
    ]
    res = tsp_approx(nodes, edges)
    # The TSP result is a sequence of nodes starting and ending at the same node.
    assert len(res['path']) == 5
    assert res['path'][0] == res['path'][-1]

    # Check total distance
    assert res['total_distance'] > 0

def test_job_shop_cpm():
    jobs = {
        'A': {'duration': 5, 'dependencies': []},
        'B': {'duration': 3, 'dependencies': ['A']},
        'C': {'duration': 4, 'dependencies': ['A']},
        'D': {'duration': 2, 'dependencies': ['B', 'C']}
    }
    res = job_shop_cpm(jobs)

    # Critical path should be A -> C -> D, duration = 5 + 4 + 2 = 11
    assert res['project_duration'] == 11
    assert res['critical_path'] == ['A', 'C', 'D']
    assert res['slack']['B'] == 1
    assert res['slack']['A'] == 0
    assert res['slack']['C'] == 0

def test_tsp_dos_protection():
    client = TestClient(app)
    # Test excessive nodes
    res = client.post("/api/route/tsp", json={
        "nodes": [str(i) for i in range(101)],
        "edges": []
    })
    assert res.status_code in (400, 422)
    assert "Graph too large" in str(res.json()["detail"]) or "at most 100 items" in str(res.json()["detail"])

    # Test excessive edges
    res = client.post("/api/route/tsp", json={
        "nodes": ["A", "B"],
        "edges": [[str(i), str(j), 1] for i in range(25) for j in range(i+1, 25)] # 300 edges
    })
    # Wait, 25 choose 2 = 300 edges. Let's send 501 edges.
    res2 = client.post("/api/route/tsp", json={
        "nodes": ["A", "B"],
        "edges": [[str(i), "B", 1] for i in range(501)]
    })
    assert res2.status_code in (400, 422)
    assert "Graph too large" in str(res2.json()["detail"]) or "at most 500 items" in str(res2.json()["detail"])

def test_jobshop_dos_protection():
    client = TestClient(app)
    # Test excessive jobs
    jobs = {f"Job{i}": {"duration": 1, "dependencies": []} for i in range(101)}
    res = client.post("/api/route/jobshop", json={"jobs": jobs})
    assert res.status_code in (400, 422)
    assert "Too many jobs" in str(res.json()["detail"]) or "at most 100 items" in str(res.json()["detail"])
