## 2024-05-24 - Avoid large explicit factorials in probability algorithms
**Learning:** In Queueing algorithms (like M/M/c queues), computing formulas using explicit `factorial(n)` and exponents inside a loop causes O(c^2) arithmetic and quickly leads to `OverflowError` for large inputs.
**Action:** Use an iterative running product instead of explicit exponents and factorials to convert the arithmetic to O(c) and eliminate overflow issues in probability calculations.
