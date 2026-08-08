## 2026-07-07 - Contextual Error Messages for Screen Readers
**Learning:** Generic HTML5 validation messages like "Value must be greater than or equal to 0" or "Please fill out this field" lack context, especially for screen reader users when errors are announced out-of-flow.
**Action:** Always try to override generic validation messages by dynamically extracting and cleaning the associated `<label>` text. This ensures the error message explicitly states which field failed validation (e.g., "Demand Rate must be at least 0").

## 2026-07-08 - Dynamic Button States and Screen Reader Emoji Redundancy
**Learning:** Decorative emojis used inside dynamic buttons (like "📋 Copy" -> "✅ Copied") are announced out of context by screen readers when an `aria-label` is present (e.g., "Check mark Copied"). Additionally, rapidly toggling `.innerHTML` on click can lead to race conditions where the state gets permanently locked in the wrong visual state.
**Action:** Always wrap non-informational emojis in `<span aria-hidden="true">` to prevent screen reader redundancy when the button has a descriptive `aria-label`. Use `dataset` properties (like `data-copying`) to implement locks during async/timeout-based state changes instead of relying on `.innerHTML` comparisons.

## 2026-07-09 - Screen Reader Context for Inline Validation Errors
**Learning:** Using `aria-describedby` to link an input to a generated error message provides basic description, but standard `aria-errormessage` creates a much stronger, explicit semantic association that screen readers recognize specifically as an error context.
**Action:** Always add `aria-errormessage` alongside `aria-invalid` to map inputs directly to their respective error message containers for robust accessibility, and remember to clear both attributes when the input becomes valid again.

## 2026-08-08 - Stateful ARIA for Custom Toggle Labels
**Learning:** When using custom elements (like spans) as clickable labels alongside a toggle switch to switch between distinct modes, setting `role="button"` and `tabindex="0"` allows keyboard interaction, but fails to convey which mode is currently active to screen readers. Relying solely on visual cues (like opacity) creates an accessibility gap.
**Action:** Always apply and dynamically update the `aria-pressed` attribute (true/false) on custom toggle label buttons to programmatically communicate the active selection state to assistive technologies.
