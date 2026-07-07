## 2026-07-07 - Contextual Error Messages for Screen Readers
**Learning:** Generic HTML5 validation messages like "Value must be greater than or equal to 0" or "Please fill out this field" lack context, especially for screen reader users when errors are announced out-of-flow.
**Action:** Always try to override generic validation messages by dynamically extracting and cleaning the associated `<label>` text. This ensures the error message explicitly states which field failed validation (e.g., "Demand Rate must be at least 0").
