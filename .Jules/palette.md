## 2026-11-05 - Placeholder Context Retention
**Learning:** When form inputs are pre-filled with default `value` attributes (like in the Inventory and Routing modules), users naturally delete these values to enter their own data. If no `placeholder` attribute exists, they immediately lose the only visual guidance on the expected format (e.g., '10, 5' vs '10,5' or 'A,B').
**Action:** Always pair default `value` attributes with corresponding `placeholder` attributes (e.g., `value="1000" placeholder="e.g., 1000"`) in form inputs. This ensures users retain helpful formatting context even after they have cleared the initial data.

## 2026-11-05 - Placeholder Context Retention
**Learning:** When form inputs are pre-filled with default `value` attributes (like in the Inventory and Routing modules), users naturally delete these values to enter their own data. If no `placeholder` attribute exists, they immediately lose the only visual guidance on the expected format (e.g., '10, 5' vs '10,5' or 'A,B').
**Action:** Always pair default `value` attributes with corresponding `placeholder` attributes (e.g., `value="1000" placeholder="e.g., 1000"`) in form inputs. This ensures users retain helpful formatting context even after they have cleared the initial data.
## 2026-06-06 - Contrast Improvements for Visual Hierarchy
**Learning:** Using low CSS opacity values (e.g., 0.5 or 0.6) for visual hierarchy (like disabled inputs, inactive labels, or stale result containers) can cause text to fail WCAG AA contrast ratios (4.5:1) on light backgrounds.
**Action:** To maintain accessibility while indicating inactive states, use higher opacity values (e.g., 0.75 or 0.85). I applied this to the disabled `.btn` state in `neumorph.css` and the stale `.results` container state in `app.js`.

## 2026-06-07 - Contextual Error Messages
**Learning:** The native HTML5 validation message for missing values ("Please fill out this field.") is generic and lacks context, which can be frustrating for screen reader users or users scanning a dense form.
**Action:** Created a custom error message builder (`getCustomError`) that queries the associated label (`<label for="input-id">`), cleans the text to remove symbols or math notation, and provides a clear, actionable validation message (e.g., "Demand Rate is a required field.").
