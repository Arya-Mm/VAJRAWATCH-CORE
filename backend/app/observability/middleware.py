from __future__ import annotations

import time

import structlog.contextvars
from starlette.middleware.base import BaseHTTPMiddleware, RequestResponseEndpoint
from starlette.requests import Request
from starlette.responses import Response

from backend.app.core.ids import new_id
from backend.app.observability.metrics import REQUEST_COUNT, REQUEST_LATENCY


class RequestContextMiddleware(BaseHTTPMiddleware):
    async def dispatch(self, request: Request, call_next: RequestResponseEndpoint) -> Response:
        request_id = request.headers.get("x-request-id", new_id("req"))
        structlog.contextvars.bind_contextvars(request_id=request_id)
        start = time.perf_counter()
        try:
            response = await call_next(request)
        finally:
            structlog.contextvars.clear_contextvars()

        duration = time.perf_counter() - start
        route = request.scope.get("route")
        path = getattr(route, "path", request.url.path)
        REQUEST_COUNT.labels(request.method, str(path), str(response.status_code)).inc()
        REQUEST_LATENCY.labels(request.method, str(path)).observe(duration)
        response.headers["x-request-id"] = request_id
        return response
