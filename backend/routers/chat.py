# Placeholder for chat router
from fastapi import APIRouter

router = APIRouter(prefix="/api/chat", tags=["chat"])

@router.post("/")
def send_chat_message(message: str):
    return {"reply": f"Placeholder reply to {message}"}
