"""FastAPI entrypoint. Exposes /health (public) and /sync (Bearer-protected)."""
import logging
from contextlib import asynccontextmanager
from datetime import datetime, timezone

import structlog
from fastapi import Depends, FastAPI, HTTPException, status

from app.auth import require_bearer
from app.config import settings
from app.db import dispose_db, init_db
from app.services.sync import SyncSummary, run_sync


def _configure_logging() -> None:
    """structlog → stdlib stdout. Adequate for container logs / journald."""
    logging.basicConfig(level=logging.INFO, format="%(message)s")
    structlog.configure(
        processors=[
            structlog.contextvars.merge_contextvars,
            structlog.processors.add_log_level,
            structlog.processors.TimeStamper(fmt="iso"),
            structlog.processors.JSONRenderer(),
        ],
        wrapper_class=structlog.make_filtering_bound_logger(logging.INFO),
        logger_factory=structlog.PrintLoggerFactory(),
    )


_configure_logging()
log = structlog.get_logger()


@asynccontextmanager
async def lifespan(app: FastAPI):
    log.info("startup", env=settings.env)
    await init_db()
    try:
        yield
    finally:
        await dispose_db()
        log.info("shutdown")


app = FastAPI(
    title="ShopMansa Pricing Engine",
    version="0.1.0",
    description="Scrapes WeSellCellular and writes wholesale listings into Supabase Postgres.",
    lifespan=lifespan,
)


@app.get("/health", tags=["health"])
async def health() -> dict:
    return {"ok": True, "ts": datetime.now(timezone.utc).isoformat()}


@app.post("/sync", tags=["sync"], dependencies=[Depends(require_bearer)])
async def sync_endpoint() -> SyncSummary:
    """One full scrape + upsert pass. Idempotent. Bearer-protected."""
    try:
        return await run_sync()
    except HTTPException:
        raise
    except Exception as exc:
        log.exception("sync.endpoint_failed")
        raise HTTPException(
            status_code=status.HTTP_502_BAD_GATEWAY,
            detail=f"sync failed: {exc}",
        ) from exc
