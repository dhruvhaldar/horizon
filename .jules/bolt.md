## YYYY-MM-DD - [Frontend Script Blocking]
**Learning:** Synchronous scripts in the `<head>` of `index.html` block HTML parsing, delaying FCP. Adding the `defer` attribute allows parallel downloading and defers execution until DOM parsing is complete.
**Action:** Always verify if external library scripts in `<head>` can use `defer` or `async` to improve FCP.
