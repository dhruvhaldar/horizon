import re
from playwright.sync_api import Page, expect
import json

def test_homepage_loads(page_with_app: Page):
    """Test that the homepage loads correctly."""
    expect(page_with_app).to_have_title(re.compile("Horizon: OR Workbench"))
    expect(page_with_app.locator("h1")).to_have_text("HORIZON")

def test_queueing_module(page_with_app: Page):
    """Test the Queueing Networks module."""
    page = page_with_app

    # Fill inputs
    page.fill("#q-gamma", "10, 5")
    page.fill("#q-mu", "20, 15")
    page.fill("#q-p", "0, 0.5\n0, 0")

    # Click the solve button
    page.click("button:has-text('Solve Network')")

    # Wait for results to be populated (it's async, so wait for the text to not be the default)
    # The default text is "Results will appear here..."
    result_locator = page.locator("#queue-results")
    expect(result_locator).not_to_have_text("Results will appear here...")

    # Verify the results contain expected JSON
    result_text = result_locator.inner_text()
    result_text = result_text.replace("📋 Copy", "").replace("✅ Copied", "")
    data = json.loads(result_text)

    # Check if data contains nodes and expected calculations
    assert "nodes" in data
    assert "node_0" in data["nodes"]
    assert "node_1" in data["nodes"]

    # M/M/1 at Node 0 with lambda=10, mu=20
    assert data["nodes"]["node_0"]["lambda"] == 10

    # Verify a node rendered in the SVG
    expect(page.locator("#queue-graph svg")).to_be_visible()
    expect(page.locator("#queue-graph svg .node").first).to_be_visible()

def test_inventory_eoq(page_with_app: Page):
    """Test the EOQ part of the Inventory module."""
    page = page_with_app

    # Ensure EOQ inputs are visible (this is default, but just to be sure)
    expect(page.locator("#inv-eoq-inputs")).to_be_visible()

    # Fill inputs
    page.fill("#i-demand", "1000")
    page.fill("#i-order", "50")
    page.fill("#i-hold", "2")

    # Click Calculate EOQ
    page.click("button:has-text('Calculate EOQ')")

    result_locator = page.locator("#inventory-results")
    expect(result_locator).not_to_have_text("Results will appear here...")

    result_text = result_locator.inner_text()
    result_text = result_text.replace("📋 Copy", "").replace("✅ Copied", "")
    data = json.loads(result_text)

    assert "Q" in data
    assert abs(data["Q"] - 223.6) < 0.1

    # Verify chart canvas is visible
    expect(page.locator("#inventory-chart")).to_be_visible()

def test_inventory_continuous_review(page_with_app: Page):
    """Test the Continuous Review (R, Q) part of the Inventory module."""
    page = page_with_app

    # Toggle to (R, Q)
    page.evaluate("document.querySelector('.togglesw').click()")

    # Ensure Continous inputs are visible
    expect(page.locator("#inv-cont-inputs")).to_be_visible()

    # Fill inputs
    page.fill("#ic-demand", "1000")
    page.fill("#ic-order", "50")
    page.fill("#ic-hold", "2")
    page.fill("#ic-lt-mean", "5")
    page.fill("#ic-lt-std", "1.2")

    # Click Calculate (R, Q)
    page.click("button:has-text('Calculate (R, Q)')")

    result_locator = page.locator("#inventory-results")
    expect(result_locator).not_to_have_text("Results will appear here...")

    result_text = result_locator.inner_text()
    result_text = result_text.replace("📋 Copy", "").replace("✅ Copied", "")
    data = json.loads(result_text)

    assert "Q" in data
    assert "R" in data
    assert "safety_stock" in data

    # Verify chart canvas is visible
    expect(page.locator("#inventory-chart")).to_be_visible()

def test_routing_module(page_with_app: Page):
    """Test the Route Planning (TSP) module."""
    page = page_with_app

    # Fill inputs
    page.fill("#r-nodes", "A, B, C, D")
    page.fill("#r-edges", "A,B,10\nA,C,15\nA,D,20\nB,C,35\nB,D,25\nC,D,30")

    # Click Optimize Route
    page.click("button:has-text('Optimize Route')")

    result_locator = page.locator("#routing-results")
    expect(result_locator).not_to_have_text("Results will appear here...")

    result_text = result_locator.inner_text()
    result_text = result_text.replace("📋 Copy", "").replace("✅ Copied", "")
    data = json.loads(result_text)

    assert "path" in data
    assert len(data["path"]) > 0
    assert "total_distance" in data

    # Verify routing graph SVG is visible
    expect(page.locator("#routing-graph svg")).to_be_visible()
    expect(page.locator("#routing-graph svg .node").first).to_be_visible()
