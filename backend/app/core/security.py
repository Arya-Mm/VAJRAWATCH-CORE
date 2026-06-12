from __future__ import annotations

from datetime import timedelta
from typing import Any, Literal

import jwt
from argon2 import PasswordHasher
from argon2.exceptions import VerifyMismatchError

from backend.app.core.config import Settings
from backend.app.core.time import utc_now
from backend.app.domain.models import TokenPair, TokenPayload

_password_hasher = PasswordHasher()


def hash_password(password: str) -> str:
    return _password_hasher.hash(password)


def verify_password(password: str, password_hash: str) -> bool:
    try:
        return _password_hasher.verify(password_hash, password)
    except VerifyMismatchError:
        return False


def _encode_token(
    *,
    subject: str,
    settings: Settings,
    token_type: Literal["access", "refresh"],
    expires_delta: timedelta,
) -> str:
    issued_at = utc_now()
    expires_at = issued_at + expires_delta
    payload: dict[str, Any] = {
        "sub": subject,
        "type": token_type,
        "iat": int(issued_at.timestamp()),
        "exp": int(expires_at.timestamp()),
    }
    encoded = jwt.encode(payload, settings.jwt_secret_key, algorithm=settings.jwt_algorithm)
    return str(encoded)


def create_token_pair(subject: str, settings: Settings) -> TokenPair:
    access_token = _encode_token(
        subject=subject,
        settings=settings,
        token_type="access",
        expires_delta=timedelta(minutes=settings.jwt_access_token_expire_minutes),
    )
    refresh_token = _encode_token(
        subject=subject,
        settings=settings,
        token_type="refresh",
        expires_delta=timedelta(minutes=settings.jwt_refresh_token_expire_minutes),
    )
    return TokenPair(access_token=access_token, refresh_token=refresh_token)


def decode_token(token: str, settings: Settings) -> TokenPayload:
    payload = jwt.decode(token, settings.jwt_secret_key, algorithms=[settings.jwt_algorithm])
    return TokenPayload.model_validate(payload)
