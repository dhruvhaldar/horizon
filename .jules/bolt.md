## YYYY-MM-DD - [Frontend Script Blocking]
**Learning:** Synchronous scripts in the `<head>` of `index.html` block HTML parsing, delaying FCP. Adding the `defer` attribute allows parallel downloading and defers execution until DOM parsing is complete.
**Action:** Always verify if external library scripts in `<head>` can use `defer` or `async` to improve FCP.

## 2026-05-23 - [Global Non-Passive Event Listeners]
**Learning:** Attaching a non-passive event listener like `wheel` or `touchstart` globally to the `document` blocks the browser's main thread on every scroll action across the entire page, disabling native 60fps scrolling optimizations and causing significant jank.
**Action:** Always attach non-passive event listeners locally to the specific elements that require them (e.g., specific `input` fields) instead of the global `document` or `window`.
