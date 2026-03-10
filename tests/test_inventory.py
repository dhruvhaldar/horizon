import pytest
from horizon.inventory import eoq, newsvendor, continuous_review

def test_eoq():
    res = eoq(demand_rate=1000, order_cost=50, holding_cost=2)
    assert res['Q'] == pytest.approx(223.60679774997897)
    assert res['total_cost'] == pytest.approx(447.21359549995793)

def test_newsvendor():
    res = newsvendor(selling_price=100, cost=60, salvage_value=20, demand_mean=500, demand_std=50)
    # cu = 40, co = 40 => cr = 0.5
    assert res['critical_ratio'] == pytest.approx(0.5)
    assert res['Q'] == pytest.approx(500)

def test_continuous_review():
    res = continuous_review(demand_rate=1000, order_cost=50, holding_cost=2, lead_time_mean=5, lead_time_std=1.2, service_level=0.95)
    assert res['Q'] == pytest.approx(223.60679774997897)
    # z for 0.95 ~ 1.64485
    # ss = 1.64485 * 1.2 ~ 1.9738
    # R = 5 + 1.9738 = 6.9738
    assert res['R'] == pytest.approx(6.9738, abs=0.01)
