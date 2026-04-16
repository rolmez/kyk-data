const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

export interface SummaryStats {
  year: number;
  month?: number;
  total_revenue: number;
  yoy_growth_pct: number;
}

export interface ProductTrend {
  urun_adi: string;
  kategori: string;
  hacim_cur: number;
  hacim_prev: number;
  ciro_cur: number;
  degisim_pct: number;
}

export const fetchSummaryStats = async (year: number, month?: number): Promise<SummaryStats> => {
  const url = new URL(`${API_URL}/api/analytics/summary`);
  url.searchParams.append("year", year.toString());
  if (month) url.searchParams.append("month", month.toString());
  
  const res = await fetch(url.toString());
  if (!res.ok) throw new Error("Failed to fetch summary stats");
  return res.json();
};

export const fetchTopGrowingProducts = async (year: number, limit = 5): Promise<ProductTrend[]> => {
  const url = new URL(`${API_URL}/api/analytics/products/top-growing`);
  url.searchParams.append("year", year.toString());
  url.searchParams.append("limit", limit.toString());
  const res = await fetch(url.toString());
  if (!res.ok) throw new Error("Failed to fetch top growing products");
  return res.json();
};

export const fetchTopDecliningProducts = async (year: number, limit = 5): Promise<ProductTrend[]> => {
  const url = new URL(`${API_URL}/api/analytics/products/top-declining`);
  url.searchParams.append("year", year.toString());
  url.searchParams.append("limit", limit.toString());
  const res = await fetch(url.toString());
  if (!res.ok) throw new Error("Failed to fetch top declining products");
  return res.json();
};

export interface RegionalSalesItem {
  bolge_kodu: string;
  bolge_adi: string;
  toplam_ciro: number;
  toplam_miktar: number;
}

export const fetchRegionsData = async (year: number): Promise<RegionalSalesItem[]> => {
  const url = new URL(`${API_URL}/api/analytics/regions`);
  url.searchParams.append("year", year.toString());
  const res = await fetch(url.toString());
  if (!res.ok) throw new Error("Failed to fetch regions data");
  return res.json();
};

export interface ProductListItem {
  urun_adi: string;
  kategori: string;
}

export interface MonthlyTrendData {
  ay: number;
  ay_adi: string;
  "2022": number;
  "2023": number;
  "2024": number;
}

export interface ABCAnalysisItem {
  urun_adi: string;
  ciro: number;
  pay_pct: number;
  cumulative_pct: number;
  sinif: string;
}

export const fetchProductsList = async (): Promise<ProductListItem[]> => {
  const res = await fetch(`${API_URL}/api/analytics/products/list`);
  if (!res.ok) throw new Error("Failed to fetch product list");
  return res.json();
};

export const fetchProductTrend = async (urun_adi: string): Promise<MonthlyTrendData[]> => {
  const url = new URL(`${API_URL}/api/analytics/products/trend`);
  url.searchParams.append("urun_adi", urun_adi);
  const res = await fetch(url.toString());
  if (!res.ok) throw new Error("Failed to fetch product trend");
  return res.json();
};

export const fetchAbcAnalysis = async (): Promise<ABCAnalysisItem[]> => {
  const res = await fetch(`${API_URL}/api/analytics/products/abc-analysis`);
  if (!res.ok) throw new Error("Failed to fetch ABC analysis");
  return res.json();
};

export interface MarketingData {
  image_url: string;
  pr_article: string;
}

export const fetchGenerateMarketing = async (urun_adi: string): Promise<MarketingData> => {
  const res = await fetch(`${API_URL}/api/marketing/generate`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ urun_adi }),
  });
  if (!res.ok) throw new Error("Failed to generate marketing material");
  return res.json();
};
