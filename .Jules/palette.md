## 2026-07-07 - Contextual Error Messages for Screen Readers
**Learning:** Generic HTML5 validation messages like "Value must be greater than or equal to 0" or "Please fill out this field" lack context, especially for screen reader users when errors are announced out-of-flow.
**Action:** Always try to override generic validation messages by dynamically extracting and cleaning the associated `<label>` text. This ensures the error message explicitly states which field failed validation (e.g., "Demand Rate must be at least 0").

## 2026-07-08 - Dynamic Button States and Screen Reader Emoji Redundancy
**Learning:** Decorative emojis used inside dynamic buttons (like "📋 Copy" -> "✅ Copied") are announced out of context by screen readers when an `aria-label` is present (e.g., "Check mark Copied"). Additionally, rapidly toggling `.innerHTML` on click can lead to race conditions where the state gets permanently locked in the wrong visual state.
**Action:** Always wrap non-informational emojis in `<span aria-hidden="true">` to prevent screen reader redundancy when the button has a descriptive `aria-label`. Use `dataset` properties (like `data-copying`) to implement locks during async/timeout-based state changes instead of relying on `.innerHTML` comparisons.
