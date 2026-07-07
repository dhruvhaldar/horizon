const API_BASE = '/api';

// ⚡ Bolt: Cache deterministic API call results using a Map.
// Mathematical solvers return identical outputs for identical inputs.
// Caching the JSON response eliminates redundant network requests and
// backend recalculations, reducing latency to 0ms for repeated queries.
const apiCache = new Map();

async function fetchWithCache(endpoint, bodyObj, errorMsg) {
    // ⚡ Bolt: Prevent redundant JSON serialization.
    // JSON.stringify is synchronous and blocks the main thread. Caching its
    // output prevents O(N) serialization overhead for large payloads (like
    // 1000-node graph edges) by reusing the string for both cache key generation
    // and the HTTP request body.
    const bodyStr = JSON.stringify(bodyObj);
    const cacheKey = endpoint + bodyStr;
    if (apiCache.has(cacheKey)) {
        return apiCache.get(cacheKey);
    }
    const res = await fetch(`${API_BASE}${endpoint}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: bodyStr
    });
    const data = await res.json();
    if (!res.ok) throw new Error(formatError(data.detail) || errorMsg);

    // Only cache successful deterministic results
    apiCache.set(cacheKey, data);
    return data;
}

// UX Enhancement: Improve error message clarity with actionable steps
function getCustomError(input) {
    let fieldName = "This field";
    const label = document.querySelector(`label[for="${input.id}"]`);
    if (label) {
        // Extract label text and remove math notations, asterisks, and colons
        fieldName = label.textContent.replace(/\s*\(.*?\)/g, '').replace(/[\*:]/g, '').trim();
    }

    if (input.validity.valueMissing) {
        return `${fieldName} is a required field.`;
    }
    if (input.validity.rangeUnderflow) {
        const min = input.getAttribute('min');
        return `${fieldName} must be at least ${min}.`;
    }
    if (input.validity.badInput || input.validity.typeMismatch) {
        return `Please enter a valid format for ${fieldName}.`;
    }
    return input.validationMessage;
}

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
    if (btnElement.getAttribute('aria-disabled') === 'true') return;

    // UX Enhancement: Trigger native HTML5 validation on visible inputs before async operations
    const container = btnElement.closest('.panel');
    if (container) {
        const inputs = container.querySelectorAll('input, textarea');

        // ⚡ Bolt: Batch DOM layout reads (offsetWidth/offsetHeight) before performing DOM writes
        // inside the validation loop. Interleaving reads and writes causes synchronous layout
        // thrashing. Filtering the visible inputs upfront bypasses O(N) recalculation overhead.
        const visibleInputs = Array.from(inputs).filter(input =>
            input.type !== 'hidden' && (input.offsetWidth > 0 || input.offsetHeight > 0)
        );

        let isValid = true;
        let firstInvalid = null;
        for (let input of visibleInputs) {
            let errorDiv = input.parentNode.querySelector('.error-feedback');
            if (!input.checkValidity()) {
                    isValid = false;
                    input.setAttribute('aria-invalid', 'true');
                    if (!errorDiv) {
                        errorDiv = document.createElement('div');
                        errorDiv.className = 'error-feedback';
                        errorDiv.setAttribute('aria-live', 'polite');
                        // Assign a unique ID for aria-errormessage association
                        errorDiv.id = `error-${input.id || Math.random().toString(36).substring(2, 9)}`;
                        input.parentNode.appendChild(errorDiv);
                    }
                    errorDiv.textContent = getCustomError(input);
                    const existingDescribedBy = input.getAttribute('aria-describedby') || '';
                    if (!existingDescribedBy.includes(errorDiv.id)) {
                        input.setAttribute('aria-describedby', `${existingDescribedBy} ${errorDiv.id}`.trim());
                    }
                if (!firstInvalid) firstInvalid = input;
            } else {
                input.removeAttribute('aria-invalid');
                if (errorDiv) {
                    const existingDescribedBy = input.getAttribute('aria-describedby') || '';
                    input.setAttribute('aria-describedby', existingDescribedBy.replace(errorDiv.id, '').trim());
                    errorDiv.remove();
                }
            }
        }
        if (!isValid) {
            if (firstInvalid) {
                firstInvalid.scrollIntoView({ behavior: 'smooth', block: 'center' });
                firstInvalid.focus({ preventScroll: true });

                // UX Enhancement: Tactile physical feedback for errors
                // Remove class, force reflow, and re-add to ensure animation replays
                firstInvalid.classList.remove('shake');
                void firstInvalid.offsetWidth;
                firstInvalid.classList.add('shake');
            }
            announce("Validation failed. Please check highlighted inputs.");
            return;
        }
    }

    const originalText = btnElement.textContent;
    const wasFocused = document.activeElement === btnElement;
    btnElement.setAttribute('aria-disabled', 'true');
    btnElement.innerHTML = '<span class="spinner" aria-hidden="true"></span> Calculating...';
    btnElement.setAttribute('aria-busy', 'true');
    try {
        await asyncFunc();
    } finally {
        btnElement.textContent = originalText;
        btnElement.removeAttribute('aria-disabled');
        btnElement.removeAttribute('aria-busy');

        // UX Enhancement: Restore keyboard focus if it was lost due to disabling the button
        if (wasFocused) {
            btnElement.focus();
        }

        // UX Enhancement: Restore data visibility after calculation
        const panel = btnElement.closest('.panel');
        if (panel) {
            panel.dataset.stale = 'false'; // ⚡ Bolt: Reset stale flag
            const staleContainers = panel.querySelectorAll('.results, .viz-container');
            staleContainers.forEach(el => {
                el.style.opacity = '';
                el.style.filter = '';
                if (el.classList.contains('viz-container') && el.hasAttribute('aria-label')) {
                    const currentLabel = el.getAttribute('aria-label');
                    if (currentLabel.startsWith('Out of date: ')) {
                        el.setAttribute('aria-label', currentLabel.replace('Out of date: ', ''));
                    }
                }
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
        const data = await fetchWithCache('/queue', { gamma, p, mu, c: mu.map(() => 1) }, 'Error solving queue');

        // ⚡ Bolt: Prevent Layout Thrashing.
        // Call the graph drawing function BEFORE writing the JSON string to the DOM.
        // The drawing functions read container dimensions (e.g., getBoundingClientRect).
        // If we write to the DOM first, the layout becomes dirty, and reading dimensions
        // forces the browser to synchronously recalculate the entire page layout.
        drawQueueGraph(gamma, p);

        const resultsEl = document.getElementById('queue-results');
        resultsEl.textContent = JSON.stringify(data, null, 2);
        resultsEl.removeAttribute('aria-invalid');
        announce("Queueing network calculation complete.");
    } catch (e) {
        const resultsEl = document.getElementById('queue-results');
        resultsEl.textContent = `❌ Error: ${e.message}`;
        resultsEl.setAttribute('aria-invalid', 'true');
        d3.select("#queue-graph").selectAll("*").remove();
        document.getElementById('queue-graph').setAttribute('aria-label', 'Queueing Network Graph (Empty: Run network solver to generate graph)');
        announce(`Error calculating queueing network: ${e.message}`);
    }
}

function drawQueueGraph(gamma, p) {
    const container = d3.select("#queue-graph");

    // ⚡ Bolt: Read dimensions before mutating the DOM to utilize cached layout.
    // Interleaving DOM reads (getBoundingClientRect) immediately after DOM writes
    // (selectAll.remove) forces synchronous layout recalculation (layout thrashing).
    const width = container.node().getBoundingClientRect().width;
    const height = container.node().getBoundingClientRect().height;

    container.selectAll("*").remove();

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

    // ⚡ Bolt: Stop the automatic simulation and run it statically.
    // This pre-computes the layout in memory and renders the final state instantly,
    // avoiding hundreds of expensive DOM updates (layout thrashing) during the animation.
    const simulation = d3.forceSimulation(nodes)
        .force("link", d3.forceLink(links).id(d => d.id).distance(100))
        .force("charge", d3.forceManyBody().strength(-400))
        .force("center", d3.forceCenter(width / 2, height / 2))
        .stop();

    simulation.tick(300);

    const svg = container.append("svg")
        .attr("viewBox", `0 0 ${width} ${height}`)
        .attr("preserveAspectRatio", "xMidYMid meet")
        .style("width", "100%")
        .style("height", "100%")
        .attr("aria-hidden", "true");

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
        .attr("marker-end", "url(#arrow)")
        .attr("d", d => {
            const dx = d.target.x - d.source.x,
                  dy = d.target.y - d.source.y,
                  dr = Math.sqrt(dx * dx + dy * dy);
            return `M${d.source.x},${d.source.y}A${dr},${dr} 0 0,1 ${d.target.x},${d.target.y}`;
        });

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

    node.attr("transform", d => `translate(${d.x},${d.y})`);

    // UX Enhancement: Add dynamic ARIA label to graph container
    document.getElementById('queue-graph').setAttribute('aria-label', `Queueing Network Graph showing ${nodes.length} nodes and ${links.length} connections.`);
}

// Inventory
let invChart = null;

function toggleInv() {
    const isChecked = document.getElementById('inv-toggle').checked;
    switchInv(isChecked ? 'continuous' : 'eoq', true);
}

function switchInv(type, userInitiated = false) {
    const toggle = document.getElementById('inv-toggle');
    const labelEoq = document.getElementById('label-eoq');
    const labelCont = document.getElementById('label-cont');

    if (type === 'eoq') {
        toggle.checked = false;
        const eoqInputs = document.getElementById('inv-eoq-inputs');
        eoqInputs.style.display = 'flex';
        document.getElementById('inv-cont-inputs').style.display = 'none';

        // UX Enhancement: Dim inactive labels for clarity
        if (labelEoq) labelEoq.style.opacity = '1';
        if (labelCont) labelCont.style.opacity = '0.75';

        if (userInitiated) {
            announce("Switched to EOQ Model");
            // UX Enhancement: Auto-focus the first visible input when switching models
            const firstInput = eoqInputs.querySelector('input');
            if (firstInput) firstInput.focus();
        }
    } else {
        toggle.checked = true;
        document.getElementById('inv-eoq-inputs').style.display = 'none';
        const contInputs = document.getElementById('inv-cont-inputs');
        contInputs.style.display = 'flex';

        // UX Enhancement: Dim inactive labels for clarity
        if (labelEoq) labelEoq.style.opacity = '0.75';
        if (labelCont) labelCont.style.opacity = '1';

        if (userInitiated) {
            announce("Switched to Continuous Review Model");
            // UX Enhancement: Auto-focus the first visible input when switching models
            const firstInput = contInputs.querySelector('input');
            if (firstInput) firstInput.focus();
        }
    }
}

async function solveEOQ() {
    const demand = Number(document.getElementById('i-demand').value);
    const order = Number(document.getElementById('i-order').value);
    const hold = Number(document.getElementById('i-hold').value);

    try {
        const data = await fetchWithCache('/inventory/eoq', { demand_rate: demand, order_cost: order, holding_cost: hold }, 'Error calculating EOQ');

        // ⚡ Bolt: Prevent Layout Thrashing.
        // Call the chart rendering function BEFORE writing to the DOM to avoid forcing
        // a synchronous layout recalculation when Chart.js reads container dimensions.
        drawInventoryChart(data.Q, 0, demand);

        const resultsEl = document.getElementById('inventory-results');
        resultsEl.textContent = JSON.stringify(data, null, 2);
        resultsEl.removeAttribute('aria-invalid');
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
        if (viz) {
            viz.innerHTML = '';
            viz.setAttribute('aria-label', 'Inventory Optimization Chart (Empty: Calculate inventory policy to generate chart)');
        }
    }
}

async function solveContinuous() {
    const demand = Number(document.getElementById('ic-demand').value);
    const order = Number(document.getElementById('ic-order').value);
    const hold = Number(document.getElementById('ic-hold').value);
    const lt_mean = Number(document.getElementById('ic-lt-mean').value);
    const lt_std = Number(document.getElementById('ic-lt-std').value);

    try {
        const data = await fetchWithCache('/inventory/continuous', {
            demand_rate: demand, order_cost: order, holding_cost: hold,
            lead_time_mean: lt_mean, lead_time_std: lt_std
        }, 'Error calculating (R, Q)');

        // ⚡ Bolt: Prevent Layout Thrashing by batching DOM reads before DOM writes.
        drawInventoryChart(data.Q, data.R, demand);

        const resultsEl = document.getElementById('inventory-results');
        resultsEl.textContent = JSON.stringify(data, null, 2);
        resultsEl.removeAttribute('aria-invalid');
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
        if (viz) {
            viz.innerHTML = '';
            viz.setAttribute('aria-label', 'Inventory Optimization Chart (Empty: Calculate inventory policy to generate chart)');
        }
    }
}

function drawInventoryChart(Q, R, demand) {
    const viz = document.getElementById('inventory-viz');
    let canvas = document.getElementById('inventory-chart');
    if (!canvas) {
        viz.innerHTML = '<canvas id="inventory-chart" aria-hidden="true">Your browser does not support the canvas element. This chart displays inventory levels over time.</canvas>';
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

    // UX Enhancement: Add dynamic ARIA label to chart container
    if (R > 0) {
        viz.setAttribute('aria-label', `Line chart showing inventory levels and reorder points over time. Order Quantity (Q) of ${Q.toFixed(2)} and Reorder Point (R) of ${R.toFixed(2)}`);
    } else {
        viz.setAttribute('aria-label', `Line chart showing inventory levels over time. Economic Order Quantity (Q) of ${Q.toFixed(2)}`);
    }
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
        const data = await fetchWithCache('/route/tsp', { nodes, edges }, 'Error calculating TSP');

        // ⚡ Bolt: Prevent Layout Thrashing.
        // drawRoutingGraph calls getBoundingClientRect(), which is a DOM read.
        // Calling it before resultsEl.textContent (a DOM write) batches reads and writes,
        // avoiding an expensive synchronous forced reflow.
        drawRoutingGraph(nodes, edges, data.path);

        const resultsEl = document.getElementById('routing-results');
        resultsEl.textContent = JSON.stringify(data, null, 2);
        resultsEl.removeAttribute('aria-invalid');
        announce("Route optimization complete.");
    } catch (e) {
        const resultsEl = document.getElementById('routing-results');
        resultsEl.textContent = `❌ Error: ${e.message}`;
        resultsEl.setAttribute('aria-invalid', 'true');
        d3.select("#routing-graph").selectAll("*").remove();
        document.getElementById('routing-graph').setAttribute('aria-label', 'Transport Routing Graph (Empty: Optimize route to generate map)');
        announce(`Error optimizing route: ${e.message}`);
    }
}

function drawRoutingGraph(nodesList, edges, path) {
    const container = d3.select("#routing-graph");

    // ⚡ Bolt: Read dimensions before mutating the DOM to utilize cached layout.
    // Interleaving DOM reads (getBoundingClientRect) immediately after DOM writes
    // (selectAll.remove) forces synchronous layout recalculation (layout thrashing).
    const width = container.node().getBoundingClientRect().width;
    const height = container.node().getBoundingClientRect().height;

    container.selectAll("*").remove();

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

    // ⚡ Bolt: Stop the automatic simulation and run it statically.
    // This pre-computes the layout in memory and renders the final state instantly,
    // avoiding hundreds of expensive DOM updates (layout thrashing) during the animation.
    const simulation = d3.forceSimulation(nodes)
        .force("link", d3.forceLink(links).id(d => d.id).distance(100))
        .force("charge", d3.forceManyBody().strength(-300))
        .force("center", d3.forceCenter(width / 2, height / 2))
        .stop();

    simulation.tick(300);

    const svg = container.append("svg")
        .attr("viewBox", `0 0 ${width} ${height}`)
        .attr("preserveAspectRatio", "xMidYMid meet")
        .style("width", "100%")
        .style("height", "100%")
        .attr("aria-hidden", "true");

    const link = svg.append("g")
        .selectAll("line")
        .data(links)
        .join("line")
        .attr("class", "link")
        .attr("stroke", d => d.isPath ? "#e74c3c" : "#334155")
        .attr("stroke-width", d => d.isPath ? 3 : 1)
        .attr("x1", d => d.source.x)
        .attr("y1", d => d.source.y)
        .attr("x2", d => d.target.x)
        .attr("y2", d => d.target.y);

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

    node.attr("transform", d => `translate(${d.x},${d.y})`);

    // UX Enhancement: Add dynamic ARIA label to graph container
    const pathText = path && path.length > 0 ? ` with optimal route of ${path.length - 1} steps` : '';
    document.getElementById('routing-graph').setAttribute('aria-label', `Transport Routing Graph showing ${nodes.length} nodes and ${links.length} possible connections${pathText}.`);
}

// UX Enhancement: Clear inline validation styling dynamically on input
document.addEventListener('input', (e) => {
    // Clear shake animation so it can be retriggered later
    e.target.classList.remove('shake');

    if (e.target.hasAttribute('aria-invalid')) {
        const errorDiv = e.target.parentNode.querySelector('.error-feedback');
        if (e.target.checkValidity()) {
            e.target.removeAttribute('aria-invalid');
            if (errorDiv) {
                const existingDescribedBy = e.target.getAttribute('aria-describedby') || '';
                e.target.setAttribute('aria-describedby', existingDescribedBy.replace(errorDiv.id, '').trim());
                errorDiv.remove();
            }
        } else if (errorDiv) {
            errorDiv.textContent = getCustomError(e.target);
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

        // ⚡ Bolt: Early return if panel is already marked stale to bypass O(N) DOM
        // traversal (querySelectorAll) on every keystroke during high-frequency input events.
        if (panel.dataset.stale === 'true') return;
        panel.dataset.stale = 'true';

        const staleContainers = panel.querySelectorAll('.results, .viz-container');
        staleContainers.forEach(container => {
            // ⚡ Bolt: Early return if already dimmed to bypass expensive DOM reads
            // and string operations on every keystroke during high-frequency input events.
            if (container.style.opacity === '0.75') return;

            // Only dim if it has actual data, not default/error states
            if (container.classList.contains('results') && container.textContent.includes('Results will appear here...')) return;
            if (container.textContent.includes('❌ Error:')) return;

            container.style.opacity = '0.75';
            container.style.filter = 'grayscale(100%)';
            container.style.transition = 'opacity 0.3s ease, filter 0.3s ease';

            if (container.classList.contains('viz-container') && container.hasAttribute('aria-label')) {
                const currentLabel = container.getAttribute('aria-label');
                if (!currentLabel.startsWith('Out of date: ')) {
                    container.setAttribute('aria-label', 'Out of date: ' + currentLabel);
                }
            }

            // UX Enhancement: Disable copy button on stale data to prevent copying inaccurate results
            if (container.classList.contains('results')) {
                const copyBtn = container.querySelector('.copy-btn');
                if (copyBtn && !copyBtn.disabled) {
                    copyBtn.setAttribute('aria-disabled', 'true');
                    copyBtn.disabled = true;
                    copyBtn.setAttribute('title', 'Results are out of date. Recalculate to copy.');
                    copyBtn.innerHTML = '⏳ Stale';
                    copyBtn.style.cursor = 'not-allowed';
                }
            }
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
            if (target.type === 'checkbox') {
                e.preventDefault();
                target.checked = !target.checked;
                target.dispatchEvent(new Event('change'));
                return;
            }
            e.preventDefault(); // Prevent default form submission or newline

            // Find the closest logical container (.calc-group or .panel)
            const container = target.closest('.calc-group, .panel');
            if (container) {
                // Find the visible primary action button within this container
                const btns = Array.from(container.querySelectorAll('.btn'));
                const btn = btns.find(b => b.offsetWidth > 0 || b.offsetHeight > 0);
                if (btn && !btn.disabled && btn.getAttribute('aria-disabled') !== 'true') {
                    // UX Enhancement: Add tactile visual feedback for keyboard shortcuts
                    btn.classList.add('active');
                    setTimeout(() => btn.classList.remove('active'), 150);
                    btn.click();
                }
            }
        }
    }
});

// Initial draw
switchInv('eoq');

// ⚡ Bolt: Attach the non-passive `wheel` event listener locally to number inputs
// rather than globally on `document`. A global non-passive wheel listener blocks
// the browser's main thread on every scroll action across the entire page,
// disabling native 60fps scroll optimizations and causing jank.
document.querySelectorAll('input[type="number"]').forEach(input => {
    input.addEventListener('wheel', (e) => {
        // Prevent default scrolling which alters the number input value
        e.preventDefault();
        // Blur the input to restore normal page scrolling
        input.blur();
    }, { passive: false });
});

// UX Enhancement: Auto-resize textareas to match content height
// ⚡ Bolt: Defers the resize logic into the browser's natural render cycle using requestAnimationFrame.
// Setting height='auto' and reading scrollHeight synchronously blocks the main thread with a forced
// layout recalculation (reflow) on every single keystroke. Deferring this eliminates input lag.
function autoResizeTextarea(textarea) {
    if (textarea.dataset.resizing) return;
    textarea.dataset.resizing = 'true';
    requestAnimationFrame(() => {
        textarea.style.height = 'auto';
        textarea.style.height = textarea.scrollHeight + 'px';
        textarea.dataset.resizing = '';
    });
}

// ⚡ Bolt: Batch DOM layout reads and writes during initialization to prevent
// O(N) synchronous layout thrashing (forced reflows).
const textareas = document.querySelectorAll('textarea');
// Phase 1: Write (reset all)
textareas.forEach(t => t.style.height = 'auto');
// Phase 2: Read (measure all without triggering reflows between measurements)
const heights = Array.from(textareas).map(t => t.scrollHeight);
// Phase 3: Write (apply final heights)
textareas.forEach((t, i) => t.style.height = heights[i] + 'px');

document.addEventListener('input', (e) => {
    if (e.target.tagName === 'TEXTAREA') {
        autoResizeTextarea(e.target);
    }
});

// UX Enhancement: Add copy button to results container
document.querySelectorAll('.results').forEach(container => {
    container.style.position = 'relative';

    const observer = new MutationObserver(() => {
        if (container.querySelector('.copy-btn')) return;
        const text = container.textContent;
        if (text.includes('Results will appear here...') || text.includes('❌ Error:')) return;

        const btn = document.createElement('button');
        btn.className = 'copy-btn btn';
        btn.innerHTML = '📋 Copy';
        btn.setAttribute('aria-label', 'Copy results to clipboard');
        btn.style.position = 'absolute';
        btn.style.top = '0.5rem';
        btn.style.right = '0.5rem';
        btn.style.padding = '0.25rem 0.5rem';
        btn.style.fontSize = '0.8rem';
        btn.style.width = 'auto';

        btn.onclick = () => {
            const clone = container.cloneNode(true);
            const copyBtn = clone.querySelector('.copy-btn');
            if (copyBtn) copyBtn.remove();
            navigator.clipboard.writeText(clone.textContent.trim()).then(() => {
                const originalHtml = btn.innerHTML;
                btn.innerHTML = '✅ Copied';
                announce('Results copied to clipboard');
                setTimeout(() => { btn.innerHTML = originalHtml; }, 2000);
            });
        };

        container.appendChild(btn);
    });

    observer.observe(container, { childList: true, subtree: true });
});

// UX Enhancement: Detect macOS and update keyboard shortcut hints
if (navigator.userAgent.includes('Mac')) {
    document.querySelectorAll('.os-modifier').forEach(el => {
        el.textContent = '⌘ Cmd';
    });
}

// UX Enhancement: Auto-select input text on focus to allow quick overwriting
document.querySelectorAll('input.inset, textarea.inset').forEach(el => {
    el.addEventListener('focus', function() {
        this.select();
    });
});
