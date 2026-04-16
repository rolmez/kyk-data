"""
KYK Yapı Kimyasalları — Mock Satış Verisi Üretici
==================================================
Çıktı : kyk_satis_2022_2024.xlsx  (~25 000 satır)
        kyk_satis_2022_2024.csv   (aynı veri, DuckDB için)
Kullanım: python generate_mock_data.py
Gereksinimler: pip install pandas numpy openpyxl faker
"""

import pandas as pd
import numpy as np
import random
from datetime import date, timedelta

SEED = 42
random.seed(SEED)
np.random.seed(SEED)

# ─── ÜRÜNLER ─────────────────────────────────────────────────────────────────
# (kod, ad, kategori, baz_fiyat_2022_tl_kg, mevsim_peak_aylar, trend_2023, trend_2024)
# trend: satış hacminde yıllık değişim oranı (0.05 = %5 artış, -0.12 = %12 düşüş)
PRODUCTS = [
    # Yapıştırıcılar
    ("Y101", "MegaFix Y101",             "Yapıştırıcılar", 28,  [4,5,6,7,8,9],       -0.08, -0.12),
    ("Y102", "MegaGranit Y102",          "Yapıştırıcılar", 34,  [4,5,6,7,8,9],        0.03,  0.05),
    ("Y103", "MegaFlex Y103",            "Yapıştırıcılar", 40,  [4,5,6,7,8,9],        0.07,  0.10),
    ("Y104", "MegaFlex Maxi Y104",       "Yapıştırıcılar", 48,  [3,4,5,6,7,8,9,10],   0.12,  0.15),
    ("Y105", "MegaPool Y105",            "Yapıştırıcılar", 44,  [4,5,6,7,8],         -0.05, -0.18),
    ("Y111", "MegaPro Facade Y111",      "Yapıştırıcılar", 55,  [3,4,5,6,7,8,9,10],   0.09,  0.08),
    ("Y113", "MegaPro RapidFlex Y113",   "Yapıştırıcılar", 50,  [3,4,5,6,7,8,9,10],   0.15,  0.18),
    ("Y194", "Mantotherm Harcı Y194",    "Yapıştırıcılar", 36,  [9,10,11,3,4],         0.20,  0.22),
    ("ARF",  "ARTEFIX",                  "Yapıştırıcılar", 22,  [4,5,6,7,8,9],        -0.10, -0.15),
    ("ARFJ", "ARTEFIX Jel",              "Yapıştırıcılar", 26,  [4,5,6,7,8,9],         0.02,  0.05),
    # Derz Dolgular
    ("D102", "MegaFuga Sil D102",        "Derz Dolgular",  46,  [4,5,6,7,8,9],         0.04,  0.02),
    ("D103", "MegaFuga Flex D103",       "Derz Dolgular",  52,  [4,5,6,7,8,9],         0.06,  0.08),
    ("D105", "MegaFuga Pool D105",       "Derz Dolgular",  58,  [4,5,6,7,8],           -0.04, -0.16),
    ("D106", "MegaFuga Rustik D106",     "Derz Dolgular",  54,  [4,5,6,7,8,9],         0.03,  0.05),
    ("D201", "MegaFuga Flex D201",       "Derz Dolgular",  62,  [4,5,6,7,8,9],         0.25,  0.30),
    ("D501", "MegaEpoxy D501",           "Derz Dolgular", 185,  [3,4,5,6,7,8,9,10],    0.18,  0.20),
    # Su Yalıtım
    ("S102", "MegaIzo Lastik 7 S102",    "Su Yalıtım",     50,  [7,8,9,10,11,3,4],     0.05,  0.03),
    ("S103", "MegaIzo Lastik 10 S103",   "Su Yalıtım",     60,  [7,8,9,10,11,3,4],     0.08,  0.06),
    ("S104", "MegaIzo Lastik 11 S104",   "Su Yalıtım",     68,  [7,8,9,10,11,3,4],     0.10,  0.08),
    ("S105", "MegaIzo Lastik 15 S105",   "Su Yalıtım",     75,  [7,8,9,10,11,3,4],     0.12,  0.10),
    ("S201", "MegaIzo S201",             "Su Yalıtım",     88,  [7,8,9,10,11],          0.15,  0.18),
    ("S301", "MegaIzo K S301",           "Su Yalıtım",     65,  [8,9,10,11,3],          0.06,  0.04),
    ("S302", "MegaIzo 2K S302",          "Su Yalıtım",     78,  [8,9,10,11,3],          0.14,  0.16),
    ("S801", "MegaIzo S801",             "Su Yalıtım",     95,  [7,8,9,10,11],          0.30,  0.35),
    # Tamir Harçları
    ("T101", "MegaTamir I T101",         "Tamir Harçları", 33,  list(range(1,13)),       0.02,  0.01),
    ("T102", "MegaTamir K T102",         "Tamir Harçları", 36,  list(range(1,13)),       0.03,  0.02),
    ("T103", "MegaTamir I Yapısal T103", "Tamir Harçları", 44,  list(range(1,13)),       0.07,  0.08),
    ("T105", "MegaTamir Grout T105",     "Tamir Harçları", 58,  list(range(1,13)),       0.10,  0.12),
    ("T106", "MegaTamir T106",           "Tamir Harçları", 50,  list(range(1,13)),       0.05,  0.06),
    ("T108", "MegaTamir T108",           "Tamir Harçları", 62,  list(range(1,13)),       0.18,  0.22),
    # Zemin Malzemeleri
    ("Z101", "MegaZemin Z101",           "Zemin Malzemeleri", 31, [3,4,5,6,7,8,9,10],   0.04,  0.05),
    ("Z102", "MegaZemin Z102",           "Zemin Malzemeleri", 29, [3,4,5,6,7,8,9,10],   0.02,  0.01),
    ("Z121", "MegaZemin BYS Z121",       "Zemin Malzemeleri", 40, [3,4,5,6,7,8,9,10],   0.08,  0.10),
    # Sıvalar
    ("H101", "MegaSıva I H101",          "Sıvalar",        18,  [3,4,5,6,7,8,9,10],    -0.03, -0.05),
    ("H102", "MegaSıva K H102",          "Sıvalar",        16,  [3,4,5,6,7,8,9,10],    -0.05, -0.08),
    ("H103", "MegaSıva Saten H103",      "Sıvalar",        24,  [3,4,5,6,7,8,9,10],     0.04,  0.06),
    ("H107", "MegaSıva Makine Iç H107",  "Sıvalar",        21,  [3,4,5,6,7,8,9,10],     0.10,  0.12),
    ("H108", "MegaSıva Makine Dış H108", "Sıvalar",        22,  [4,5,6,7,8,9],          0.12,  0.14),
    ("H201", "MegaSıva H201",            "Sıvalar",        38,  [4,5,6,7,8,9],          0.20,  0.25),
    # Astarlar
    ("A101", "MegaFilm BB A101",         "Astarlar",       36,  [3,4,5,6,7,8,9,10],     0.05,  0.08),
    ("A201", "MegaFilm A201",            "Astarlar",       30,  [3,4,5,6,7,8,9,10],     0.03,  0.04),
    ("A203", "MegaFilm Visko A203",      "Astarlar",       48,  [3,4,5,6,7,8,9,10],     0.08,  0.10),
    ("A204", "MegaFilm BB A204",         "Astarlar",       34,  [3,4,5,6,7,8,9,10],     0.06,  0.08),
    # Katkılar ve Yardımcı
    ("K201", "MegaLatex K201",           "Katkılar",       44,  list(range(1,13)),       0.03,  0.04),
    ("K901", "MegaAntiFreeze K901",      "Katkılar",       58,  [10,11,12,1,2,3],        0.05,  0.08),
    ("K902", "MegaClean K902",           "Katkılar",       35,  list(range(1,13)),        0.02,  0.03),
]

# ─── BÖLGELER ─────────────────────────────────────────────────────────────────
# (kod, ad, merkez_sehir, pazar_agirligi)
REGIONS = [
    ("IST", "İstanbul Bölge",         "İstanbul",   0.29),
    ("ESK", "Eskişehir (Merkez)",     "Eskişehir",  0.18),
    ("IZM", "İzmir / Aydın Bölge",   "İzmir",      0.16),
    ("ANK", "Ankara Bölge",           "Ankara",     0.14),
    ("ANT", "Antalya Bölge",          "Antalya",    0.09),
    ("SAM", "Samsun Bölge",           "Samsun",     0.07),
    ("ADA", "Adana Bölge",            "Adana",      0.04),
    ("DIY", "Diyarbakır Bölge",       "Diyarbakır", 0.03),
]

REGION_CODES   = [r[0] for r in REGIONS]
REGION_NAMES   = {r[0]: r[1] for r in REGIONS}
REGION_CITIES  = {r[0]: r[2] for r in REGIONS}
REGION_WEIGHTS = [r[3] for r in REGIONS]

# ─── KANALLAR ─────────────────────────────────────────────────────────────────
CHANNELS = ["Bayi", "Direkt Satış", "İhracat", "E-Ticaret"]
CHANNEL_WEIGHTS = [0.55, 0.28, 0.12, 0.05]

# ─── MÜŞTERİ TİPLERİ ─────────────────────────────────────────────────────────
CUSTOMER_TYPES = ["Konut Müteahhidi", "Ticari Yapı", "Endüstriyel", "Kamu / İhale", "Bireysel"]
CUSTOMER_WEIGHTS = [0.35, 0.28, 0.18, 0.13, 0.06]

# ─── YARDIMCI FONKSİYONLAR ───────────────────────────────────────────────────

def enflasyon_fiyat(baz_fiyat: float, yil: int) -> float:
    """TL enflasyonu: 2023 %58, 2024 %45 kümülatif etki."""
    if yil == 2022:
        return baz_fiyat
    elif yil == 2023:
        return baz_fiyat * 1.58
    else:  # 2024
        return baz_fiyat * 1.58 * 1.45


def mevsim_carpani(ay: int, peak_aylar: list) -> float:
    """Peak aylarda satış hacmi 1.4-1.8x, düşük aylarda 0.5-0.7x."""
    if ay in peak_aylar:
        return np.random.uniform(1.35, 1.80)
    else:
        return np.random.uniform(0.45, 0.75)


def trend_carpani(yil: int, trend_2023: float, trend_2024: float) -> float:
    """Yıllık hacim trendi."""
    if yil == 2022:
        return 1.0
    elif yil == 2023:
        return 1.0 + trend_2023
    else:
        return (1.0 + trend_2023) * (1.0 + trend_2024)


def miktar_uret(birim_fiyat_tl: float) -> float:
    """Paket boyutlarına göre gerçekçi kg miktarı üret.
    - Ucuz ürünler (sıva, katkı) daha büyük miktarda satılır
    - Pahalı ürünler (epoksi) daha az
    """
    if birim_fiyat_tl > 150:   # Epoksi tipi premium
        base = np.random.choice([6, 15, 30], p=[0.50, 0.35, 0.15])
    elif birim_fiyat_tl > 80:  # Poliüretan / membran
        base = np.random.choice([20, 50, 100, 200], p=[0.30, 0.35, 0.25, 0.10])
    elif birim_fiyat_tl > 45:  # Elastik yapıştırıcı / derz
        base = np.random.choice([25, 50, 100, 250], p=[0.25, 0.35, 0.30, 0.10])
    else:                       # Sıva / katkı / temel yapıştırıcı
        base = np.random.choice([25, 50, 100, 250, 500], p=[0.20, 0.30, 0.30, 0.15, 0.05])

    # ±20% gürültü
    return round(base * np.random.uniform(0.80, 1.20), 1)


# ─── GÜNLÜK İŞLEM SAYISI ─────────────────────────────────────────────────────
def gunluk_islem_sayisi(d: date) -> int:
    """Hafta içi ~30, hafta sonu ~10, resmi tatil ~5 işlem."""
    if d.weekday() >= 5:  # Hf sonu
        return np.random.randint(6, 14)
    # Türkiye resmi tatilleri (yaklaşık)
    tatiller = {
        (1, 1), (4, 23), (5, 1), (5, 19),
        (7, 15), (8, 30), (10, 28), (10, 29)
    }
    if (d.month, d.day) in tatiller:
        return np.random.randint(3, 8)
    return np.random.randint(22, 40)


# ─── ANA ÜRETİCİ ─────────────────────────────────────────────────────────────
def uret_veri() -> pd.DataFrame:
    rows = []
    siparis_no = 100000

    start = date(2022, 1, 1)
    end   = date(2024, 12, 31)
    delta = end - start

    prod_df = pd.DataFrame(
        PRODUCTS,
        columns=["kod", "ad", "kategori", "baz_fiyat", "peak_aylar", "trend_23", "trend_24"]
    )

    for offset in range(delta.days + 1):
        d = start + timedelta(days=offset)
        n_islem = gunluk_islem_sayisi(d)

        for _ in range(n_islem):
            siparis_no += 1

            # Ürün seç (ağırlıklı: pahalı ürünler biraz daha az)
            urun = prod_df.sample(1).iloc[0]

            # Bölge seç
            bolge_kodu = np.random.choice(REGION_CODES, p=REGION_WEIGHTS)

            # Fiyat
            birim_fiyat = enflasyon_fiyat(urun["baz_fiyat"], d.year)
            birim_fiyat *= np.random.uniform(0.90, 1.10)  # fiyat varyasyonu

            # Hacim
            mevsim = mevsim_carpani(d.month, urun["peak_aylar"])
            trend  = trend_carpani(d.year, urun["trend_23"], urun["trend_24"])
            miktar = miktar_uret(birim_fiyat) * mevsim * trend
            miktar = max(round(miktar, 1), 1.0)

            # Ciro
            ciro = round(miktar * birim_fiyat, 2)

            # Maliyet (kar marjı ürüne ve kanala göre)
            kanal = np.random.choice(CHANNELS, p=CHANNEL_WEIGHTS)
            if kanal == "Bayi":
                marj = np.random.uniform(0.22, 0.32)
            elif kanal == "Direkt Satış":
                marj = np.random.uniform(0.30, 0.42)
            elif kanal == "İhracat":
                marj = np.random.uniform(0.15, 0.25)
            else:
                marj = np.random.uniform(0.28, 0.38)

            maliyet = round(ciro * (1 - marj), 2)
            kar     = round(ciro - maliyet, 2)

            musteri_tipi = np.random.choice(CUSTOMER_TYPES, p=CUSTOMER_WEIGHTS)

            rows.append({
                "siparis_id":     f"KYK-{siparis_no}",
                "tarih":           d.strftime("%Y-%m-%d"),
                "yil":             d.year,
                "ay":              d.month,
                "ay_adi":          ["Oca","Şub","Mar","Nis","May","Haz",
                                    "Tem","Ağu","Eyl","Eki","Kas","Ara"][d.month - 1],
                "ceyrek":         f"Q{(d.month - 1) // 3 + 1}",
                "urun_kodu":       urun["kod"],
                "urun_adi":        urun["ad"],
                "kategori":        urun["kategori"],
                "bolge_kodu":      bolge_kodu,
                "bolge_adi":       REGION_NAMES[bolge_kodu],
                "sehir":           REGION_CITIES[bolge_kodu],
                "kanal":           kanal,
                "musteri_tipi":    musteri_tipi,
                "miktar_kg":       miktar,
                "birim_fiyat_tl":  round(birim_fiyat, 2),
                "ciro_tl":         ciro,
                "maliyet_tl":      maliyet,
                "kar_tl":          kar,
                "kar_marji_pct":   round(marj * 100, 1),
            })

    df = pd.DataFrame(rows)
    df["tarih"] = pd.to_datetime(df["tarih"])
    df = df.sort_values("tarih").reset_index(drop=True)
    return df


# ─── KAYDET ───────────────────────────────────────────────────────────────────
if __name__ == "__main__":
    print("Veri üretiliyor… (bu 20-40 saniye sürebilir)")
    df = uret_veri()
    print(f"Toplam satır: {len(df):,}")
    print(f"Tarih aralığı: {df['tarih'].min().date()} → {df['tarih'].max().date()}")
    print(f"Toplam ciro (3 yıl): {df['ciro_tl'].sum():,.0f} TL")
    print()

    # CSV — DuckDB için
    csv_path = "kyk_satis_2022_2024.csv"
    df.to_csv(csv_path, index=False, encoding="utf-8-sig")
    print(f"CSV kaydedildi: {csv_path}")

    # Excel — Profesör pivot kontrolü için
    xlsx_path = "kyk_satis_2022_2024.xlsx"
    with pd.ExcelWriter(xlsx_path, engine="openpyxl") as writer:
        # Ana veri
        df.to_excel(writer, sheet_name="Satış_Verileri", index=False)

        # Özet pivot: yıl × kategori → ciro
        pivot1 = df.pivot_table(
            values="ciro_tl", index="kategori", columns="yil",
            aggfunc="sum"
        ).round(0)
        pivot1.to_excel(writer, sheet_name="Özet_Kategori_Yıl")

        # Özet pivot: yıl × ürün → ciro (top 20)
        top_urunler = df.groupby("urun_adi")["ciro_tl"].sum().nlargest(20).index
        pivot2 = df[df["urun_adi"].isin(top_urunler)].pivot_table(
            values="ciro_tl", index="urun_adi", columns="yil",
            aggfunc="sum"
        ).round(0)
        pivot2.to_excel(writer, sheet_name="Top20_Ürün_Yıl")

        # Özet pivot: yıl × bölge → ciro
        pivot3 = df.pivot_table(
            values="ciro_tl", index="bolge_adi", columns="yil",
            aggfunc="sum"
        ).round(0)
        pivot3.to_excel(writer, sheet_name="Özet_Bölge_Yıl")

        # Aylık trend (kategori bazında)
        df["yil_ay"] = df["tarih"].dt.to_period("M").astype(str)
        pivot4 = df.pivot_table(
            values="ciro_tl", index="yil_ay", columns="kategori",
            aggfunc="sum"
        ).round(0)
        pivot4.to_excel(writer, sheet_name="Aylık_Trend_Kategori")

    print(f"Excel kaydedildi: {xlsx_path}")
    print()
    print("=== Veri Kalite Özeti ===")
    print(f"Benzersiz ürün sayısı  : {df['urun_kodu'].nunique()}")
    print(f"Benzersiz bölge sayısı : {df['bolge_kodu'].nunique()}")
    print(f"Kanal dağılımı:\n{df['kanal'].value_counts(normalize=True).mul(100).round(1).to_string()}")
    print()
    print("=== Yıl × Kategori Ciro (TL) ===")
    print(
        df.pivot_table(values="ciro_tl", index="kategori", columns="yil", aggfunc="sum")
        .map(lambda x: f"{x:,.0f}" if pd.notna(x) else "").to_string()
    )
