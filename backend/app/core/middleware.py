"""
UpayAche — Request ID & Logging Middleware.
Attaches unique request ID and logs timing and status for all requests.
"""

import time
import uuid
import logging
from starlette.middleware.base import BaseHTTPMiddleware, RequestResponseEndpoint
from starlette.requests import Request
from starlette.responses import Response

logger = logging.getLogger("upayache.api")


class RequestIdMiddleware(BaseHTTPMiddleware):
    async def dispatch(self, request: Request, call_next: RequestResponseEndpoint) -> Response:
        # Extract or generate request ID
        req_id = request.headers.get("X-Request-ID")
        if not req_id:
            req_id = f"req-{uuid.uuid4().hex[:12]}"
        
        request.state.request_id = req_id

        start_time = time.perf_counter()
        
        try:
            response = await call_next(request)
        except Exception as exc:
            duration_ms = (time.perf_counter() - start_time) * 1000.0
            logger.error(
                f"[{req_id}] {request.method} {request.url.path} - 500 ERROR ({duration_ms:.2f}ms): {exc}",
                exc_info=True
            )
            raise exc

        duration_ms = (time.perf_counter() - start_time) * 1000.0
        response.headers["X-Request-ID"] = req_id
        response.headers["X-Process-Time-Ms"] = f"{duration_ms:.2f}"

        logger.info(
            f"[{req_id}] {request.method} {request.url.path} - {response.status_code} ({duration_ms:.2f}ms)"
        )
        return response
