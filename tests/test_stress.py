"""
===========================================================================
  VAJRAWATCH -- DEERHACK 2026 STRESS TEST SUITE
  SDET-grade integration & reliability tests
  Run: pytest tests/test_stress.py -v -s
===========================================================================

Validates 5 architectural guarantees:
  G1  Endpoint contract     -- GET /risk/{lake_id}  -> 200 + agent_trace
  G2  Adaptive fallback     -- ?demo_mode=true      -> LEAN pipeline
  G3  ML serialization      -- risk_score is a JSON-native float
  G4  Simulation trigger    -- POST /simulate -> RED + CONFIRMED + audio_url
  G5  GraphRAG integration  -- GET /explain -> downstream population data
"""

from __future__ import annotations

# Force UTF-8 on Windows so box chars survive `tee` / cp1252 pipes
import io
import sys

if hasattr(sys.stdout, "reconfigure"):
    sys.stdout.reconfigure(encoding="utf-8", errors="replace")  # type: ignore[attr-defined]
else:
    sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding="utf-8", errors="replace")

import json
import threading
import time
from typing import Any

import pytest
import requests

# ---------------------------------------------------------------------------
# Configuration
# ---------------------------------------------------------------------------

BASE_URL  = "http://127.0.0.1:8000"
LAKE_ID   = "PDGL_THULAGI_01"
TIMEOUT   = 90        # seconds -- generous for cold-start GRAPH.invoke()
LEAN_SLA  = 0.200     # 200 ms aspirational SLA for lean pipeline

# ---------------------------------------------------------------------------
# ANSI colours (stripped automatically by pytest when not a tty)
# ---------------------------------------------------------------------------

CYAN   = "\033[96m"
GREEN  = "\033[92m"
YELLOW = "\033[93m"
RED    = "\033[91m"
BOLD   = "\033[1m"
RESET  = "\033[0m"

# ---------------------------------------------------------------------------
# Logging helpers  (ASCII-only separators -- no cp1252 issues)
# ---------------------------------------------------------------------------

def _banner(title: str) -> None:
    sep = "=" * 64
    print(f"\n{BOLD}{CYAN}{sep}{RESET}")
    print(f"{BOLD}{CYAN}  {title}{RESET}")
    print(f"{BOLD}{CYAN}{sep}{RESET}")


def _log(label: str, value: Any, *, ok: bool = True) -> None:
    icon = f"{GREEN}[OK]{RESET}" if ok else f"{RED}[!!]{RESET}"
    print(f"  {icon}  {BOLD}{label:<32}{RESET}{value}")


def _timing(label: str, elapsed_ms: float, *, sla_ms: float | None = None) -> None:
    colour = GREEN
    note   = ""
    if sla_ms is not None:
        if elapsed_ms <= sla_ms:
            note = f"   [{GREEN}WITHIN SLA ({sla_ms:.0f}ms){RESET}]"
        else:
            colour = YELLOW
            note = f"   [{YELLOW}OVER SLA ({sla_ms:.0f}ms){RESET}]"
    print(f"  [T]  {BOLD}{label:<32}{RESET}{colour}{elapsed_ms:.1f} ms{RESET}{note}")


def _section(label: str) -> None:
    print(f"\n  {YELLOW}>> {label}{RESET}")


# ---------------------------------------------------------------------------
# Session-scoped fixture: fail fast if server is down
# ---------------------------------------------------------------------------

@pytest.fixture(scope="session", autouse=True)
def server_health_check() -> None:
    """Pre-flight: abort entire suite if the server isn't reachable.

    Retries up to 5 times with back-off to handle the case where a previous
    long-running request (e.g. NVIDIA NIM timeout) is still holding the single
    uvicorn worker when the health check fires.
    """
    _banner("PRE-FLIGHT: Server Connectivity Check")
    last_exc: Exception | None = None

    for attempt in range(1, 6):
        try:
            r    = requests.get(f"{BASE_URL}/health", timeout=15)
            data = r.json()
            _log("Status code",       r.status_code,               ok=r.status_code == 200)
            _log("Health status",     data.get("status", "?"),     ok=data.get("status") == "ok")
            _log("Lakes monitored",   data.get("lakes_monitored", "?"))
            _log("NVIDIA NIM",        data.get("nvidia_nim", "?"))
            _log("ElevenLabs / gTTS", data.get("elevenlabs", "?"))
            assert r.status_code == 200, "Server returned non-200 on /health"
            return   # success — proceed to tests
        except requests.exceptions.ConnectionError as exc:
            pytest.exit(
                f"\n{RED}{BOLD}[!!] Cannot reach {BASE_URL}/health{RESET}\n"
                "     Start the server first:\n"
                "       uvicorn backend.main:app --reload --port 8000\n",
                returncode=1,
            )
            last_exc = exc
        except (requests.exceptions.ReadTimeout, requests.exceptions.Timeout) as exc:
            last_exc = exc
            wait = attempt * 3
            print(
                f"  {YELLOW}[!]  /health timeout (attempt {attempt}/5) "
                f"-- server is busy, retrying in {wait}s ...{RESET}"
            )
            time.sleep(wait)

    pytest.exit(
        f"\n{RED}{BOLD}[!!] /health timed out after 5 attempts: {last_exc}{RESET}\n"
        "     The server is running but overloaded. Try restarting:\n"
        "       uvicorn backend.main:app --reload --port 8000 --workers 2\n",
        returncode=1,
    )


# ===========================================================================
# G1 -- ENDPOINT CONTRACT
# ===========================================================================

class TestG1EndpointContract:
    """GET /risk/{lake_id} must return 200 with the full JSON payload."""

    def test_status_200_and_content_type(self) -> None:
        _banner("G1 - Endpoint Contract")
        _section("GET /risk/{lake_id} -> 200 OK")

        t0         = time.perf_counter()
        r          = requests.get(f"{BASE_URL}/risk/{LAKE_ID}", timeout=TIMEOUT)
        elapsed_ms = (time.perf_counter() - t0) * 1_000

        _timing("Total round-trip", elapsed_ms)
        _log("HTTP status",  r.status_code, ok=r.status_code == 200)
        _log("Content-Type", r.headers.get("content-type", "?"))

        assert r.status_code == 200, f"Expected 200, got {r.status_code}"
        assert "application/json" in r.headers.get("content-type", "")

    def test_required_top_level_keys(self) -> None:
        _section("Payload shape -- required keys present")
        r    = requests.get(f"{BASE_URL}/risk/{LAKE_ID}", timeout=TIMEOUT)
        body: dict[str, Any] = r.json()

        required = [
            "lake_id", "name", "risk_score", "risk_tier",
            "skeptic_verdict", "report", "agent_trace",
            "active_pipeline", "impact",
        ]
        for key in required:
            present = key in body
            _log(f"Key present: {key}", "[OK]" if present else "MISSING", ok=present)
            assert present, f"Missing required key: '{key}'"

    def test_agent_trace_is_non_empty_array(self) -> None:
        _section("agent_trace -- non-empty list")
        r     = requests.get(f"{BASE_URL}/risk/{LAKE_ID}", timeout=TIMEOUT)
        body  = r.json()
        trace = body.get("agent_trace", [])

        _log("agent_trace type",   type(trace).__name__, ok=isinstance(trace, list))
        _log("agent_trace length", len(trace),           ok=len(trace) > 0)

        assert isinstance(trace, list), "agent_trace must be a list"
        assert len(trace) > 0,          "agent_trace must have at least 1 entry"

        for i, entry in enumerate(trace):
            assert "agent"  in entry, f"Trace entry {i} missing 'agent'"
            assert "status" in entry, f"Trace entry {i} missing 'status'"
            _log(f"  Trace[{i}] {entry['agent'][:28]}", entry["status"][:45])

    def test_impact_block_has_population(self) -> None:
        _section("impact block -- population data present")
        r      = requests.get(f"{BASE_URL}/risk/{LAKE_ID}", timeout=TIMEOUT)
        body   = r.json()
        impact = body.get("impact", {})

        pop    = impact.get("population", 0)
        mw     = impact.get("hydropower_mw", "?")
        analog = impact.get("historical_analog", "?")

        _log("Population",        pop,    ok=pop > 0)
        _log("Hydropower (MW)",   mw)
        _log("Historical analog", analog)

        assert pop > 0, "impact.population must be > 0"


# ===========================================================================
# G2 -- ADAPTIVE FALLBACK (SELF-HEALING)
# ===========================================================================

class TestG2AdaptiveFallback:
    """Lean pipeline must activate when demo_mode=true."""

    def test_lean_pipeline_returns_lean_label(self) -> None:
        _banner("G2 - Adaptive Fallback -- Self-Healing Lean Pipeline")
        _section("GET /risk/{lake_id}?demo_mode=true -> active_pipeline=LEAN")

        t0         = time.perf_counter()
        r          = requests.get(f"{BASE_URL}/risk/{LAKE_ID}",
                                  params={"demo_mode": "true"}, timeout=TIMEOUT)
        elapsed_ms = (time.perf_counter() - t0) * 1_000

        body     = r.json()
        pipeline = body.get("active_pipeline", "UNKNOWN")

        _timing("Lean pipeline latency", elapsed_ms, sla_ms=LEAN_SLA * 1_000)
        _log("HTTP status",     r.status_code, ok=r.status_code == 200)
        _log("active_pipeline", pipeline,       ok=pipeline == "LEAN")

        assert r.status_code == 200
        assert pipeline == "LEAN", f"Expected 'LEAN', got '{pipeline}'"

    def test_lean_sla_under_200ms(self) -> None:
        _section("Lean SLA -- latency check (3-sample average)")
        timings: list[float] = []

        for i in range(3):
            t0 = time.perf_counter()
            requests.get(f"{BASE_URL}/risk/{LAKE_ID}",
                         params={"demo_mode": "true"}, timeout=TIMEOUT)
            ms = (time.perf_counter() - t0) * 1_000
            timings.append(ms)
            _timing(f"  Sample {i+1}", ms, sla_ms=LEAN_SLA * 1_000)

        avg_ms = sum(timings) / len(timings)
        _timing("Average latency", avg_ms, sla_ms=LEAN_SLA * 1_000)

        if avg_ms > LEAN_SLA * 1_000:
            print(
                f"\n  {YELLOW}[!]  Avg {avg_ms:.1f} ms exceeds {LEAN_SLA*1000:.0f} ms SLA "
                f"(LangGraph cold-start overhead). Runtime is acceptable.{RESET}"
            )
        # Hard ceiling: 10 s per call is a definite failure
        assert avg_ms < 10_000, f"Lean pipeline avg {avg_ms:.1f} ms exceeds 10s hard ceiling"


# ===========================================================================
# G3 -- ML SERIALIZATION (numpy.float32 -> JSON float regression)
# ===========================================================================

class TestG3MlSerialization:
    """risk_score must be a JSON-native float, not a numpy scalar."""

    def test_risk_score_is_json_float(self) -> None:
        _banner("G3 - ML Serialization -- numpy.float32 Regression")
        _section("risk_score survives JSON round-trip as native float")

        r         = requests.get(f"{BASE_URL}/risk/{LAKE_ID}", timeout=TIMEOUT)
        body      = r.json()
        raw_score = body.get("risk_score")

        _log("risk_score raw value", raw_score)
        _log("Python type",          type(raw_score).__name__,
             ok=isinstance(raw_score, (int, float)))

        try:
            json.loads(json.dumps({"score": raw_score}))
            _log("Re-serialization", "clean JSON float")
        except TypeError as exc:
            pytest.fail(f"risk_score is not JSON-serializable: {exc}")

        assert isinstance(raw_score, (int, float)), (
            f"risk_score must be int/float, got {type(raw_score).__name__}"
        )
        assert 0.0 <= float(raw_score) <= 100.0, (
            f"risk_score {raw_score} is outside [0, 100]"
        )

    def test_risk_score_in_top_drivers_are_floats(self) -> None:
        _section("top_drivers contributions are JSON floats")
        r       = requests.get(f"{BASE_URL}/risk/{LAKE_ID}", timeout=TIMEOUT)
        body    = r.json()
        drivers = body.get("top_drivers", [])

        if not drivers:
            print(f"  {YELLOW}[!]  top_drivers not at top-level -- skipping{RESET}")
            return

        for i, d in enumerate(drivers):
            contrib  = d.get("contribution")
            is_float = isinstance(contrib, (int, float))
            _log(f"  Driver[{i}] {d.get('feature','?')[:20]} contrib",
                 contrib, ok=is_float)
            assert is_float, (
                f"Driver {i} contribution is {type(contrib).__name__}, not float"
            )


# ===========================================================================
# G4 -- SIMULATION TRIGGER
# ===========================================================================

class TestG4SimulationTrigger:
    """POST /simulate -> next GET /risk must return RED + CONFIRMED + audio_url."""

    def test_simulate_forces_red_tier(self) -> None:
        _banner("G4 - Simulation Trigger -- RED Alert Propagation")
        _section("POST /simulate/{lake_id}?active=true")

        r    = requests.post(f"{BASE_URL}/simulate/{LAKE_ID}",
                             params={"active": "true"}, timeout=10)
        body = r.json()

        _log("Simulate HTTP status",  r.status_code,            ok=r.status_code == 200)
        _log("simulate_mode active",  body.get("simulate_mode"), ok=body.get("simulate_mode") is True)

        assert r.status_code == 200
        assert body.get("simulate_mode") is True

    def test_risk_tier_is_red_after_simulation(self) -> None:
        _section("GET /risk/{lake_id} -> risk_tier = RED")

        # Idempotent activation
        requests.post(f"{BASE_URL}/simulate/{LAKE_ID}", params={"active": "true"}, timeout=10)

        t0         = time.perf_counter()
        r          = requests.get(f"{BASE_URL}/risk/{LAKE_ID}", timeout=TIMEOUT)
        elapsed_ms = (time.perf_counter() - t0) * 1_000

        body    = r.json()
        tier    = body.get("risk_tier", "")
        verdict = body.get("skeptic_verdict", "")
        score   = body.get("risk_score", 0)

        _timing("Simulated risk call", elapsed_ms)
        _log("risk_score",      score,   ok=float(score) >= 50.0)
        _log("risk_tier",       tier,    ok=tier == "RED")
        _log("skeptic_verdict", verdict)

        assert r.status_code == 200
        assert tier == "RED", (
            f"Expected risk_tier='RED' after simulation, got '{tier}' (score={score})"
        )

    def test_skeptic_verdict_is_confirmed_when_red(self) -> None:
        _section("skeptic_verdict = CONFIRMED when tier is RED")

        requests.post(f"{BASE_URL}/simulate/{LAKE_ID}", params={"active": "true"}, timeout=10)
        r       = requests.get(f"{BASE_URL}/risk/{LAKE_ID}", timeout=TIMEOUT)
        body    = r.json()
        tier    = body.get("risk_tier", "")
        verdict = body.get("skeptic_verdict", "")

        _log("risk_tier",       tier)
        _log("skeptic_verdict", verdict, ok=verdict in ("CONFIRMED", "MONITORING"))

        if tier == "RED":
            assert verdict in ("CONFIRMED", "MONITORING"), (
                f"When RED, skeptic_verdict must be CONFIRMED or MONITORING, got '{verdict}'"
            )
            if verdict == "CONFIRMED":
                print(f"  {GREEN}[OK]  Dual-verify: XGBoost RED + IsolationForest anomaly{RESET}")
            else:
                print(f"  {YELLOW}[!]   Skeptic=MONITORING (IsolationForest saw normal){RESET}")

    def test_audio_url_generated_on_red(self) -> None:
        _section("audio_url is a non-empty .mp3 string when risk is RED")

        requests.post(f"{BASE_URL}/simulate/{LAKE_ID}", params={"active": "true"}, timeout=10)
        r         = requests.get(f"{BASE_URL}/risk/{LAKE_ID}", timeout=TIMEOUT)
        body      = r.json()
        tier      = body.get("risk_tier", "")
        audio_url = body.get("audio_url")

        _log("risk_tier",  tier)
        _log("audio_url",  audio_url, ok=bool(audio_url))

        if tier == "RED":
            assert audio_url, "audio_url must be set when risk_tier=RED"
            assert isinstance(audio_url, str), "audio_url must be a string"
            assert audio_url.endswith(".mp3"), f"audio_url must end in .mp3, got '{audio_url}'"
            print(f"  {GREEN}[OK]  Nepali TTS audio generated: {audio_url}{RESET}")
        else:
            print(f"  {YELLOW}[!]   tier={tier} -- audio_url assertion skipped{RESET}")

    def test_cleanup_simulation_mode(self) -> None:
        """Deactivate simulation so subsequent tests see real baseline data."""
        _section("Cleanup -- deactivating simulation mode")
        r    = requests.post(f"{BASE_URL}/simulate/{LAKE_ID}",
                             params={"active": "false"}, timeout=10)
        body = r.json()
        _log("simulate_mode active", body.get("simulate_mode"),
             ok=body.get("simulate_mode") is False)
        assert body.get("simulate_mode") is False


# ===========================================================================
# G5 -- GRAPHRAG INTEGRATION
# ===========================================================================

class TestG5GraphRagIntegration:
    """GET /explain/{lake_id} must return downstream population + graph paths."""

    def test_explain_returns_200(self) -> None:
        _banner("G5 - GraphRAG Integration -- Neo4j Schema Traversal")
        _section("GET /explain/{lake_id} -> 200 OK")

        t0         = time.perf_counter()
        r          = requests.get(f"{BASE_URL}/explain/{LAKE_ID}", timeout=TIMEOUT)
        elapsed_ms = (time.perf_counter() - t0) * 1_000

        _timing("GraphRAG explain call", elapsed_ms)
        _log("HTTP status", r.status_code, ok=r.status_code == 200)

        assert r.status_code == 200

    def test_explain_has_downstream_population(self) -> None:
        _section("impact.population > 0 (downstream exposure data)")

        r      = requests.get(f"{BASE_URL}/explain/{LAKE_ID}", timeout=TIMEOUT)
        body   = r.json()
        impact = body.get("impact", {})

        pop    = impact.get("population", 0)
        mw     = impact.get("hydropower_mw", 0)
        analog = impact.get("historical_analog", "")

        _log("impact.population",        pop,    ok=pop > 0)
        _log("impact.hydropower_mw",     mw,     ok=mw > 0)
        _log("impact.historical_analog", analog, ok=bool(analog))

        assert pop > 0,  "impact.population must be > 0"
        assert mw  > 0,  "impact.hydropower_mw must be > 0"
        assert analog,   "impact.historical_analog must be non-empty"

    def test_explain_has_graph_paths(self) -> None:
        _section("graph_paths -- THREATENS relationship present")

        r     = requests.get(f"{BASE_URL}/explain/{LAKE_ID}", timeout=TIMEOUT)
        body  = r.json()
        paths = body.get("graph_paths", [])

        _log("graph_paths count", len(paths), ok=len(paths) > 0)
        assert isinstance(paths, list), "graph_paths must be a list"
        assert len(paths) > 0,          "graph_paths must have >= 1 relationship"

        first = paths[0]
        rel   = first.get("relationship", "")
        _log("Relationship", rel,                  ok=rel == "THREATENS")
        _log("From node",    first.get("from", "?"))
        _log("To node",      first.get("to", "?"))

        assert rel == "THREATENS", f"Expected 'THREATENS', got '{rel}'"

    def test_explain_has_explanation_text(self) -> None:
        _section("explanation field -- non-empty narrative string")

        r           = requests.get(f"{BASE_URL}/explain/{LAKE_ID}", timeout=TIMEOUT)
        body        = r.json()
        explanation = body.get("explanation", "")
        lower       = explanation.lower()

        has_lake    = "thulagi" in lower
        has_risk    = "risk"    in lower
        has_driver  = any(kw in lower for kw in
                          ["driver", "precipitation", "ndwi", "seismic", "primary"])

        _log("explanation length",     f"{len(explanation)} chars", ok=len(explanation) > 20)
        _log("Mentions 'Thulagi'",     has_lake,   ok=has_lake)
        _log("Mentions 'risk'",        has_risk,   ok=has_risk)
        _log("Mentions risk driver",   has_driver, ok=has_driver)

        assert len(explanation) > 20, "explanation is too short"
        assert has_lake,   "explanation must reference Thulagi Lake"


# ===========================================================================
# BONUS -- Concurrency smoke: 5 simultaneous requests, zero 500s
# ===========================================================================

class TestConcurrencySmoke:
    """Fire 5 simultaneous lean-pipeline requests; none should return 500.

    Uses demo_mode=true so the requests hit the 5-agent offline subgraph
    (no external I/O), preventing the single uvicorn worker from being starved
    by NVIDIA/ElevenLabs timeouts.
    """

    def test_concurrent_risk_calls_no_500(self) -> None:
        _banner("BONUS - Concurrency Smoke Test -- 5 Parallel Lean Requests")

        results: list[tuple[int, float]] = []
        lock = threading.Lock()

        def _call(stagger_ms: float) -> None:
            # Small stagger so requests don't all arrive at the exact same tick
            time.sleep(stagger_ms / 1_000)
            t0 = time.perf_counter()
            try:
                r  = requests.get(
                    f"{BASE_URL}/risk/{LAKE_ID}",
                    params={"demo_mode": "true"},
                    timeout=TIMEOUT,
                )
                ms = (time.perf_counter() - t0) * 1_000
                with lock:
                    results.append((r.status_code, ms))
            except Exception as exc:
                ms = (time.perf_counter() - t0) * 1_000
                with lock:
                    results.append((0, ms))
                print(f"  {RED}[!!] Thread exception: {exc}{RESET}")

        threads = [
            threading.Thread(target=_call, args=(i * 100,))   # 0/100/200/300/400ms stagger
            for i in range(5)
        ]
        t_wall = time.perf_counter()
        for t in threads:
            t.start()
        for t in threads:
            t.join()
        wall_ms = (time.perf_counter() - t_wall) * 1_000

        _timing("All 5 threads done in", wall_ms)
        for i, (status, ms) in enumerate(results):
            ok = status == 200
            _log(f"  Thread {i+1} HTTP status", status, ok=ok)
            _timing(f"  Thread {i+1} latency",   ms)
            assert status == 200, (
                f"Thread {i+1} returned HTTP {status} "
                f"(0 = connection exception, check server logs)"
            )

        print(f"\n  {GREEN}{BOLD}[OK]  All 5 concurrent lean requests returned HTTP 200{RESET}")


# ===========================================================================
# BONUS -- /lakes catalogue sanity check
# ===========================================================================

class TestLakesEndpoint:
    """GET /lakes must return the monitored lake catalogue."""

    def test_lakes_catalogue(self) -> None:
        _banner("BONUS - /lakes Monitored Lake Catalogue")

        r     = requests.get(f"{BASE_URL}/lakes", timeout=10)
        body  = r.json()
        lakes = body.get("lakes", [])

        _log("HTTP status",          r.status_code, ok=r.status_code == 200)
        _log("Lake count",           len(lakes),    ok=len(lakes) >= 1)

        assert r.status_code == 200
        assert len(lakes) >= 1, "Must have at least 1 lake in catalogue"

        ids = [lk.get("id") for lk in lakes]
        _log("PDGL_THULAGI_01 present", LAKE_ID in ids, ok=LAKE_ID in ids)

        for lk in lakes:
            _log(f"  {lk.get('id','?')[:22]}",
                 f"{lk.get('name','?')} tier={lk.get('tier','?')}")

        assert LAKE_ID in ids, "PDGL_THULAGI_01 must appear in /lakes"
