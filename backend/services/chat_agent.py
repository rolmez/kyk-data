import os
import duckdb
import json
from anthropic import Anthropic

BASE_DIR = os.path.dirname(os.path.dirname(os.path.dirname(__file__)))
CSV_PATH = os.path.join(BASE_DIR, 'kyk_satis_2022_2024.csv')

def query_sales_data_stream(history: list, new_question: str):
    anthropic_key = os.getenv("ANTHROPIC_API_KEY")
    client = Anthropic(api_key=anthropic_key)
    
    def emit_action(msg):
        return json.dumps({"type": "action", "content": msg}) + "\n"
        
    def emit_text(msg):
        return json.dumps({"type": "text", "content": msg}) + "\n"

    yield emit_action("🔍 Şema, hafıza ve geçmiş diyaloglar inceleniyor...")

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
DİKKAT: bolge_adi alanında arama yaparken her zaman ILIKE '%İzmir%' gibi esnek eşleşmeler kullan. Sadece SQL cümlesi yaz! Markdown veya "```sql" gibi tagler KULLANMA. Açıklama metni KULLANMA.
GÖREVİN 2: Eğer kullanıcının sorusu SQL gerektirmeyen bir muhabbetse SQL yazma, normal konuşarak cevap ver.
    """
    
    try:
        res1 = client.messages.create(
            model="claude-sonnet-4-5-20250929",
            max_tokens=600,
            messages=[{"role": "user", "content": system_prompt}]
        )
        sql_or_reply = res1.content[0].text.strip()
        sql_or_reply = sql_or_reply.replace('```sql', '').replace('```', '').strip()
        
        if sql_or_reply.upper().startswith("SELECT") or sql_or_reply.upper().startswith("WITH"):
            yield emit_action("⚙️ Veriler üzerinde SQL sorgusu çalıştırılarak ham rapor çekiliyor...")
            execute_query = sql_or_reply.replace("satislar", f"read_csv_auto('{CSV_PATH}')")
            conn = duckdb.connect()
            df = conn.execute(execute_query).df()
            conn.close()
            
            if len(df) > 20:
                df = df.head(20)
                
            data_str = df.to_string()
            
            yield emit_action("📊 Ham sonuçlar yapay zeka ile profesyonel dille sentezleniyor...")
            analysis_prompt = f"""
Kullanıcının Sorusu: {new_question}

Veritabanından çekilen gerçek ham veri sonuçları:
{data_str}

Buna dayanarak soruyu soran kişiye kibar, şık ve profesyonel bir veri analisti edasıyla doğrudan metin yazıp cevapla. Markdown kullanabilirsin. Parasal değerin sonuna TL koy.
"""
            
            with client.messages.stream(
                model="claude-sonnet-4-5-20250929",
                max_tokens=1024,
                messages=[{"role": "user", "content": analysis_prompt}]
            ) as stream:
                for text in stream.text_stream:
                    yield emit_text(text)
                    
            yield emit_action("✅ Tamamlandı")
        else:
            yield emit_action("💬 Sohbet yanıtı oluşturuluyor...")
            yield emit_text(sql_or_reply)
            yield emit_action("✅ Tamamlandı")

    except Exception as e:
         yield emit_text(f"Veri analizi sırasında bir hata meydana geldi: {str(e)}")
         yield emit_action("❌ Hata oluştu")
