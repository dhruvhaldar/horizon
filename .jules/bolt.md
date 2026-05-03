## 2024-05-24 - Unrolling Recursive Type Checks
**Learning:** In highly recursive Python functions (like scanning nested JSON response dictionaries), the overhead of function calls combined with `isinstance()` MRO lookups is immense for common scalar leaf nodes.
**Action:** Unroll leaf-node evaluations into the caller and use exact type matching (`type(x) is float`) instead of `isinstance` to bypass both function call overhead and MRO resolution for primitive types, yielding significant speedups (~3x) on dense data.
