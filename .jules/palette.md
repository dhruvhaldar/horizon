## 2026-05-06 - Auto-focus Invalid Inputs and Toggle A11y
**Learning:** During custom async validation, calling `reportValidity()` without explicit focus leaves keyboard and screen reader users stranded, requiring manual navigation back to the invalid field. Also, custom switch components using external labels and dynamic `aria-label` attributes on the actual checkbox element can result in redundant screen reader announcements if the external text labels are not hidden with `aria-hidden="true"`. Finally, HTML5 skip-links require the target container (like `<main>`) to have `tabindex="-1"` to properly shift programmatic focus in modern browsers.
**Action:** Always auto-focus elements using `.focus()` immediately before calling `.reportValidity()` on invalid inputs in custom workflows. Use `aria-hidden="true"` on visual labels adjacent to custom toggles when the toggle itself has a comprehensive `aria-label`. Always add `tabindex="-1"` to skip-to-content target elements.
## 2026-05-23 - Tactile Feedback for Keyboard Shortcuts
**Learning:** Keyboard shortcut users miss out on `:active` pseudo-class feedback in tactile (Neumorphic) UIs, making interactions feel disconnected compared to pointer users.
**Action:** Always programmatically apply the `.active` CSS state to elements when triggering them via keyboard shortcuts (and remove it after a short delay, e.g., 150ms) to bridge the tactile feedback gap.
## 2026-05-25 - Maintain Focus During Async Actions
**Learning:** Dynamically setting the native `disabled` attribute on an active button drops screen reader and keyboard focus, dropping users back to the `<body>` element.
**Action:** Use `aria-disabled="true"` instead of `disabled=true` for loading states to maintain keyboard context, and update CSS selectors to target `[aria-disabled="true"]`.

## 2026-05-28 - Prevent Abrupt Page Jumps During Focus
**Learning:** When focusing an element during custom validation, calling `element.focus()` can cause the browser to jump abruptly to the element, creating a disorienting experience. By combining `element.scrollIntoView({ behavior: 'smooth', block: 'center' })` with `element.focus({ preventScroll: true })`, we can smoothly bring the element into view before focusing it.
**Action:** Always use smooth scrolling and prevent default focus scrolling when navigating to invalid inputs.

## 2026-05-29 - Avoid title Attributes for Critical Form Constraints
**Learning:** The application heavily used native `title` attributes on form inputs to store critical constraints (e.g., "Must be > gamma") and formatting rules. This pattern creates a severe UX and accessibility issue because native tooltips are invisible to mobile touch users, inconsistent for keyboard users, and cause double-speak for screen readers when paired with `aria-describedby`.
**Action:** Always place critical input constraints directly within visible `.helper-text` elements linked via `aria-describedby`, and avoid redundant `title` attributes on form inputs to ensure universal access and better design clarity.

## 2026-05-31 - Static aria-label for Native Switches
**Learning:** Dynamically updating the `aria-label` of a `role="switch"` (checkbox) element to reflect its current state is redundant and an accessibility anti-pattern. Screen readers natively announce the state (checked/unchecked). Modifying the label dynamically while focused causes inconsistent double-speak or is dropped entirely by some screen readers.
**Action:** Use a static, descriptive `aria-label` for the switch's purpose, and trust the native `checked` attribute to convey state.

## 2026-06-04 - Opacity causes WCAG contrast failures
**Learning:** Using low CSS opacity values (like 0.5 or 0.7) to create visual hierarchy for disabled inputs, inactive toggle labels, empty states, or helper text can inadvertently cause the text color to blend with the background and fail WCAG AA contrast ratios (4.5:1).
**Action:** Always verify color contrast of elements with reduced opacity by calculating the blended color against the background. Use higher opacity values (e.g., 0.75 or 0.85) to ensure text remains readable.
