from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
import os
import fal_client
from anthropic import Anthropic
import json

router = APIRouter()

class MarketingRequest(BaseModel):
    urun_adi: str

class MarketingResponse(BaseModel):
    image_url: str
    pr_article: str

@router.post("/generate", response_model=MarketingResponse)
async def generate_marketing_material(req: MarketingRequest):
    """
    Ürün adını alır, Anthropic ile JSON formatında PR yazısı + İngilizce Görsel Prompt tasarlar,
    Fal.ai ile bu prompt'tan yüksek kaliteli bir reklam görseli (Flux) üretir.
    """
    anthropic_key = os.getenv("ANTHROPIC_API_KEY")
    fal_key = os.getenv("FAL_KEY")

    if not anthropic_key:
        raise HTTPException(status_code=500, detail="ANTHROPIC_API_KEY .env dosyasında bulunamadı.")
    if not fal_key:
        raise HTTPException(status_code=500, detail="FAL_KEY .env dosyasında bulunamadı. Lütfen Fal.ai API anahtarını ekleyin.")

    # 1. Claude'dan Dinamik Prompt ve Metin Üretimi
    client = Anthropic(api_key=anthropic_key)
    
    system_prompt = f"""
Sen KYK Yapı Kimyasalları'nın usta Pazarlama Direktörü ve Sosyal Medya Uzmanısın.
Odağımızdaki ürün: {req.urun_adi}

Bana sadece aşağıdaki formatta 1 adet JSON döndür, dışına hiçbir metin yazma:
{{
  "image_prompt": "Bu ürünün bir inşaat şantiyesinde, KYK formalı ustalar tarafından uygulanışını anlatan yüksek estetikli, ultra-gerçekçi, sinematik, İngilizce bir görsel çizim promptu. Sadece İngilizce detaylı prompt metnini yaz.",
  "pr_article": "Ürünün kalitesini, uygulamasının gücünü anlatan; dergilere basılmaya uygun, marka prestijini koruyan ama aynı zamanda ikna edici ve okuması kolay 3 paragraflık Türkçe bir PR makalesi. Markdown kullanarak başlık ve kalın yazılar ekle."
}}
    """

    try:
        res = client.messages.create(
            model="claude-sonnet-4-5-20250929",
            max_tokens=1000,
            messages=[{"role": "user", "content": system_prompt}]
        )
        
        content = res.content[0].text.strip()
        # Ensure it's valid JSON block
        if "```json" in content:
            content = content.replace("```json", "").replace("```", "").strip()
            
        ai_data = json.loads(content)
        dynamic_prompt = ai_data.get("image_prompt", "")
        pr_article = ai_data.get("pr_article", "")
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Anthropic API Hatası: {str(e)}")

    # 2. Fal.ai üzerinden Flux Visual Generation
    # Güçlü, sabit bir baz prompt kuralım: (Çünkü kalite standardı gerekir)
    base_prompt = "Ultra-realistic, 8k, highly detailed structural photography, cinematic lighting, corporate construction context. "
    final_prompt = base_prompt + dynamic_prompt

    try:
        # Fal.ai API
        # Using fal-ai/flux/schnell for fast <5s rendering, or flux-pro for perfection
        handler = fal_client.submit(
            "fal-ai/flux/dev",
            arguments={
                "prompt": final_prompt,
                "image_size": "landscape_16_9",
                "num_inference_steps": 28,
                "guidance_scale": 3.5,
                "num_images": 1
            },
        )

        result = handler.get()
        # Get the first image url
        image_url = result["images"][0]["url"]
        
        return MarketingResponse(
            image_url=image_url,
            pr_article=pr_article
        )

    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Fal.ai Resim Üretim Hatası: {str(e)}")
