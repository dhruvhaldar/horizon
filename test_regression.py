import networkx as nx
from horizon.routing import job_shop_cpm

jobs = {
    'A': {'duration': 5, 'dependencies': []},
    'B': {'duration': 3, 'dependencies': ['A']}
}

res = job_shop_cpm(jobs)
print(res)
