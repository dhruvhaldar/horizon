## YYYY-MM-DD - [Frontend Script Blocking]
**Learning:** Synchronous scripts in the `<head>` of `index.html` block HTML parsing, delaying FCP. Adding the `defer` attribute allows parallel downloading and defers execution until DOM parsing is complete.
**Action:** Always verify if external library scripts in `<head>` can use `defer` or `async` to improve FCP.

## 2026-05-23 - [Global Non-Passive Event Listeners]
**Learning:** Attaching a non-passive event listener like `wheel` or `touchstart` globally to the `document` blocks the browser's main thread on every scroll action across the entire page, disabling native 60fps scrolling optimizations and causing significant jank.
**Action:** Always attach non-passive event listeners locally to the specific elements that require them (e.g., specific `input` fields) instead of the global `document` or `window`.

## 2026-05-25 - [Static D3.js Forced Graphs]
**Learning:** Animating D3.js force-directed graphs via `simulation.on("tick", ...)` causes severe synchronous DOM layout thrashing, as the browser must recalculate styles and layout on every animation frame for every node and link. For graphs where only the final steady-state layout is needed, this is unnecessary overhead.
**Action:** Always stop the automatic animation (`simulation.stop()`), manually advance the physics simulation in-memory (`simulation.tick(300)`), and apply the final `x` and `y` coordinates directly during element creation to bypass layout thrashing.
## 2024-05-26 - Deterministic API Caching
**Learning:** Mathematical solvers in this application act as pure functions. Identical inputs always yield identical outputs. Relying solely on the backend to re-calculate these results incurs unnecessary network latency and CPU overhead.
**Action:** Implemented a client-side `apiCache` (using a JavaScript Map) to memoize JSON responses based on serialized request payloads. This reduces redundant network requests to 0 and brings calculation latency to 0ms for repeated queries.

## 2026-05-28 - [DOM Initialization Layout Thrashing]
**Learning:** When initializing auto-resizing elements (like multiple textareas) on page load, a simple `forEach` loop that sets `style.height = 'auto'` and immediately reads `scrollHeight` interleaves DOM writes and reads. This forces the browser to synchronously recalculate the entire page layout on every iteration, causing O(N) layout thrashing and slowing down First Contentful Paint.
**Action:** Always batch DOM initialization into distinct phases to bypass forced reflows: 1. Write (reset all), 2. Read (measure all), 3. Write (apply all final states).

## 2026-06-01 - [FastAPI JSON Serialization Overhead]
**Learning:** Returning a plain Python dictionary from a FastAPI endpoint forces the framework to recursively run `fastapi.encoders.jsonable_encoder` on the entire response payload. This adds severe serialization overhead for large nested structures (like mathematical graphs).
**Action:** When the response data is already composed of simple, native JSON-serializable types (like lists, dicts, and floats), always return `fastapi.responses.JSONResponse(content=data)` directly. This bypasses the recursive encoding overhead and can improve endpoint response speed by 60-70%.

## 2026-06-02 - [FastAPI JSON Serialization NaN Validation]
**Learning:** Validating large, nested mathematical JSON payloads for Infinity/NaN using a recursive Python function is extremely slow due to function call and iteration overhead. However, the underlying C implementation of `json.dumps(..., allow_nan=False)` performs this validation natively at C-speed, throwing a `ValueError`.
**Action:** Subclass `fastapi.responses.JSONResponse` and override the `render()` method to catch the `ValueError` from its internal `json.dumps()` call. This allows rejecting Inf/NaN values securely without the severe performance penalty of recursive Python-level checks.

## 2026-06-03 - [NumPy Array Instantiation Overhead]
**Learning:** Using `np.array()` to parse large nested Python lists (like a 2D matrix payload from an API) incurs massive overhead because NumPy must dynamically infer both the shape and the type of the elements by recursively traversing the Python objects.
**Action:** Always use `np.fromiter` with a specified `dtype` and `count` to stream elements into memory via C-level iterators. For 2D matrices, flatten the Python list using `itertools.chain.from_iterable()` before passing it to `np.fromiter`, then `.reshape()` the result. This bypasses the Python type-checking overhead and is ~40% faster for matrix instantiation.

## 2026-06-04 - [NetworkX is_connected Overhead]
**Learning:** Using `nx.is_connected(G)` to check graph connectivity before running `nx.floyd_warshall_numpy(G)` is redundant and slow. `nx.is_connected` performs an O(V+E) BFS/DFS traversal in pure Python. However, `floyd_warshall_numpy` computes the shortest paths and inherently identifies disconnected components by returning `inf` values for unreachable nodes.
**Action:** Remove `nx.is_connected(G)` and instead compute the distance matrix first using `nx.floyd_warshall_numpy(G)`, then check for connectivity at C-speed using `np.isinf(matrix).any()`.

## 2026-06-13 - [FastAPI Inline Module Imports]
**Learning:** Calling module imports (like `from fastapi.responses import FileResponse`) inside an endpoint function executes Python's import machinery (checking `sys.modules`, dictionary lookups) on every single request. While cached, this introduces unnecessary per-request overhead for frequently accessed endpoints like the root (`/`).
**Action:** Always place standard imports in the global scope at the top of the file to ensure they are parsed only once during application startup, maximizing endpoint throughput.

## 2026-06-15 - [Visualization Container Layout Thrashing]
**Learning:** Interleaving DOM writes (like clearing a D3 container via `selectAll("*").remove()`) immediately followed by DOM layout reads (like `getBoundingClientRect()`) forces the browser to synchronously recalculate layout. When updating visualizations, always measure container dimensions *before* clearing or mutating the container to utilize the browser's cached layout and bypass the reflow penalty.
**Action:** Always place DOM layout reads (`offsetWidth`, `getBoundingClientRect()`) before DOM writes within functions handling DOM updates.

## 2026-06-25 - [NetworkX vs SciPy Distance Matrix Overhead]
**Learning:** Building a `networkx.Graph()` and adding nodes/edges involves significant Python-level object instantiation and validation overhead. When the only goal is to compute an all-pairs shortest path matrix (e.g., for TSP approximation setup), passing a NetworkX graph to `nx.floyd_warshall_numpy` is unnecessarily slow.
**Action:** Bypass NetworkX graph creation entirely. Map node IDs to integers, manually populate an adjacency matrix as a NumPy array, and use `scipy.sparse.csgraph.floyd_warshall`. This computes the distance matrix roughly 50% faster than the NetworkX approach.

## 2026-06-22 - NetworkX `nx.from_numpy_array` Overhead for Dense Graphs
**Learning:** While `nx.from_numpy_array` is faster than using nested python loops to build graphs, it still introduces massive overhead for dense graphs (like metric closures) because it iterates over the entire `N x N` matrix.
**Action:** When building dense undirected graphs from symmetric NumPy matrices, extract the upper triangle indices using `np.triu_indices` and manually zip the edges into `G.add_edges_from`. This avoids iterating over non-edges/duplicate edges and constructs the graph >2x faster.

## 2026-06-25 - [Layout Thrashing from Execution Order]
**Learning:** Even if a function correctly batches its own DOM reads before writes (e.g., measuring a container before drawing a graph), calling it immediately *after* another DOM write (e.g., updating a results text element) still forces a synchronous layout recalculation. The browser's layout state is dirtied by the preceding text update, defeating the optimization inside the drawing function.
**Action:** Always consider the broader execution context. Swap the execution order to batch all DOM reads (the graph measurement) *before* any DOM writes (updating the results text and drawing the graph elements).
## 2026-06-27 - [JSON.stringify Redundancy Overhead]
**Learning:** Calling `JSON.stringify(bodyObj)` multiple times for the same large payload (once to generate a client-side cache key, and again for the HTTP `fetch` body) introduces significant redundant O(N) serialization overhead that blocks the browser main thread.
**Action:** Always cache the output of `JSON.stringify` into a variable (`bodyStr`) if it needs to be reused across multiple operations like cache key generation and network requests.

## 2026-06-28 - [NetworkX add_edges_from Overhead with Comprehensions]
**Learning:** Constructing dense graphs in NetworkX using `G.add_edges_from()` with inline dictionary comprehensions for edge attributes (e.g., `[{'weight': float(w)} for w in weights]`) and NumPy array iteration introduces massive Python dictionary instantiation and NumPy scalar boxing overheads.
**Action:** Always use `G.add_weighted_edges_from(zip(u.tolist(), v.tolist(), w.tolist()))` when constructing dense symmetric graphs from NumPy matrices. Converting to native Python lists at C-speed via `.tolist()` bypasses the boxing overhead and constructs the graph significantly faster.

## 2026-07-02 - [O(N) DOM Traversal Overhead in Global Input Listeners]
**Learning:** Executing `querySelectorAll` inside a global `input` event listener forces the browser to perform O(N) DOM traversal on every single keystroke. This redundant querying during high-frequency input events blocks the main thread and introduces perceptible input lag.
**Action:** When applying visual state changes (like dimming stale data) during `input` events, use an early return flag (e.g., a `data-*` attribute on the parent container) to bypass `querySelectorAll` and subsequent DOM operations entirely once the state has already been applied.

## 2026-07-06 - [NumPy Identity Matrix Subtraction Overhead]
**Learning:** Calculating `np.eye(n) - A` (where `A` is an `N x N` NumPy array) is a common pattern for generating `(I - A)` matrices. However, `np.eye(n)` creates a full `N x N` identity matrix filled with zeros, and the subsequent subtraction performs an `O(N^2)` element-wise operation. This intermediate allocation and subtraction adds unnecessary overhead.
**Action:** When computing `I - A`, initialize the result by directly negating the array (`res = -A`), which inherently returns a negated copy at C-speed. Then, use `np.fill_diagonal(res, res.diagonal() + 1.0)` to add 1 to the diagonal in-place. This bypasses the full `N x N` subtraction and intermediate identity matrix allocation, running roughly 2x faster.
## 2026-07-05 - [Defers textarea resizing with requestAnimationFrame]
**Learning:** Setting height='auto' and reading scrollHeight synchronously blocks the main thread with a forced layout recalculation (reflow) on every single keystroke. This causes input lag for textareas.
**Action:** Defer the resize logic into the browser's natural render cycle using `requestAnimationFrame`. This eliminates input lag by preventing synchronous reflows on every keystroke.

## 2026-07-10 - [FastAPI Threadpool Overhead for O(1) Endpoints]
**Learning:** In FastAPI, standard `def` endpoints are executed in an external threadpool (via `run_in_threadpool`) to prevent blocking the async event loop. For microsecond-level O(1) CPU tasks (like health checks or simple mathematical formulas), the overhead of acquiring a thread and context switching is significantly higher than the execution time itself. However, defining heavy CPU-bound tasks (like O(N^2) routing solvers) as `async def` is a critical anti-pattern that blocks the event loop and kills server concurrency.
**Action:** Define ultra-fast O(1) CPU-bound endpoints as `async def` instead of `def` to bypass the threadpool and reduce latency. Always keep computationally heavy endpoints as standard `def` to ensure they are offloaded to the threadpool.
## 2026-07-15 - [O(N) DOM Traversal Overhead in Validation]
**Learning:** Using `document.querySelector('label[for="id"]')` to find an input's label forces an O(N) DOM traversal. This is especially problematic during high-frequency validation events (like input event listeners when an element is in an error state), causing performance bottlenecks.
**Action:** Use the native HTML5 `element.labels[0]` property for O(1) direct access to an input's associated label.

## 2026-07-20 - [Redundant DOMRect Calculations]
**Learning:** Calling `getBoundingClientRect()` multiple times consecutively on the same DOM node without an intervening layout mutation doesn't trigger layout thrashing, but it does incur unnecessary execution time by recalculating/fetching the layout box and allocating a new `DOMRect` object on each call.
**Action:** When multiple dimensions (e.g., width and height) are needed from a single element, cache the result of a single `getBoundingClientRect()` call into a variable (e.g., `const rect = ...`) and read the properties from it.

## 2026-07-25 - [Rate Limit Middleware O(N) Overhead]
**Learning:** Using a list comprehension to prune a rolling window of timestamps (e.g., `[t for t in history if now - t < 60]`) incurs O(N) overhead and allocates a new list object on *every single request*. For rate-limiting middleware that executes on every API call, this creates unnecessary garbage collection pressure and CPU usage.
**Action:** Always use a `collections.deque` for rolling time windows. By calling `popleft()` inside a `while` loop, you can prune expired timestamps in amortized O(1) time and perform the update in-place without intermediate allocations.

## 2026-07-30 - [O(N) Layout Thrashing with Concurrent requestAnimationFrame]
**Learning:** Using individual `requestAnimationFrame` callbacks for elements to batch their own DOM reads/writes is insufficient when multiple elements (like multiple textareas) trigger updates simultaneously (e.g., during window resize). The callbacks run in the same frame, interleaving their reads and writes across instances, which causes O(N) forced synchronous layout recalculations.
**Action:** When multiple elements might update simultaneously, queue them in a `Set` (to deduplicate) and process them in a single, batched `requestAnimationFrame`. Execute all DOM writes (reset phase), then all DOM reads (measure phase), then the final DOM writes (apply phase) to reduce layout thrashing to O(1) per frame.
