import os
from fastapi import APIRouter
from fastapi.responses import StreamingResponse
from pydantic import BaseModel
from typing import List
from services.chat_agent import query_sales_data_stream

router = APIRouter(prefix="/api/chat", tags=["chat"])

class ChatMessagePayload(BaseModel):
    role: str
    content: str

class ChatRequest(BaseModel):
    messages: List[ChatMessagePayload]
    new_message: str

@router.post("")
def send_chat_message(req: ChatRequest):
    if not os.getenv("ANTHROPIC_API_KEY"):
        return {"reply": "Sistem Hatası: 'ANTHROPIC_API_KEY' bulunamadı."}
        
    return StreamingResponse(
        query_sales_data_stream(req.messages, req.new_message),
        media_type="application/x-ndjson"
    )
