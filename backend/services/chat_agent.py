import os
import duckdb
from anthropic import Anthropic

BASE_DIR = os.path.dirname(os.path.dirname(os.path.dirname(__file__)))
CSV_PATH = os.path.join(BASE_DIR, 'kyk_satis_2022_2024.csv')

def query_sales_data_with_memory(history: list, new_question: str) -> str:
    """Natively executes Text-to-SQL + Memory using Anthropics API to completely bypass LlamaIndex dependency hell."""
    anthropic_key = os.getenv("ANTHROPIC_API_KEY")
    client = Anthropic(api_key=anthropic_key)
    
    # 1. Hafızayı okunabilir bir metne çeviriyoruz (Geçmiş 4 mesaj)
    history_context = ""
    if history:
        history_context = "--- Önceki Sohbet Hafızası ---\n"
        for msg in history:
            role_name = "Yönetici (User)" if msg.role == "user" else "AI Asistan"
            history_context += f"{role_name}: {msg.content}\n"
        history_context += "-----------------------------\n"
        
    system_prompt = f"""
Sen KYK Yapı Kimyasalları firmasında uzman bir Veri Analisti ve Satış Koçusun.
Şirketin veritabanı "satislar" isminde tek bir DuckDB tablosundan oluşuyor.

Tablo Şeması:
- yil: Yıl (Örn: 2022, 2023, 2024)
- ay_adi: Ay adı (Örn: Ocak, Subat)
- bolge_adi: TAM OLARAK ŞUNLARDAN BİRİDİR: 'Antalya Bölge', 'İzmir / Aydın Bölge', 'Adana Bölge', 'Ankara Bölge', 'İstanbul Bölge', 'Samsun Bölge', 'Diyarbakır Bölge', 'Eskişehir (Merkez)'
- kategori: Ürün grubu
- urun_adi: Spesifik ürün (Örn: MegaFlex Y103)
- miktar_kg: KG cinsinden satılan hacim
- ciro_tl: TL cinsinden elde edilen gelir

{history_context}

Kullanıcının şu anki sorusu / talebi: {new_question}

GÖREVİN 1: Eğer kullanıcı veri soruyorsa, YALNIZCA çalışan temiz bir SQL sorgusu (DuckDB uyumlu) olarak yaz. 
DİKKAT: bolge_adi alanında arama yaparken her zaman ILIKE '%İzmir%' gibi esnek eşleşmeler kullan. Sadece SQL cümlesi yaz! Markdown veya "```sql" gibi tagler KULLANMA. Açıklama metni KULLANMA. (Örn: SELECT bolge_adi, SUM(ciro_tl) FROM satislar WHERE yil=2024 GROUP BY bolge_adi ORDER BY SUM(ciro_tl) DESC LIMIT 1;)
GÖREVİN 2: Eğer kullanıcının sorusu SQL gerektirmeyen (Örn: "Selam", "Teşekkür ederim", "Kolay gelsin") bir muhabbetse SQL yazma, normal konuşarak cevap ver.
    """
    
    try:
        # AŞAMA 1: SQL Üretimi
        res1 = client.messages.create(
            model="claude-sonnet-4-5-20250929",
            max_tokens=600,
            messages=[{"role": "user", "content": system_prompt}]
        )
        sql_or_reply = res1.content[0].text.strip()
        sql_or_reply = sql_or_reply.replace('```sql', '').replace('```', '').strip()
        
        # Eğer üretilen metin bir SQL sorgusu ise arkaplanda çalıştır
        if sql_or_reply.upper().startswith("SELECT") or sql_or_reply.upper().startswith("WITH"):
            # Replace 'satislar' with direct CSV read just like data_service does to prevent Linux/Mac DB format lock DB crashes
            execute_query = sql_or_reply.replace("satislar", f"read_csv_auto('{CSV_PATH}')")
            conn = duckdb.connect()
            df = conn.execute(execute_query).df()
            conn.close()
            
            # Veri çok büyükse ilk 20 satırı al
            if len(df) > 20:
                df = df.head(20)
                
            data_str = df.to_string()
            
            # AŞAMA 2: Çıkan saf veriyi yorumlayıp raporlama (Coach Engine)
            analysis_prompt = f"""
Kullanıcının Sorusu: {new_question}

Veritabanından çekilen gerçek ham veri sonuçları:
{data_str}

Buna dayanarak soruyu soran kişiye kibar, şık ve son derece profesyonel bir veri analisti edasıyla doğrudan analiz metni yazıp cevapla. Asla "Sayın Yöneticim", "Merhaba", "Saygılarımla" gibi mektup/e-posta giriş-çıkış ifadeleri KULLANMA. Doğrudan konuya ve sadede gir. Markdown kullanabilirsin (Kalınlaştırma, maddeler vb.) Sayıları okunaklı yaz. Parasal değerin sonuna TL koy.
            """
            
            res2 = client.messages.create(
                model="claude-sonnet-4-5-20250929",
                max_tokens=1024,
                messages=[{"role": "user", "content": analysis_prompt}]
            )
            return res2.content[0].text
        else:
            # SQL değilse direkt cevabı döndür
            return sql_or_reply

    except Exception as e:
        return f"Veri analizi sırasında bir hata meydana geldi: {str(e)}"
