## 2026-07-31 - Debounce Textarea Auto-Resize on Input
**Learning:** Even when using `requestAnimationFrame` to batch DOM reads/writes in an auto-resize function, firing that function continuously on every keystroke (via the `input` event) queues up redundant reflow operations. During rapid typing, this constant queuing and un-queuing causes subtle layout thrashing and input lag.
**Action:** When binding an auto-resize function to high-frequency events like `input`, always wrap it in a short debounce (e.g., 50ms) using a `WeakMap` to manage timeouts per element. This ensures the batching process itself only runs once the rapid event stream pauses, significantly reducing main-thread load without sacrificing responsiveness.

## 2024-05-24 - Layout Thrashing with Visibility Checks
**Learning:** Checking element visibility dynamically by calling `offsetWidth` or `offsetHeight` forces a synchronous layout recalculation (reflow) if the DOM is dirty. This causes layout thrashing and stutter during high-frequency events (like `keydown` and validation).
**Action:** Use `offsetParent !== null` to check element visibility instead. This relies on the CSS object model rather than performing expensive geometric bounding box calculations, making it O(1) and safe for use in high-frequency event listeners.
