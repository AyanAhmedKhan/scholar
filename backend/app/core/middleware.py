import time
import logging
from fastapi import Request
from starlette.middleware.base import BaseHTTPMiddleware

logging.basicConfig(level=logging.DEBUG)
logger = logging.getLogger(__name__)

# Reduce noise from some libraries if needed, but for now keep full debug
logging.getLogger("uvicorn.access").setLevel(logging.INFO) # Keep access logs clean
logging.getLogger("sqlalchemy.engine").setLevel(logging.INFO) # Log SQL queries

class LoggingMiddleware(BaseHTTPMiddleware):
    async def dispatch(self, request: Request, call_next):
        start_time = time.time()
        
        # Log request
        logger.info(
            f"{request.method} {request.url.path} - "
            f"Client: {request.client.host if request.client else 'unknown'}"
        )
        
        try:
            response = await call_next(request)
        except Exception as e:
            process_time = time.time() - start_time
            logger.error(
                f"{request.method} {request.url.path} - "
                f"Error after {process_time:.3f}s: {str(e)}"
            )
            raise
        
        process_time = time.time() - start_time
        
        # Log response
        log_level = logger.warning if response.status_code >= 400 else logger.info
        log_level(
            f"{request.method} {request.url.path} - "
            f"Status: {response.status_code} - "
            f"Time: {process_time:.3f}s"
        )
        
        return response
