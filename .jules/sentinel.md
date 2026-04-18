## 2024-05-26 - Unhandled NaN/Infinity in Pydantic v2
**Vulnerability:** Pydantic v2 float fields accept "NaN" and "Infinity" string representations by default. This causes unhandled `ValueError` exceptions during FastAPI's `json.dumps()` serialization, exposing 500 Internal Server Errors (and potential stack traces if debug is on) and creating a potential Denial of Service vector.
**Learning:** This existed because Pydantic prioritizes loose coercion for standard types unless explicitly constrained, and the application did not validate that input floats were standard finite numbers.
**Prevention:** Always set `model_config = {"allow_inf_nan": False}` on Pydantic BaseModels handling numerical data from untrusted API requests to fail securely with a 422 Unprocessable Entity.
## 2026-04-18 - Missing Security Headers Mitigation
**Vulnerability:** The FastAPI application was missing standard HTTP security headers globally.
**Learning:** FastAPI does not include standard web security headers out-of-the-box. Without them, applications are more vulnerable to clickjacking, MIME-sniffing, and MITM attacks.
**Prevention:** Always implement a global HTTP middleware (`@app.middleware("http")`) early in the project to inject `X-Content-Type-Options`, `X-Frame-Options`, `Strict-Transport-Security`, and `Referrer-Policy`.
