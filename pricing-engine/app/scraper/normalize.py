"""
CSV-row → normalized listing dict.

WeSellCellular's dealer-portal CSV column headers vary slightly across export
formats. The mapping below is the default; override by extending COLUMN_MAP
once the real headers are confirmed. Every output dict is shaped to match
`wholesale_listings` columns exactly so the sync layer can hand them straight
to PostgreSQL.
"""
from __future__ import annotations

import csv
import io
import re
from decimal import Decimal, InvalidOperation
from typing import Iterable, Iterator

import structlog

log = structlog.get_logger()

# Source column header → target listing field. Headers are matched
# case-insensitively after stripping whitespace.
COLUMN_MAP: dict[str, str] = {
    "sku": "sku",
    "item id": "external_id",
    "item": "name",
    "product": "name",
    "model": "model",
    "make": "brand",
    "brand": "brand",
    "grade": "condition",
    "condition": "condition",
    "memory": "storage",
    "storage": "storage",
    "capacity": "storage",
    "color": "color",
    "colour": "color",
    "carrier": "carrier",
    "lock": "carrier",
    "price": "wholesale_price",
    "wholesale price": "wholesale_price",
    "unit price": "wholesale_price",
    "qty": "stock_quantity",
    "quantity": "stock_quantity",
    "available": "stock_quantity",
}

PRICE_CLEAN_RE = re.compile(r"[^0-9.\-]")


def _norm_header(h: str) -> str:
    return (h or "").strip().lower()


def _parse_price(raw: str | None) -> Decimal | None:
    if raw is None:
        return None
    cleaned = PRICE_CLEAN_RE.sub("", str(raw))
    if not cleaned or cleaned in {"-", "."}:
        return None
    try:
        return Decimal(cleaned).quantize(Decimal("0.01"))
    except InvalidOperation:
        return None


def _parse_int(raw: str | None) -> int | None:
    if raw is None:
        return None
    s = str(raw).strip()
    if not s:
        return None
    try:
        return int(float(s))
    except (ValueError, TypeError):
        return None


def normalize_csv(text: str) -> list[dict]:
    """Parse the upstream CSV body. Returns a list of listing dicts."""
    reader = csv.DictReader(io.StringIO(text))
    return list(_iter_rows(reader))


def _iter_rows(reader: csv.DictReader) -> Iterator[dict]:
    skipped = 0
    for raw_row in reader:
        norm = _normalize_row(raw_row)
        if norm is None:
            skipped += 1
            continue
        yield norm
    if skipped:
        log.warning("normalize.rows_skipped", count=skipped)


def _normalize_row(raw: dict[str, str]) -> dict | None:
    out: dict = {"raw_payload": dict(raw)}
    for src_header, value in raw.items():
        target = COLUMN_MAP.get(_norm_header(src_header))
        if not target:
            continue
        out[target] = value.strip() if isinstance(value, str) else value

    sku = out.get("sku") or out.get("external_id")
    name = out.get("name") or out.get("model")
    price = _parse_price(out.get("wholesale_price"))
    if not sku or not name or price is None:
        return None

    qty = _parse_int(out.get("stock_quantity"))

    return {
        "external_id": out.get("external_id") or None,
        "sku": str(sku),
        "name": str(name)[:300],
        "brand": (out.get("brand") or None),
        "model": (out.get("model") or None),
        "condition": (out.get("condition") or None),
        "storage": (out.get("storage") or None),
        "color": (out.get("color") or None),
        "carrier": (out.get("carrier") or None),
        "wholesale_price": price,
        "currency": "USD",
        "in_stock": (qty is None) or (qty > 0),
        "stock_quantity": qty,
        "raw_payload": out["raw_payload"],
    }


def normalize_rows(rows: Iterable[dict]) -> list[dict]:
    """Allow callers that already parsed CSV/HTML to skip the csv module."""
    return [r for r in (_normalize_row(row) for row in rows) if r is not None]
