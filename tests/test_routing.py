import pytest
from horizon.routing import tsp_approx, job_shop_cpm

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
