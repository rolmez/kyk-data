#!/bin/bash

# Renkli ciktilar icin
GREEN='\033[0;32m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

echo -e "${BLUE}=== KYK DATA ANALYSIS Başlatılıyor ===${NC}"

# Backend'i baslatma
echo -e "${GREEN}1. FastAPI Backend'i (.venv) hazırlanıyor...${NC}"
source .venv/bin/activate
cd backend
uvicorn main:app --port 8000 --reload &
BE_PID=$!

# Frontend'i baslatma
echo -e "${GREEN}2. Next.js Frontend hazırlanıyor...${NC}"
cd ../frontend
npm run dev &
FE_PID=$!

# Tarayici bilgisi
echo ""
echo -e "${BLUE}================================================${NC}"
echo -e "${GREEN}✨ SİSTEM BAŞARIYLA AYAKLANDIRILDI! ✨${NC}"
echo -e "Tarayıcınızı (Chrome/Safari) açıp şu adrese gidin:"
echo -e "👉 ${BLUE}http://localhost:3000${NC}"
echo ""
echo -e "Demo Giriş Şifresi: ${GREEN}kyk2025demo${NC}"
echo -e "${BLUE}================================================${NC}"
echo -e "Sistemi kapatmak için bu ekranda CTRL+C tuşlarına basabilirsiniz."

# Arka plandaki proceleri bekle
wait
