from fastapi import APIRouter

from .routes import home, secret, checkcontent

api_router = APIRouter()
api_router.include_router(home.router, tags=["home"])
api_router.include_router(secret.router, tags=["secret"])
api_router.include_router(checkcontent.router, tags=["checkcontent"])
