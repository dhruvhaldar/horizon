from fastapi.testclient import TestClient
from api.index import app

client = TestClient(app)

def test_cl_invalid():
    # If we pass an invalid content-length header, it might cause 500
    response = client.post(
        "/api/queue",
        headers={"Content-Length": "abc"},
        json={"gamma": [1], "p": [[0]], "mu": [2]}
    )
    assert response.status_code == 400
    assert response.json()["detail"] == "Invalid Content-Length header."
