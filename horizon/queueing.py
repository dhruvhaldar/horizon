import numpy as np
from math import factorial

def mmc_queue(arrival_rate: float, service_rate: float, c: int):
    """
    Solves M/M/c queue metrics.
    arrival_rate: lambda
    service_rate: mu
    c: number of servers
    """
    if arrival_rate >= c * service_rate:
         raise ValueError("Arrival rate must be strictly less than c * service_rate for stability")

    rho = arrival_rate / (c * service_rate)

    # Calculate P0
    # ⚡ Bolt: Use an iterative running product for term calculation instead of
    # explicit factorials and exponents. This prevents OverflowError for large c
    # and significantly improves performance from O(c^2) arithmetic to O(c).
    r = arrival_rate / service_rate
    sum_p0 = 0.0
    current_term = 1.0

    for n in range(c):
        sum_p0 += current_term
        current_term *= (r / (n + 1))

    last_term = current_term
    p0 = 1.0 / (sum_p0 + (last_term / (1 - rho)))

    # Calculate Lq
    lq = (p0 * last_term * rho) / ((1 - rho) ** 2)

    # Calculate Wq, W, L
    wq = lq / arrival_rate
    w = wq + (1 / service_rate)
    l = lq + (arrival_rate / service_rate)

    return {
        "rho": rho,
        "p0": p0,
        "Lq": lq,
        "L": l,
        "Wq": wq,
        "W": w
    }

def jackson_network(gamma: list[float], p: list[list[float]], mu: list[float], c: list[int] = None):
    """
    Solves Jackson Network traffic equations.
    gamma: external arrival rates to each node.
    p: routing probability matrix (n x n).
    mu: service rates for each node.
    c: number of servers at each node (defaults to 1 for all).
    """
    n = len(gamma)
    if c is None:
        c = [1] * n

    gamma_vec = np.array(gamma)
    p_mat = np.array(p)

    # Traffic equations: lambda = gamma + lambda * P  =>  lambda * (I - P) = gamma
    # lambda = gamma * (I - P)^(-1)

    i_minus_p = np.eye(n) - p_mat.T
    lambda_vec = np.linalg.solve(i_minus_p, gamma_vec)

    # ⚡ Bolt: Convert the NumPy array to a native Python list before iterating over it.
    # Accessing individual scalar elements of a NumPy array inside a Python loop
    # incurs significant type-checking and boxing overhead. .tolist() converts the
    # entire array at C-speed, making the subsequent iterations faster.
    lambda_vec_list = lambda_vec.tolist()

    results = {}
    for i in range(n):
        l_i = lambda_vec_list[i]
        mu_i = mu[i]
        c_i = c[i]

        # Calculate metrics for each node as an M/M/c queue
        node_metrics = mmc_queue(l_i, mu_i, c_i)
        results[f"node_{i}"] = {
            "lambda": l_i,
            **node_metrics
        }

    # System totals
    # ⚡ Bolt: Use a list comprehension instead of a generator expression inside sum().
    # For small, bounded collections, constructing a list is faster than the generator
    # setup overhead.
    total_L = sum([results[f"node_{i}"]["L"] for i in range(n)])
    total_gamma = sum(gamma)
    total_W = total_L / total_gamma if total_gamma > 0 else 0

    return {
        "nodes": results,
        "total_L": total_L,
        "total_W": total_W
    }
