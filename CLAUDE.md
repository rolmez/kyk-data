# KYK Yapı Kimyasalları — Satış Analiz & AI Dashboard

## CLAUDE.md — Proje Bağlamı ve Geliştirme Rehberi

> Bu dosya, projede çalışan tüm Claude agent instansları için zorunlu okuma belgesidir.
> Bir göreve başlamadan önce bu dosyanın tamamını oku.

## Geliştirme Yaklaşımı

Her görevde:

1. Önce yapacağını kısaca açıkla
2. Onay aldıktan sonra kodu yaz
3. Bitince kısa özet ver (ne oluşturuldu, hangi komutla test edilir)

---

## 1. Proje Özeti

KYK Yapı Kimyasalları için üç fazdan oluşan bir satış analiz ve AI destekli karar destek platformu.

**Faz 1 (Mevcut):** Demo dashboard — mock veri, temel analizler, LLM sohbet botu.
**Faz 2 (Sonraki):** Gerçek Excel/ERP entegrasyonu, production backend.
**Faz 3 (Planlı):** AI görsel üretim pipeline'ı (sosyal medya kampanyaları).

**Birincil hedef:** Satışı düşen ürünleri tespit et → anlayışlı analiz sun → aksiyon öner.

**Demo sunumu:** Bir danışman profesöre yapılacak. Tarayıcı + URL + şifre. Hedef bilgisayara hiçbir şey kurulmaz.

---

## 2. Teknoloji Stack'i

### Demo Stack (Şu an geliştirilen)

| Katman           | Teknoloji                           | Neden                                                      |
| ---------------- | ----------------------------------- | ---------------------------------------------------------- |
| Frontend         | Next.js 16 (App Router)             | Vercel native deploy, middleware auth                      |
| Grafik           | Tremor + ECharts                    | Tremor hızlı dashboard bileşenleri, ECharts harita/heatmap |
| Backend          | FastAPI (Python 3.14)               | LlamaIndex, Pandas, DuckDB ekosistemi                      |
| Veri             | DuckDB                              | Excel/CSV'yi doğrudan SQL ile sorgular, sunucu gerektirmez |
| Vector DB        | ChromaDB (in-memory)                | Demo için sıfır config                                     |
| LLM Orkestrasyon | LlamaIndex                          | LangChain'den daha temiz RAG API'si                        |
| LLM Sağlayıcı    | **Değiştirilebilir** — bkz. Bölüm 6 | OpenAI / Claude / Mistral                                  |
| Hosting FE       | Vercel                              | Auto-deploy, edge, ücretsiz                                |
| Hosting BE       | Railway                             | Python için en kolay managed hosting                       |
| Harita           | react-leaflet + Türkiye GeoJSON     | İl/bölge choropleth                                        |
| Auth             | Next.js middleware + env şifre      | Basit, kurulum gerektirmiyor                               |

### Production Stack (Faz 2 geçişinde)

- DuckDB → **PostgreSQL + TimescaleDB** (zaman serisi optimizasyonu)
- ChromaDB → **Qdrant** veya **PGVector**
- In-memory state → **Redis**
- Tek şifre → **Clerk** veya **Auth.js**

---

## 3. Proje Klasör Yapısı

```
kyk-demo/
├── CLAUDE.md                    ← Bu dosya
├── generate_mock_data.py        ← Mock veri üretici (seed=42, deterministik)
├── kyk_satis_2022_2024.csv      ← Ana veri (DuckDB için)
├── kyk_satis_2022_2024.xlsx     ← Excel (profesör kontrolü için, 5 sheet)
│
├── frontend/                    ← Next.js 14
│   ├── middleware.ts             ← Demo şifre koruma
│   ├── app/
│   │   ├── (dashboard)/         ← Korumalı route group
│   │   │   ├── page.tsx         ← Ana dashboard
│   │   │   ├── urunler/         ← Ürün analizi
│   │   │   ├── bolgeler/        ← Bölgesel harita
│   │   │   └── chat/            ← LLM sohbet botu
│   │   └── login/               ← Şifre sayfası
│   └── components/
│       ├── charts/              ← Grafik bileşenleri
│       ├── map/                 ← Türkiye haritası
│       └── chat/                ← Sohbet botu UI
│
├── backend/                     ← FastAPI
│   ├── main.py                  ← Entry point
│   ├── routers/
│   │   ├── analytics.py         ← Satış analiz endpoint'leri
│   │   └── chat.py              ← LLM chat endpoint
│   ├── services/
│   │   ├── data_service.py      ← DuckDB sorgu katmanı
│   │   ├── llm_router.py        ← Intent sınıflandırıcı
│   │   ├── analytics_agent.py   ← Veri sorgu agent'ı
│   │   └── coach_agent.py       ← RAG tabanlı satış koçu
│   └── data/                    ← CSV + ChromaDB index
│
└── scripts/
    ├── generate_mock_data.py    ← Kopyası (kayıt için)
    └── index_catalog.py         ← Ürün kataloğunu ChromaDB'ye yükler
```

---

## 4. Veri Şeması

### Ana satış tablosu: `kyk_satis_2022_2024.csv`

| Sütun          | Tip    | Açıklama             | Örnek            |
| -------------- | ------ | -------------------- | ---------------- |
| siparis_id     | string | Benzersiz sipariş ID | KYK-100042       |
| tarih          | date   | YYYY-MM-DD           | 2023-04-15       |
| yil            | int    | 2022, 2023, 2024     | 2023             |
| ay             | int    | 1-12                 | 4                |
| ay_adi         | string | Kısa ay adı          | Nis              |
| ceyrek         | string | Q1, Q2, Q3, Q4       | Q2               |
| urun_kodu      | string | Ürün kodu            | Y103             |
| urun_adi       | string | Tam ürün adı         | MegaFlex Y103    |
| kategori       | string | 8 ana kategori       | Yapıştırıcılar   |
| bolge_kodu     | string | 3 harf kod           | IST              |
| bolge_adi      | string | Tam bölge adı        | İstanbul Bölge   |
| sehir          | string | Merkez şehir         | İstanbul         |
| kanal          | string | Satış kanalı         | Bayi             |
| musteri_tipi   | string | Müşteri segmenti     | Konut Müteahhidi |
| miktar_kg      | float  | kg cinsinden miktar  | 250.0            |
| birim_fiyat_tl | float  | TL/kg                | 62.40            |
| ciro_tl        | float  | Toplam ciro TL       | 15600.00         |
| maliyet_tl     | float  | Maliyet TL           | 10764.00         |
| kar_tl         | float  | Brüt kar TL          | 4836.00          |
| kar_marji_pct  | float  | Kar marjı %          | 31.0             |

### Ürün kategorileri (8 adet)

- Yapıştırıcılar (10 ürün: Y101-Y194, ARF, ARFJ)
- Derz Dolgular (6 ürün: D102-D501, D201)
- Su Yalıtım (8 ürün: S102-S802)
- Tamir Harçları (6 ürün: T101-T108)
- Zemin Malzemeleri (3 ürün: Z101-Z121)
- Sıvalar (6 ürün: H101-H201)
- Astarlar (4 ürün: A101-A204)
- Katkılar (3 ürün: K201-K902)

### Bölgeler (8 adet)

| Kod | Bölge                      | Pazar Payı (mock) |
| --- | -------------------------- | ----------------- |
| IST | İstanbul                   | %29               |
| ESK | Eskişehir (Merkez/Fabrika) | %18               |
| IZM | İzmir/Aydın                | %16               |
| ANK | Ankara                     | %14               |
| ANT | Antalya                    | %9                |
| SAM | Samsun                     | %7                |
| ADA | Adana                      | %4                |
| DIY | Diyarbakır                 | %3                |

### Mock verinin gerçekçilik özellikleri

- **Mevsimsellik:** Yapıştırıcılar/Sıvalar Nisan-Eylül peak; Su Yalıtım Ağustos-Kasım; MegaAntiFreeze Ekim-Mart
- **Trend:** Bazı ürünler (Y101, Y105, ARF) yıllık düşüş; premium ürünler (Y104, Y113, D201, S801) büyüme
- **Enflasyon:** 2023 +%58, 2024 ek +%45 fiyat artışı (TL bazında ciro artıyor, hacim stabil)
- **Deterministik:** `random.seed(42)` — her üretimde aynı sonuç

---

## 5. Dashboard Analiz Modülleri

Her modülün hangi SQL sorgusunu tetiklediğini buraya yaz.

### 5.1 Ana Özet (Ana Sayfa)

- Toplam ciro (seçilen dönem)
- YoY büyüme %
- En çok düşen 5 ürün (YoY hacim değişimi)
- En çok büyüyen 5 ürün
- Bölge bazında ciro ısı haritası

### 5.2 Ürün Analizi

- Ürün seçili: aylık trend (2022-2024 üç çizgi, tek grafik)
- YoY karşılaştırma tablosu (ay × yıl pivot)
- ABC analizi (ürünleri ciro katkısına göre A/B/C grupla)
- Mevsimsel indeks (ürünün ortalama aylık ciro vs genel ortalama)

### 5.3 Bölgesel Analiz

- Türkiye choropleth haritası (ECharts veya Leaflet)
- Bölge seçince: o bölge için kategori dağılımı
- YoY bölgesel karşılaştırma

### 5.4 Karşılaştırma

- Ay/çeyrek/yıl granülarite seçici
- Ürün veya kategori seçip yıllar arası karşılaştır
- İndir butonu (PNG + CSV)

---

## 6. LLM Sohbet Botu — Tek Bot, Şeffaf Yönlendirme

### Temel Tasarım İlkesi

Kullanıcı **tek bir chat arayüzü** görür. Hangi mod veya sisteme yönlendirildiğini seçmez. Bot otomatik olarak intent'i tespit eder ve en uygun motorla yanıt üretir. Yanıtın altında/üstünde küçük bir bağlam etiketi gösterilir — seçim için değil, şeffaflık için.

```
Kullanıcı: "Mart 2024'te en çok düşüş yaşayan kategori hangisi?"
Bot yanıtı: [küçük etiket: Veri analizi]
→ "Su Yalıtım kategorisi 2023 Mart'a kıyasla hacimde -%23 geriledi. ..."

Kullanıcı: "MegaFlex Y103'ü yüklenicilere nasıl anlatabilirim?"
Bot yanıtı: [küçük etiket: Satış danışmanlığı]
→ "MegaFlex Y103, C2TE S1 sınıfıyla ... "
```

### 6.1 Intent Router

```python
INTENT_SYSTEM_PROMPT = """
Kullanıcı mesajını analiz et ve JSON formatında döndür:
{
  "intent": "analytics" | "coach" | "catalog" | "general",
  "confidence": 0.0-1.0,
  "language": "tr" | "en"
}

- analytics: Sayısal veri, tarih, trend, karşılaştırma, düşüş/artış sorguları
- coach: Ürün satışı, ikna, nasıl anlatırım, müşteriye yaklaşım
- catalog: Ürün özellikleri, teknik bilgi, hangi ürün nerede kullanılır
- general: Şirket hakkında, selamlama, dışı konular

Örnekler:
"Mart 2023 cirosu neydi?" → analytics
"Bu ürünü nasıl satabilirim?" → coach
"MegaPool Y105 nerelerde kullanılır?" → catalog
"KYK nerede kurulu?" → general
"""
```

### 6.2 Analytics Agent (Text-to-DuckDB)

Amacı: Doğal dil sorusunu DuckDB SQL'ine çevir, çalıştır, formatla.

```python
ANALYTICS_SYSTEM_PROMPT = """
Sen KYK Yapı Kimyasalları'nın satış analiz asistanısın.
Elindeki DuckDB tablosu: kyk_satis (sütunlar: tarih, yil, ay, urun_kodu, urun_adi,
kategori, bolge_adi, kanal, musteri_tipi, miktar_kg, ciro_tl, kar_tl, kar_marji_pct)

Kurallar:
1. Önce sorguyu anla, gerekirse açıklayıcı soru sor
2. SQL sorgusunu üret ve çalıştır (tool: run_sql)
3. Sayısal sonucu Türkçe, anlaşılır, iş odaklı yorumla
4. YoY karşılaştırmalarda % değişimi her zaman belirt
5. Ciro rakamlarını bin TL veya milyon TL cinsinden göster
6. Eğer veri yok veya yeterli değilse dürüstçe belirt

Yanıt formatı:
- Önce kısa özet (1-2 cümle)
- Sonra detay veya tablo
- Sonra iş yorumu (neden önemli, ne yapılabilir)
"""
```

### 6.3 Coach Agent (RAG + Catalog)

Amacı: Ürün katalog bilgisi + satış bağlamı ile danışmanlık yanıtı üret.

```python
COACH_SYSTEM_PROMPT = """
Sen KYK Yapı Kimyasalları'nın satış danışmanısın.
Ürün kataloğuna ve satış verilerine erişimin var.

Yaklaşım:
1. Ürün veya konuyu vector search ile bul (tool: search_catalog)
2. Varsa o ürünün satış performansını getir (tool: get_product_stats)
3. Teknik özellikleri + satış bağlamını birleştir
4. Müşteri tipine göre (müteahhit, kamu, bireysel) tonunu ayarla
5. Rakiplerle karşılaştırma yapma, KYK ürünlerini öne çıkar

Yanıt yapısı:
- Ürünün güçlü yönleri (teknik)
- Hangi problemleri çözdüğü (faydası)
- Doğru kullanım alanları
- Fiyat/değer argümanı (pahalı ürünse neden değer?)
"""
```

### 6.4 LLM Sağlayıcı Soyutlaması

**ÖNEMLİ:** LLM sağlayıcısı değiştirilebilir olmalı. `.env` dosyasındaki `LLM_PROVIDER` değişkeni ile kontrol edilir.

```python
# backend/services/llm_provider.py
import os
from typing import Optional

LLM_PROVIDER = os.getenv("LLM_PROVIDER", "claude")  # claude | openai | mistral | ollama

def get_llm_client():
    if LLM_PROVIDER == "claude":
        from anthropic import Anthropic
        return Anthropic(api_key=os.getenv("ANTHROPIC_API_KEY"))
    elif LLM_PROVIDER == "openai":
        from openai import OpenAI
        return OpenAI(api_key=os.getenv("OPENAI_API_KEY"))
    elif LLM_PROVIDER == "mistral":
        from mistralai import Mistral
        return Mistral(api_key=os.getenv("MISTRAL_API_KEY"))
    elif LLM_PROVIDER == "ollama":
        # Yerel model, API key yok
        from ollama import Client
        return Client(host=os.getenv("OLLAMA_HOST", "http://localhost:11434"))

# Demo için maliyet sıralaması:
# ollama (sıfır maliyet, yerel) < mistral-small < gpt-3.5-turbo < claude-haiku < gpt-4o < claude-sonnet
```

---

## 7. Demo Auth Sistemi

### Next.js Middleware (frontend/middleware.ts)

```typescript
import { NextRequest, NextResponse } from "next/server";

const DEMO_PASSWORD = process.env.DEMO_PASSWORD!;
const COOKIE_NAME = "kyk_demo_auth";

export function middleware(request: NextRequest) {
  // Login sayfası, API route'ları ve static dosyaları atla
  if (
    request.nextUrl.pathname.startsWith("/login") ||
    request.nextUrl.pathname.startsWith("/api") ||
    request.nextUrl.pathname.startsWith("/_next")
  )
    return NextResponse.next();

  const cookie = request.cookies.get(COOKIE_NAME);
  if (cookie?.value === DEMO_PASSWORD) return NextResponse.next();

  return NextResponse.redirect(new URL("/login", request.url));
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"],
};
```

### Vercel Ortam Değişkenleri

```
DEMO_PASSWORD=kyk2025demo
LLM_PROVIDER=claude
ANTHROPIC_API_KEY=sk-ant-...
NEXT_PUBLIC_API_URL=https://kyk-backend.railway.app
```

---

## 8. Önemli Geliştirme Kuralları

### Python / Backend

```bash
# ZORUNLU: Bu projedeki tüm Python komutlarını venv ile çalıştır
cd backend/
python -m venv .venv
source .venv/bin/activate   # Windows: .venv\Scripts\activate
pip install -r requirements.txt

# Agent çalıştırırken venv aktif olduğundan emin ol
# Eğer "ModuleNotFoundError" alıyorsan venv aktif değildir
which python  # /home/.../kyk-demo/backend/.venv/bin/python çıkmalı
```

**Agent instanslarına not:** Bu projede çalışıyorsan, bash komutlarından önce
`source backend/.venv/bin/activate` çalıştır veya `.venv/bin/python` ile çağır.

### DuckDB Sorgu Kalıpları

```python
import duckdb

# Bağlantı — CSV doğrudan okunur, tablo oluşturmaya gerek yok
conn = duckdb.connect()

# YoY karşılaştırma örneği
YOY_QUERY = """
SELECT
    urun_adi,
    SUM(CASE WHEN yil = 2023 THEN ciro_tl ELSE 0 END) AS ciro_2023,
    SUM(CASE WHEN yil = 2024 THEN ciro_tl ELSE 0 END) AS ciro_2024,
    ROUND(
        (SUM(CASE WHEN yil = 2024 THEN ciro_tl ELSE 0 END) /
         NULLIF(SUM(CASE WHEN yil = 2023 THEN ciro_tl ELSE 0 END), 0) - 1) * 100, 1
    ) AS degisim_pct
FROM read_csv_auto('kyk_satis_2022_2024.csv')
WHERE ay = ?
GROUP BY urun_adi
ORDER BY degisim_pct ASC
LIMIT 10
"""
result = conn.execute(YOY_QUERY, [3]).df()  # Mart ayı
```

### Frontend Kuralları

- Tüm API çağrıları `frontend/lib/api.ts` üzerinden
- Grafik bileşenleri `components/charts/` altında, her grafik kendi dosyasında
- Türkçe metin içerik `lib/i18n.ts` içinde (hardcode etme)
- Responsive: mobil + tablet + masaüstü çalışmalı (Tremor zaten responsive)

### Git Commit Mesajları

```
feat: ürün YoY karşılaştırma grafiği eklendi
fix: DuckDB bağlantı havuzu kapatma sorunu düzeltildi
data: mock veri mevsimsel ağırlıklar güncellendi
docs: CLAUDE.md LLM router bölümü güncellendi
```

---

## 9. Şu Anki Geliştirme Öncelikleri (Faz 1)

**Tamamlandı:**

- [x] Mock veri üreteci (`generate_mock_data.py`)
- [x] Proje mimarisi kararları
- [x] Tech stack seçimi

**Yapılacaklar (sırasıyla):**

1. [ ] FastAPI backend iskelet + DuckDB bağlantısı
2. [ ] Temel analitik endpoint'ler (YoY, kategori, bölge)
3. [ ] Next.js frontend iskelet + middleware auth
4. [ ] Ana dashboard sayfası (4 KPI kart + 2 grafik)
5. [ ] Ürün analizi sayfası
6. [ ] Türkiye haritası bileşeni
7. [ ] LLM intent router
8. [ ] Analytics agent (Text-to-DuckDB)
9. [ ] RAG catalog indexleme + coach agent
10. [ ] Sohbet botu UI
11. [ ] Vercel + Railway deploy
12. [ ] Demo şifre testi

---

## 10. İş Bağlamı — KYK Hakkında

- Tam adı: KYK Yapı Kimyasalları
- Merkez fabrika: Eskişehir OSB
- Diğer fabrikalar: Samsun, Adana, Diyarbakır, Aydın (İzmir bölgesi)
- Bölge ofisleri: Ankara, Antalya, İstanbul
- Ürün gamı: 8 kategori, 60+ ürün (yapıştırıcı → su yalıtım → tamir harçları)
- Hedef müşteri: İnşaat müteahhitleri, seramik uygulayıcıları, kamu ihaleleri
- Önemli ürün ailesi: Mantotherm (dış cephe ısı yalıtım sistemi) — sistemin tüm bileşenleri KYK
- Web: kyk.com.tr

### Satış Analizi için Önemli Bağlam

- İnşaat sektörü mevsimseldir: Türkiye'de kış (Aralık-Şubat) durgun, Nisan-Eylül aktif
- TL enflasyonu nedeniyle ciro TL bazında artıyor gibi görünse de hacim (kg) gerçek büyümeyi gösterir
- Pool ürünleri (Y105, D105) düşüşte — iklim + ekonomik baskı
- Premium esnek yapıştırıcılar (Y103, Y104, Y113) büyüyor — büyük format seramik trendi
- Su yalıtım segment büyüyor — iklim değişikliği farkındalığı, kentsel dönüşüm

---

## 11. Faz 3 — AI Görsel Üretim Pipeline (Referans)

Bu faz henüz geliştirmede değil. Tasarım kararları:

- **Tetikleyici:** Dashboard'da satış düşüşü tespit edilen ürün "kampanya adayı" flaglenir
- **Akış:** Düşüş tespiti → Uzman onayı 1 → Creative brief agent (LLM) → fal.ai/Kling AI → Görsel → Uzman onayı 2 → R2/S3 çıktısı
- **Sosyal medya formatları:** 1:1 (Instagram kare), 9:16 (Story/Reels), 1.91:1 (Feed)
- **API:** fal.ai (Kling AI v1.5 için tercih edilen gateway)
- **Human-in-the-loop:** Her iki onay adımı Streamlit veya basit web formu ile

---

_Son güncelleme: Proje başlangıç — Faz 1 geliştirme öncesi_
_Bu dosyayı her önemli mimari karar sonrasında güncelle._
