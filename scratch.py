import asyncio
import json
import httpx

async def test_stream():
    async with httpx.AsyncClient() as client:
        async with client.stream("POST", "http://127.0.0.1:8000/api/chat", json={"messages": [], "new_message": "Merhaba"}) as response:
            print("Status:", response.status_code)
            async for chunk in response.aiter_lines():
                print(chunk)

asyncio.run(test_stream())
