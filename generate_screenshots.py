from playwright.sync_api import sync_playwright
import subprocess
import time
import requests
import os

def generate_screenshots():
    # Start the server
    port = 8000
    host = "127.0.0.1"
    url = f"http://{host}:{port}"

    env = os.environ.copy()
    env["PYTHONPATH"] = os.path.abspath(os.path.join(os.path.dirname(__file__), "."))

    process = subprocess.Popen(
        ["uvicorn", "api.index:app", "--host", host, "--port", str(port)],
        env=env,
        stdout=subprocess.PIPE,
        stderr=subprocess.PIPE,
        text=True
    )

    # Wait for the server
    for _ in range(30):
        try:
            if requests.get(f"{url}/api/health").status_code == 200:
                break
        except requests.ConnectionError:
            time.sleep(0.5)

    try:
        with sync_playwright() as p:
            browser = p.chromium.launch()
            page = browser.new_page(viewport={"width": 1280, "height": 1024})
            page.goto(url)
            page.wait_for_selector("h1:has-text('HORIZON')")

            # Queueing
            page.fill("#q-gamma", "10, 5")
            page.fill("#q-mu", "20, 15")
            page.fill("#q-p", "0, 0.5\n0, 0")
            page.click("button:has-text('Solve Network')")
            page.locator("#queue-results").wait_for(state="visible")
            time.sleep(1) # wait for animation
            page.locator("#queueing-module").screenshot(path="assets/queueing_network.png")

            # Inventory EOQ
            page.fill("#i-demand", "1000")
            page.fill("#i-order", "50")
            page.fill("#i-hold", "2")
            page.click("button:has-text('Calculate EOQ')")
            page.locator("#inventory-results").wait_for(state="visible")
            time.sleep(1)
            page.locator("#inventory-module").screenshot(path="assets/inventory_eoq.png")

            # Routing TSP
            page.fill("#r-nodes", "A, B, C, D")
            page.fill("#r-edges", "A,B,10\nA,C,15\nA,D,20\nB,C,35\nB,D,25\nC,D,30")
            page.click("button:has-text('Optimize Route')")
            page.locator("#routing-results").wait_for(state="visible")
            time.sleep(1)
            page.locator("#routing-module").screenshot(path="assets/routing_tsp.png")

            browser.close()
    finally:
        process.terminate()
        process.wait()

if __name__ == "__main__":
    generate_screenshots()
