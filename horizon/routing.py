import networkx as nx

def tsp_approx(nodes: list[str], edges: list[tuple[str, str, float]]):
    """
    Traveling Salesperson Problem Approximation using NetworkX.
    Nodes: list of node IDs.
    Edges: list of tuples (node1, node2, weight).
    """
    G = nx.Graph()
    G.add_nodes_from(nodes)
    G.add_weighted_edges_from(edges)

    # We can use the traveling_salesperson_problem from networkx which gives an approximation
    # Since we need to form a cycle that visits all nodes, this function uses Christofides if triangle inequality holds
    # or another approximation. We assume fully connected graph or we compute shortest paths.

    # For a robust approach on an arbitrary graph, we first compute all-pairs shortest paths
    # to create a complete metric graph, then run TSP on it.

    # Check if the graph is connected
    if not nx.is_connected(G):
        raise ValueError("Graph is not connected, TSP has no solution.")

    metric_G = nx.Graph()
    metric_G.add_nodes_from(G.nodes())

    path_lengths = dict(nx.all_pairs_dijkstra_path_length(G))
    for u in G.nodes():
        for v in G.nodes():
            if u != v:
                metric_G.add_edge(u, v, weight=path_lengths[u][v])

    tsp_path = nx.approximation.traveling_salesman_problem(metric_G, cycle=True)

    # Calculate total weight
    total_weight = sum(metric_G[u][v]['weight'] for u, v in zip(tsp_path[:-1], tsp_path[1:]))

    return {
        "path": tsp_path,
        "total_distance": total_weight
    }

def job_shop_cpm(jobs: dict[str, dict]):
    """
    Critical Path Method for Job-Shop Scheduling.
    jobs: dict where keys are job IDs and values are dicts containing 'duration' and 'dependencies'.
    e.g., {'A': {'duration': 5, 'dependencies': []}, 'B': {'duration': 3, 'dependencies': ['A']}}
    """
    G = nx.DiGraph()

    for job, details in jobs.items():
        G.add_node(job, duration=details['duration'])
        for dep in details.get('dependencies', []):
            G.add_edge(dep, job)

    if not nx.is_directed_acyclic_graph(G):
         raise ValueError("Job dependencies contain a cycle.")

    # Add a start node and an end node
    G.add_node('START', duration=0)
    G.add_node('END', duration=0)

    for job, details in jobs.items():
        if not details.get('dependencies', []):
            G.add_edge('START', job)
        if G.out_degree(job) == 0:
            G.add_edge(job, 'END')

    # Calculate earliest start times (EST) and earliest finish times (EFT)
    est = {'START': 0}
    for node in nx.topological_sort(G):
        if node == 'START': continue
        est[node] = max((est[pred] + G.nodes[pred]['duration'] for pred in G.predecessors(node)), default=0)

    # Calculate latest start times (LST) and latest finish times (LFT)
    project_duration = est['END']
    lft = {'END': project_duration}

    # Need to process in reverse topological order
    for node in reversed(list(nx.topological_sort(G))):
        if node == 'END': continue
        lft[node] = min((lft[succ] - G.nodes[succ]['duration'] for succ in G.successors(node)), default=project_duration)

    # Identify critical path
    critical_path = []
    slack = {}
    for node in G.nodes():
        if node in ('START', 'END'): continue
        s = lft[node] - est[node] - G.nodes[node]['duration']
        slack[node] = s
        if s == 0:
            critical_path.append(node)

    # Sort critical path by EST to represent chronological order
    critical_path.sort(key=lambda x: est[x])

    return {
        "project_duration": project_duration,
        "critical_path": critical_path,
        "est": {k: v for k, v in est.items() if k not in ('START', 'END')},
        "lft": {k: v for k, v in lft.items() if k not in ('START', 'END')},
        "slack": slack
    }
