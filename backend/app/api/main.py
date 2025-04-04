from fastapi import APIRouter

from .routes import health, checkcontent, checksender

api_router = APIRouter()
api_router.include_router(health.router, tags=["health"])
api_router.include_router(checkcontent.router, tags=["checkcontent"])
api_router.include_router(checksender.router, tags=["checksender"])
