## 2024-05-24 - Missing Form Label Associations
**Learning:** The application's form inputs lacked programmatically associated labels, breaking screen reader accessibility and preventing click-to-focus behavior.
**Action:** Always ensure `<label>` tags use the `for` attribute referencing the `id` of the target `<input>` or `<textarea>`.

## 2025-03-25 - CSS `display: none` Breaks Screen Reader & Keyboard Access
**Learning:** Using `display: none` on interactive form elements like an `<input type="checkbox">` completely removes them from the accessibility tree, making them invisible to screen readers and unreachable via keyboard navigation (Tab), even when used with custom CSS UI like toggle switches.
**Action:** Use the visually-hidden technique instead of `display: none`. This keeps the element accessible to assistive technologies and focusable while hiding it visually (e.g. `position: absolute; width: 1px; height: 1px; overflow: hidden; clip: rect(0, 0, 0, 0); white-space: nowrap; border-width: 0;`). Also ensure adequate `focus-visible` styling is applied so sighted keyboard users know where focus is.

## 2026-03-27 - Invisible Text on Focus
**Learning:** Setting `color: #fff` combined with `outline: none` on focused input elements (`.inset:focus`) with light backgrounds makes the text unreadable when typing and removes visual focus indicators, breaking both keyboard navigation and basic usability.
**Action:** Never change text color to blend into the background on focus. Use `:focus-visible` with a distinct `outline` (e.g., `2px solid var(--highlight)`) to ensure keyboard users can always see which element is active without affecting mouse users' click experience negatively.
