from fastapi import APIRouter

router = APIRouter()


@router.get("/")
async def health():
    return "API is Running!"
