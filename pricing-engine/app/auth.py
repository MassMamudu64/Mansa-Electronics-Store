"""Bearer-token guard for the /sync endpoint."""
import hmac
from typing import Annotated

from fastapi import Header, HTTPException, status

from app.config import settings


async def require_bearer(
    authorization: Annotated[str | None, Header()] = None,
) -> None:
    """Reject anything that isn't `Authorization: Bearer <PRICING_API_KEY>`."""
    expected = f"Bearer {settings.pricing_api_key.get_secret_value()}"
    presented = authorization or ""
    # Constant-time compare prevents timing leaks on the prefix.
    if not hmac.compare_digest(presented, expected):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Unauthorized",
            headers={"WWW-Authenticate": "Bearer"},
        )
