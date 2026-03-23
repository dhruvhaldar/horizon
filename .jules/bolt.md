
## 2025-03-23 - Avoid large factorials and exponents in probability algorithms
**Learning:** Calculating queueing probabilities ($p_0$ and $L_q$) with explicit factorials (`factorial(n)`) and powers (`(c*rho)**n`) in a loop leads to extreme numerical instability, `OverflowError` (typically failing around $c=150$ due to float limits), and slow $O(c^2)$ complexity. This is a common bottleneck in Operations Research / mathematical codebases.
**Action:** Replace explicit factorials with iterative running products (e.g., `term *= u / n`). This prevents overflow, stays within float precision, and drops complexity to $O(n)$ or $O(c)$.
