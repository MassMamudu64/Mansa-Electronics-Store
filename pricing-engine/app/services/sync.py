"""
Sync orchestration:

  1. Upsert the `wholesale_sources` row for WeSellCellular, mark it `syncing`.
  2. Run the scraper (login + fetch inventory).
  3. Bulk-upsert every normalized listing into `wholesale_listings`
     keyed on (source_id, sku).
  4. Mark the source `ok` + bump `last_synced_at`.

Any exception rolls back the source-row status to `error` with the message
captured in `last_error`. Listings written before the failure are NOT rolled
back (each upsert is its own statement in the same transaction), so a partial
sync that crashed mid-stream still leaves the most-recent rows visible.
"""
from __future__ import annotations

from dataclasses import dataclass
from datetime import datetime, timezone
from typing import Any
from uuid import uuid4

import structlog
from pydantic import BaseModel
from sqlalchemy import select
from sqlalchemy.dialects.postgresql import insert as pg_insert
from sqlalchemy.ext.asyncio import AsyncSession

from app.config import settings
from app.db import get_session_factory
from app.models import WholesaleListing, WholesaleSource
from app.scraper.wesell import scrape_wesell

log = structlog.get_logger()


class SyncSummary(BaseModel):
    source: str
    listings_seen: int
    listings_written: int
    started_at: datetime
    finished_at: datetime
    duration_ms: int
    status: str


@dataclass
class _Counts:
    seen: int = 0
    written: int = 0


def _now() -> datetime:
    # Postgres timestamp columns are timezone-naive in this schema; strip tz.
    return datetime.now(timezone.utc).replace(tzinfo=None)


def _new_id() -> str:
    return uuid4().hex


async def run_sync() -> SyncSummary:
    started = _now()
    factory = get_session_factory()
    counts = _Counts()

    async with factory() as session:
        source = await _begin_sync(session)
        await session.commit()

    try:
        scrape = await scrape_wesell()
        counts.seen = len(scrape.listings)

        async with factory() as session:
            await _upsert_listings(session, source_id=source.id, listings=scrape.listings)
            counts.written = counts.seen
            await _mark_ok(session, source_id=source.id, ts=_now())
            await session.commit()

    except Exception as exc:
        async with factory() as session:
            await _mark_error(session, source_id=source.id, err=str(exc)[:1000])
            await session.commit()
        log.exception("sync.failed", source=source.name)
        raise

    finished = _now()
    summary = SyncSummary(
        source=source.name,
        listings_seen=counts.seen,
        listings_written=counts.written,
        started_at=started,
        finished_at=finished,
        duration_ms=int((finished - started).total_seconds() * 1000),
        status="ok",
    )
    log.info("sync.ok", **summary.model_dump(mode="json"))
    return summary


async def _begin_sync(session: AsyncSession) -> WholesaleSource:
    """Upsert the source row and mark it `syncing`."""
    stmt = (
        pg_insert(WholesaleSource)
        .values(
            id=_new_id(),
            name=settings.wesell_source_name,
            base_url=settings.wesell_base_url or None,
            status="syncing",
            last_error=None,
            updated_at=_now(),
        )
        .on_conflict_do_update(
            index_elements=["name"],
            set_={
                "status": "syncing",
                "last_error": None,
                "base_url": settings.wesell_base_url or None,
                "updated_at": _now(),
            },
        )
    )
    await session.execute(stmt)

    row = await session.scalar(
        select(WholesaleSource).where(WholesaleSource.name == settings.wesell_source_name)
    )
    if row is None:  # defensive — the upsert should guarantee a row
        raise RuntimeError("wholesale_sources upsert returned no row")
    return row


async def _upsert_listings(
    session: AsyncSession,
    *,
    source_id: str,
    listings: list[dict[str, Any]],
) -> None:
    """Bulk INSERT … ON CONFLICT(source_id, sku) DO UPDATE."""
    if not listings:
        return

    now = _now()
    rows = [
        {
            "id": _new_id(),
            "source_id": source_id,
            "external_id": row.get("external_id"),
            "sku": row["sku"],
            "name": row["name"],
            "brand": row.get("brand"),
            "model": row.get("model"),
            "condition": row.get("condition"),
            "storage": row.get("storage"),
            "color": row.get("color"),
            "carrier": row.get("carrier"),
            "wholesale_price": row["wholesale_price"],
            "currency": row.get("currency", "USD"),
            "in_stock": row.get("in_stock", True),
            "stock_quantity": row.get("stock_quantity"),
            "source_url": row.get("source_url"),
            "raw_payload": row.get("raw_payload"),
            "scraped_at": now,
        }
        for row in listings
    ]

    stmt = pg_insert(WholesaleListing).values(rows)
    update_cols = {
        c: getattr(stmt.excluded, c)
        for c in (
            "external_id",
            "name",
            "brand",
            "model",
            "condition",
            "storage",
            "color",
            "carrier",
            "wholesale_price",
            "currency",
            "in_stock",
            "stock_quantity",
            "source_url",
            "raw_payload",
            "scraped_at",
        )
    }
    stmt = stmt.on_conflict_do_update(
        constraint="wholesale_listings_source_id_sku_key",
        set_=update_cols,
    )
    await session.execute(stmt)


async def _mark_ok(session: AsyncSession, *, source_id: str, ts: datetime) -> None:
    src = await session.get(WholesaleSource, source_id)
    if src is None:
        return
    src.status = "ok"
    src.last_synced_at = ts
    src.last_error = None
    src.updated_at = ts


async def _mark_error(session: AsyncSession, *, source_id: str, err: str) -> None:
    src = await session.get(WholesaleSource, source_id)
    if src is None:
        return
    src.status = "error"
    src.last_error = err
    src.updated_at = _now()
