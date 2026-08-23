## 2026-08-14 - Fix Stale Call-To-Action Button Animation Targeting
**Learning:** When components use multiple layered state buttons (e.g., EOQ vs (R,Q) calculation buttons in the inventory panel switched via a toggle), a simple `querySelector` for the first button can incorrectly apply visual state changes (like the `needs-recalc` pulse) to hidden buttons, breaking visual affordance.
**Action:** Use `offsetParent !== null` to filter a NodeList and only apply visual state updates to the currently visible button in the flow.

## 2026-08-23 - Improve Mobile Numeric Input Affordance
**Learning:** Pairing `type="number"` with `inputmode="decimal"` on inputs that accept fractional values (`step="any"`) is crucial for mobile users (especially on iOS Safari) because it forces the OS to display a full numeric keypad with a decimal separator, whereas `type="number"` alone might not.
**Action:** Always include `inputmode="decimal"` on floating-point number inputs to guarantee the correct software keyboard is triggered.
