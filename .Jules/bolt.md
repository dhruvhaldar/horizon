## 2024-05-24 - Avoid large explicit factorials in probability algorithms
**Learning:** In Queueing algorithms (like M/M/c queues), computing formulas using explicit `factorial(n)` and exponents inside a loop causes O(c^2) arithmetic and quickly leads to `OverflowError` for large inputs.
**Action:** Use an iterative running product instead of explicit exponents and factorials to convert the arithmetic to O(c) and eliminate overflow issues in probability calculations.

## 2025-03-25 - NetworkX all-pairs shortest path bottleneck
**Learning:** Using `nx.all_pairs_dijkstra_path_length` and manually creating edges $O(N^2)$ for metric graph construction can be severely slow for moderate-sized graphs due to Python overhead and graph operation inefficiency.
**Action:** Use `nx.floyd_warshall_numpy` to compute distances significantly faster by leveraging NumPy vectorized operations. When generating the new edges, utilize `metric_G.add_weighted_edges_from(edges)` and a list comprehension to insert only `i < j` pairs instead of `add_edge` in nested loops.

## 2025-03-27 - Optimize graph edge lookup in visualization loop
**Learning:** Using `Array.find` inside a rendering loop to match edge source/target pairs leads to $O(V \times E)$ time complexity. This causes severe rendering bottlenecks in D3 graph visualizations when handling large or dense routing graphs (e.g., TSP approximations).
**Action:** Always pre-compute a `Set` of required edge pairs (e.g., `u-v` and `v-u`) before applying styles. Iterating over the graph's link array and using the $O(1)$ Set lookup reduces the time complexity to $O(V + E)$, ensuring smooth front-end performance regardless of network density.

## 2025-05-10 - Avoid `scipy.stats` distribution object overhead for inverse CDF
**Learning:** `scipy.stats.norm.ppf` and similar functions are extremely slow (~150x overhead) because they create and configure distribution objects and run extensive, non-vectorized input validations under the hood on every call.
**Action:** When calculating standard inverse cumulative distribution function (CDF) values, bypass `scipy.stats` entirely and call the underlying raw C/Fortran routines in `scipy.special` (e.g., `special.ndtri(p)`). If the distribution has a custom location $\mu$ and scale $\sigma$, simply compute it manually using the formula $x = \mu + \sigma \times \text{ndtri}(p)$.

## 2025-06-12 - Redundant NetworkX topological sorts
**Learning:** Checking for cycles using `nx.is_directed_acyclic_graph(G)` and then running `nx.topological_sort(G)` separately in loops adds significant O(V+E) overhead per call. `nx.is_directed_acyclic_graph` actually runs a full topological sort under the hood.
**Action:** When working with DAGs (like CPM or scheduling), run `nx.topological_sort(G)` exactly once and cache it in a list. Wrap this single call in a `try...except nx.NetworkXUnfeasible:` block to detect cycles for free, eliminating redundant graph traversals.

## 2026-05-18 - Math.sqrt over np.sqrt for scalar calculation
**Learning:** Using `np.sqrt` for calculating scalar roots introduces significant performance overhead compared to Python's built-in `math.sqrt` due to NumPy's type checking and array conversion mechanisms. While negligible for a few calls, this matters in heavy computational simulations.
**Action:** When computing the square root of a single scalar value (e.g., EOQ formulations), bypass NumPy and use `math.sqrt()` to achieve approximately 5x faster calculation speeds.

## 2026-06-19 - NumPy array scalar access bottleneck
**Learning:** Accessing individual scalar elements of a `numpy.ndarray` within a Python loop (e.g., list comprehensions) is extremely slow due to the overhead of type-checking and boxing each element into a CPython float.
**Action:** When you need to iterate over a NumPy array in Python to extract individual values, convert the entire array to a native list of lists using `.tolist()` first. This pushes the conversion to C-speed and makes the subsequent Python iterations significantly faster.

## 2024-03-01 - NetworkX Node Attribute Lookup Overhead
**Learning:** Repeatedly accessing node attributes in NetworkX graphs (e.g., `G.nodes[node]['duration']`) within performance-critical traversal loops introduces significant NetworkX property lookup overhead, acting as a bottleneck.
**Action:** Pre-fetch these node attributes into a native Python dictionary before iterating over the graph. Replacing NetworkX node attribute accesses with native dict lookups (e.g., `durations[node]`) significantly improves performance in critical path or graph traversal loops.
## 2026-04-06 - Generator vs List Comprehension in Min/Max Operations
**Learning:** For small bounded collections (like graph predecessors/successors where limits are <= 100), passing a generator expression into `max()` or `min()` is noticeably slower (up to 10-20% slower per call) than passing a list comprehension. This is due to Python's internal generator setup and function call overhead outweighing the memory benefits of lazy evaluation for small inputs.
**Action:** When working with computationally intensive loops operating on small bounded sets (e.g., node neighbor lookups in NetworkX traversals), use list comprehensions instead of generator expressions inside aggregation functions like `max()` or `min()`.
## 2026-04-08 - NetworkX TSP Metric Closure
**Learning:** Manually calculating the full metric closure (e.g. using `nx.floyd_warshall_numpy`) and instantiating a new complete graph object for `nx.approximation.traveling_salesman_problem` introduces significant O(V³) time and O(V²) Python looping overhead.
**Action:** Always pass the original graph directly to `nx.approximation.traveling_salesman_problem(G)` since it automatically and efficiently computes the required shortest paths internally. Use `nx.shortest_path_length` as a fallback when calculating the final path weight if edges were synthesized.
## 2026-04-08 - NetworkX Metric Graph Creation
**Learning:** Using nested list comprehensions to construct a fully connected metric graph from an $O(N^2)$ distance matrix (e.g. from `floyd_warshall_numpy`) introduces significant Python looping and object instantiation overhead.
**Action:** When building a complete/dense graph from a NumPy distance matrix, use `nx.from_numpy_array(matrix)` directly. This constructs the dense graph efficiently at C-speed, bypassing the nested Python loops. Map node integers back to string identifiers using `nx.relabel_nodes`.

## 2026-06-21 - NetworkX TSP Metric Closure API Breakage
**Learning:** In the `horizon/routing.py` module, removing the manual computation of the metric closure via `nx.floyd_warshall_numpy` and `nx.from_numpy_array` to directly pass the original graph `G` to `nx.approximation.traveling_salesman_problem(G, cycle=True)` introduces a severe functional bug and a performance regression. While NetworkX calculates the missing shortest paths efficiently internally, it expands the final path back into `G`. This causes `tsp_path` to include intermediate, duplicated nodes (the literal walk through the graph), breaking any downstream code expecting a strict list of unique waypoints. In addition, computing the final edge weights by calling `nx.shortest_path_length` iteratively on every sequential pair of nodes in the generated TSP path recalculates Dijkstra's algorithm $O(V)$ times for paths that were already found just moments prior, leading to a massive performance bottleneck.
**Action:** Do not remove the manual metric closure calculation for TSP approximations using `nx.approximation.traveling_salesman_problem`. Maintain the explicit use of `nx.floyd_warshall_numpy` and `nx.from_numpy_array` to build the complete graph `metric_G`, passing `metric_G` to the TSP solver and calculating the final weight via $O(1)$ edge lookups (`metric_G[u][v]['weight']`).

## 2026-06-21 - Avoid redundant dictionary lookups and string building for aggregation
**Learning:** In `horizon/queueing.py`, aggregating `total_L` with a list comprehension like `sum([results[f"node_{i}"]["L"] for i in range(n)])` after building the `results` dictionary requires $O(N)$ string creations (`f"node_{i}"`) and $O(N)$ nested dictionary lookups for data that was just computed.
**Action:** When calculating system totals from newly computed node metrics inside a loop, accumulate the totals directly in local scope during that primary processing loop rather than re-querying the data structure later.
