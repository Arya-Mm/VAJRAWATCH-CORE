from __future__ import annotations

from prometheus_client import CONTENT_TYPE_LATEST, Counter, Histogram, generate_latest
from starlette.responses import Response

REQUEST_COUNT = Counter(
    "vajrawatch_http_requests_total",
    "Total HTTP requests.",
    ["method", "path", "status_code"],
)
REQUEST_LATENCY = Histogram(
    "vajrawatch_http_request_duration_seconds",
    "HTTP request latency.",
    ["method", "path"],
)
WORKFLOW_COUNT = Counter(
    "vajrawatch_workflows_total",
    "Total workflow runs.",
    ["workflow", "status"],
)


def metrics_response() -> Response:
    return Response(generate_latest(), media_type=CONTENT_TYPE_LATEST)
