from __future__ import annotations

from typing import Annotated

from fastapi import APIRouter, Depends, HTTPException, status

from backend.app.api.dependencies import get_auth_service, get_current_user
from backend.app.domain.models import (
    RefreshTokenRequest,
    TokenPair,
    UserCreate,
    UserLogin,
    UserPublic,
)
from backend.app.services.auth import AuthError, AuthService

router = APIRouter(prefix="/auth", tags=["auth"])


class AuthResponse(UserPublic):
    tokens: TokenPair


@router.post("/register", response_model=AuthResponse, status_code=status.HTTP_201_CREATED)
async def register(
    request: UserCreate,
    auth_service: Annotated[AuthService, Depends(get_auth_service)],
) -> AuthResponse:
    try:
        user, tokens = await auth_service.register(request)
    except AuthError as exc:
        raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail=str(exc)) from exc
    return AuthResponse(**user.model_dump(), tokens=tokens)


@router.post("/login", response_model=AuthResponse)
async def login(
    request: UserLogin,
    auth_service: Annotated[AuthService, Depends(get_auth_service)],
) -> AuthResponse:
    try:
        user, tokens = await auth_service.login(request)
    except AuthError as exc:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail=str(exc)) from exc
    return AuthResponse(**user.model_dump(), tokens=tokens)


@router.post("/refresh", response_model=TokenPair)
async def refresh(
    request: RefreshTokenRequest,
    auth_service: Annotated[AuthService, Depends(get_auth_service)],
) -> TokenPair:
    try:
        return await auth_service.refresh(request.refresh_token)
    except AuthError as exc:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail=str(exc)) from exc


@router.get("/me", response_model=UserPublic)
@router.get("/../users/me", response_model=UserPublic, include_in_schema=False)
async def me(current_user: Annotated[UserPublic, Depends(get_current_user)]) -> UserPublic:
    return current_user
