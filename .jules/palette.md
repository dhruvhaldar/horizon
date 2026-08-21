## 2026-08-14 - Fix Stale Call-To-Action Button Animation Targeting
**Learning:** When components use multiple layered state buttons (e.g., EOQ vs (R,Q) calculation buttons in the inventory panel switched via a toggle), a simple `querySelector` for the first button can incorrectly apply visual state changes (like the `needs-recalc` pulse) to hidden buttons, breaking visual affordance.
**Action:** Use `offsetParent !== null` to filter a NodeList and only apply visual state updates to the currently visible button in the flow.

## 2026-08-21 - Force decimal keypad on mobile for number inputs
**Learning:** For inputs that accept floating point numbers, setting `type="number"` with `step="any"` is not enough. iOS Safari defaults to a numeric keypad *without* a decimal separator unless explicitly told otherwise.
**Action:** Always pair `type="number"` with `inputmode="decimal"` on inputs that accept fractional values (e.g., using `step="any"`) to force the OS to display a full numeric keypad with a decimal separator.
