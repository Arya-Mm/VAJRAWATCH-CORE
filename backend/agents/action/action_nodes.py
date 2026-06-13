from __future__ import annotations

import json
import math
import os
from datetime import datetime
from typing import Any, cast
import requests
from dotenv import load_dotenv
from typing_extensions import TypedDict

load_dotenv()

# Define GLOFState matching orchestrator schema
class GLOFState(TypedDict):
    lake_id: str
    raw_data: dict[str, Any]
    risk_result: dict[str, Any]
    graph_context: str
    skeptic_verdict: str
    evacuation_route: str
    audio_url: str
    alert_dispatched: bool
    report: str
    agent_trace: list[dict[str, str]]


def haversine(lat1: float, lon1: float, lat2: float, lon2: float) -> float:
    """Calculate the great-circle distance between two points in kilometers."""
    r = 6371.0  # km
    dlat = math.radians(lat2 - lat1)
    dlon = math.radians(lon2 - lon1)
    a = (math.sin(dlat / 2.0) ** 2 +
         math.cos(math.radians(lat1)) * math.cos(math.radians(lat2)) * math.sin(dlon / 2.0) ** 2)
    c = 2.0 * math.atan2(math.sqrt(a), math.sqrt(1.0 - a))
    return r * c


def evacuation_router_node(state: GLOFState) -> GLOFState:
    """Agent 9: Evacuation Router Agent.
    Queries OSM Overpass API for roads in Besisahar and runs Dijkstra's algorithm.
    """
    # Besisahar coordinates
    start_lat, start_lon = 28.230, 84.370
    # Safe high ground target
    safe_lat, safe_lon = 28.180, 84.420

    fallback_route = "Besisahar (Elev: 760m) -> Khudi -> Bhulebhule (Elev: 840m) -> Bharatpur Safe Zone (4.5h, 110km)"
    state["evacuation_route"] = fallback_route

    # Query Overpass API for roads near Besisahar
    url = "https://overpass-api.de/api/interpreter"
    query = f"""[out:json][timeout:8];
    way(around:3000, {start_lat}, {start_lon})[highway];
    out geom;"""

    try:
        r = requests.post(url, data={"data": query}, timeout=8.0)
        if r.status_code == 200:
            data = r.json()
            elements = data.get("elements", [])
            
            # Build road network graph
            adj: dict[tuple[float, float], list[tuple[tuple[float, float], float]]] = {}
            nodes_set: set[tuple[float, float]] = set()

            for elem in elements:
                geom = elem.get("geometry", [])
                if len(geom) < 2:
                    continue
                for i in range(len(geom) - 1):
                    p1 = (float(geom[i]["lat"]), float(geom[i]["lon"]))
                    p2 = (float(geom[i+1]["lat"]), float(geom[i+1]["lon"]))
                    dist = haversine(p1[0], p1[1], p2[0], p2[1])

                    nodes_set.add(p1)
                    nodes_set.add(p2)
                    adj.setdefault(p1, []).append((p2, dist))
                    adj.setdefault(p2, []).append((p1, dist))

            if nodes_set:
                # Find nearest nodes to start and safe targets
                start_node = min(nodes_set, key=lambda n: haversine(start_lat, start_lon, n[0], n[1]))
                end_node = min(nodes_set, key=lambda n: haversine(safe_lat, safe_lon, n[0], n[1]))

                # Dijkstra pathfinder
                import heapq
                queue: list[tuple[float, tuple[float, float], list[tuple[float, float]]]] = [(0.0, start_node, [start_node])]
                visited: set[tuple[float, float]] = set()
                shortest_dist: dict[tuple[float, float], float] = {start_node: 0.0}

                found_path = None
                found_dist = 0.0

                while queue:
                    d, curr, path = heapq.heappop(queue)
                    if curr in visited:
                        continue
                    visited.add(curr)

                    if curr == end_node:
                        found_path = path
                        found_dist = d
                        break

                    for neighbor, weight in adj.get(curr, []):
                        if neighbor in visited:
                            continue
                        old_d = shortest_dist.get(neighbor, float("inf"))
                        new_d = d + weight
                        if new_d < old_d:
                            shortest_dist[neighbor] = new_d
                            heapq.heappush(queue, (new_d, neighbor, path + [neighbor]))

                if found_path:
                    # Format route output
                    formatted_coords = " -> ".join([f"({lat:.4f}, {lon:.4f})" for lat, lon in [start_node, end_node]])
                    state["evacuation_route"] = (
                        f"OSM Evacuation Route: {formatted_coords} | "
                        f"Shortest Path: {found_dist:.2f} km | Estimated travel time: {int(found_dist * 1.5 + 10)} mins"
                    )
                    status_msg = "OSM Overpass road graph route computed successfully"
                else:
                    status_msg = "No path found between coordinates in road network, loaded fallback route"
            else:
                status_msg = "Empty road network geometry returned, loaded fallback route"
        else:
            status_msg = f"OSM query failed with status {r.status_code}, loaded fallback route"
    except Exception as e:
        status_msg = f"OSM routing query error: {e}, loaded fallback route"

    state["agent_trace"].append({
        "agent": "Evacuation Router Agent",
        "status": status_msg
    })
    return state


def nepali_tts_node(state: GLOFState) -> GLOFState:
    """Agent 10: Nepali TTS Agent.
    Generates ElevenLabs warning alert in Nepali language, falling back to gTTS if key is missing or fails.
    """
    risk_result = state.setdefault("risk_result", {})
    risk_tier = risk_result.get("risk_tier", "GREEN")
    risk_score = risk_result.get("risk_score", 0.0)
    lake_id = state.get("lake_id", "PDGL_THULAGI_01")

    state["audio_url"] = ""

    # CONDITIONAL LOGIC: Only execute if risk tier is RED
    if risk_tier != "RED":
        state["agent_trace"].append({
            "agent": "Nepali TTS Agent",
            "status": "Skipped (risk tier is not RED)"
        })
        return state

    text = (
        f"अत्यन्त जरुरी चेतावनी। थुलागी ताल खतरनाक स्तरमा पुगेको छ। "
        f"जोखिम स्कोर {int(risk_score)} प्रतिशत। "
        f"बेसिसहार, खुदी, र भुलेभुले क्षेत्रका मानिसहरू तुरुन्त सुरक्षित स्थानमा जानुहोस्।"
    )

    static_dir = os.path.join("backend", "static", "alerts")
    os.makedirs(static_dir, exist_ok=True)
    audio_path = os.path.join(static_dir, f"{lake_id}.mp3")

    elevenlabs_key = os.getenv("ELEVENLABS_API_KEY", "")
    tts_generated = False
    model_used = "gTTS (fallback)"

    if elevenlabs_key:
        try:
            r = requests.post(
                "https://api.elevenlabs.io/v1/text-to-speech/pNInz6obpgDQGcFmaJgB",
                headers={
                    "xi-api-key": elevenlabs_key,
                    "Content-Type": "application/json"
                },
                json={
                    "text": text,
                    "model_id": "eleven_multilingual_v2",
                    "voice_settings": {"stability": 0.5, "similarity_boost": 0.75}
                },
                timeout=15.0
            )
            if r.status_code == 200:
                with open(audio_path, "wb") as f:
                    f.write(r.content)
                tts_generated = True
                model_used = "ElevenLabs"
            else:
                print(f"[Nepali TTS Agent] ElevenLabs failed with status {r.status_code}, falling back to gTTS")
        except Exception as e:
            print(f"[Nepali TTS Agent] ElevenLabs request failed: {e}, falling back to gTTS")

    if not tts_generated:
        try:
            from gtts import gTTS  # type: ignore[import-untyped]
            tts = gTTS(text=text, lang="ne")
            tts.save(audio_path)
            tts_generated = True
        except Exception as e:
            print(f"[Nepali TTS Agent] gTTS failed: {e}")

    if tts_generated:
        state["audio_url"] = f"/static/alerts/{lake_id}.mp3"
        status_msg = f"Nepali warning audio compiled using {model_used}"
    else:
        status_msg = "Warning audio compilation failed"

    state["agent_trace"].append({
        "agent": "Nepali TTS Agent",
        "status": status_msg
    })
    return state


def alert_dispatch_node(state: GLOFState) -> GLOFState:
    """Agent 8: Alert Dispatch Agent.
    Sends Twilio SMS and triggers ICIMOD-format Webhook warning protocols.
    """
    risk_result = state.setdefault("risk_result", {})
    risk_tier = risk_result.get("risk_tier", "GREEN")
    skeptic_verdict = state.get("skeptic_verdict", "MONITORING")
    report = state.get("report", "")
    lake_id = state.get("lake_id", "PDGL_THULAGI_01")

    state["alert_dispatched"] = False

    # CONDITIONAL LOGIC: Only execute if Risk is RED and Skeptic verdict is CONFIRMED
    if not (risk_tier == "RED" and skeptic_verdict == "CONFIRMED"):
        state["agent_trace"].append({
            "agent": "Alert Dispatch Agent",
            "status": f"Skipped (tier={risk_tier}, skeptic={skeptic_verdict})"
        })
        return state

    # 1. Twilio SMS Integration
    twilio_sid = os.getenv("TWILIO_ACCOUNT_SID", "")
    twilio_token = os.getenv("TWILIO_AUTH_TOKEN", "")
    twilio_from = os.getenv("TWILIO_PHONE_NUMBER", "")
    twilio_to = os.getenv("TWILIO_TARGET_PHONE", "")

    sms_status = "Twilio credentials missing"
    if twilio_sid and twilio_token and twilio_from and twilio_to:
        try:
            from twilio.rest import Client
            client = Client(twilio_sid, twilio_token)
            sms_body = f"CRITICAL GLOF ALERT - VajraWatch:\n{report or 'High risk of flood detected at Thulagi Lake.'}"
            client.messages.create(
                body=sms_body[:1600],  # Twilio SMS length limit safety
                from_=twilio_from,
                to=twilio_to
            )
            sms_status = f"Warning SMS dispatched to {twilio_to}"
        except Exception as e:
            sms_status = f"Twilio SMS delivery failed: {e}"

    # 2. ICIMOD Webhook Integration
    webhook_url = os.getenv("ICIMOD_WEBHOOK_URL", "https://httpbin.org/post")
    payload = {
        "event": "GLOF_EARLY_WARNING",
        "lake_id": lake_id,
        "risk_score": risk_result.get("risk_score"),
        "risk_tier": risk_tier,
        "skeptic_verdict": skeptic_verdict,
        "timestamp": datetime.utcnow().isoformat(),
        "evacuation_route": state.get("evacuation_route", ""),
        "report": report
    }
    
    webhook_status = "Webhook endpoint not configured"
    if webhook_url:
        try:
            r = requests.post(webhook_url, json=payload, timeout=8.0)
            if r.status_code in (200, 201):
                webhook_status = f"ICIMOD protocol webhook dispatched to {webhook_url}"
            else:
                webhook_status = f"ICIMOD Webhook failed with status {r.status_code}"
        except Exception as e:
            webhook_status = f"ICIMOD Webhook post error: {e}"

    state["alert_dispatched"] = True
    state["agent_trace"].append({
        "agent": "Alert Dispatch Agent",
        "status": f"{sms_status} | {webhook_status}"
    })
    return state


def report_synthesizer_node(state: GLOFState) -> GLOFState:
    """Agent 11: Report Agent (Report Synthesizer).
    Queries NVIDIA NIM or Ollama Gemma:2b to write an executive decision brief.
    """
    risk_result = state.setdefault("risk_result", {})
    score = risk_result.get("risk_score", 0.0)
    tier = risk_result.get("risk_tier", "GREEN")
    skeptic_verdict = state.get("skeptic_verdict", "MONITORING")
    graph_context = state.get("graph_context", "")
    evacuation_route = state.get("evacuation_route", "")
    drivers = risk_result.get("top_drivers", [])

    top_driver_str = drivers[0]["feature"] if drivers else "unknown"

    prompt = (
        f"You are the GLOF Command Center Report Agent.\n"
        f"A GLOF warning is active for Thulagi Lake (Score: {score}/100, Tier: {tier}).\n"
        f"Skeptic Agent Verdict: {skeptic_verdict}.\n"
        f"Primary risk driver: {top_driver_str}.\n"
        f"Downstream Threat Context from GraphRAG:\n{graph_context}\n"
        f"Evacuation Route:\n{evacuation_route}\n"
        f"Write a 3-sentence executive brief for emergency dispatch and hydropower operators. Be direct, authoritative, and actionable."
    )

    nvidia_api_key = os.getenv("NVIDIA_API_KEY", "")
    ollama_url = os.getenv("OLLAMA_BASE_URL", "http://localhost:11434")
    report_text = ""
    model_used = "Fallback deterministic template"

    # Try NVIDIA NIM
    if nvidia_api_key:
        try:
            r = requests.post(
                "https://integrate.api.nvidia.com/v1/chat/completions",
                headers={
                    "Authorization": f"Bearer {nvidia_api_key}",
                    "Content-Type": "application/json"
                },
                json={
                    "model": "meta/llama-3.3-70b-instruct",
                    "messages": [{"role": "user", "content": prompt}],
                    "max_tokens": 200,
                    "temperature": 0.3
                },
                timeout=8.0
            )
            if r.status_code == 200:
                report_text = r.json()["choices"][0]["message"]["content"].strip()
                model_used = "NVIDIA NIM (Llama 3.3 70B)"
            else:
                print(f"[Report Agent] NVIDIA NIM failed: status {r.status_code}, falling back to Ollama")
        except Exception as e:
            print(f"[Report Agent] NVIDIA NIM query error: {e}, falling back to Ollama")

    # Try Ollama (Gemma 2B)
    if not report_text:
        try:
            # Check Ollama generation endpoint
            r = requests.post(
                f"{ollama_url}/api/generate",
                json={
                    "model": "gemma:2b",
                    "prompt": prompt,
                    "stream": False
                },
                timeout=8.0
            )
            if r.status_code == 200:
                report_text = r.json().get("response", "").strip()
                model_used = "Ollama (Gemma 2B)"
            else:
                print(f"[Report Agent] Ollama failed: status {r.status_code}, falling back to template")
        except Exception as e:
            print(f"[Report Agent] Ollama query error: {e}, falling back to template")

    # Static fallback template if all else fails
    if not report_text:
        report_text = (
            f"CRITICAL EARLY WARNING: Thulagi Lake has reached risk score {score}/100 ({tier}). "
            f"Skeptic agent has confirmed risk status as {skeptic_verdict}. Primary driver: {top_driver_str}. "
            f"Recommend immediate 36-hour shutdown preparation for threatened downstream infrastructure. "
            f"Evacuation routing: {evacuation_route}."
        )

    state["report"] = report_text
    state["agent_trace"].append({
        "agent": "Report Agent",
        "status": f"Decision brief synthesized using {model_used}"
    })
    return state
