import pytest
import subprocess
import time
import requests
import os
import signal

@pytest.fixture(scope="session")
def server_url():
    """Starts the FastAPI server as a background process and yields its URL."""
    # Find an open port or use a default
    port = 8000
    host = "127.0.0.1"
    url = f"http://{host}:{port}"

    # We need to set PYTHONPATH so uvicorn can find the horizon module
    env = os.environ.copy()
    env["PYTHONPATH"] = os.path.abspath(os.path.join(os.path.dirname(__file__), ".."))

    # Start the server
    process = subprocess.Popen(
        ["uvicorn", "api.index:app", "--host", host, "--port", str(port)],
        env=env,
        stdout=subprocess.PIPE,
        stderr=subprocess.PIPE,
        text=True
    )

    # Wait for the server to be ready
    max_retries = 30
    for _ in range(max_retries):
        try:
            response = requests.get(f"{url}/api/health")
            if response.status_code == 200:
                break
        except requests.ConnectionError:
            time.sleep(0.5)
    else:
        # If it didn't start in time, kill the process and raise an error
        process.send_signal(signal.SIGTERM)
        process.wait()
        raise RuntimeError("FastAPI server failed to start")

    yield url

    # Teardown: kill the server
    process.send_signal(signal.SIGTERM)
    process.wait()

@pytest.fixture
def page_with_app(page, server_url):
    """Navigates to the app index page before returning the page."""
    page.goto(server_url)
    page.wait_for_selector("h1:has-text('HORIZON')")
    return page
