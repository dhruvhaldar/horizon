# Horizon

Horizon is a web-based Operations Research and Systems Engineering platform built for SF2866 Applied Systems Engineering. It provides computational solvers for the complex logistics, queueing, and scheduling problems commonly found in industrial and transport systems.

The tool features a Dark Neumorphic (Soft UI) design, creating a tactile, "space-age command console" feel where components appear extruded from the background material.

## 📚 Syllabus Mapping (SF2866)

This project strictly adheres to the course learning outcomes:

| Module | Syllabus Topic | Implemented Features |
|---|---|---|
| Queueing | Markov processes & networks | M/M/c queue simulators and Jackson Network solvers for interconnected nodes. |
| Inventory | Deterministic & stochastic models | EOQ optimizer and continuous review $(R, Q)$ policy generators with sustainability parameters. |
| Routing | Route planning | Graph-based optimization for transport networks (TSP approximations). |
| Scheduling | Production systems | Job-shop scheduling workflows and resource allocation optimization. |
| Validation | Validate, analyze and optimize | Monte Carlo simulation wrappers to validate the analytical expected values against variance. |

## 🚀 Deployment

### Cloud (Vercel)
Horizon is designed to run as a serverless mathematical engine.

1. Fork this repository.
2. Deploy to Vercel (Python runtime is auto-detected).
3. Access the Systems Dashboard at `https://your-horizon.vercel.app`.

### Local Development
To run Horizon on your own machine:

1. **Install Dependencies**:
   ```bash
   pip install -r requirements.txt
   ```
2. **Start the API Server**:
   The backend uses FastAPI. You can run it using `uvicorn`:
   ```bash
   uvicorn api.index:app --reload
   ```
3. **Serve the Frontend**:
   Since the frontend is a static site in the `public/` directory, you can serve it with any static server (e.g., Python's `http.server`, `live-server`, or just by opening `index.html` if you adjust the API base path). 
   
   To serve both together during development, ensure the `uvicorn` server is running on port 8000, and you can access the API at `http://localhost:8000/api`.

   *Note: For full functional parity with Vercel locally, use the [Vercel CLI](https://vercel.com/docs/cli):*
   ```bash
   vercel dev
   ```

## 📊 Visualizations & Artifacts

### 1. Queueing Networks (Markov Processes)

Interactive node-link diagrams visualizing the flow of entities through a system of interconnected service stations.

**Figure 1: Jackson Network.** The D3.js visualization maps the routing probabilities ($P_{ij}$) between nodes. The solver calculates the bottleneck nodes by solving the traffic equations, ensuring the arrival rate $\lambda$ does not exceed the service capacity $\mu$ at any station.

### 2. Stochastic Inventory Optimization

Visualizing the trade-offs between holding costs, ordering costs, and stockout probabilities over the planning horizon.

**Figure 2: The $(R, Q)$ Policy Saw-Tooth Plot.** This Chart.js output simulates inventory levels over time. It highlights the Reorder Point ($R$), the Order Quantity ($Q$), and the safety stock required to buffer against probabilistic lead-time demand.

### 3. Route Planning & Transport Systems

Graph-based visualizations for solving the Traveling Salesperson Problem (TSP) or Vehicle Routing Problem (VRP).

**Figure 3: Transport Routing.** The tool calculates the most cost-efficient path through a network of delivery nodes, utilizing NetworkX heuristics to minimize total distance and travel time while respecting vehicle capacity constraints.
