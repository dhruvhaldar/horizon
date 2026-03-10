from playwright.sync_api import sync_playwright

def verify_frontend():
    with sync_playwright() as p:
        browser = p.chromium.launch(headless=True)
        page = browser.new_page()

        # We need to serve the static files somehow, or open via file://
        # Let's start a quick python http server for the public folder on another port.
        import subprocess
        import time
        server = subprocess.Popen(["python3", "-m", "http.server", "8001", "--directory", "public"])
        time.sleep(2) # wait for server to start

        try:
            page.goto("http://localhost:8001")

            # Wait for some elements to be visible
            page.wait_for_selector("h1:has-text('Horizon Command Center')")

            # Since the API is on 8000 and the frontend is just calling /api, it might fail unless we mock or the proxy is set up.
            # In index.html, API_BASE = '/api' which means it'll try to hit localhost:8001/api, which 404s.
            # But we just want to verify the UI layout for now. Let's take a screenshot.

            page.screenshot(path="verification.png", full_page=True)
            print("Screenshot saved to verification.png")

        finally:
            server.terminate()
            browser.close()

if __name__ == "__main__":
    verify_frontend()
