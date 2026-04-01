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
