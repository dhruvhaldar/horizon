## 2024-05-24 - Missing Form Label Associations
**Learning:** The application's form inputs lacked programmatically associated labels, breaking screen reader accessibility and preventing click-to-focus behavior.
**Action:** Always ensure `<label>` tags use the `for` attribute referencing the `id` of the target `<input>` or `<textarea>`.
