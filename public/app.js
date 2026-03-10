const API_BASE = '/api';

// Queueing
async function solveQueue() {
    const gamma = document.getElementById('q-gamma').value.split(',').map(Number);
    const mu = document.getElementById('q-mu').value.split(',').map(Number);
    const pStr = document.getElementById('q-p').value.trim();
    const p = pStr ? pStr.split('\n').map(row => row.split(',').map(Number)) : [];

    try {
        const res = await fetch(`${API_BASE}/queue`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ gamma, p, mu, c: mu.map(() => 1) })
        });
        const data = await res.json();
        if(!res.ok) throw new Error(data.detail || 'Error solving queue');

        document.getElementById('queue-results').innerText = JSON.stringify(data, null, 2);
        drawQueueGraph(gamma, p);
    } catch (e) {
        document.getElementById('queue-results').innerText = e.message;
    }
}

function drawQueueGraph(gamma, p) {
    const container = d3.select("#queue-graph");
    container.selectAll("*").remove();

    const width = container.node().getBoundingClientRect().width;
    const height = container.node().getBoundingClientRect().height;

    const nodes = gamma.map((_, i) => ({ id: `Node ${i}`, index: i }));
    const links = [];

    // External arrivals
    gamma.forEach((g, i) => {
        if(g > 0) {
            nodes.push({ id: `Ext_${i}`, isExternal: true });
            links.push({ source: `Ext_${i}`, target: `Node ${i}`, value: g });
        }
    });

    for(let i=0; i<p.length; i++){
        for(let j=0; j<p[i].length; j++){
            if(p[i][j] > 0){
                links.push({ source: `Node ${i}`, target: `Node ${j}`, value: p[i][j] });
            }
        }
    }

    const simulation = d3.forceSimulation(nodes)
        .force("link", d3.forceLink(links).id(d => d.id).distance(100))
        .force("charge", d3.forceManyBody().strength(-400))
        .force("center", d3.forceCenter(width / 2, height / 2));

    const svg = container.append("svg")
        .attr("width", width)
        .attr("height", height);

    // Arrow marker
    svg.append("defs").append("marker")
        .attr("id", "arrow")
        .attr("viewBox", "0 -5 10 10")
        .attr("refX", 20)
        .attr("refY", 0)
        .attr("markerWidth", 6)
        .attr("markerHeight", 6)
        .attr("orient", "auto")
        .append("path")
        .attr("d", "M0,-5L10,0L0,5")
        .attr("fill", "#ff6b35");

    const link = svg.append("g")
        .selectAll("path")
        .data(links)
        .join("path")
        .attr("class", "link")
        .attr("stroke", "#ff6b35")
        .attr("marker-end", "url(#arrow)");

    const node = svg.append("g")
        .attr("class", "node")
        .selectAll("g")
        .data(nodes)
        .join("g");

    node.append("circle")
        .attr("r", d => d.isExternal ? 5 : 15);

    node.append("text")
        .attr("dx", 20)
        .attr("dy", 5)
        .text(d => d.isExternal ? "In" : d.id);

    simulation.on("tick", () => {
        link.attr("d", d => {
            const dx = d.target.x - d.source.x,
                  dy = d.target.y - d.source.y,
                  dr = Math.sqrt(dx * dx + dy * dy);
            return `M${d.source.x},${d.source.y}A${dr},${dr} 0 0,1 ${d.target.x},${d.target.y}`;
        });
        node.attr("transform", d => `translate(${d.x},${d.y})`);
    });
}

// Inventory
let invChart = null;

function toggleInv() {
    const isChecked = document.getElementById('inv-toggle').checked;
    switchInv(isChecked ? 'continuous' : 'eoq');
}

function switchInv(type) {
    const toggle = document.getElementById('inv-toggle');
    if (type === 'eoq') {
        toggle.checked = false;
        document.getElementById('inv-eoq-inputs').style.display = 'block';
        document.getElementById('inv-cont-inputs').style.display = 'none';
        document.querySelector('#inv-eoq-inputs button').onclick = solveEOQ;
    } else {
        toggle.checked = true;
        document.getElementById('inv-eoq-inputs').style.display = 'none';
        document.getElementById('inv-cont-inputs').style.display = 'block';
        document.querySelector('#inv-cont-inputs button').onclick = solveContinuous;
    }
}

async function solveEOQ() {
    const demand = Number(document.getElementById('i-demand').value);
    const order = Number(document.getElementById('i-order').value);
    const hold = Number(document.getElementById('i-hold').value);

    try {
        const res = await fetch(`${API_BASE}/inventory/eoq`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ demand_rate: demand, order_cost: order, holding_cost: hold })
        });
        const data = await res.json();
        if(!res.ok) throw new Error(data.detail || 'Error calculating EOQ');

        document.getElementById('inventory-results').innerText = JSON.stringify(data, null, 2);
        drawInventoryChart(data.Q, 0, demand);
    } catch (e) {
        document.getElementById('inventory-results').innerText = e.message;
    }
}

async function solveContinuous() {
    const demand = Number(document.getElementById('ic-demand').value);
    const order = Number(document.getElementById('ic-order').value);
    const hold = Number(document.getElementById('ic-hold').value);
    const lt_mean = Number(document.getElementById('ic-lt-mean').value);
    const lt_std = Number(document.getElementById('ic-lt-std').value);

    try {
        const res = await fetch(`${API_BASE}/inventory/continuous`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                demand_rate: demand, order_cost: order, holding_cost: hold,
                lead_time_mean: lt_mean, lead_time_std: lt_std
            })
        });
        const data = await res.json();
        if(!res.ok) throw new Error(data.detail || 'Error calculating (R, Q)');

        document.getElementById('inventory-results').innerText = JSON.stringify(data, null, 2);
        drawInventoryChart(data.Q, data.R, demand);
    } catch (e) {
        document.getElementById('inventory-results').innerText = e.message;
    }
}

function drawInventoryChart(Q, R, demand) {
    const ctx = document.getElementById('inventory-chart').getContext('2d');
    if (invChart) invChart.destroy();

    const timeSteps = 100;
    const inventory = [];
    const reorderLine = [];
    let currentInv = Q + (R > 0 ? R : 0);
    const dailyDemand = demand / 365;

    for(let i=0; i<timeSteps; i++) {
        inventory.push({x: i, y: currentInv});
        reorderLine.push({x: i, y: R});

        currentInv -= dailyDemand * 10; // scale demand for viz

        if (currentInv <= R) {
            currentInv += Q; // Instantaneous delivery for viz simplicity
        }
    }

    invChart = new Chart(ctx, {
        type: 'line',
        data: {
            datasets: [
                {
                    label: 'Inventory Level',
                    data: inventory,
                    borderColor: '#ff6b35',
                    borderWidth: 2,
                    fill: false,
                    tension: 0
                },
                {
                    label: 'Reorder Point (R)',
                    data: reorderLine,
                    borderColor: '#e74c3c',
                    borderWidth: 1,
                    borderDash: [5, 5],
                    pointRadius: 0,
                    fill: false
                }
            ]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            scales: {
                x: { type: 'linear', display: false },
                y: {
                    beginAtZero: true,
                    grid: { color: 'rgba(0, 0, 0, 0.1)' },
                    ticks: { color: '#444' }
                }
            },
            plugins: {
                legend: { labels: { color: '#2d3748' } }
            }
        }
    });
}

// Routing
async function solveTSP() {
    const nodes = document.getElementById('r-nodes').value.split(',').map(n => n.trim());
    const edgesText = document.getElementById('r-edges').value.trim();
    const edges = edgesText.split('\n').map(line => {
        const parts = line.split(',');
        return [parts[0].trim(), parts[1].trim(), Number(parts[2])];
    });

    try {
        const res = await fetch(`${API_BASE}/route/tsp`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ nodes, edges })
        });
        const data = await res.json();
        if(!res.ok) throw new Error(data.detail || 'Error calculating TSP');

        document.getElementById('routing-results').innerText = JSON.stringify(data, null, 2);
        drawRoutingGraph(nodes, edges, data.path);
    } catch (e) {
        document.getElementById('routing-results').innerText = e.message;
    }
}

function drawRoutingGraph(nodesList, edges, path) {
    const container = d3.select("#routing-graph");
    container.selectAll("*").remove();

    const width = container.node().getBoundingClientRect().width;
    const height = container.node().getBoundingClientRect().height;

    const nodes = nodesList.map(id => ({ id }));

    // Create links, highlighting the path
    const links = edges.map(e => ({ source: e[0], target: e[1], weight: e[2], isPath: false }));

    if (path && path.length > 0) {
        for(let i=0; i<path.length - 1; i++) {
            const u = path[i];
            const v = path[i+1];
            const link = links.find(l => (l.source === u && l.target === v) || (l.source === v && l.target === u));
            if (link) link.isPath = true;
        }
    }

    const simulation = d3.forceSimulation(nodes)
        .force("link", d3.forceLink(links).id(d => d.id).distance(100))
        .force("charge", d3.forceManyBody().strength(-300))
        .force("center", d3.forceCenter(width / 2, height / 2));

    const svg = container.append("svg")
        .attr("width", width)
        .attr("height", height);

    const link = svg.append("g")
        .selectAll("line")
        .data(links)
        .join("line")
        .attr("class", "link")
        .attr("stroke", d => d.isPath ? "#e74c3c" : "#334155")
        .attr("stroke-width", d => d.isPath ? 3 : 1);

    const node = svg.append("g")
        .attr("class", "node")
        .selectAll("g")
        .data(nodes)
        .join("g");

    node.append("circle")
        .attr("r", 15);

    node.append("text")
        .attr("dx", -5)
        .attr("dy", 4)
        .text(d => d.id);

    simulation.on("tick", () => {
        link
            .attr("x1", d => d.source.x)
            .attr("y1", d => d.source.y)
            .attr("x2", d => d.target.x)
            .attr("y2", d => d.target.y);

        node.attr("transform", d => `translate(${d.x},${d.y})`);
    });
}

// Initial draw
switchInv('eoq');
