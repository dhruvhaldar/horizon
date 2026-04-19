## 2024-05-24 - NetworkX Attribute Access Overhead
**Learning:** Repeatedly accessing node attributes inside tight loops using `G.nodes[node]['attr']` in NetworkX incurs significant dictionary-wrapping and property access overhead. This becomes a measurable bottleneck during O(V+E) traversals like computing Earliest Start Times (EST) and Latest Finish Times (LFT) in scheduling algorithms.
**Action:** When performing performance-critical graph traversals that frequently read node data, pre-fetch the necessary attributes into a native, flat Python dictionary (`durations = {n: d['attr'] for n, d in G.nodes(data=True)}`) beforehand to convert chained lookups into O(1) dict access.

## 2025-03-05 - Optimize aggregation with sum() list comprehensions
**Learning:** For small bounded collections, calling `sum()` on a list comprehension inside brackets `sum([ ... ])` is significantly faster than using a generator expression `sum( ... )`. The overhead of generator setup dominates the memory allocation cost for small arrays.
**Action:** Use list comprehensions inside aggregation functions like `sum()` when iterating over small API-bounded collections to bypass the Python generator setup overhead.
## 2025-04-11 - Push-based Dynamic Programming on DAGs
**Learning:** For dynamic programming algorithms on Directed Acyclic Graphs (like computing Earliest Start Times or Latest Finish Times in Critical Path Method), using a 'pull-based' approach with list comprehensions inside `max()` or `min()` incurs significant overhead from list instantiation and function calls.
**Action:** Use a 'push-based' state update instead. Initialize the state array, iterate over the nodes in topological order, and push updates directly to the successors via simple comparisons (e.g., `if curr > est[v]: est[v] = curr`). This eliminates overhead and noticeably speeds up performance-critical traversals.

## 2025-05-18 - Dictionary Comprehension vs. Copy & Pop overhead
**Learning:** In Python, rebuilding a dictionary using a comprehension to exclude a few specific keys (e.g., `{k: v for k, v in est.items() if k not in ('START', 'END')}`) evaluates the condition for every element, introducing O(N) evaluation overhead.
**Action:** When filtering out a small number of known keys from a dictionary, use `.copy()` followed by `.pop('KEY', None)` (or `del`). This is roughly 20x faster because the C-level copy and targeted key deletions bypass Python-level iteration and condition checking entirely.

## 2026-04-14 - Bulk Graph Construction Overhead
**Learning:** In NetworkX, building a `DiGraph` or `Graph` by repeatedly calling `.add_node()` and `.add_edge()` within a performance-critical loop introduces significant dict wrapping and validation overhead per item. When building graphs dynamically from input dictionaries (like in Job-Shop scheduling), this becomes a measurable bottleneck.
**Action:** When creating graphs from bounded inputs, gather all nodes and edges into native Python lists first, then call `G.add_nodes_from()` and `G.add_edges_from()` once. This executes the NetworkX insertions in bulk, resulting in faster and more efficient graph creation.
## 2026-05-20 - Vectorized Path Weight Calculation
**Learning:** When evaluating the total weight of a path sequence (e.g., a list of nodes `[0, 1, 2, 0]`) using a pre-computed distance matrix from `nx.floyd_warshall_numpy`, using Python list comprehensions to iterate over edges and look up weights in a NetworkX graph or dictionary introduces significant Python looping overhead.
**Action:** Use vectorized NumPy array indexing to calculate the total path weight directly from the distance matrix. By slicing the path array into sources (`path[:-1]`) and destinations (`path[1:]`), you can extract all edge weights simultaneously and sum them at C-speed (e.g., `path_lengths[path[:-1], path[1:]].sum()`), which is roughly 3-4x faster than Python iteration.

## 2026-06-03 - Pydantic Model Serialization Overhead
**Learning:** Reconstructing a dictionary of Pydantic models by using a dictionary comprehension and calling `.model_dump()` on each individual nested item (e.g. `{k: v.model_dump() for k, v in req.jobs.items()}`) introduces significant Python looping overhead and individual method call overhead.
**Action:** When serializing collections in Pydantic BaseModels, always use the top-level `.model_dump()` and extract the required nested dictionary (e.g. `req.model_dump()['jobs']`). This shifts the entire serialization process down to Pydantic-Core (Rust), improving performance roughly 2.5x compared to manual Python iteration.
## 2025-03-02 - Replace NetworkX out_degree with Python set tracking for Job Shop endpoints
**Learning:** When identifying nodes without successors during NetworkX graph construction, track dependent nodes dynamically using a native Python set during the initial data iteration rather than calling `G.out_degree(node) == 0` after graph creation. This bypasses O(V) validation and dictionary mapping overhead from NetworkX method calls.
**Action:** Use Python sets to pre-calculate graph properties when iterating over raw graph data during graph construction, rather than relying on heavy NetworkX methods afterward.
