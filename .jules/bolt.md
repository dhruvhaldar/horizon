## 2024-05-24 - Unrolling Recursive Type Checks
**Learning:** In highly recursive Python functions (like scanning nested JSON response dictionaries), the overhead of function calls combined with `isinstance()` MRO lookups is immense for common scalar leaf nodes.
**Action:** Unroll leaf-node evaluations into the caller and use exact type matching (`type(x) is float`) instead of `isinstance` to bypass both function call overhead and MRO resolution for primitive types, yielding significant speedups (~3x) on dense data.
## 2024-05-25 - Using `math.isfinite` for faster validation
**Learning:** Checking for infinity or NaN using `math.isinf(x) or math.isnan(x)` requires two separate C-level function calls.
**Action:** Replace `math.isinf(x) or math.isnan(x)` with `not math.isfinite(x)`. This reduces the number of function calls by half for valid values, decreasing overhead by ~20% in large validation loops.
