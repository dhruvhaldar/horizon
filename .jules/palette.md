## 2024-05-24 - Interactive Element Focus Indicator
**Learning:** Checking element visibility dynamically by calling `offsetWidth` or `offsetHeight` forces a synchronous layout recalculation (reflow) if the DOM is dirty. To prevent layout thrashing and stutter during high-frequency events (like `keydown`), use `offsetParent !== null` to check element visibility.
**Action:** When determining visibility to trigger focus or animations (e.g. `needs-recalc` pulse), check if the element has an `offsetParent` rather than triggering reflow.

## 2024-05-24 - Accessibility Anti-pattern: Escape to drop focus
**Learning:** Avoid using keyboard shortcuts (like `Escape`) to forcibly drop focus (`blur()`) from form inputs to the document body. This is an accessibility anti-pattern that resets the screen reader's reading position and disrupts spatial navigation.
**Action:** Do not use `Escape` or `blur()` for this purpose.

## 2024-05-24 - Semantic State of Custom Elements
**Learning:** When custom interactive elements (like text spans acting as toggle switch labels) share similar semantic behavior with native `label` elements, ensure they implement consistent visual states (e.g., `:hover`, `:focus`, and `:active` color transitions) in CSS to maintain cohesive affordance and a unified user experience.
**Action:** Apply consistent visual states to custom elements acting as labels.

## 2024-05-24 - Mobile Data Entry Affordance
**Learning:** To ensure mobile users (especially on iOS Safari) can easily enter floating-point numbers, always pair `type="number"` with `inputmode="decimal"` on inputs that accept fractional values (e.g., using `step="any"`). This forces the OS to display a full numeric keypad with a decimal separator.
**Action:** Add `inputmode="decimal"` to number inputs that expect decimal values to optimize the mobile UX.

## 2024-05-24 - Mobile Data Entry Affordance
**Learning:** To ensure mobile users (especially on iOS Safari) can easily enter floating-point numbers, always pair `type="number"` with `inputmode="decimal"` on inputs that accept fractional values (e.g., using `step="any"`). This forces the OS to display a full numeric keypad with a decimal separator.
**Action:** Add `inputmode="decimal"` to number inputs that expect decimal values to optimize the mobile UX.
