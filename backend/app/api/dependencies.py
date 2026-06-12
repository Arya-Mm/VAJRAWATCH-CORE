from __future__ import annotations

from typing import Annotated, cast

from fastapi import Depends, HTTPException, Request, status
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer

from backend.app.container import AppContainer
from backend.app.domain.models import UserPublic
from backend.app.services.auth import AuthError, AuthService

bearer_scheme = HTTPBearer(auto_error=False)


def get_container(request: Request) -> AppContainer:
    return cast(AppContainer, request.app.state.container)


def get_auth_service(container: Annotated[AppContainer, Depends(get_container)]) -> AuthService:
    return cast(AuthService, container.auth_service)


async def get_current_user(
    credentials: Annotated[HTTPAuthorizationCredentials | None, Depends(bearer_scheme)],
    auth_service: Annotated[AuthService, Depends(get_auth_service)],
) -> UserPublic:
    if credentials is None:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="missing bearer token",
            headers={"WWW-Authenticate": "Bearer"},
        )
    try:
        return await auth_service.authenticate_bearer(credentials.credentials)
    except AuthError as exc:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail=str(exc),
            headers={"WWW-Authenticate": "Bearer"},
        ) from exc
