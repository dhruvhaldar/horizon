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
