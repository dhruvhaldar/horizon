import time
from horizon.routing import job_shop_cpm

jobs = {
    f"J{i}": {"duration": 1, "dependencies": [f"J{i-1}"] if i > 0 else []} for i in range(100)
}
start = time.perf_counter()
for _ in range(100):
    job_shop_cpm(jobs)
print(f"JobShop time: {time.perf_counter() - start:.4f}s")
