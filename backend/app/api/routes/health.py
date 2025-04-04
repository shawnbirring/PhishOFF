from fastapi import APIRouter

router = APIRouter()


@router.get("/")
async def get_default():
    return "API is Running!"
