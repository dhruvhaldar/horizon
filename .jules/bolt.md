## 2024-04-18 - Avoid Dictionary Unpacking in Tight Loops
**Learning:** In Python, using dictionary unpacking syntax (`{**dict1, **dict2}`) inside a hot loop forces the creation of a full copy of the dictionary on every iteration. This introduces severe memory allocation and execution overhead.
**Action:** Mutate the dictionary in-place instead when constructing results inside performance-critical algorithmic loops.

## 2024-04-18 - Native sum() vs Python Accumulation
**Learning:** Manually accumulating a sum inside a Python `for` loop (e.g., `total += arr[i]`) is significantly slower than calling Python's built-in `sum()` natively on the collection.
**Action:** Always pre-calculate sums of existing lists at C-speed using the built-in `sum()` before or after the loop instead of accumulating them iteratively during traversal.
