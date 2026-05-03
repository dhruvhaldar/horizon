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

## 2026-04-18 - Added Disabled State Styles for Action Buttons
**Learning:** The action buttons lacked a visual indication when they were disabled during asynchronous operations (using the `withLoading` function), making it unclear to users that the form was processing and could not be clicked again. The native `disabled` attribute was being set, but there were no CSS styles specifically targeting `.btn:disabled`.
**Action:** Always provide explicit visual styling for the `:disabled` state of interactive elements, such as reduced opacity and `cursor: not-allowed`, to clearly communicate state and prevent user confusion.
## 2026-03-31 - Enter Key Submission for Formless Layouts
**Learning:** When building custom layouts without native `<form>` wraps (like in this neumorphic UI), users lose the innate ability to press "Enter" to submit or calculate. This breaks keyboard usability and accessibility expectations.
**Action:** Always implement a global `keydown` listener to catch the "Enter" key within inputs, explicitly ignoring `shift+Enter` for textareas, to seamlessly trigger the closest primary action button.

## 2026-06-15 - Global Keydown Listeners in Toggled UI Sections
**Learning:** When using global `keydown` listeners to simulate "Enter to submit" behavior by finding the closest action button (`container.querySelector('.btn')`), it can inadvertently select and trigger hidden buttons in UI sections that use conditional toggles (e.g., `display: none` for inactive views). This causes the wrong action to run and confuses the user.
**Action:** Always filter dynamically selected action buttons by visibility (e.g., ensuring `offsetWidth > 0` or `offsetHeight > 0`) in global keydown handlers before triggering a click event, ensuring only the active UI context is submitted.

## 2026-04-19 - Missing Screen Reader Announcements for Async Results
**Learning:** Asynchronous operations update text content dynamically without page reloads, leaving screen reader users unaware that calculations have finished or errors have occurred.
**Action:** Always add `aria-live="polite"` to DOM nodes that receive dynamic textual updates (like results or error containers) so screen readers can automatically announce the new content without losing context.
## 2024-05-24 - Prevent Stale Data Confusion in Async Workflows
**Learning:** When async operations fail, leaving previously rendered visualizations (D3 graphs, Chart.js canvases) on the screen creates severe UX confusion, as users may mistakenly interpret the stale successful data as the result of their new (failed) input.
**Action:** Always explicitly destroy or clear visualization containers in the `catch` blocks of async data-fetching workflows to ensure failure states are unambiguous.
## 2024-05-18 - CSS-based Empty States for Visualizations
**Learning:** D3.js visualization containers often experience empty states before rendering or when an error clears them (e.g., `d3.select("#graph").selectAll("*").remove()`). Relying on JavaScript to manage placeholder text in these states is brittle and error-prone.
**Action:** Use the CSS `:empty::before` pseudo-class pattern (`#container:empty::before { content: "Placeholder"; }`) for visualization containers. This creates a highly robust, JS-free empty state that automatically appears when the container has no children and seamlessly disappears the moment D3.js appends an SVG or Canvas.
## 2026-04-20 - Dynamic Canvas Injection for CSS Empty States
**Learning:** Hardcoded `<canvas>` elements defeat the CSS `:empty::before` placeholder pattern, leaving users with confusing blank UI regions on initial load and after errors.
**Action:** Always inject `<canvas>` elements dynamically only when data is ready to be rendered, and clear the container's innerHTML on error, ensuring consistent CSS empty states across all visualization types while preserving canvas ARIA roles.

## 2024-05-25 - HTML5 Number Input Step Constraints
**Learning:** Using `<input type="number">` for floating-point values (like standard deviation `1.2`) without defining the `step` attribute makes the input natively invalid (step mismatch) because the default step is 1. This causes browser spinner controls to snap values to integers, frustrating users and destroying decimal precision.
**Action:** Always add `step="any"` (and appropriate `min`/`max` bounds) to numeric inputs meant for continuous/floating-point mathematical data to ensure smooth cross-browser UX and accurate spinner behavior.

## 2024-04-12 - Missing HTML5 Validation on Async Actions
**Learning:** Standard HTML5 form validation (using `required` attributes and the browser's native `.reportValidity()`) does not naturally trigger when action buttons execute JavaScript click handlers instead of native form submissions. This is common in non-traditional or app-like layouts (like this app's formless neumorphic design), leading to users submitting incomplete data and encountering error states.
**Action:** When building formless UIs with async handlers, manually query relevant visible inputs (`input`, `textarea`) inside the contextual container and call `.reportValidity()` on them prior to making network requests, aborting the action if validation fails.
## 2026-05-15 - Unreadable Error Arrays from API
**Learning:** When APIs (like FastAPI/Pydantic) return 422 Validation errors, the detail payload is often an array of objects. Directly passing this payload to a new `Error()` constructor or innerText causes the browser to stringify it as `[object Object]`, which is completely unhelpful to the user.
**Action:** Always inspect error payloads and implement a formatting helper (e.g., mapping over array objects to extract the `msg` fields) before displaying them in the UI to ensure users receive actionable, human-readable feedback.

## 2026-05-18 - Missing ARIA Roles on Dynamic Visualization Containers
**Learning:** Visualization containers (like `#inventory-viz`) that start empty and dynamically receive `<canvas>` elements often get overlooked for accessibility because the canvas doesn't exist on page load. While other SVG-based containers in the app had ARIA attributes, the canvas container was missing them, leaving screen reader users unaware of the chart's existence even after rendering.
**Action:** Always ensure structural layout containers meant for visualizations explicitly define `role="img"` and a descriptive `aria-label` (e.g., "Inventory Optimization Chart") directly in the HTML, regardless of whether the child graphic is a `<canvas>` or `<svg>` injected later by JavaScript.

## 2026-05-19 - Clickable Labels for Custom Toggles
**Learning:** Custom UI switches often map `onclick` behavior strictly to the `<input type="checkbox">` toggle itself. Users naturally expect to click the accompanying text labels to switch states. When labels aren't clickable, it creates a frustrating, restricted interaction area.
**Action:** Always add `cursor: pointer` and explicit `onclick` handlers (or proper `<label for="...">` associations) to the text labels accompanying custom toggle switches to maximize the clickable area and match user expectations.

## 2026-06-25 - Custom Keyboard Shortcuts Require Visual Hints
**Learning:** While implementing global keyboard shortcuts (like "Enter to submit") in custom formless UIs greatly improves keyboard accessibility, users will not intuitively know these shortcuts exist since they aren't using a standard HTML form.
**Action:** Always provide a subtle, visible hint in the interface (e.g., a header tip or tooltip) alongside global custom keyboard shortcut listeners to ensure the feature is discoverable and actually benefits users.

## 2026-06-26 - Inline Validation Feedback
**Learning:** Native browser form validation tooltips disappear quickly and only highlight one field at a time, leaving no persistent visual indicator of error state on the input element itself. Using `input:invalid` applies aggressively on page load.
**Action:** When manually calling `.reportValidity()` or checking validity in async workflows, explicitly add `aria-invalid="true"` to invalid inputs. Use this ARIA attribute as a CSS hook (`.inset[aria-invalid="true"]`) to provide a persistent, styled inline error state, and dynamically remove it via an `input` event listener when the user corrects their entry.

## 2026-10-25 - Disable Spellcheck on Technical Inputs
**Learning:** Native browser spellcheck and autocomplete features interfere with technical and mathematical inputs (like routing matrices or comma-separated numeric vectors). The squiggly red underlines degrade the UX by incorrectly marking math data as misspelled words, and the autocomplete dropdowns obscure critical parts of the UI while providing irrelevant suggestions.
**Action:** Always add `spellcheck="false"` and `autocomplete="off"` to `<input>` and `<textarea>` elements intended for raw mathematical matrices, programmatic lists, or non-natural-language text inputs to prevent confusing visual artifacts and ensure a clean workspace.
## 2026-04-26 - Stale Data Dimming
**Learning:** When users edit input fields after already performing a calculation, the previously generated output (results text and charts) remains fully visible. This creates a confusing UX where users might mistakenly associate the new, unsubmitted input values with the old, stale output.
**Action:** Apply a subtle visual dimming (e.g., `opacity: 0.5`, `filter: grayscale(100%)`) to result containers and visualizations as soon as a user edits an input, and restore full visibility when a new calculation completes.
## 2024-05-27 - Accessible Required Indicators
**Learning:** To enhance UX and accessibility on required form fields, appending a visual indicator (like an asterisk) directly within the associated `<label>` provides immediate visual guidance. However, if the input already has the HTML5 `required` attribute, screen readers will natively announce it. An exposed asterisk will cause the screen reader to redundantly announce 'star' or 'asterisk'.
**Action:** When adding visual required indicators to labels, always wrap the indicator (e.g., `*`) in a `<span aria-hidden="true">`. This ensures sighted users get the visual cue while preserving a clean, non-redundant experience for screen reader users.
## 2025-02-23 - Improve WCAG Text Contrast on Links
**Learning:** Brand colors often fail WCAG text contrast on links against light backgrounds.
**Action:** Apply a high-contrast text color (e.g., `--text-color`) and use the brand color for a styled underline (`text-decoration-color`, `text-decoration-thickness`, `text-underline-offset`) to preserve both accessibility and brand identity.
## 2026-10-26 - Visual and ARIA states for Custom Toggles
**Learning:** Custom toggle switches (like the EOQ / R,Q inventory selector) can leave screen readers without context of what mode is currently active if relying only on visually positioned labels. Furthermore, if the inactive label isn't visually dimmed, sighted users may be slightly confused as to which state is active.
**Action:** When implementing custom UI toggle switches that transition between distinct modes, use CSS to visually dim the inactive text labels and dynamically update the switch's `aria-label` via JavaScript to explicitly announce the currently active mode for screen reader users. Also ensure `aria-controls` is set if the toggle shows/hides specific content sections.

## 2026-10-27 - Multi-line Input UX
**Learning:** Overriding the 'Enter' key in multi-line inputs (like `<textarea>`) to submit forms causes severe UX friction, as users naturally expect 'Enter' to insert a newline. Expecting users to hold 'Shift' to get a newline is an anti-pattern. Furthermore, when textareas are used, manual resizing often looks unpolished and native scrollbars can clash with the design system.
**Action:** When implementing global keyboard submission shortcuts, always allow natural newlines in `<textarea>` elements and require an explicit modifier (like `Ctrl+Enter` or `Cmd+Enter`) to trigger submission from within them. Additionally, implement JS-based auto-resizing (`scrollHeight`) and hide scrollbars/manual resizing via CSS to provide a clean, expanding text editor experience.
