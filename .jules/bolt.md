## 2024-05-24 - Unrolling Recursive Type Checks
**Learning:** In highly recursive Python functions (like scanning nested JSON response dictionaries), the overhead of function calls combined with `isinstance()` MRO lookups is immense for common scalar leaf nodes.
**Action:** Unroll leaf-node evaluations into the caller and use exact type matching (`type(x) is float`) instead of `isinstance` to bypass both function call overhead and MRO resolution for primitive types, yielding significant speedups (~3x) on dense data.
## 2024-05-25 - Using `math.isfinite` for faster validation
**Learning:** Checking for infinity or NaN using `math.isinf(x) or math.isnan(x)` requires two separate C-level function calls.
**Action:** Replace `math.isinf(x) or math.isnan(x)` with `not math.isfinite(x)`. This reduces the number of function calls by half for valid values, decreasing overhead by ~20% in large validation loops.
## 2024-05-26 - Avoid `innerText` in frequent DOM operations
**Learning:** `innerText` computes the visible text content of an element by evaluating CSS layout, which triggers costly layout thrashing / reflows. When used inside high-frequency listeners like global `input` event listeners (e.g., checking states for stale data dimming), it causes significant UI freezing and delays.
**Action:** Replace `innerText` with `textContent` when retrieving or updating DOM text if you don't explicitly need CSS visibility validation. `textContent` simply reads the raw text nodes from the DOM tree, bypassing layout calculation entirely and yielding ~2.5x speedups in frequent operations.
## 2024-05-27 - Using GZipMiddleware in FastAPI
**Learning:** Large JSON payloads and static assets (HTML/JS/CSS) can consume massive amounts of bandwidth over standard network connections, where I/O is a larger bottleneck than CPU for typical text transfers.
**Action:** Always inject `GZipMiddleware` with an appropriate minimum size threshold (e.g., `minimum_size=1000`) into FastAPI applications. This can reduce payload size by 80-90% for large lists or matrices, yielding significant network speedups.
## 2026-05-09 - Early Return in High-Frequency DOM Iterations
**Learning:** In high-frequency frontend event listeners (like global `input` handlers applying UI dimming), iterating over `querySelectorAll` results and performing redundant DOM reads (`textContent`) and string operations on elements that are *already* dimmed is an unnecessary performance bottleneck.
**Action:** When applying stateful UI effects in loops during high-frequency events, always add an early return or `continue` block (e.g., `if (el.style.opacity === '0.5') return;`) to bypass expensive checks once the desired state has been achieved.
## 2026-05-15 - Bypass Redundant Shortest Paths in TSP Wrapper
**Learning:** `networkx.approximation.traveling_salesman_problem` is a high-level wrapper that automatically re-computes `all_pairs_dijkstra` on the input graph, assuming the input graph is not yet a complete metric closure graph. This introduces massive O(N^3) shortest path overhead if you've already computed the metric closure yourself natively in C-speed (e.g., using `nx.floyd_warshall_numpy`).
**Action:** When approximating TSP on a pre-computed complete metric graph in NetworkX, bypass the `traveling_salesman_problem` wrapper entirely. Call the specific approximation algorithm directly (e.g., `nx.approximation.christofides(metric_G, weight="weight")`) to avoid redundant shortest path computations, speeding up dense graph resolution by ~15x.
