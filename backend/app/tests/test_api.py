"""API 测试：健康检查、配置、推演运行、非法输入拒绝、结果查询（规格书 §9.1）。"""

BALANCED = {"school": 1, "market": 1, "park": 1, "residential": 1, "station": 1}
SPECIALIST = {"school": 0, "market": 0, "park": 0, "residential": 0, "station": 5}


def test_health(client):
    response = client.get("/api/health")
    assert response.status_code == 200
    body = response.json()
    assert body["status"] == "ok"
    assert body["rulesVersion"]


def test_scenario_config_has_five_independent_curves(client):
    response = client.get("/api/config/scenarios")
    assert response.status_code == 200
    scenarios = response.json()
    assert [item["id"] for item in scenarios] == [
        "school",
        "market",
        "park",
        "residential",
        "station",
    ]
    curves = [tuple(item["yieldCurve"]) for item in scenarios]
    assert all(len(curve) == 6 for curve in curves)
    # 五条曲线必须互不相同（禁止五个场景共用一条曲线）
    assert len(set(curves)) == 5


def test_rain_type_config(client):
    response = client.get("/api/config/rain-types")
    assert response.status_code == 200
    rains = response.json()
    assert {item["id"] for item in rains} == {"continuous", "burst"}
    for item in rains:
        assert abs(sum(item["weights"].values()) - 1.0) < 1e-9


def test_run_simulation_returns_full_contract(client):
    response = client.post("/api/simulations/run", json={"rainType": "continuous", "allocation": BALANCED})
    assert response.status_code == 200
    body = response.json()
    for field in (
        "simulationId",
        "overallScore",
        "scenarioResults",
        "riskMetrics",
        "triggeredSynergies",
        "strategyType",
        "events",
        "explanations",
        "recommendations",
        "forecast",
        "rulesVersion",
    ):
        assert field in body
    assert len(body["scenarioResults"]) == 5
    assert len(body["forecast"]) == 6
    assert len(body["explanations"]) >= 2


def test_run_specialist_and_balanced_are_allowed(client):
    for allocation in (SPECIALIST, BALANCED):
        response = client.post(
            "/api/simulations/run", json={"rainType": "burst", "allocation": allocation}
        )
        assert response.status_code == 200


def test_sum_not_five_is_rejected(client):
    response = client.post(
        "/api/simulations/run",
        json={"rainType": "continuous", "allocation": {"school": 1, "market": 1, "park": 1, "residential": 1, "station": 0}},
    )
    assert response.status_code == 422
    assert "总和" in str(response.json()["detail"])

    response = client.post(
        "/api/simulations/run",
        json={"rainType": "continuous", "allocation": {"school": 2, "market": 1, "park": 1, "residential": 1, "station": 1}},
    )
    assert response.status_code == 422


def test_out_of_range_and_missing_fields_are_rejected(client):
    response = client.post(
        "/api/simulations/run",
        json={"rainType": "continuous", "allocation": {"school": 6, "market": 0, "park": 0, "residential": 0, "station": -1}},
    )
    assert response.status_code == 422

    response = client.post(
        "/api/simulations/run", json={"rainType": "continuous", "allocation": {"school": 5}}
    )
    assert response.status_code == 422

    response = client.post(
        "/api/simulations/run",
        json={"rainType": "unknown", "allocation": BALANCED},
    )
    assert response.status_code == 422


def test_get_simulation_by_id_and_404(client):
    created = client.post(
        "/api/simulations/run", json={"rainType": "burst", "allocation": SPECIALIST}
    ).json()
    got = client.get(f"/api/simulations/{created['simulationId']}")
    assert got.status_code == 200
    assert got.json()["overallScore"] == created["overallScore"]

    missing = client.get("/api/simulations/sim-does-not-exist")
    assert missing.status_code == 404


def test_repeated_calls_are_identical(client):
    first = client.post("/api/simulations/run", json={"rainType": "continuous", "allocation": BALANCED}).json()
    second = client.post("/api/simulations/run", json={"rainType": "continuous", "allocation": BALANCED}).json()
    assert first == second
