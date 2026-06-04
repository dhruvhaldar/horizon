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
