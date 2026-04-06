import networkx as nx

def tsp_approx(nodes: list[str], edges: list[tuple[str, str, float]]):
    """
    Traveling Salesperson Problem Approximation using NetworkX.
    Nodes: list of node IDs.
    Edges: list of tuples (node1, node2, weight).
    """

    # Security: Prevent DoS via implicit node creation. Validate that all edges
    # only reference explicitly defined nodes to enforce API-level size bounds.
    nodes_set = set(nodes)
    for u, v, _ in edges:
        if u not in nodes_set or v not in nodes_set:
            raise ValueError(f"Edge references undefined node: {u if u not in nodes_set else v}")

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
    nodes_list = list(G.nodes())
    metric_G.add_nodes_from(nodes_list)

    # ⚡ Bolt: Use floyd_warshall_numpy instead of all_pairs_dijkstra_path_length
    # for creating a complete metric graph. This computes all-pairs shortest paths
    # much faster using optimized C/NumPy operations, reducing TSP setup time
    # significantly for larger graphs. We also only add edges where i < j.
    path_lengths = nx.floyd_warshall_numpy(G)

    # ⚡ Bolt: Convert the NumPy array to a native Python list of lists before
    # iterating over it. Accessing individual scalar elements of a NumPy array
    # inside a Python loop incurs significant type-checking and boxing overhead.
    # .tolist() converts the entire array to CPython floats at C-speed, making
    # the subsequent O(N^2) list comprehension noticeably faster.
    path_lengths_list = path_lengths.tolist()

    n = len(nodes_list)
    edges_to_add = [
        (nodes_list[i], nodes_list[j], path_lengths_list[i][j])
        for i in range(n) for j in range(i + 1, n)
    ]
    metric_G.add_weighted_edges_from(edges_to_add)

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

    # ⚡ Bolt: Pre-fetch node durations into a native Python dict.
    # Repeatedly accessing G.nodes[node]['duration'] inside performance-critical
    # traversal loops introduces significant NetworkX property lookup overhead.
    durations = {'START': 0, 'END': 0}

    for job, details in jobs.items():
        durations[job] = details['duration']
        G.add_node(job, duration=details['duration'])
        for dep in details.get('dependencies', []):
            if dep not in jobs:
                raise ValueError(f"Dependency '{dep}' for job '{job}' is not defined.")
            G.add_edge(dep, job)

    # Add a start node and an end node
    G.add_node('START', duration=0)
    G.add_node('END', duration=0)

    for job, details in jobs.items():
        if not details.get('dependencies', []):
            G.add_edge('START', job)
        if G.out_degree(job) == 0:
            G.add_edge(job, 'END')

    # ⚡ Bolt: Cache a single topological sort traversal into a list.
    # This implicitly detects cycles (raising NetworkXUnfeasible) and prevents
    # redundant O(V+E) recalculations from calling `is_directed_acyclic_graph`
    # and `topological_sort` repeatedly.
    try:
        topo_order = list(nx.topological_sort(G))
    except nx.NetworkXUnfeasible:
         raise ValueError("Job dependencies contain a cycle.")

    # ⚡ Bolt: Pre-fetch duration attributes into a native Python dict.
    # Repeatedly accessing G.nodes[node]['duration'] inside loops incurs overhead.
    # This optimization slightly speeds up O(V+E) traversals.
    durations = {node: data['duration'] for node, data in G.nodes(data=True)}

    # Calculate earliest start times (EST) and earliest finish times (EFT)
    est = {'START': 0}
    for node in topo_order:
        if node == 'START': continue
        # ⚡ Bolt: Use a list comprehension instead of a generator expression inside max().
        # For small graphs (N <= 100 per API limit), constructing a small list is faster
        # than the generator setup and function call overhead, improving traversal speed.
        est[node] = max([est[pred] + durations[pred] for pred in G.predecessors(node)], default=0)

    # Calculate latest start times (LST) and latest finish times (LFT)
    project_duration = est['END']
    lft = {'END': project_duration}

    # Need to process in reverse topological order
    for node in reversed(topo_order):
        if node == 'END': continue
        # ⚡ Bolt: Use a list comprehension instead of a generator expression inside min().
        # Similar to EST, constructing a small list is faster than generator overhead
        # for these bounded graph sizes.
        lft[node] = min([lft[succ] - durations[succ] for succ in G.successors(node)], default=project_duration)

    # Identify critical path
    critical_path = []
    slack = {}
    for node in G.nodes():
        if node in ('START', 'END'): continue
        s = lft[node] - est[node] - durations[node]
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
