## 2026-08-14 - Fix Stale Call-To-Action Button Animation Targeting
**Learning:** When components use multiple layered state buttons (e.g., EOQ vs (R,Q) calculation buttons in the inventory panel switched via a toggle), a simple `querySelector` for the first button can incorrectly apply visual state changes (like the `needs-recalc` pulse) to hidden buttons, breaking visual affordance.
**Action:** Use `offsetParent !== null` to filter a NodeList and only apply visual state updates to the currently visible button in the flow.

## 2026-08-24 - Improve Mobile Number Input Experience for Fractional Values
**Learning:** For inputs that accept fractional numbers (e.g., `step="any"`), using only `type="number"` does not consistently trigger a full numeric keypad with a decimal separator on mobile browsers (particularly iOS Safari).
**Action:** Pair `type="number"` with `inputmode="decimal"` to ensure mobile users are presented with the appropriate keypad for entering fractional values.

## 2026-08-26 - Replace CSS Pseudo-elements with Explicit Structural Empty States
**Learning:** Using CSS `:empty::before` with a `content` property to display decorative emojis as empty states causes screen readers to redundantly announce the emojis out of context because pseudo-elements lack the ability to directly accept `aria-hidden="true"`.
**Action:** Always use an explicit DOM structure (e.g., `<div class="empty-state">`) with `aria-hidden="true"` applied to decorative icons, rather than relying on CSS pseudo-elements for initial empty states.

## 2026-08-30 - Update Aria-label on Dynamically Changing Interactive Elements
**Learning:** When interactive elements dynamically change their visual text (e.g., a button changing from its original text to 'Calculating...'), their `aria-label` is not automatically updated, which may cause screen readers to read the previous label or confusing DOM properties.
**Action:** Always programmatically update the `aria-label` to match the new state for screen readers, and restore the original `aria-label` when the state normalizes.
