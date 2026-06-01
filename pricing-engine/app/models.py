"""
SQLAlchemy ORM models mirroring the Prisma schema for the pricing tables.
Prisma owns the schema (see prisma/migrations/); these classes only exist so
the FastAPI service can read/write the same Postgres tables type-safely.

Field names use snake_case to match the actual column names. Only the tables
the scraper actually touches are modelled — products / orders / inventory are
deliberately out of scope for least-privilege.
"""
from datetime import datetime
from decimal import Decimal
from typing import Optional

from sqlalchemy import (
    Boolean,
    DateTime,
    ForeignKey,
    Index,
    Integer,
    Numeric,
    String,
    Text,
    UniqueConstraint,
    func,
)
from sqlalchemy.dialects.postgresql import JSONB
from sqlalchemy.orm import DeclarativeBase, Mapped, mapped_column, relationship


class Base(DeclarativeBase):
    pass


class WholesaleSource(Base):
    __tablename__ = "wholesale_sources"

    id: Mapped[str] = mapped_column(String, primary_key=True)
    name: Mapped[str] = mapped_column(String(100), unique=True, nullable=False)
    base_url: Mapped[Optional[str]] = mapped_column(String(500))
    # Stored as the enum's text value — SQLAlchemy treats it as a plain string
    # so we don't have to declare the Postgres enum type Python-side.
    status: Mapped[str] = mapped_column(String, nullable=False, server_default="idle")
    last_synced_at: Mapped[Optional[datetime]] = mapped_column(DateTime)
    last_error: Mapped[Optional[str]] = mapped_column(Text)
    created_at: Mapped[datetime] = mapped_column(
        DateTime, server_default=func.now(), nullable=False
    )
    updated_at: Mapped[datetime] = mapped_column(
        DateTime, server_default=func.now(), nullable=False
    )

    listings: Mapped[list["WholesaleListing"]] = relationship(
        "WholesaleListing",
        back_populates="source",
        cascade="all, delete-orphan",
    )


class WholesaleListing(Base):
    __tablename__ = "wholesale_listings"
    __table_args__ = (
        UniqueConstraint("source_id", "sku", name="wholesale_listings_source_id_sku_key"),
        Index("wholesale_listings_sku_idx", "sku"),
        Index("wholesale_listings_scraped_at_idx", "scraped_at"),
        Index("wholesale_listings_brand_idx", "brand"),
    )

    id: Mapped[str] = mapped_column(String, primary_key=True)
    source_id: Mapped[str] = mapped_column(
        String, ForeignKey("wholesale_sources.id", ondelete="CASCADE"), nullable=False
    )
    external_id: Mapped[Optional[str]] = mapped_column(String(100))
    sku: Mapped[str] = mapped_column(String(100), nullable=False)
    name: Mapped[str] = mapped_column(String(300), nullable=False)
    brand: Mapped[Optional[str]] = mapped_column(String(100))
    model: Mapped[Optional[str]] = mapped_column(String(200))
    condition: Mapped[Optional[str]] = mapped_column(String(50))
    storage: Mapped[Optional[str]] = mapped_column(String(50))
    color: Mapped[Optional[str]] = mapped_column(String(100))
    carrier: Mapped[Optional[str]] = mapped_column(String(100))
    wholesale_price: Mapped[Decimal] = mapped_column(Numeric(10, 2), nullable=False)
    currency: Mapped[str] = mapped_column(String(3), nullable=False, server_default="USD")
    in_stock: Mapped[bool] = mapped_column(Boolean, nullable=False, server_default="true")
    stock_quantity: Mapped[Optional[int]] = mapped_column(Integer)
    source_url: Mapped[Optional[str]] = mapped_column(String(1000))
    raw_payload: Mapped[Optional[dict]] = mapped_column(JSONB)
    scraped_at: Mapped[datetime] = mapped_column(
        DateTime, server_default=func.now(), nullable=False
    )

    source: Mapped[WholesaleSource] = relationship(
        "WholesaleSource", back_populates="listings"
    )
