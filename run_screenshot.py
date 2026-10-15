from playwright.sync_api import sync_playwright
import subprocess
import time
import requests
import os

def capture_ui():
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

    for _ in range(60):
        try:
            if requests.get(f"{url}/api/health").status_code == 200:
                break
        except requests.ConnectionError:
            time.sleep(1)

    print(process.poll())
    if process.poll() is not None:
        print(process.stdout.read())
        print(process.stderr.read())

    try:
        with sync_playwright() as p:
            browser = p.chromium.launch()
            page = browser.new_page(viewport={"width": 1280, "height": 1024})
            page.goto(url)
            page.wait_for_selector("h1:has-text('HORIZON')")
            page.screenshot(path="full_page_start.png", full_page=True)

            # Focus an input
            page.focus("#q-gamma")
            page.screenshot(path="full_page_focus.png", full_page=True)

            browser.close()
    finally:
        process.terminate()
        process.wait()

capture_ui()
