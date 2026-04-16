import duckdb
import os
import pandas as pd

CSV_PATH = os.path.join(os.path.dirname(os.path.dirname(os.path.dirname(__file__))), 'kyk_satis_2022_2024.csv')

def get_duckdb_connection():
    # Return a generic connection, DuckDB handles concurrent memory reads well enough for demo.
    return duckdb.connect()

def get_summary_stats(year: int, month: int = None) -> dict:
    conn = get_duckdb_connection()
    month_filter = "AND ay = ?" if month else ""
    params = [month, month] if month else []
    
    query = f"""
    SELECT 
        SUM(CASE WHEN yil = {year} THEN ciro_tl ELSE 0 END) as current_ciro,
        SUM(CASE WHEN yil = {year - 1} THEN ciro_tl ELSE 0 END) as previous_ciro
    FROM read_csv_auto('{CSV_PATH}')
    WHERE (yil = {year} OR yil = {year - 1}) {month_filter}
    """
    df = conn.execute(query, params).df()
    
    current_ciro = float(df['current_ciro'].iloc[0]) if not pd.isna(df['current_ciro'].iloc[0]) else 0
    previous_ciro = float(df['previous_ciro'].iloc[0]) if not pd.isna(df['previous_ciro'].iloc[0]) else 0
    
    yoy_pct = 0.0
    if previous_ciro > 0:
        yoy_pct = round(((current_ciro / previous_ciro) - 1.0) * 100, 1)
        
    return {
        "year": year,
        "month": month,
        "total_revenue": current_ciro,
        "yoy_growth_pct": yoy_pct
    }

def get_top_products(year: int, month: int = None, limit: int = 5, is_growing: bool = True) -> list:
    conn = get_duckdb_connection()
    month_filter = "AND ay = ?" if month else ""
    params = [month] if month else []
    order_dir = "DESC" if is_growing else "ASC"
    
    query = f"""
    SELECT
        urun_adi,
        kategori,
        SUM(CASE WHEN yil = {year} THEN miktar_kg ELSE 0 END) AS hacim_cur,
        SUM(CASE WHEN yil = {year - 1} THEN miktar_kg ELSE 0 END) AS hacim_prev,
        SUM(CASE WHEN yil = {year} THEN ciro_tl ELSE 0 END) AS ciro_cur,
        ROUND(
            (SUM(CASE WHEN yil = {year} THEN miktar_kg ELSE 0 END) /
             NULLIF(SUM(CASE WHEN yil = {year - 1} THEN miktar_kg ELSE 0 END), 0) - 1) * 100, 1
        ) AS degisim_pct
    FROM read_csv_auto('{CSV_PATH}')
    WHERE 1=1 {month_filter}
      AND (yil = {year} OR yil = {year - 1})
    GROUP BY urun_adi, kategori
    HAVING hacim_prev > 0
    ORDER BY degisim_pct {order_dir}
    LIMIT {limit}
    """
    df = conn.execute(query, params).df()
    return df.to_dict(orient="records")

def get_regional_sales(year: int, month: int = None) -> list:
    conn = get_duckdb_connection()
    month_filter = "ay = ? AND" if month else ""
    params = [month] if month else []
    
    query = f"""
    SELECT
        bolge_kodu,
        bolge_adi,
        SUM(ciro_tl) AS toplam_ciro,
        SUM(miktar_kg) AS toplam_miktar
    FROM read_csv_auto('{CSV_PATH}')
    WHERE {month_filter} yil = {year}
    GROUP BY bolge_kodu, bolge_adi
    ORDER BY toplam_ciro DESC
    """
    df = conn.execute(query, params).df()
    return df.to_dict(orient="records")

def get_category_sales(year: int, month: int = None) -> list:
    conn = get_duckdb_connection()
    month_filter = "ay = ? AND" if month else ""
    params = [month] if month else []
    
    query = f"""
    SELECT
        kategori,
        SUM(ciro_tl) AS toplam_ciro,
        SUM(miktar_kg) AS toplam_miktar
    FROM read_csv_auto('{CSV_PATH}')
    WHERE {month_filter} yil = {year}
    GROUP BY kategori
    ORDER BY toplam_ciro DESC
    """
    df = conn.execute(query, params).df()
    return df.to_dict(orient="records")

def get_products_list() -> list:
    conn = get_duckdb_connection()
    query = f"SELECT DISTINCT urun_adi, kategori FROM read_csv_auto('{CSV_PATH}') ORDER BY kategori, urun_adi"
    df = conn.execute(query).df()
    return df.to_dict(orient="records")

def get_product_trend(urun_adi: str) -> list:
    conn = get_duckdb_connection()
    query = f"""
    SELECT
        ay,
        ay_adi,
        SUM(CASE WHEN yil = 2022 THEN miktar_kg ELSE 0 END) AS "2022",
        SUM(CASE WHEN yil = 2023 THEN miktar_kg ELSE 0 END) AS "2023",
        SUM(CASE WHEN yil = 2024 THEN miktar_kg ELSE 0 END) AS "2024"
    FROM read_csv_auto('{CSV_PATH}')
    WHERE urun_adi = ?
    GROUP BY ay, ay_adi
    ORDER BY ay
    """
    df = conn.execute(query, [urun_adi]).df()
    return df.to_dict(orient="records")

def get_abc_analysis() -> list:
    conn = get_duckdb_connection()
    query = f"""
    WITH product_revenue AS (
        SELECT urun_adi, SUM(ciro_tl) as ciro
        FROM read_csv_auto('{CSV_PATH}')
        GROUP BY urun_adi
    ),
    total_revenue AS (
        SELECT SUM(ciro) as toplam_sirket_ciro FROM product_revenue
    ),
    ranked AS (
        SELECT 
            p.urun_adi, 
            p.ciro,
            (p.ciro / t.toplam_sirket_ciro) * 100 as pay_pct,
            SUM(p.ciro) OVER (ORDER BY p.ciro DESC) / t.toplam_sirket_ciro * 100 as cumulative_pct
        FROM product_revenue p, total_revenue t
    )
    SELECT 
        urun_adi, 
        ciro, 
        pay_pct,
        cumulative_pct,
        CASE 
            WHEN cumulative_pct <= 70.0 THEN 'A'
            WHEN cumulative_pct <= 90.0 THEN 'B'
            ELSE 'C'
        END as sinif
    FROM ranked
    ORDER BY ciro DESC
    """
    df = conn.execute(query).df()
    return df.to_dict(orient="records")

def get_kpi_cards(year: int) -> dict:
    conn = get_duckdb_connection()
    query = f"""
    SELECT
        COUNT(DISTINCT urun_adi) as aktif_urun,
        COUNT(DISTINCT siparis_id) as toplam_siparis,
        ROUND(SUM(kar_tl), 0) as toplam_kar,
        ROUND(AVG(kar_marji_pct), 1) as ort_kar_marji
    FROM read_csv_auto('{CSV_PATH}')
    WHERE yil = {year}
    """
    df = conn.execute(query).df()
    return {
        "aktif_urun": int(df['aktif_urun'].iloc[0]),
        "toplam_siparis": int(df['toplam_siparis'].iloc[0]),
        "toplam_kar": float(df['toplam_kar'].iloc[0]),
        "ort_kar_marji": float(df['ort_kar_marji'].iloc[0])
    }

def get_profitability_by_category(year: int) -> list:
    conn = get_duckdb_connection()
    query = f"""
    SELECT
        kategori,
        ROUND(SUM(ciro_tl), 0) as toplam_ciro,
        ROUND(SUM(kar_tl), 0) as toplam_kar,
        ROUND(SUM(maliyet_tl), 0) as toplam_maliyet,
        ROUND(AVG(kar_marji_pct), 1) as ort_kar_marji,
        ROUND(SUM(miktar_kg), 0) as toplam_hacim
    FROM read_csv_auto('{CSV_PATH}')
    WHERE yil = {year}
    GROUP BY kategori
    ORDER BY toplam_kar DESC
    """
    df = conn.execute(query).df()
    return df.to_dict(orient="records")

def get_profitability_by_product(year: int, limit: int = 10, most_profitable: bool = True) -> list:
    conn = get_duckdb_connection()
    order = "DESC" if most_profitable else "ASC"
    query = f"""
    SELECT
        urun_adi,
        kategori,
        ROUND(SUM(ciro_tl), 0) as toplam_ciro,
        ROUND(SUM(kar_tl), 0) as toplam_kar,
        ROUND(AVG(kar_marji_pct), 1) as ort_kar_marji,
        ROUND(SUM(miktar_kg), 0) as toplam_hacim
    FROM read_csv_auto('{CSV_PATH}')
    WHERE yil = {year}
    GROUP BY urun_adi, kategori
    HAVING toplam_kar > 0
    ORDER BY toplam_kar {order}
    LIMIT {limit}
    """
    df = conn.execute(query).df()
    return df.to_dict(orient="records")

def get_margin_trend(year: int) -> list:
    conn = get_duckdb_connection()
    query = f"""
    SELECT
        ay,
        ay_adi,
        ROUND(AVG(kar_marji_pct), 1) as ort_marj,
        ROUND(SUM(kar_tl), 0) as toplam_kar,
        ROUND(SUM(ciro_tl), 0) as toplam_ciro
    FROM read_csv_auto('{CSV_PATH}')
    WHERE yil = {year}
    GROUP BY ay, ay_adi
    ORDER BY ay
    """
    df = conn.execute(query).df()
    return df.to_dict(orient="records")
