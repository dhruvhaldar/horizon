## 2026-08-14 - Fix Stale Call-To-Action Button Animation Targeting
**Learning:** When components use multiple layered state buttons (e.g., EOQ vs (R,Q) calculation buttons in the inventory panel switched via a toggle), a simple `querySelector` for the first button can incorrectly apply visual state changes (like the `needs-recalc` pulse) to hidden buttons, breaking visual affordance.
**Action:** Use `offsetParent !== null` to filter a NodeList and only apply visual state updates to the currently visible button in the flow.

## 2026-10-25 - Improve Mobile UX for Fractional Number Inputs
**Learning:** Mobile browsers (especially iOS Safari) often do not display a decimal separator on the numeric keypad when using `type="number"` and `step="any"` alone, making it difficult for users to enter operations research parameters like probabilities or standard deviations.
**Action:** Pair `type="number"` with `inputmode="decimal"` on all numeric inputs that accept floating-point values to ensure the OS forces the display of a full numeric keypad with a decimal separator.
