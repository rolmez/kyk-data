"use client";

import { useEffect, useState } from "react";
import { fetchProductsList, fetchProductTrend, fetchAbcAnalysis, fetchGenerateMarketing, ProductListItem, MonthlyTrendData, ABCAnalysisItem, MarketingData } from "@/lib/api";
import { Card, Title, Subtitle, LineChart, Table, TableHead, TableRow, TableHeaderCell, TableBody, TableCell, Badge, Button } from "@tremor/react";

// Simple markdown bold parser
const renderMarkdownText = (text: string) => {
  return text.split('\n').map((line, i) => {
    if (!line.trim()) return <br key={i} />;
    
    // Parse bold text **bold**
    const parts = line.split(/(\*\*.*?\*\*)/g);
    return (
      <p key={i} className="mb-2">
        {parts.map((part, j) => {
          if (part.startsWith('**') && part.endsWith('**')) {
            return <strong key={j}>{part.slice(2, -2)}</strong>;
          }
           // Parse headers # Header
          if (part.startsWith('# ')) return <span key={j} className="text-xl font-bold block mb-2">{part.replace('# ', '')}</span>;
          if (part.startsWith('## ')) return <span key={j} className="text-lg font-bold block mb-2">{part.replace('## ', '')}</span>;
          return part;
        })}
      </p>
    );
  });
};

export default function UrunlerPage() {
  const [products, setProducts] = useState<ProductListItem[]>([]);
  const [selectedProduct, setSelectedProduct] = useState<string>("MegaFlex Y103");
  const [trendData, setTrendData] = useState<MonthlyTrendData[]>([]);
  const [abcData, setAbcData] = useState<ABCAnalysisItem[]>([]);
  const [isMarketingLoading, setIsMarketingLoading] = useState<boolean>(false);
  const [marketingResult, setMarketingResult] = useState<MarketingData | null>(null);

  useEffect(() => {
    // İlk yüklemede, ürün kodlarını ve genel abc analizini alıyoruz.
    const loadInitials = async () => {
      try {
        const [prodList, abc] = await Promise.all([
          fetchProductsList(),
          fetchAbcAnalysis()
        ]);
        setProducts(prodList);
        setAbcData(abc);
      } catch(err) {
        console.error("Initials fetch error", err);
      }
    };
    loadInitials();
  }, []);

  useEffect(() => {
    // Seçili ürün değiştikçe trendi çağır
    const loadTrend = async () => {
      if (!selectedProduct) return;
      try {
        const trend = await fetchProductTrend(selectedProduct);
        setTrendData(trend);
      } catch(err) {
        console.error("Trend fetch error", err);
      }
    };
    loadTrend();
    // Clear marketing result on product change
    setMarketingResult(null);
  }, [selectedProduct]);

  const handleGenerateMarketing = async () => {
    if (!selectedProduct) return;
    setIsMarketingLoading(true);
    setMarketingResult(null);
    try {
      const data = await fetchGenerateMarketing(selectedProduct);
      setMarketingResult(data);
    } catch (err) {
      console.error("Marketing generation error", err);
      alert("Pazarlama içeriği üretilirken bir hata oluştu. Fal Key'i veya bağlantıyı kontrol edin.");
    }
    setIsMarketingLoading(false);
  };

  return (
    <div className="p-8 space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-slate-800 dark:text-slate-100">Ürün Analizi</h1>
        <p className="text-slate-500">Ürün spesifik ciro katkı analizleri ve mevsimsel 3-yıllık trend haritası.</p>
      </div>

      <Card>
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-4 gap-4">
          <div>
            <Title>Aylık Satış Trendi (Hacim-KG)</Title>
            <Subtitle>{selectedProduct} ürününün 2022-2024 yılları arasındaki mevsimsel hareket grafiği</Subtitle>
          </div>
          <select 
            value={selectedProduct}
            onChange={(e) => setSelectedProduct(e.target.value)}
            className="border p-2 rounded-md bg-white dark:bg-slate-800 sm:w-1/3"
          >
            {products.map(p => (
              <option key={p.urun_adi} value={p.urun_adi}>{p.kategori} | {p.urun_adi}</option>
            ))}
          </select>
        </div>

        <LineChart
          className="h-80"
          data={trendData}
          index="ay_adi"
          categories={["2024", "2023", "2022"]}
          colors={["emerald", "blue", "slate"]}
          valueFormatter={(number) => Intl.NumberFormat("tr").format(number).toString()}
          yAxisWidth={64}
        />

        <div className="mt-6 border-t pt-6">
          <div className="flex flex-col sm:flex-row items-center justify-between">
            <div>
              <Title>Yapay Zeka ile Pazarlama İçeriği Üret</Title>
              <Subtitle>Seçili ürün için dergi kalitesinde PR içeriği ve profesyonel reklam görseli oluştur (Fal.ai Flux + Claude 4.5 Sonnet)</Subtitle>
            </div>
            <Button 
               size="lg" 
               color="emerald" 
               className="mt-4 sm:mt-0 shadow-lg"
               loading={isMarketingLoading}
               onClick={handleGenerateMarketing}
            >
              ✨ Dergi / PR Bülteni Üret
            </Button>
          </div>

          {marketingResult && (
            <div className="mt-8 grid grid-cols-1 lg:grid-cols-2 gap-8 bg-slate-50 dark:bg-slate-800/50 p-6 rounded-xl border border-slate-100 dark:border-slate-800">
              <div className="flex flex-col space-y-4">
                <Title className="text-emerald-600">Üretilen Kampanya Görseli</Title>
                <div className="rounded-xl overflow-hidden shadow-2xl ring-1 ring-slate-200 dark:ring-slate-700 aspect-video relative bg-slate-200 dark:bg-slate-700 animate-fade-in group">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={marketingResult.image_url} alt="Campaign Visual" className="object-cover w-full h-full transition-transform duration-700 group-hover:scale-105" />
                </div>
              </div>
              <div className="flex flex-col space-y-4">
                <Title className="text-indigo-600">PR Basın Bülteni</Title>
                <div className="prose prose-slate dark:prose-invert prose-sm md:prose-base bg-white dark:bg-slate-900 p-6 rounded-xl shadow-lg border border-slate-100 dark:border-slate-800 overflow-y-auto max-h-[500px]">
                   {renderMarkdownText(marketingResult.pr_article)}
                </div>
              </div>
            </div>
          )}
        </div>
      </Card>

      <Card>
        <Title>ABC Ciro Analizi (Kümülatif)</Title>
        <Subtitle>En çok kazandıran ürünler ve Pareto dağılım oranları (A İlk %70, B %20, C %10)</Subtitle>
        
        <Table className="mt-5 max-h-96 overflow-y-auto">
          <TableHead>
            <TableRow>
              <TableHeaderCell>Sınıf</TableHeaderCell>
              <TableHeaderCell>Ürün Adı</TableHeaderCell>
              <TableHeaderCell className="text-right">Kurum İçi Pay (%)</TableHeaderCell>
              <TableHeaderCell className="text-right">Kümülatif Pay (%)</TableHeaderCell>
              <TableHeaderCell className="text-right">Toplam Ciro (TL)</TableHeaderCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {abcData.map((item) => (
              <TableRow key={item.urun_adi}>
                <TableCell>
                  <Badge color={item.sinif === 'A' ? 'emerald' : item.sinif === 'B' ? 'blue' : 'slate'}>
                    {item.sinif}
                  </Badge>
                </TableCell>
                <TableCell>{item.urun_adi}</TableCell>
                <TableCell className="text-right">{item.pay_pct.toFixed(2)}%</TableCell>
                <TableCell className="text-right">{item.cumulative_pct.toFixed(2)}%</TableCell>
                <TableCell className="text-right">₺{(item.ciro / 1000000).toFixed(2)}M</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </Card>

    </div>
  );
}
