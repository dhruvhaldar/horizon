const API_BASE = '/api';

// UX Enhancement: Global screen reader announcer
function announce(message) {
    const announcer = document.getElementById('sr-announcer');
    if (announcer) {
        // Clear and re-set to ensure the screen reader announces repeated messages
        announcer.textContent = '';
        setTimeout(() => { announcer.textContent = message; }, 50);
    }
}

// Helper to format validation errors from FastAPI
function formatError(detail) {
    if (Array.isArray(detail)) {
        return detail.map(err => {
            let field = '';
            if (err.loc && err.loc.length > 1) {
                // loc is usually ["body", "field_name", ...]
                field = `${err.loc[1]}: `;
            }
            return `• ${field}${err.msg}`;
        }).join('\n');
    }
    return detail;
}

async function withLoading(btnElement, asyncFunc) {
    // UX Enhancement: Trigger native HTML5 validation on visible inputs before async operations
    const container = btnElement.closest('.panel');
    if (container) {
        const inputs = container.querySelectorAll('input, textarea');
        let isValid = true;
        let firstInvalid = null;
        for (let input of inputs) {
            // Only validate if the element is not visually hidden (like toggles) and is currently displayed
            if (input.type !== 'hidden' && (input.offsetWidth > 0 || input.offsetHeight > 0)) {
                if (!input.checkValidity()) {
                    isValid = false;
                    input.setAttribute('aria-invalid', 'true');
                    if (!firstInvalid) firstInvalid = input;
                } else {
                    input.removeAttribute('aria-invalid');
                }
            }
        }
        if (!isValid) {
            if (firstInvalid) {
                firstInvalid.focus();
                firstInvalid.reportValidity();
            }
            announce("Validation failed. Please check highlighted inputs.");
            return;
        }
    }

    const originalText = btnElement.textContent;
    btnElement.disabled = true;
    btnElement.textContent = "⏳ Calculating...";
    btnElement.setAttribute('aria-busy', 'true');
    try {
        await asyncFunc();
    } finally {
        btnElement.textContent = originalText;
        btnElement.disabled = false;
        btnElement.removeAttribute('aria-busy');

        // UX Enhancement: Restore data visibility after calculation
        const panel = btnElement.closest('.panel');
        if (panel) {
            const staleContainers = panel.querySelectorAll('.results, .viz-container');
            staleContainers.forEach(el => {
                el.style.opacity = '';
                el.style.filter = '';
            });
        }
    }
}

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
        if(!res.ok) throw new Error(formatError(data.detail) || 'Error solving queue');

        const resultsEl = document.getElementById('queue-results');
        resultsEl.textContent = JSON.stringify(data, null, 2);
        resultsEl.removeAttribute('aria-invalid');
        drawQueueGraph(gamma, p);
        announce("Queueing network calculation complete.");
    } catch (e) {
        const resultsEl = document.getElementById('queue-results');
        resultsEl.textContent = `❌ Error: ${e.message}`;
        resultsEl.setAttribute('aria-invalid', 'true');
        d3.select("#queue-graph").selectAll("*").remove();
        announce(`Error calculating queueing network: ${e.message}`);
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
        .attr("viewBox", `0 0 ${width} ${height}`)
        .attr("preserveAspectRatio", "xMidYMid meet")
        .style("width", "100%")
        .style("height", "100%");

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
    const labelEoq = document.getElementById('label-eoq');
    const labelCont = document.getElementById('label-cont');

    if (type === 'eoq') {
        toggle.checked = false;
        document.getElementById('inv-eoq-inputs').style.display = 'flex';
        document.getElementById('inv-cont-inputs').style.display = 'none';

        // UX Enhancement: Dim inactive labels for clarity
        if (labelEoq) labelEoq.style.opacity = '1';
        if (labelCont) labelCont.style.opacity = '0.5';
        toggle.setAttribute('aria-label', 'Toggle between EOQ and Continuous Review models. Currently EOQ is active.');
    } else {
        toggle.checked = true;
        document.getElementById('inv-eoq-inputs').style.display = 'none';
        document.getElementById('inv-cont-inputs').style.display = 'flex';

        // UX Enhancement: Dim inactive labels for clarity
        if (labelEoq) labelEoq.style.opacity = '0.5';
        if (labelCont) labelCont.style.opacity = '1';
        toggle.setAttribute('aria-label', 'Toggle between EOQ and Continuous Review models. Currently Continuous Review is active.');
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
        if(!res.ok) throw new Error(formatError(data.detail) || 'Error calculating EOQ');

        const resultsEl = document.getElementById('inventory-results');
        resultsEl.textContent = JSON.stringify(data, null, 2);
        resultsEl.removeAttribute('aria-invalid');
        drawInventoryChart(data.Q, 0, demand);
        announce("EOQ calculation complete.");
    } catch (e) {
        const resultsEl = document.getElementById('inventory-results');
        resultsEl.textContent = `❌ Error: ${e.message}`;
        resultsEl.setAttribute('aria-invalid', 'true');
        announce(`Error calculating EOQ: ${e.message}`);
        if (invChart) {
            invChart.destroy();
            invChart = null;
        }
        const viz = document.getElementById('inventory-viz');
        if (viz) viz.innerHTML = '';
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
        if(!res.ok) throw new Error(formatError(data.detail) || 'Error calculating (R, Q)');

        const resultsEl = document.getElementById('inventory-results');
        resultsEl.textContent = JSON.stringify(data, null, 2);
        resultsEl.removeAttribute('aria-invalid');
        drawInventoryChart(data.Q, data.R, demand);
        announce("Continuous review calculation complete.");
    } catch (e) {
        const resultsEl = document.getElementById('inventory-results');
        resultsEl.textContent = `❌ Error: ${e.message}`;
        resultsEl.setAttribute('aria-invalid', 'true');
        announce(`Error calculating continuous review: ${e.message}`);
        if (invChart) {
            invChart.destroy();
            invChart = null;
        }
        const viz = document.getElementById('inventory-viz');
        if (viz) viz.innerHTML = '';
    }
}

function drawInventoryChart(Q, R, demand) {
    const viz = document.getElementById('inventory-viz');
    let canvas = document.getElementById('inventory-chart');
    if (!canvas) {
        viz.innerHTML = '<canvas id="inventory-chart" role="img" aria-label="Line chart showing inventory levels and reorder points over time">Your browser does not support the canvas element. This chart displays inventory levels over time.</canvas>';
        canvas = document.getElementById('inventory-chart');
    }
    const ctx = canvas.getContext('2d');
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
                legend: { labels: { color: 'hsl(220, 30%, 20%)' } }
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
        if(!res.ok) throw new Error(formatError(data.detail) || 'Error calculating TSP');

        const resultsEl = document.getElementById('routing-results');
        resultsEl.textContent = JSON.stringify(data, null, 2);
        resultsEl.removeAttribute('aria-invalid');
        drawRoutingGraph(nodes, edges, data.path);
        announce("Route optimization complete.");
    } catch (e) {
        const resultsEl = document.getElementById('routing-results');
        resultsEl.textContent = `❌ Error: ${e.message}`;
        resultsEl.setAttribute('aria-invalid', 'true');
        d3.select("#routing-graph").selectAll("*").remove();
        announce(`Error optimizing route: ${e.message}`);
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
        // ⚡ Bolt: Use a Set for O(1) path edge lookups instead of O(E) Array.find
        // inside the loop. This reduces the time complexity from O(V * E) to O(V + E),
        // significantly improving rendering performance for large/dense routing graphs.
        const pathEdges = new Set();
        for(let i=0; i<path.length - 1; i++) {
            pathEdges.add(`${path[i]}-${path[i+1]}`);
            pathEdges.add(`${path[i+1]}-${path[i]}`);
        }

        links.forEach(link => {
            if (pathEdges.has(`${link.source}-${link.target}`)) {
                link.isPath = true;
            }
        });
    }

    const simulation = d3.forceSimulation(nodes)
        .force("link", d3.forceLink(links).id(d => d.id).distance(100))
        .force("charge", d3.forceManyBody().strength(-300))
        .force("center", d3.forceCenter(width / 2, height / 2));

    const svg = container.append("svg")
        .attr("viewBox", `0 0 ${width} ${height}`)
        .attr("preserveAspectRatio", "xMidYMid meet")
        .style("width", "100%")
        .style("height", "100%");

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

// UX Enhancement: Clear inline validation styling dynamically on input
document.addEventListener('input', (e) => {
    if (e.target.hasAttribute('aria-invalid')) {
        if (e.target.checkValidity()) {
            e.target.removeAttribute('aria-invalid');
        }
    }

    // UX Enhancement: Dim stale data when inputs change
    const panel = e.target.closest('.panel');
    if (panel) {
        // Clear aggressive error styling as soon as user attempts a correction
        const resultBox = panel.querySelector('.results');
        if (resultBox && resultBox.hasAttribute('aria-invalid')) {
            resultBox.removeAttribute('aria-invalid');
        }

        const staleContainers = panel.querySelectorAll('.results, .viz-container');
        staleContainers.forEach(container => {
            // ⚡ Bolt: Early return if already dimmed to bypass expensive DOM reads
            // and string operations on every keystroke during high-frequency input events.
            if (container.style.opacity === '0.5') return;

            // Only dim if it has actual data, not default/error states
            if (container.classList.contains('results') && container.textContent.includes('Results will appear here...')) return;
            if (container.textContent.includes('❌ Error:')) return;

            container.style.opacity = '0.5';
            container.style.filter = 'grayscale(100%)';
            container.style.transition = 'opacity 0.3s ease, filter 0.3s ease';
        });
    }
});

// UX Enhancement: Enter key submits active module
document.addEventListener('keydown', (e) => {
    if (e.key === 'Enter') {
        const target = e.target;

        // UX Enhancement: Allow natural newlines in textareas. Require Ctrl/Cmd+Enter to submit.
        if (target.tagName === 'TEXTAREA' && !e.ctrlKey && !e.metaKey) return;

        if (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA') {
            e.preventDefault(); // Prevent default form submission or newline

            // Find the closest logical container (.calc-group or .panel)
            const container = target.closest('.calc-group, .panel');
            if (container) {
                // Find the visible primary action button within this container
                const btns = Array.from(container.querySelectorAll('.btn'));
                const btn = btns.find(b => b.offsetWidth > 0 || b.offsetHeight > 0);
                if (btn && !btn.disabled) {
                    btn.click();
                }
            }
        }
    }
});

// Initial draw
switchInv('eoq');

// UX Enhancement: Prevent accidental data mutation via scroll wheel on number inputs
document.addEventListener('wheel', (e) => {
    if (document.activeElement && document.activeElement.type === 'number') {
        // Prevent default scrolling which alters the number input value
        e.preventDefault();
        // Blur the input to restore normal page scrolling
        document.activeElement.blur();
    }
}, { passive: false });

// UX Enhancement: Auto-resize textareas to match content height
function autoResizeTextarea(textarea) {
    textarea.style.height = 'auto';
    textarea.style.height = textarea.scrollHeight + 'px';
}
document.querySelectorAll('textarea').forEach(autoResizeTextarea);
document.addEventListener('input', (e) => {
    if (e.target.tagName === 'TEXTAREA') {
        autoResizeTextarea(e.target);
    }
});
