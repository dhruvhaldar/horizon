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
