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

## 2026-09-01 - Provide Accessible Tooltips for Domain-Specific Acronyms
**Learning:** Educational and domain-specific tools often rely on acronyms (like EOQ or TSP) which can alienate new users and be read ambiguously by screen readers.
**Action:** Use native `<abbr title="...">` tags for inline text and `aria-label`/`title` attributes for interactive elements to provide on-demand contextual definitions and clear screen-reader expansions.

## 2026-09-03 - Provide Context to Landmark Regions
**Learning:** While `aria-labelledby` provides a concise name for `<section>` landmark regions, screen reader users miss out on immediately available contextual descriptions placed just below the heading unless they manually read further into the content.
**Action:** Use `aria-describedby` on the landmark container to programmatically associate descriptive paragraphs (like `.module-def`), providing richer immediate context during landmark navigation.

## 2026-09-04 - Preserve Inner HTML of Stateful Buttons and Prevent Clashing ARIA Announcements
**Learning:** Overwriting a button's content with generic text during an async loading state using `textContent` inadvertently strips accessible HTML tags like `<abbr>` upon restoration. Furthermore, generic unconditional async success announcements (like "Calculation complete") can clobber domain-specific error or success `aria-live` announcements that were triggered just milliseconds prior by the resolved function.
**Action:** Use `innerHTML` to store and restore button content instead of `textContent`. Rely on the specific business logic functions to trigger screen reader announcements rather than an unconditional wrapper.

## 2026-09-05 - Avoid ARIA Label Shadowing of Semantic Tags
**Learning:** Placing semantic tags like `<abbr>` inside an interactive element (such as a `<span role="button">`) that already has an `aria-label` is ineffective for screen readers. The `aria-label` overrides and shadows the entire subtree, causing screen readers to ignore the semantic benefits of the `<abbr>` tag.
**Action:** Do not wrap acronyms in `<abbr>` tags if they are placed inside elements with an `aria-label`. Instead, expand the acronym directly within the `aria-label` and `title` attributes of the parent interactive element to ensure it is properly announced by screen readers and visible to sighted users via native tooltips.
## 2026-09-08 - Provide Tooltips for Interactive Elements
**Learning:** When an interactive element dynamically updates its `aria-label` for screen readers (e.g., a button changing from 'Copy' to 'Copied'), sighted mouse users are left without visual confirmation if the element lacks a native tooltip.
**Action:** Programmatically update the `title` attribute alongside the `aria-label` when states change to ensure native browser tooltips provide equivalent context for sighted users.

## 2026-09-09 - Visual Toast Notification with ARIA Consistency
**Learning:** Adding a visual toast notification provides crucial feedback for sighted users during events like asynchronous completions, but this often clashes with existing screen reader setups. Adding another `aria-live` element on the visual toast can result in duplicate announcements.
**Action:** Pair visual toasts (for sighted users) with a dedicated screen-reader announcer (like `sr-announcer` with `aria-live`). Add `aria-hidden="true"` to the visual toast container to ensure screen readers only read from the invisible announcer element, providing consistency without redundancy.

## 2026-09-20 - Expose Implicit JavaScript Keyboard Shortcuts
**Learning:** When JavaScript adds global keyboard event listeners (like mapping 'Enter' inside a form to click the primary submit button), screen readers and sighted users navigating via mouse hover are unaware of these implicit shortcuts unless explicitly told.
**Action:** Always append keyboard shortcut hints (like " (Press Enter)") to the `title` attribute for native tooltips and use the `aria-keyshortcuts` attribute (e.g., `aria-keyshortcuts="Enter"`) to programmatically expose these implicit JavaScript shortcuts to screen readers.

## 2026-09-20 - Context-Specific ARIA Labels for Repeating Structures
**Learning:** Using generic ARIA labels (like `aria-label="Calculation Results"`) across multiple identical repeating structures (e.g., `.results` divs in different panels) provides ambiguous navigation context for screen reader users when they jump between landmarks.
**Action:** Replace generic ARIA labels with context-specific descriptions (e.g., `Queueing Calculation Results`) on repeating UI components to ensure clarity during non-linear screen reader navigation.
