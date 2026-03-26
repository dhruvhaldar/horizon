## 2024-05-24 - Avoid large explicit factorials in probability algorithms
**Learning:** In Queueing algorithms (like M/M/c queues), computing formulas using explicit `factorial(n)` and exponents inside a loop causes O(c^2) arithmetic and quickly leads to `OverflowError` for large inputs.
**Action:** Use an iterative running product instead of explicit exponents and factorials to convert the arithmetic to O(c) and eliminate overflow issues in probability calculations.

## 2025-03-25 - NetworkX all-pairs shortest path bottleneck
**Learning:** Using `nx.all_pairs_dijkstra_path_length` and manually creating edges $O(N^2)$ for metric graph construction can be severely slow for moderate-sized graphs due to Python overhead and graph operation inefficiency.
**Action:** Use `nx.floyd_warshall_numpy` to compute distances significantly faster by leveraging NumPy vectorized operations. When generating the new edges, utilize `metric_G.add_weighted_edges_from(edges)` and a list comprehension to insert only `i < j` pairs instead of `add_edge` in nested loops.

## 2025-03-26 - O(V*E) Array.find loop bottleneck in JS graph rendering
**Learning:** Highlighting calculated graph paths by using `Array.find` on edges inside a loop over path nodes leads to `O(V * E)` performance. This blocks the main thread and severely degrades frontend responsiveness for moderate-to-large visualizations.
**Action:** Use a `Set` to pre-store path edges (in both directions) and perform a single `O(E)` iteration over all edges to flag those that exist in the set. This `O(V + E)` approach avoids nested searching overhead.
