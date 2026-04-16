"use client";

import { useEffect, useState } from "react";
import { fetchSummaryStats, fetchTopGrowingProducts, fetchTopDecliningProducts, fetchKpiCards, SummaryStats, ProductTrend, KpiCards } from "@/lib/api";
import { TopProductsChart } from "@/components/charts/TopProductsChart";
import { Card, Metric, Text, BadgeDelta, Grid } from "@tremor/react";

export default function Dashboard() {
  const [selectedYear, setSelectedYear] = useState(2024);
  const [summary, setSummary] = useState<SummaryStats | null>(null);
  const [kpi, setKpi] = useState<KpiCards | null>(null);
  const [topGrowing, setTopGrowing] = useState<ProductTrend[]>([]);
  const [topDeclining, setTopDeclining] = useState<ProductTrend[]>([]);

  useEffect(() => {
    const loadData = async () => {
      try {
        const [sumData, growingData, decliningData, kpiData] = await Promise.all([
          fetchSummaryStats(selectedYear),
          fetchTopGrowingProducts(selectedYear),
          fetchTopDecliningProducts(selectedYear),
          fetchKpiCards(selectedYear),
        ]);
        setSummary(sumData);
        setTopGrowing(growingData);
        setTopDeclining(decliningData);
        setKpi(kpiData);
      } catch (err) {
        console.error("Error fetching data", err);
      }
    };
    loadData();
  }, [selectedYear]);

  return (
    <div className="p-8">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-3xl font-bold text-slate-800 dark:text-slate-100">KYK Satış Analiz Özeti</h1>
          <p className="text-slate-500">Yıllık performans göstergeleri ve ürün bazlı büyüme/gerileme haritası.</p>
        </div>
        <div className="flex items-center gap-2">
          <label className="text-sm font-medium">Satış Yılı:</label>
          <select 
            value={selectedYear} 
            onChange={e => setSelectedYear(parseInt(e.target.value))}
            className="border p-2 rounded-md bg-white dark:bg-slate-800"
          >
            <option value={2024}>2024</option>
            <option value={2023}>2023</option>
            <option value={2022}>2022</option>
          </select>
        </div>
      </div>
      
      <Grid numItemsSm={2} numItemsLg={4} className="gap-4">
        <Card decoration="top" decorationColor="blue">
          <Text>Toplam Ciro</Text>
          <Metric>
            {summary ? `₺${(summary.total_revenue / 1000000).toFixed(2)}M` : 'Yükleniyor...'}
          </Metric>
        </Card>
        <Card decoration="top" decorationColor={(summary?.yoy_growth_pct ?? 0) > 0 ? "emerald" : "rose"}>
          <Text>YoY Büyüme (Ciro)</Text>
          <div className="flex items-center space-x-2 mt-2">
            <Metric>{summary ? `${summary.yoy_growth_pct}%` : '...'}</Metric>
            {summary && (
              <BadgeDelta deltaType={summary.yoy_growth_pct > 0 ? "moderateIncrease" : "moderateDecrease"} />
            )}
          </div>
        </Card>
        <Card decoration="top" decorationColor="amber">
          <Text>Aktif Ürün Sayısı</Text>
          <Metric>{kpi ? kpi.aktif_urun : '...'}</Metric>
        </Card>
        <Card decoration="top" decorationColor="indigo">
          <Text>Toplam Sipariş</Text>
          <Metric>{kpi ? Intl.NumberFormat("tr").format(kpi.toplam_siparis) : '...'}</Metric>
        </Card>
      </Grid>

      {/* İkinci satır: Kar metrikleri */}
      <Grid numItemsSm={2} numItemsLg={2} className="gap-4 mt-4">
        <Card decoration="top" decorationColor="emerald">
          <Text>Toplam Brüt Kar</Text>
          <Metric>{kpi ? `₺${(kpi.toplam_kar / 1000000).toFixed(2)}M` : '...'}</Metric>
        </Card>
        <Card decoration="top" decorationColor={(kpi?.ort_kar_marji ?? 0) > 30 ? "emerald" : "rose"}>
          <Text>Ortalama Kar Marjı</Text>
          <div className="flex items-center space-x-2 mt-2">
            <Metric>{kpi ? `%${kpi.ort_kar_marji}` : '...'}</Metric>
            {kpi && (
              <BadgeDelta deltaType={kpi.ort_kar_marji > 30 ? "moderateIncrease" : "moderateDecrease"} />
            )}
          </div>
        </Card>
      </Grid>
      
      {selectedYear === 2022 ? (
        <div className="mt-6 p-6 bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-xl text-center">
          <p className="text-amber-700 dark:text-amber-300 font-medium">📌 2022 yılı için YoY (Yıldan Yıla) karşılaştırma yapılamıyor çünkü sistemde 2021 verisi bulunmuyor.</p>
          <p className="text-amber-600 dark:text-amber-400 text-sm mt-1">Lütfen 2023 veya 2024 yılını seçerek büyüme/gerileme analizlerini görüntüleyin.</p>
        </div>
      ) : (
        <div className="mt-6 grid grid-cols-1 md:grid-cols-2 gap-4">
          <TopProductsChart 
            data={topGrowing} 
            title="En Çok Büyüyen Ürünler (Hacim YoY)" 
            subtitle={`${selectedYear} yılı için hacimsel bazda pozitif büyüme gösteren 5 ürün`} 
          />
          <TopProductsChart 
            data={topDeclining} 
            title="En Çok Düşen Ürünler (Hacim YoY)" 
            subtitle={`${selectedYear} yılı için hacimsel bazda gerileme yaşayan 5 ürün`} 
          />
        </div>
      )}

    </div>
  );
}
