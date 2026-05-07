## 2025-04-26 - JSON Serialization Crash on Mathematical Output Overflows
**Vulnerability:** API endpoints performing mathematical operations (like `math.sqrt` or divisions) could generate `float('inf')` from valid but large float inputs (e.g. `1e300`). Starlette's strict JSON serialization crashed with a `ValueError`, leaking a `500 Internal Server Error` and representing a Denial of Service and Information Leak vector.
**Learning:** While Pydantic's `allow_inf_nan=False` effectively blocks incoming non-finite inputs, it does not validate outgoing nested dictionaries dynamically created by the business logic. Mathematical operations on large floats can overflow mid-flight.
**Prevention:** To avoid unhandled 500 crashes during JSON serialization in math-heavy APIs, either strictly restrict input float bounds using `Pydantic.Field` or run a recursive post-processing validator over the output dictionary to reject `math.isinf()` and `math.isnan()` values before returning them to the ASGI framework.
## 2025-05-18 - Safe CORS and Defense-in-Depth CSP
**Vulnerability:** Missing Content Security Policy (CSP) header allowing potential XSS vulnerabilities.
**Learning:** When auditing CORS configurations in FastAPI, recognize that allow_origins=["*"] combined with allow_credentials=False is a standard and safe pattern for public APIs or environments where the frontend deployment domain is not strictly known ahead of time. Restricting origins without knowing the exact deployment topology can cause severe functional regressions.
**Prevention:** When adding a Content Security Policy (CSP) header for defense-in-depth against XSS on a static frontend, ensure all required external dependencies (e.g., CDNs like d3js.org, cdn.jsdelivr.net) and inline script requirements (e.g., 'unsafe-inline' for inline library configurations like MathJax) are explicitly allowed in the script-src directive to prevent breaking UI functionality.

## 2024-05-18 - [HIGH] Denial of Service via Unbounded Nested Pydantic List
**Vulnerability:** The `/api/route/jobshop` endpoint enforced a maximum limit of 100 jobs at the endpoint validation layer. However, the `JobDetails` Pydantic model did not enforce a length limit on its `dependencies: List[str]` attribute. An attacker could submit a single job with millions of elements in its dependencies array, bypassing the top-level limit and causing the backend Critical Path Method algorithm to hang indefinitely (22+ seconds) during O(N) internal dependency resolution lookups, leading to an application Denial of Service.
**Learning:** Validation limits placed only on top-level structures (like the outer dictionary keys) are insufficient if inner/nested array attributes are left unbounded. Pydantic models will eagerly parse these massive inner arrays, bypassing endpoint-level size constraints and exposing inner loops to O(N) or O(N^2) algorithmic explosion.
**Prevention:** Always define explicit length bounds on nested lists and sequences within Pydantic models (e.g., using `Field(max_length=100)`) to enforce Defense in Depth, especially when those sequences represent inputs to mathematical algorithms or graph traversals.
## 2025-05-18 - String DoS Prevention via Pydantic Constraints

**Vulnerability:** Memory DoS via unbounded string inputs.

**Learning:** Unbounded strings in Pydantic models (like `List[str]` or `Dict[str, Any]`) can lead to Memory DoS or slow parsing attacks by malicious actors.

**Prevention:** Apply `pydantic.constr(max_length=50)` or `Annotated[str, Field(max_length=50)]` to constrain string lengths inside Pydantic collections (`List`, `Tuple`, `Dict`). Using `constr` guarantees constraint enforcement across different versions of Pydantic.
