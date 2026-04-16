"use client";

import { useEffect, useState } from "react";
import { fetchSummaryStats, fetchTopGrowingProducts, fetchTopDecliningProducts, SummaryStats, ProductTrend } from "@/lib/api";
import { TopProductsChart } from "@/components/charts/TopProductsChart";
import { Card, Metric, Text, BadgeDelta, Grid } from "@tremor/react";

export default function Dashboard() {
  const [selectedYear, setSelectedYear] = useState(2024);
  const [summary, setSummary] = useState<SummaryStats | null>(null);
  const [topGrowing, setTopGrowing] = useState<ProductTrend[]>([]);
  const [topDeclining, setTopDeclining] = useState<ProductTrend[]>([]);

  useEffect(() => {
    const loadData = async () => {
      try {
        const sumData = await fetchSummaryStats(selectedYear);
        const growingData = await fetchTopGrowingProducts(selectedYear);
        const decliningData = await fetchTopDecliningProducts(selectedYear);
        setSummary(sumData);
        setTopGrowing(growingData);
        setTopDeclining(decliningData);
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
          <p className="text-slate-500">Burası Dashboard ana yönetim panelidir.</p>
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
          <Metric>36</Metric>
        </Card>
        <Card decoration="top" decorationColor="indigo">
          <Text>Gerçekleşen Gönderim</Text>
          <Metric>1.204</Metric>
        </Card>
      </Grid>
      
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

    </div>
  );
}
