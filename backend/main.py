import os
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from dotenv import load_dotenv

from routers import analytics, chat, marketing

load_dotenv()

app = FastAPI(title="KYK Data Analysis Demo API")

# Setup CORS for Next.js frontend
origins = [
    "http://localhost:3000",
    "https://kyk-data-umber.vercel.app",
    os.getenv("FRONTEND_URL", "http://localhost:3000"),
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(analytics.router)
app.include_router(chat.router)
app.include_router(marketing.router, prefix="/api/marketing")

@app.get("/")
def root():
    return {"status": "ok", "message": "KYK Demo Data Analysis API Running"}
