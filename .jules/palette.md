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

## 2026-06-10 - Add interactive hover states to Neumorphic inputs
**Learning:** Neumorphic design heavily relies on shadows to indicate depth and interactability. Without a hover state, `.inset` elements (like text inputs) feel static compared to buttons, reducing discoverability. Additionally, placeholder text needs sufficient opacity to meet contrast guidelines.
**Action:** Always include subtle inset shadow transitions on hover for inputs in Neumorphic UIs to improve tactile feel. Use `opacity: 0.75` for placeholders to ensure accessibility while maintaining the design language.

## 2026-06-12 - Map Enter Key for Custom Switches
**Learning:** Keyboard users expect custom toggle switches to respond to the `Enter` key (similar to buttons), but native checkboxes only respond to `Space`. If a global `Enter` keydown handler prevents default and submits the nearest form, keyboard users cannot toggle the switch at all.
**Action:** When overriding the global `Enter` key behavior on inputs, explicitly check if the target is a checkbox and toggle its `checked` state while dispatching a `change` event to align with keyboard user expectations.

## 2026-06-13 - Align visual empty states with ARIA labels
**Learning:** `aria-label` completely overrides visual `::before` pseudo-element text on elements with `role="img"`, meaning screen reader users miss out on crucial context like "Run network solver to generate graph" that sighted users see.
**Action:** When a container uses `role="img"` and has an empty state, duplicate the empty-state instruction inside its static `aria-label` until it is dynamically replaced by actual content. Fortunately, when dynamic content is loaded, the application already updates the `aria-label` explicitly using `setAttribute`, meaning the empty state label correctly disappears.

## 2026-06-14 - Fallback aria-errormessage to aria-describedby
**Learning:** The `aria-errormessage` attribute has limited support across different screen readers, meaning users may not hear the inline validation error when focusing an invalid input. In contrast, appending the error message ID to the existing `aria-describedby` string is widely supported and ensures the error is read immediately after the input's description.
**Action:** Instead of relying on `aria-errormessage`, always append dynamically generated error message IDs to the input's `aria-describedby` attribute (and remove them when valid) for robust screen reader support.

## 2026-06-15 - Prevent A11y Double-Speak on Viz Containers
**Learning:** When using visual containers like D3.js or Chart.js where a parent container has `role="img"` and a dynamic `aria-label`, inserting focusable child nodes or children with redundant roles causes screen readers to double-speak or lose focus context. Furthermore, custom parent containers are not focusable by default, so users relying on keyboards miss out on the descriptive aria-labels.
**Action:** Always add `tabindex="0"` to the outer wrapper element when it is responsible for the component's `aria-label`, and explicitly add `aria-hidden="true"` to inner dynamically generated SVG/Canvas elements to establish a single source of truth for the screen reader.

## 2026-06-20 - Programmatic Context for Stale Visual States
**Learning:** The application visually dims `.results` and `.viz-container` elements to indicate to sighted users that the data is stale when inputs change. However, visual-only opacity changes leave screen reader users unaware that the current content they are interacting with is no longer up to date with the inputs.
**Action:** When applying visual stale states (like dimming or grayscale) to visualization containers, always prepend a text warning (e.g., `"Out of date: "`) to their dynamic `aria-label` to provide equivalent programmatic context, and ensure the warning is cleared when the data is refreshed or state is restored.

## 2026-06-25 - Share Disabled Styles with aria-busy
**Learning:** When using `aria-busy="true"` to signify a loading or processing state on interactive elements (like buttons), failing to explicitly map CSS disabled visual styles (such as `opacity: 0.75` and `cursor: not-allowed`) to the `[aria-busy="true"]` selector leaves sighted users without visual feedback, potentially leading to double-clicks, even though screen readers are correctly informed.
**Action:** Always extend existing CSS disabled selectors (e.g., `.btn:disabled, .btn[aria-disabled="true"]`) to include `.btn[aria-busy="true"]` to maintain visual consistency and feedback during async operations.

## 2026-06-30 - Avoid duplicate validation UI with reportValidity()
**Learning:** When implementing custom inline validation UIs (like Neumorphic `.error-feedback` messages), calling `reportValidity()` triggers the browser's native error bubble. This creates duplicate error messages that visually clash with the custom UI, resulting in a poor UX.
**Action:** Remove `reportValidity()` when a custom inline error message is already being displayed. Rely on `.focus()` and `aria-invalid` to maintain accessibility while keeping the visual presentation clean and consistent.
