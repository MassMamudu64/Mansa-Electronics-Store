"""
WeSellCellular dealer-portal scraper.

Authorized B2B use: ShopMansa is a registered dealer; this service uses its
own credentials to fetch the inventory feed it is entitled to. The portal
URLs and form field names are configurable via env so the real values can
be confirmed without a code change.

Output: a list of normalized listing dicts ready for upsert.
"""
from __future__ import annotations

from dataclasses import dataclass

import httpx
import structlog

from app.config import settings
from app.scraper.client import build_async_client, retrier
from app.scraper.normalize import normalize_csv

log = structlog.get_logger()


@dataclass
class ScrapeResult:
    listings: list[dict]
    source_url: str
    raw_byte_count: int


async def scrape_wesell() -> ScrapeResult:
    """One full scrape pass. Raises on any irrecoverable error."""
    async with build_async_client() as client:
        await _login(client)
        body = await _fetch_inventory(client)

    listings = normalize_csv(body)
    for row in listings:
        row["source_url"] = settings.wesell_inventory_url

    log.info(
        "scrape.complete",
        rows=len(listings),
        bytes=len(body.encode("utf-8")),
    )
    return ScrapeResult(
        listings=listings,
        source_url=settings.wesell_inventory_url,
        raw_byte_count=len(body.encode("utf-8")),
    )


async def _login(client: httpx.AsyncClient) -> None:
    """POST credentials to the login URL. Cookies persist on the client jar."""
    payload = {
        settings.wesell_login_username_field: settings.wesell_username.get_secret_value(),
        settings.wesell_login_password_field: settings.wesell_password.get_secret_value(),
    }

    async for attempt in retrier():
        with attempt:
            resp = await client.post(settings.wesell_login_url, data=payload)
            resp.raise_for_status()
            log.info(
                "scrape.login_ok",
                url=settings.wesell_login_url,
                status=resp.status_code,
            )


async def _fetch_inventory(client: httpx.AsyncClient) -> str:
    """GET the inventory export and return the body as text."""
    async for attempt in retrier():
        with attempt:
            resp = await client.get(settings.wesell_inventory_url)
            resp.raise_for_status()
            log.info(
                "scrape.inventory_ok",
                url=settings.wesell_inventory_url,
                status=resp.status_code,
                bytes=len(resp.content),
            )
            return resp.text

    # tenacity guarantees a value or raises; mypy doesn't know that
    raise RuntimeError("retrier exited without value")
