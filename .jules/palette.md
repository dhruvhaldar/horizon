## 2026-08-14 - Fix Stale Call-To-Action Button Animation Targeting
**Learning:** When components use multiple layered state buttons (e.g., EOQ vs (R,Q) calculation buttons in the inventory panel switched via a toggle), a simple `querySelector` for the first button can incorrectly apply visual state changes (like the `needs-recalc` pulse) to hidden buttons, breaking visual affordance.
**Action:** Use `offsetParent !== null` to filter a NodeList and only apply visual state updates to the currently visible button in the flow.

## 2026-08-24 - Improve Mobile Number Input Experience for Fractional Values
**Learning:** For inputs that accept fractional numbers (e.g., `step="any"`), using only `type="number"` does not consistently trigger a full numeric keypad with a decimal separator on mobile browsers (particularly iOS Safari).
**Action:** Pair `type="number"` with `inputmode="decimal"` to ensure mobile users are presented with the appropriate keypad for entering fractional values.
