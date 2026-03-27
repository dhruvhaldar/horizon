from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import List, Dict, Optional, Any
import os
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

class JacksonRequest(BaseModel):
    gamma: List[float]
    p: List[List[float]]
    mu: List[float]
    c: Optional[List[int]] = None

class EOQRequest(BaseModel):
    demand_rate: float
    order_cost: float
    holding_cost: float

class NewsvendorRequest(BaseModel):
    selling_price: float
    cost: float
    salvage_value: float
    demand_mean: float
    demand_std: float

class ContinuousReviewRequest(BaseModel):
    demand_rate: float
    order_cost: float
    holding_cost: float
    lead_time_mean: float
    lead_time_std: float
    service_level: Optional[float] = 0.95

class TSPRequest(BaseModel):
    nodes: List[str]
    edges: List[List[Any]] # [node1, node2, weight]

class JobShopRequest(BaseModel):
    jobs: Dict[str, Dict[str, Any]]

@app.get("/api/health")
def health_check():
    return {"status": "ok"}

@app.post("/api/queue")
def solve_queue(req: JacksonRequest):
    # Security: Prevent CPU/Memory DoS attacks from extremely large factorials
    # in the M/M/c queueing calculation.
    if req.c and any(c_val > 100 for c_val in req.c):
        raise HTTPException(status_code=400, detail="Maximum number of servers (c) exceeded. Must be <= 100.")

    try:
        res = jackson_network(req.gamma, req.p, req.mu, req.c)
        return res
    except ValueError as e:
        # Security: Catch specific validation errors instead of generic Exception to prevent leaking stack traces or internal details
        raise HTTPException(status_code=400, detail=str(e))

@app.post("/api/inventory/eoq")
def solve_eoq(req: EOQRequest):
    try:
        res = eoq(req.demand_rate, req.order_cost, req.holding_cost)
        return res
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))

@app.post("/api/inventory/newsvendor")
def solve_newsvendor(req: NewsvendorRequest):
    try:
        res = newsvendor(req.selling_price, req.cost, req.salvage_value, req.demand_mean, req.demand_std)
        return res
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))

@app.post("/api/inventory/continuous")
def solve_continuous(req: ContinuousReviewRequest):
    try:
        res = continuous_review(req.demand_rate, req.order_cost, req.holding_cost, req.lead_time_mean, req.lead_time_std, req.service_level)
        return res
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))

@app.post("/api/route/tsp")
def solve_tsp(req: TSPRequest):
    try:
        # Convert list of lists back to list of tuples
        edges = [(e[0], e[1], float(e[2])) for e in req.edges]
        res = tsp_approx(req.nodes, edges)
        return res
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))

@app.post("/api/route/jobshop")
def solve_jobshop(req: JobShopRequest):
    try:
        res = job_shop_cpm(req.jobs)
        return res
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


