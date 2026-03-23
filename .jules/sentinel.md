## 2025-03-23 - Unbounded Input in Mathematical Models
**Vulnerability:** The queueing network API endpoint (`/api/queue`) lacked input bounds. Mathematical operations like $c!$ (factorial of the number of servers) and solving matrix systems ($O(N^3)$) were performed on unvalidated user input.
**Learning:** Operations Research models, especially those involving combinatorics or matrix inversions, are highly susceptible to algorithmic complexity attacks (DoS) if inputs are unbounded. Passing $c=100000$ or a $1000 \times 1000$ matrix will hang or crash the server.
**Prevention:** Always add strict validation constraints (`max_length`, `conint`, `confloat`) to API models (e.g., Pydantic) before passing data to heavy mathematical functions.
