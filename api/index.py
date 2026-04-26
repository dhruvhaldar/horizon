from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import List, Dict, Optional, Any, Tuple
import os
import math
import numpy as np
from fastapi.staticfiles import StaticFiles

from horizon.queueing import jackson_network
from horizon.inventory import eoq, newsvendor, continuous_review
from horizon.routing import tsp_approx, job_shop_cpm

app = FastAPI(title="Horizon Math API")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=False,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.middleware("http")
async def add_security_headers(request, call_next):
    response = await call_next(request)
    # Security: Defense in depth - inject standard security headers to prevent
    # clickjacking (X-Frame-Options), MIME sniffing (X-Content-Type-Options),
    # and enforce strict HTTPS (HSTS).
    response.headers["X-Frame-Options"] = "DENY"
    response.headers["X-Content-Type-Options"] = "nosniff"
    response.headers["Strict-Transport-Security"] = "max-age=31536000; includeSubDomains"
    response.headers["Referrer-Policy"] = "strict-origin-when-cross-origin"
    return response

def validate_finite(obj: Any) -> Any:
    """Security: Prevent 500 errors by rejecting Inf/NaN outputs before JSON serialization."""
    if isinstance(obj, dict):
        for v in obj.values():
            validate_finite(v)
    elif isinstance(obj, list) or isinstance(obj, tuple):
        for v in obj:
            validate_finite(v)
    elif isinstance(obj, float):
        if math.isinf(obj) or math.isnan(obj):
            raise ValueError("Mathematical result is out of bounds (Infinity/NaN)")
    return obj

class SafeBaseModel(BaseModel):
    # Security: Reject 'NaN' and 'Infinity' string representations in float fields
    # to prevent unhandled ValueError crashes during JSON serialization (500 Internal Server Error).
    model_config = {"allow_inf_nan": False}

class JacksonRequest(SafeBaseModel):
    gamma: List[float]
    p: List[List[float]]
    mu: List[float]
    c: Optional[List[int]] = None

class EOQRequest(SafeBaseModel):
    demand_rate: float
    order_cost: float
    holding_cost: float

class NewsvendorRequest(SafeBaseModel):
    selling_price: float
    cost: float
    salvage_value: float
    demand_mean: float
    demand_std: float

class ContinuousReviewRequest(SafeBaseModel):
    demand_rate: float
    order_cost: float
    holding_cost: float
    lead_time_mean: float
    lead_time_std: float
    service_level: float = 0.95

class TSPRequest(SafeBaseModel):
    nodes: List[str]
    edges: List[Tuple[str, str, float]]

class JobDetails(SafeBaseModel):
    duration: float
    dependencies: List[str] = []

class JobShopRequest(SafeBaseModel):
    jobs: Dict[str, JobDetails]

@app.get("/api/health")
def health_check():
    return {"status": "ok"}

@app.post("/api/queue")
def solve_queue(req: JacksonRequest):
    # Security: Prevent CPU/Memory DoS attacks from extremely large factorials
    # in the M/M/c queueing calculation.
    # ⚡ Bolt: Restore generator expressions inside any() for short-circuiting.
    if req.c and any(c_val > 100 for c_val in req.c):
        raise HTTPException(status_code=400, detail="Maximum number of servers (c) exceeded. Must be <= 100.")

    # Security: Prevent ZeroDivisionError and 500 error leaks by validating physical limits.
    if req.c and any(c_val <= 0 for c_val in req.c):
        raise HTTPException(status_code=400, detail="Number of servers (c) must be > 0.")
    if any(m <= 0 for m in req.mu):
        raise HTTPException(status_code=400, detail="Service rate (mu) must be > 0.")
    if any(g <= 0 for g in req.gamma):
        raise HTTPException(status_code=400, detail="Arrival rate (gamma) must be > 0.")

    # Security: Prevent CPU/Memory DoS attacks from large Jackson Networks (e.g. matrix inversion)
    if len(req.gamma) > 100:
        raise HTTPException(status_code=400, detail="Network too large. Maximum 100 nodes allowed.")

    # Security: Prevent 500 Internal Server Error (IndexError) when array lengths do not match gamma.
    n = len(req.gamma)
    if len(req.mu) != n:
        raise HTTPException(status_code=400, detail="Length of mu must match length of gamma.")
    if req.c is not None and len(req.c) != n:
        raise HTTPException(status_code=400, detail="Length of c must match length of gamma.")
    if len(req.p) != n or any(len(row) != n for row in req.p):
        raise HTTPException(status_code=400, detail="p must be a square matrix matching the length of gamma.")

    try:
        res = jackson_network(req.gamma, req.p, req.mu, req.c)
        return validate_finite(res)
    except ValueError as e:
        # Security: Catch specific validation errors instead of generic Exception to prevent leaking stack traces or internal details
        raise HTTPException(status_code=400, detail=str(e))
    except np.linalg.LinAlgError:
        # Security: Catch specialized mathematical library exceptions like LinAlgError to prevent 500 error leaks.
        raise HTTPException(status_code=400, detail="Singular matrix")

@app.post("/api/inventory/eoq")
def solve_eoq(req: EOQRequest):
    # Security: Prevent ZeroDivisionError and 500 error leaks by validating physical limits.
    if req.demand_rate <= 0 or req.order_cost <= 0 or req.holding_cost <= 0:
        raise HTTPException(status_code=400, detail="Demand rate, order cost, and holding cost must be > 0.")
    try:
        res = eoq(req.demand_rate, req.order_cost, req.holding_cost)
        return validate_finite(res)
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))

@app.post("/api/inventory/newsvendor")
def solve_newsvendor(req: NewsvendorRequest):
    try:
        res = newsvendor(req.selling_price, req.cost, req.salvage_value, req.demand_mean, req.demand_std)
        return validate_finite(res)
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))

@app.post("/api/inventory/continuous")
def solve_continuous(req: ContinuousReviewRequest):
    # Security: Prevent mathematical undefined states and ZeroDivisionErrors.
    if req.demand_rate <= 0 or req.order_cost <= 0 or req.holding_cost <= 0:
        raise HTTPException(status_code=400, detail="Demand rate, order cost, and holding cost must be > 0.")
    # Security: Prevent 500 error leaks and JSON serialization crashes from nan/inf bounds.
    if req.service_level <= 0 or req.service_level >= 1:
        raise HTTPException(status_code=400, detail="Service level must be between 0 and 1 (exclusive).")
    try:
        res = continuous_review(req.demand_rate, req.order_cost, req.holding_cost, req.lead_time_mean, req.lead_time_std, req.service_level)
        return validate_finite(res)
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))

@app.post("/api/route/tsp")
def solve_tsp(req: TSPRequest):
    # Security: Prevent CPU/Memory DoS attacks from large graphs
    if len(req.nodes) > 100 or len(req.edges) > 500:
        raise HTTPException(status_code=400, detail="Graph too large. Maximum 100 nodes and 500 edges allowed.")

    # Security: Prevent 500 Internal Server Error (NetworkXPointlessConcept) from graphs with < 2 nodes
    # Also ensure nodes are unique to prevent mathematically invalid graphs.
    if len(set(req.nodes)) != len(req.nodes):
        raise HTTPException(status_code=400, detail="Nodes must be unique.")
    if len(req.nodes) < 2:
        raise HTTPException(status_code=400, detail="Graph too small. Minimum 2 nodes required for TSP.")

    try:
        res = tsp_approx(req.nodes, req.edges)
        return validate_finite(res)
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))

@app.post("/api/route/jobshop")
def solve_jobshop(req: JobShopRequest):
    # Security: Prevent CPU/Memory DoS attacks from large job sets
    if len(req.jobs) > 100:
        raise HTTPException(status_code=400, detail="Too many jobs. Maximum 100 allowed.")

    try:
        # Convert Pydantic models back to dict for the backend function
        # ⚡ Bolt: Use Pydantic's top-level model_dump() directly instead of a
        # list comprehension over nested models. This is roughly 2.5x faster
        # because it serializes the entire nested structure natively in Rust/C
        # rather than performing O(N) Python iterations and method calls.
        jobs_dict = req.model_dump()['jobs']
        res = job_shop_cpm(jobs_dict)
        return validate_finite(res)
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))

# Resolve static files path
base_dir = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
public_dir = os.path.join(base_dir, "public")

@app.get("/")
async def serve_index():
    from fastapi.responses import FileResponse
    return FileResponse(os.path.join(public_dir, "index.html"))

if os.path.exists(public_dir):
    app.mount("/", StaticFiles(directory=public_dir, html=True), name="public")


