## 2026-08-14 - Fix Stale Call-To-Action Button Animation Targeting
**Learning:** When components use multiple layered state buttons (e.g., EOQ vs (R,Q) calculation buttons in the inventory panel switched via a toggle), a simple `querySelector` for the first button can incorrectly apply visual state changes (like the `needs-recalc` pulse) to hidden buttons, breaking visual affordance.
**Action:** Use `offsetParent !== null` to filter a NodeList and only apply visual state updates to the currently visible button in the flow.

## 2026-08-18 - Fix Missing Decimal Point on iOS Number Inputs
**Learning:** By default, iOS Safari displays a simplified numeric keypad (without a decimal point or negative sign) for inputs with `type="number"`. This prevents users from entering necessary floating-point values (like standard deviations) on mobile devices, severely breaking functionality.
**Action:** Always pair `type="number"` with `inputmode="decimal"` on inputs that accept floating point numbers (`step="any"`) to guarantee the mobile OS presents the correct, full-featured numeric keypad.
