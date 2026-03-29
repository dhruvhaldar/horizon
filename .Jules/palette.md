## 2024-05-24 - Missing Form Label Associations
**Learning:** The application's form inputs lacked programmatically associated labels, breaking screen reader accessibility and preventing click-to-focus behavior.
**Action:** Always ensure `<label>` tags use the `for` attribute referencing the `id` of the target `<input>` or `<textarea>`.

## 2025-03-25 - CSS `display: none` Breaks Screen Reader & Keyboard Access
**Learning:** Using `display: none` on interactive form elements like an `<input type="checkbox">` completely removes them from the accessibility tree, making them invisible to screen readers and unreachable via keyboard navigation (Tab), even when used with custom CSS UI like toggle switches.
**Action:** Use the visually-hidden technique instead of `display: none`. This keeps the element accessible to assistive technologies and focusable while hiding it visually (e.g. `position: absolute; width: 1px; height: 1px; overflow: hidden; clip: rect(0, 0, 0, 0); white-space: nowrap; border-width: 0;`). Also ensure adequate `focus-visible` styling is applied so sighted keyboard users know where focus is.

## 2026-03-27 - Invisible Text on Focus
**Learning:** Setting `color: #fff` combined with `outline: none` on focused input elements (`.inset:focus`) with light backgrounds makes the text unreadable when typing and removes visual focus indicators, breaking both keyboard navigation and basic usability.
**Action:** Never change text color to blend into the background on focus. Use `:focus-visible` with a distinct `outline` (e.g., `2px solid var(--highlight)`) to ensure keyboard users can always see which element is active without affecting mouse users' click experience negatively.

## 2024-05-19 - Added Disabled/Loading States to Action Buttons
**Learning:** Users lack feedback when performing async operations like solving complex networks or running inventory calculations, making the system feel unresponsive and leading to potential multi-clicks.
**Action:** Implemented a unified `withLoading` wrapper to visually manage loading and disabled states of asynchronous operations in UI components, improving perceived performance and preventing duplicate submissions.
## 2026-03-05 - Link helper text to inputs for accessibility
**Learning:** Found a pattern where `.input-group` elements include domain-specific `<span class="helper-text">` definitions (like OR terminology). These were not programmatically associated with the input fields, making it difficult for screen reader users to hear contextual definitions when focusing the inputs.
**Action:** Always assign a unique `id` to the helper text element and link it using `aria-describedby` on the corresponding input/textarea element in `.input-group` components.
