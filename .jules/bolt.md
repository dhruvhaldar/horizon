## 2026-07-31 - Debounce Textarea Auto-Resize on Input
**Learning:** Even when using `requestAnimationFrame` to batch DOM reads/writes in an auto-resize function, firing that function continuously on every keystroke (via the `input` event) queues up redundant reflow operations. During rapid typing, this constant queuing and un-queuing causes subtle layout thrashing and input lag.
**Action:** When binding an auto-resize function to high-frequency events like `input`, always wrap it in a short debounce (e.g., 50ms) using a `WeakMap` to manage timeouts per element. This ensures the batching process itself only runs once the rapid event stream pauses, significantly reducing main-thread load without sacrificing responsiveness.

## 2024-05-24 - Layout Thrashing with Visibility Checks
**Learning:** Checking element visibility dynamically by calling `offsetWidth` or `offsetHeight` forces a synchronous layout recalculation (reflow) if the DOM is dirty. This causes layout thrashing and stutter during high-frequency events (like `keydown` and validation).
**Action:** Use `offsetParent !== null` to check element visibility instead. This relies on the CSS object model rather than performing expensive geometric bounding box calculations, making it O(1) and safe for use in high-frequency event listeners.

## 2024-11-20 - Fast JSON Serialization
**Learning:** In FastAPI, subclassing `JSONResponse` and overriding its `render` method to use `json.dumps` natively does not bypass the significant performance overhead of `jsonable_encoder`. FastAPI automatically applies `jsonable_encoder` to all dictionary/Pydantic returns in its routing layer *before* the payload is passed to the response object.
**Action:** To completely bypass `jsonable_encoder` for large, simple data structures, subclass Starlette's base `Response` directly (with `media_type="application/json"`) and manually serialize the content using `json.dumps()` in the overridden `render` method.

## 2025-10-12 - Fast List Validation with max/min
**Learning:** Evaluating conditions across a full list using `any()` with a generator expression (e.g. `any(x > 100 for x in lst)`) incurs significant Python-level iteration and function call overhead.
**Action:** Use C-optimized native functions like `max()` or `min()` (e.g. `max(lst) > 100`) instead of `any()` when processing numerical constraints on fully materialized lists. Be sure to guard against empty lists (`if lst and max(lst) > 100`) to avoid `ValueError`.

## 2026-07-31 - Fast Square Matrix Dimensionality Check
**Learning:** Checking that a matrix has uniform row length using a generator expression inside `any()` (e.g., `any(len(row) != expected for row in matrix)`) adds Python-level iteration and function call overhead.
**Action:** Use native C-level builtins via `set(map(len, matrix))` to check matrix dimensionality. This avoids Python-level loops, running significantly faster. Example: `len(set(map(len, matrix))) != 1 or len(matrix[0]) != expected`.
## 2026-07-31 - Fast Square Matrix Dimensionality Check
**Learning:** The C-level `set(map(len, matrix))` approach doesn't short-circuit. It fails terribly (5x slower) when the matrix fails early compared to a generator expression with `any()`.
**Action:** Do not use `set(map(len, ...))` to replace `any()` for validation checks when readability is degraded and early-exit is important.

## 2026-07-31 - Fast List Validation max vs any
**Learning:** The C-level `max(lst)` optimization doesn't short-circuit. It fails terribly (3-4x slower) when the list fails early compared to a generator expression with `any()`.
**Action:** Do not use `max(lst)` to replace `any()` for validation checks when early-exit is important or if failure is a common case, as the optimization is brittle.

## 2026-07-31 - Fast List Validation any vs for-loop
**Learning:** Checking elements using a generator expression inside `any()` (e.g., `any(len(row) != expected for row in matrix)`) adds Python-level iteration and function call overhead. Previously, using `set(map(len, ...))` was suggested to bypass this, but that sacrifices short-circuiting behavior and fails slowly on early failures.
**Action:** Use a standard `for` loop instead of `any()` with a generator expression. A standard `for` loop avoids the overhead of setting up a generator, resulting in roughly 40% faster validation while retaining O(1) early-exit capability if a mismatched condition is met early.
