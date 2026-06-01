"""Shared httpx async client with cookie jar + retry policy."""
import httpx
from tenacity import (
    AsyncRetrying,
    retry_if_exception_type,
    stop_after_attempt,
    wait_exponential,
)

from app.config import settings


def build_async_client() -> httpx.AsyncClient:
    """Return a fresh client. Caller is responsible for closing it (use `async with`)."""
    return httpx.AsyncClient(
        timeout=settings.request_timeout_s,
        follow_redirects=True,
        headers={"User-Agent": settings.user_agent},
    )


def retrier() -> AsyncRetrying:
    """Network-error retry policy used by the scraper steps."""
    return AsyncRetrying(
        stop=stop_after_attempt(settings.max_retries),
        wait=wait_exponential(multiplier=1, min=1, max=10),
        retry=retry_if_exception_type(
            (httpx.HTTPError, httpx.TimeoutException),
        ),
        reraise=True,
    )
