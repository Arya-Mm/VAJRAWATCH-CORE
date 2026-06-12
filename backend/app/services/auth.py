from __future__ import annotations

import jwt

from backend.app.core import security
from backend.app.core.config import Settings
from backend.app.core.ids import new_id
from backend.app.core.time import utc_now
from backend.app.domain.models import (
    StoredUser,
    TokenPair,
    UserCreate,
    UserLogin,
    UserPublic,
    UserRole,
)
from backend.app.repositories.protocols import AppRepository


class AuthError(Exception):
    pass


class AuthService:
    def __init__(self, repository: AppRepository, settings: Settings) -> None:
        self._repository = repository
        self._settings = settings

    async def register(self, request: UserCreate) -> tuple[UserPublic, TokenPair]:
        stored_user = StoredUser(
            user_id=new_id("user"),
            email=request.email,
            full_name=request.full_name,
            role=UserRole.OPERATOR,
            password_hash=security.hash_password(request.password),
            created_at=utc_now(),
        )
        try:
            created = await self._repository.create_user(stored_user)
        except ValueError as exc:
            raise AuthError("email already registered") from exc
        return self._public_user(created), security.create_token_pair(
            created.user_id, self._settings
        )

    async def login(self, request: UserLogin) -> tuple[UserPublic, TokenPair]:
        user = await self._repository.get_user_by_email(request.email)
        if user is None or not security.verify_password(request.password, user.password_hash):
            raise AuthError("invalid email or password")
        return self._public_user(user), security.create_token_pair(user.user_id, self._settings)

    async def refresh(self, refresh_token: str) -> TokenPair:
        try:
            payload = security.decode_token(refresh_token, self._settings)
        except jwt.PyJWTError as exc:
            raise AuthError("invalid refresh token") from exc
        if payload.token_type != "refresh":
            raise AuthError("invalid refresh token type")
        user = await self._repository.get_user_by_id(payload.subject)
        if user is None:
            raise AuthError("user no longer exists")
        return security.create_token_pair(user.user_id, self._settings)

    async def authenticate_bearer(self, token: str) -> UserPublic:
        try:
            payload = security.decode_token(token, self._settings)
        except jwt.PyJWTError as exc:
            raise AuthError("invalid bearer token") from exc
        if payload.token_type != "access":
            raise AuthError("invalid access token type")
        user = await self._repository.get_user_by_id(payload.subject)
        if user is None:
            raise AuthError("user no longer exists")
        return self._public_user(user)

    @staticmethod
    def _public_user(user: StoredUser) -> UserPublic:
        return UserPublic(
            user_id=user.user_id,
            email=user.email,
            full_name=user.full_name,
            role=user.role,
            created_at=user.created_at,
        )
