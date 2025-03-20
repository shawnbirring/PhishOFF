from fastapi import APIRouter

from .routes import home, secret

api_router = APIRouter()
api_router.include_router(home.router, tags=["home"])
api_router.include_router(secret.router, tags=["secret"])
