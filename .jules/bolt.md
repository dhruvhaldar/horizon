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
