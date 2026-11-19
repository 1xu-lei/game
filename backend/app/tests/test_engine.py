"""引擎测试：档位、确定性、联动、事件与解释的真实性（规格书 §9.1）。"""

from app.config.rain_types import RAIN_TYPES
from app.config.scenarios import SCENARIO_BY_ID, SCENARIO_ORDER
from app.engine.allocation import validate_allocation
from app.engine.flow import compute_water
from app.engine.simulation import simulate, stage_label

BALANCED = {"school": 1, "market": 1, "park": 1, "residential": 1, "station": 1}
SPECIALIST_STATION = {"school": 0, "market": 0, "park": 0, "residential": 0, "station": 5}
SPECIALIST_PARK = {"school": 0, "market": 0, "park": 5, "residential": 0, "station": 0}
DUAL = {"school": 0, "market": 0, "park": 3, "residential": 0, "station": 2}
ALL_ZERO = {"school": 0, "market": 0, "park": 0, "residential": 0, "station": 0}


def test_zero_allocation_is_rejected_but_scenarios_exist():
    # 0 点场景必须是合法档位，但总和 0 不满足「恰好 5 点」
    assert stage_label(0) == "无专项投入"
    assert validate_allocation(ALL_ZERO) != []
    assert validate_allocation(BALANCED) == []


def test_stage_labels_follow_points():
    expected = ["无专项投入", "初步介入", "稳定发展", "深度发展", "阶段突破", "极限专精"]
    assert [stage_label(points) for points in range(6)] == expected


def test_all_six_levels_run_and_reports_every_scene():
    for points in range(6):
        allocation = {scene_id: 0 for scene_id in SCENARIO_ORDER}
        allocation["park"] = points
        allocation["station"] = 5 - points
        result = simulate(allocation, "continuous")
        assert [item["sceneId"] for item in result["scenarioResults"]] == SCENARIO_ORDER
        zero_scene = [item for item in result["scenarioResults"] if item["invested"] == 0]
        assert all(item["stageLabel"] == "无专项投入" for item in zero_scene)


def test_score_range_and_grade():
    for allocation in (BALANCED, SPECIALIST_STATION, SPECIALIST_PARK, DUAL):
        for rain in RAIN_TYPES:
            result = simulate(allocation, rain["id"])
            assert 0 <= result["overallScore"] <= 100
            assert result["grade"] in {"S", "A", "B", "C", "D"}
            assert result["gradeLabel"]


def test_deterministic_same_input_same_output():
    first = simulate(BALANCED, "burst")
    second = simulate(BALANCED, "burst")
    assert first == second
    assert first["simulationId"] == second["simulationId"]


def test_two_rain_types_differ():
    continuous = simulate(DUAL, "continuous")
    burst = simulate(DUAL, "burst")
    assert continuous["overallScore"] != burst["overallScore"]
    assert continuous["riskMetrics"] != burst["riskMetrics"]


def test_synergy_triggers_and_absent():
    dual = simulate(DUAL, "continuous")
    assert {hit["id"] for hit in dual["triggeredSynergies"]} >= {"upstream_storage", "coordinated_drainage"}

    single = simulate(SPECIALIST_STATION, "continuous")
    assert single["triggeredSynergies"] == []

    balanced = simulate(BALANCED, "continuous")
    assert "balanced_all" in {hit["id"] for hit in balanced["triggeredSynergies"]}


def test_synergy_gain_is_positive_and_from_bonus_config():
    result = simulate(DUAL, "continuous")
    assert result["triggeredSynergies"]
    assert all(hit["gain"] > 0 for hit in result["triggeredSynergies"])


def test_events_are_generated_from_real_numbers():
    result = simulate(DUAL, "continuous")
    events = result["events"]
    assert {event["step"] for event in events} == {1, 2, 3, 4, 5, 6}
    assert [event["index"] for event in events] == list(range(1, len(events) + 1))

    station = next(event for event in events if event["step"] == 5)
    water = compute_water(DUAL, RAIN_TYPES[0])
    expected_inflow = int(round(water["station"].inflow * 100))
    assert str(expected_inflow) in station["text"]

    zero_scene_events = [
        event for event in events if event["step"] == 2 and event["sceneId"] == "school"
    ]
    assert zero_scene_events and "0 点" in zero_scene_events[0]["text"]


def test_explanations_reference_actual_values():
    result = simulate(SPECIALIST_PARK, "burst")
    explanations = result["explanations"]
    assert len(explanations) >= 2
    assert all(item["title"] and item["body"] and item["evidence"] for item in explanations)
    joined = " ".join(item["body"] for item in explanations)
    station_pressure = result["riskMetrics"]["stationPressure"]
    assert str(station_pressure) in joined


def test_recommendations_are_real_improvements():
    result = simulate(SPECIALIST_STATION, "continuous")
    for item in result["recommendations"]:
        trial = dict(SPECIALIST_STATION)
        source = item["text"].split("从")[1].split("挪")[0]
        target = SCENARIO_BY_ID[item["sceneId"]]["name"]
        assert source and target in item["text"]
        assert item["gain"] > 0
        assert trial[item["sceneId"]] == 0 or trial[item["sceneId"]] >= 0


def test_strategy_types_are_reachable():
    cases = {
        "专精型": SPECIALIST_STATION,
        "双核型": DUAL,
        "均衡型": BALANCED,
        "偏科型": {"school": 1, "market": 1, "park": 3, "residential": 0, "station": 0},
    }
    for expected, allocation in cases.items():
        assert simulate(allocation, "continuous")["strategyType"] == expected


def test_baseline_delta_is_zero_for_balanced():
    result = simulate(BALANCED, "continuous")
    assert all(item["deltaValue"] == 0 for item in result["scenarioResults"])
    assert all(item["deltaText"] == "与基准持平" for item in result["scenarioResults"])
