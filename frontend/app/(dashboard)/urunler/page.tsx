"use client";

import { useEffect, useState } from "react";
import { fetchProductsList, fetchProductTrend, fetchAbcAnalysis, ProductListItem, MonthlyTrendData, ABCAnalysisItem } from "@/lib/api";
import { Card, Title, Subtitle, LineChart, Table, TableHead, TableRow, TableHeaderCell, TableBody, TableCell, Badge } from "@tremor/react";

export default function UrunlerPage() {
  const [products, setProducts] = useState<ProductListItem[]>([]);
  const [selectedProduct, setSelectedProduct] = useState<string>("MegaFlex Y103");
  const [trendData, setTrendData] = useState<MonthlyTrendData[]>([]);
  const [abcData, setAbcData] = useState<ABCAnalysisItem[]>([]);

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
  }, [selectedProduct]);

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
