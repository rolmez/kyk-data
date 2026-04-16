from fastapi import APIRouter, Query
from typing import Optional, List
from pydantic import BaseModel
from services import data_service

router = APIRouter(prefix="/api/analytics", tags=["analytics"])

# Pydantic Models
class SummaryStatsResponse(BaseModel):
    year: int
    month: Optional[int] = None
    total_revenue: float
    yoy_growth_pct: float

class ProductTrend(BaseModel):
    urun_adi: str
    kategori: str
    hacim_cur: float
    hacim_prev: float
    ciro_cur: float
    degisim_pct: Optional[float] = None

class RegionalSales(BaseModel):
    bolge_kodu: str
    bolge_adi: str
    toplam_ciro: float
    toplam_miktar: float

class CategorySales(BaseModel):
    kategori: str
    toplam_ciro: float
    toplam_miktar: float

@router.get("/summary", response_model=SummaryStatsResponse)
def get_summary(
    year: int = Query(2024, description="Analysis year"),
    month: Optional[int] = Query(None, description="Analysis month (1-12)")
):
    """Returns total revenue and year-over-year growth percentage."""
    return data_service.get_summary_stats(year=year, month=month)

@router.get("/products/top-growing", response_model=List[ProductTrend])
def get_top_growing_products(
    year: int = Query(2024),
    month: Optional[int] = Query(None),
    limit: int = Query(5)
):
    """Returns top N products with the highest YoY volume growth."""
    return data_service.get_top_products(year=year, month=month, limit=limit, is_growing=True)

@router.get("/products/top-declining", response_model=List[ProductTrend])
def get_top_declining_products(
    year: int = Query(2024),
    month: Optional[int] = Query(None),
    limit: int = Query(5)
):
    """Returns top N products with the highest YoY volume decline."""
    return data_service.get_top_products(year=year, month=month, limit=limit, is_growing=False)

@router.get("/regions", response_model=List[RegionalSales])
def get_regions(
    year: int = Query(2024),
    month: Optional[int] = Query(None)
):
    """Returns sales grouped by region."""
    return data_service.get_regional_sales(year=year, month=month)

@router.get("/categories", response_model=List[CategorySales])
def get_categories(
    year: int = Query(2024),
    month: Optional[int] = Query(None)
):
    """Returns sales grouped by product category."""
    return data_service.get_category_sales(year=year, month=month)

@router.get("/products/list")
def get_products_list():
    """Returns unique list of products."""
    return data_service.get_products_list()

@router.get("/products/trend")
def get_product_trend(urun_adi: str = Query(..., description="Product name to analyze")):
    """Returns monthly sales volume trend across years for a product."""
    return data_service.get_product_trend(urun_adi=urun_adi)

@router.get("/products/abc-analysis")
def get_abc_analysis():
    """Returns the ABC revenue classification of all products."""
    return data_service.get_abc_analysis()
