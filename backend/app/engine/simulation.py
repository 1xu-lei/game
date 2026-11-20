"""推演编排：把 config 参数 + 引擎模块组装成完整结果（规格书 §4）。

纯计算：不 import fastapi / sqlalchemy，不含随机数、时间戳或顺序依赖。
同一输入必得同一输出（simulation_id 由输入内容哈希得到，也保持确定性）。
"""

import hashlib
import json

from app.config.rain_types import RAIN_TYPE_BY_ID
from app.config.scenarios import SCENARIO_BY_ID, SCENARIO_ORDER
from app.config.scoring import BUDGET_TOTAL, SCORING, STAGE_LABELS
from app.engine.allocation import round_half_up, validate_allocation
from app.engine.flow import clamp, compute_water
from app.engine.scoring import display_score, forecast, grade_of, raw_score, risk_metrics
from app.engine.strategy import classify_strategy
from app.engine.synergy import evaluate_synergies, total_bonus, unmet_rule_summary

STEP_LABELS = [
    "雨型输入",
    "场景防护",
    "上游调蓄",
    "下游汇流",
    "车站压力",
    "最终结算",
]


def simulation_id(allocation: dict, rain_type_id: str) -> str:
    """由输入内容哈希得到稳定 id：同输入必得同 id，便于断言确定性。"""
    payload = json.dumps(
        {"allocation": allocation, "rainType": rain_type_id, "rulesVersion": SCORING["rules_version"]},
        sort_keys=True,
        ensure_ascii=False,
    )
    digest = hashlib.sha1(payload.encode("utf-8")).hexdigest()[:10]
    return f"sim-{rain_type_id}-{digest}"


def stage_label(points: int) -> str:
    return STAGE_LABELS[max(0, min(len(STAGE_LABELS) - 1, points))]


def _core(allocation: dict, rain_type: dict) -> dict:
    """一次完整计算（供主结果与「一步优化建议」复用，避免两套算法）。"""
    water = compute_water(allocation, rain_type)
    hits = evaluate_synergies(allocation)
    bonus = total_bonus(hits)
    raw = raw_score(water, rain_type, bonus)
    score = display_score(raw)
    return {
        "water": water,
        "hits": hits,
        "bonus": bonus,
        "raw": raw,
        "score": score,
        "risks": risk_metrics(water),
    }


def _baseline_core(rain_type: dict) -> dict:
    return _core(SCORING["baseline_allocation"], rain_type)


def _tone_by_ratio(ratio: float) -> str:
    if ratio >= 0.95:
        return "bad"
    if ratio >= 0.7:
        return "warn"
    if ratio <= 0.35:
        return "good"
    return "info"


def _build_events(allocation: dict, rain_type: dict, core: dict) -> list:
    """事件全部由实际计算的数值与联动结果生成，禁止模板化假事件。"""
    water = core["water"]
    events = []

    def add(step: int, text: str, tone: str, scene_id: str | None = None) -> None:
        events.append(
            {
                "index": len(events) + 1,
                "step": step,
                "stepLabel": STEP_LABELS[step - 1],
                "sceneId": scene_id,
                "text": text,
                "tone": tone,
            }
        )

    weights = rain_type["weights"]
    add(
        1,
        f"载入「{rain_type['name']}」，总量权重 {int(round_half_up(weights['volume'] * 100, 0))}%、"
        f"峰值权重 {int(round_half_up(weights['peak'] * 100, 0))}%",
        "info",
    )

    for scene_id in SCENARIO_ORDER:
        site = water[scene_id]
        name = SCENARIO_BY_ID[scene_id]["name"]
        points = allocation[scene_id]
        coverage = int(round_half_up(site.defense * 100, 0))
        if points == 0:
            add(2, f"{name}投入 0 点（无专项投入），本地防护 {coverage}", "warn", scene_id)
        else:
            add(
                2,
                f"{name}投入 {points} 点，本地防护 {coverage}（{stage_label(points)}）",
                "good" if coverage >= 50 else "info",
                scene_id,
            )

    school = water["school"]
    park = water["park"]
    market = water["market"]
    residential = water["residential"]
    station = water["station"]
    add(
        3,
        f"校园残余径流 {int(round_half_up(school.residual * 100, 0))} 经输送后 "
        f"{int(round_half_up(park.inflow * 100, 0))} 进入公园调蓄",
        _tone_by_ratio(park.ratio),
        "park",
    )
    add(
        4,
        f"集市残余径流 {int(round_half_up(market.residual * 100, 0))} 经输送后 "
        f"{int(round_half_up(residential.inflow * 100, 0))} 压向居民区",
        _tone_by_ratio(residential.ratio),
        "residential",
    )
    add(
        5,
        f"两路汇流抵达车站，合计来水 {int(round_half_up(station.inflow * 100, 0))}，"
        f"站内压力比 {round_half_up(station.ratio, 2)}",
        _tone_by_ratio(station.ratio),
        "station",
    )

    hits = core["hits"]
    if hits:
        names = "、".join(hit.name for hit in hits)
        add(6, f"触发 {len(hits)} 条联动：{names}，协同加成 {round_half_up(core['bonus'], 1)}", "good")
    else:
        add(6, "本轮没有触发任何场景联动，资源分布在单个场景上", "info")
    grade, grade_label = grade_of(core["score"])
    add(6, f"最终评分 {core['score']}（{grade} · {grade_label}）", "info")

    return events


def _build_explanations(allocation: dict, rain_type: dict, core: dict) -> list:
    """解释全部来自实际数值与未触发规则，至少 2 条。"""
    water = core["water"]
    explanations = []

    weakest = min(SCENARIO_ORDER, key=lambda scene_id: (water[scene_id].safety, scene_id))
    weakest_site = water[weakest]
    explanations.append(
        {
            "title": f"{SCENARIO_BY_ID[weakest]['name']}是当前最薄弱环节",
            "body": (
                f"{SCENARIO_BY_ID[weakest]['name']}投入 {allocation[weakest]} 点"
                f"（{stage_label(allocation[weakest])}），本地防护 "
                f"{int(round_half_up(weakest_site.defense * 100, 0))}，"
                f"另有 {int(round_half_up(weakest_site.inflow * 100, 0))} 的上游来水压在这里。"
            ),
            "evidence": (
                f"effective={int(round_half_up(weakest_site.safety, 0))} · "
                f"load={round_half_up(weakest_site.load, 2)} · "
                f"inflow={int(round_half_up(weakest_site.inflow * 100, 0))}"
            ),
        }
    )

    station = water["station"]
    explanations.append(
        {
            "title": f"车站排水压力 {core['risks']['stationPressure']}",
            "body": (
                f"公园与居民区两路下泄合计 {int(round_half_up(station.inflow * 100, 0))} 汇入车站，"
                f"车站自身负荷 {int(round_half_up(station.load * 100, 0))}、"
                f"防护 {int(round_half_up(station.defense * 100, 0))}，"
                f"压力比 {round_half_up(station.ratio, 2)} 直接体现为低洼积水风险。"
            ),
            "evidence": (
                f"stationPressure={core['risks']['stationPressure']} · "
                f"drainageLoad={core['risks']['drainageLoad']} · "
                f"inflow={int(round_half_up(station.inflow * 100, 0))}"
            ),
        }
    )

    hits = core["hits"]
    if hits:
        explanations.append(
            {
                "title": f"触发 {len(hits)} 条联动",
                "body": "、".join(f"{hit.name}（+{round_half_up(hit.bonus, 1)}）" for hit in hits)
                + "：满足阈值后额外获得协同收益。",
                "evidence": "bonus_total=" + str(round_half_up(core["bonus"], 1)),
            }
        )
    else:
        unmet = unmet_rule_summary(allocation)
        explanations.append(
            {
                "title": "没有触发联动的具体原因",
                "body": "；".join(f"{item['name']}：{item['gap']}" for item in unmet) or "本轮无联动规则",
                "evidence": "synergies=" + str(len(hits)),
            }
        )

    best = max(SCENARIO_ORDER, key=lambda scene_id: (water[scene_id].safety, scene_id))
    if allocation[best] > 0:
        explanations.append(
            {
                "title": f"{SCENARIO_BY_ID[best]['name']}获得最多回报",
                "body": (
                    f"在「{rain_type['name']}」下，{SCENARIO_BY_ID[best]['name']}净安全度 "
                    f"{int(round_half_up(water[best].safety, 0))}，"
                    f"是本次 {BUDGET_TOTAL} 点配置里收益最集中的一处。"
                ),
                "evidence": f"effective={int(round_half_up(water[best].safety, 0))}",
            }
        )

    return explanations


def _build_recommendations(allocation: dict, rain_type: dict, core: dict) -> list:
    """真实重算「挪动 1 点」的收益，不编造建议。"""
    candidates = []
    for from_scene in SCENARIO_ORDER:
        if allocation[from_scene] <= 0:
            continue
        for to_scene in SCENARIO_ORDER:
            if from_scene == to_scene:
                continue
            trial = dict(allocation)
            trial[from_scene] -= 1
            trial[to_scene] += 1
            gain = round_half_up(_core(trial, rain_type)["score"] - core["score"], 1)
            if gain <= 0:
                continue
            candidates.append(
                {
                    "sceneId": to_scene,
                    "text": (
                        f"从{SCENARIO_BY_ID[from_scene]['name']}挪 1 点给"
                        f"{SCENARIO_BY_ID[to_scene]['name']}"
                        f"（{allocation[from_scene]}/{allocation[to_scene]}"
                        f" → {trial[from_scene]}/{trial[to_scene]}）"
                    ),
                    "gain": gain,
                }
            )

    candidates.sort(key=lambda item: (-item["gain"], SCENARIO_ORDER.index(item["sceneId"])))
    return candidates[:3]


def _scenario_results(allocation: dict, rain_type: dict, water: dict, baseline: dict) -> list:
    convey_loss = rain_type["convey_loss"]
    results = []
    for scene_id in SCENARIO_ORDER:
        site = water[scene_id]
        config = SCENARIO_BY_ID[scene_id]
        transfer = config["transfer"]
        delta_value = round_half_up(site.safety - baseline[scene_id].safety, 1)
        if delta_value > 0:
            delta_text = f"比基准高 {round_half_up(delta_value, 1)}"
        elif delta_value < 0:
            delta_text = f"比基准低 {round_half_up(abs(delta_value), 1)}"
        else:
            delta_text = "与基准持平"
        results.append(
            {
                "sceneId": scene_id,
                "sceneName": config["name"],
                "invested": allocation[scene_id],
                "stageLabel": stage_label(allocation[scene_id]),
                "coverage": int(round_half_up(site.defense * 100, 0)),
                "effective": int(round_half_up(site.safety, 0)),
                "inflow": int(round_half_up(site.inflow * 100, 0)),
                "outflow": int(round_half_up(site.residual * transfer * convey_loss * 100, 0)),
                "deltaValue": delta_value,
                "deltaText": delta_text,
            }
        )
    return results


def simulate(allocation: dict, rain_type_id: str) -> dict:
    """执行一次完整推演。分配非法时抛 ValueError（由 service 层转 4xx）。"""
    errors = validate_allocation(allocation)
    if errors:
        raise ValueError("；".join(errors))
    if rain_type_id not in RAIN_TYPE_BY_ID:
        raise ValueError(f"未知雨型：{rain_type_id}")

    rain_type = RAIN_TYPE_BY_ID[rain_type_id]
    core = _core(allocation, rain_type)
    baseline = _baseline_core(rain_type)
    grade, grade_label = grade_of(core["score"])
    risks = core["risks"]

    return {
        "simulationId": simulation_id(allocation, rain_type_id),
        "rainType": rain_type_id,
        "allocation": {scene_id: allocation[scene_id] for scene_id in SCENARIO_ORDER},
        "overallScore": core["score"],
        "grade": grade,
        "gradeLabel": grade_label,
        "strategyType": classify_strategy(allocation),
        "scenarioResults": _scenario_results(allocation, rain_type, core["water"], baseline["water"]),
        "riskMetrics": risks,
        "triggeredSynergies": [
            {
                "id": hit.id,
                "name": hit.name,
                "detail": hit.detail,
                "gain": round_half_up(
                    display_score(core["raw"]) - display_score(core["raw"] - hit.bonus), 1
                ),
            }
            for hit in core["hits"]
        ],
        "forecast": forecast(rain_type, risks["waterlogRisk"], risks["lossRisk"]),
        "events": _build_events(allocation, rain_type, core),
        "explanations": _build_explanations(allocation, rain_type, core),
        "recommendations": _build_recommendations(allocation, rain_type, core),
        "rulesVersion": SCORING["rules_version"],
        "isValid": True,
        "validationMessage": None,
    }


def score_only(allocation: dict, rain_type_id: str) -> float:
    """枚举采样用的轻量入口（同一引擎，不重复实现规则）。"""
    return _core(allocation, RAIN_TYPE_BY_ID[rain_type_id])["score"]


def clamp_score(value: float) -> float:
    return clamp(value, SCORING["score_min"], SCORING["score_max"])
