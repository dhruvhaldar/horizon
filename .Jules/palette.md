## 2024-05-24 - Missing Form Label Associations
**Learning:** The application's form inputs lacked programmatically associated labels, breaking screen reader accessibility and preventing click-to-focus behavior.
**Action:** Always ensure `<label>` tags use the `for` attribute referencing the `id` of the target `<input>` or `<textarea>`.

## 2024-05-25 - Focus Visible Styles for Keyboard Navigation
**Learning:** Keyboard navigation (tabbing) was difficult because many interactive elements (inputs, buttons, toggle switches, and links) lacked distinct focus indicators, relying either on subtle color changes or nothing at all.
**Action:** Implemented `focus-visible` pseudo-class for `.inset` inputs, `.btn` buttons, the `.togglesw` custom checkbox, and footer links using an `outline` with the primary `--highlight` color to ensure high visibility for keyboard users.
