from playwright.sync_api import sync_playwright

def run_cuj(page):
    page.goto("http://localhost:8000")
    page.wait_for_timeout(500)

    # Trigger a successful queue solve first to render a chart
    page.get_by_role("button", name="Solve Network").click()
    page.wait_for_timeout(1000)

    # Induce an error: Make a capacity < 0
    page.locator("#q-mu").fill("-10, 15")
    page.wait_for_timeout(500)

    # Submit with error
    page.get_by_role("button", name="Solve Network").click()
    page.wait_for_timeout(1000)

    # Take screenshot at the final error state showing the cleared chart
    page.screenshot(path="/home/jules/verification/screenshots/verification.png")
    page.wait_for_timeout(1000)

if __name__ == "__main__":
    import os
    os.makedirs("/home/jules/verification/videos", exist_ok=True)
    os.makedirs("/home/jules/verification/screenshots", exist_ok=True)

    with sync_playwright() as p:
        browser = p.chromium.launch(headless=True)
        context = browser.new_context(
            record_video_dir="/home/jules/verification/videos"
        )
        page = context.new_page()
        try:
            run_cuj(page)
        finally:
            context.close()
            browser.close()
