"use client";

import { useEffect, useState } from "react";
import { fetchProfitByCategory, fetchProfitByProduct, fetchMarginTrend, ProfitCategory, ProfitProduct, MarginTrend } from "@/lib/api";
import { Card, Title, Subtitle, BarChart, LineChart, Table, TableHead, TableRow, TableHeaderCell, TableBody, TableCell, Badge } from "@tremor/react";

export default function KarlilikPage() {
  const [selectedYear, setSelectedYear] = useState(2024);
  const [categories, setCategories] = useState<ProfitCategory[]>([]);
  const [topProducts, setTopProducts] = useState<ProfitProduct[]>([]);
  const [bottomProducts, setBottomProducts] = useState<ProfitProduct[]>([]);
  const [marginTrend, setMarginTrend] = useState<MarginTrend[]>([]);

  useEffect(() => {
    const load = async () => {
      try {
        const [cats, top, bottom, trend] = await Promise.all([
          fetchProfitByCategory(selectedYear),
          fetchProfitByProduct(selectedYear, 10, true),
          fetchProfitByProduct(selectedYear, 10, false),
          fetchMarginTrend(selectedYear),
        ]);
        setCategories(cats);
        setTopProducts(top);
        setBottomProducts(bottom);
        setMarginTrend(trend);
      } catch (err) {
        console.error("Profitability fetch error", err);
      }
    };
    load();
  }, [selectedYear]);

  const trendData = marginTrend.map(m => ({
    ay: m.ay_adi,
    "Kar Marjı (%)": m.ort_marj,
    "Toplam Kar (₺M)": +(m.toplam_kar / 1000000).toFixed(2),
  }));

  const categoryBarData = categories.map(c => ({
    kategori: c.kategori,
    "Ciro (₺M)": +(c.toplam_ciro / 1000000).toFixed(2),
    "Kar (₺M)": +(c.toplam_kar / 1000000).toFixed(2),
  }));

  return (
    <div className="p-8 space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-slate-800 dark:text-slate-100">Karlılık Analizi</h1>
          <p className="text-slate-500">Kategori ve ürün bazlı brüt kar, maliyet ve marj analizi.</p>
        </div>
        <div className="flex items-center gap-2 bg-white dark:bg-slate-800 p-2 rounded-md shadow-sm border border-slate-200 dark:border-slate-700">
          <label className="text-sm font-medium pl-2">Yıl:</label>
          <select
            value={selectedYear}
            onChange={e => setSelectedYear(parseInt(e.target.value))}
            className="bg-transparent font-semibold focus:outline-none p-1"
          >
            <option value={2024}>2024</option>
            <option value={2023}>2023</option>
            <option value={2022}>2022</option>
          </select>
        </div>
      </div>

      {/* Aylık Kar Marjı Trendi */}
      <Card>
        <Title>Aylık Kar Marjı Trendi</Title>
        <Subtitle>{selectedYear} yılında aylara göre ortalama brüt kar marjı değişimi</Subtitle>
        <LineChart
          className="h-72 mt-4"
          data={trendData}
          index="ay"
          categories={["Kar Marjı (%)"]}
          colors={["emerald"]}
          valueFormatter={(v) => `%${v}`}
          yAxisWidth={48}
        />
      </Card>

      {/* Kategori Bazlı Ciro vs Kar */}
      <Card>
        <Title>Kategori Bazlı Ciro vs Brüt Kar</Title>
        <Subtitle>Her ürün kategorisinin toplam cirosu ve elde edilen brüt kar karşılaştırması</Subtitle>
        <BarChart
          className="h-80 mt-4"
          data={categoryBarData}
          index="kategori"
          categories={["Ciro (₺M)", "Kar (₺M)"]}
          colors={["blue", "emerald"]}
          valueFormatter={(v) => `₺${v}M`}
          yAxisWidth={56}
        />
      </Card>

      {/* Kategori Detay Tablosu */}
      <Card>
        <Title>Kategori Detay Tablosu</Title>
        <Subtitle>Tüm metriklerin kategori bazlı kırılımı</Subtitle>
        <Table className="mt-4">
          <TableHead>
            <TableRow>
              <TableHeaderCell>Kategori</TableHeaderCell>
              <TableHeaderCell className="text-right">Toplam Ciro</TableHeaderCell>
              <TableHeaderCell className="text-right">Toplam Kar</TableHeaderCell>
              <TableHeaderCell className="text-right">Maliyet</TableHeaderCell>
              <TableHeaderCell className="text-right">Kar Marjı</TableHeaderCell>
              <TableHeaderCell className="text-right">Hacim (KG)</TableHeaderCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {categories.map((c) => (
              <TableRow key={c.kategori}>
                <TableCell className="font-medium">{c.kategori}</TableCell>
                <TableCell className="text-right">₺{(c.toplam_ciro / 1000000).toFixed(2)}M</TableCell>
                <TableCell className="text-right text-emerald-600 font-semibold">₺{(c.toplam_kar / 1000000).toFixed(2)}M</TableCell>
                <TableCell className="text-right">₺{(c.toplam_maliyet / 1000000).toFixed(2)}M</TableCell>
                <TableCell className="text-right">
                  <Badge color={c.ort_kar_marji > 30 ? "emerald" : c.ort_kar_marji > 25 ? "amber" : "rose"}>
                    %{c.ort_kar_marji}
                  </Badge>
                </TableCell>
                <TableCell className="text-right">{Intl.NumberFormat("tr").format(c.toplam_hacim)} kg</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </Card>

      {/* En Karlı ve En Az Karlı Ürünler */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <Title className="text-emerald-600">🏆 En Karlı 10 Ürün</Title>
          <Table className="mt-4">
            <TableHead>
              <TableRow>
                <TableHeaderCell>Ürün</TableHeaderCell>
                <TableHeaderCell className="text-right">Brüt Kar</TableHeaderCell>
                <TableHeaderCell className="text-right">Marj</TableHeaderCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {topProducts.map((p) => (
                <TableRow key={p.urun_adi}>
                  <TableCell>
                    <div>
                      <span className="font-medium">{p.urun_adi}</span>
                      <span className="text-xs text-slate-400 ml-2">{p.kategori}</span>
                    </div>
                  </TableCell>
                  <TableCell className="text-right text-emerald-600 font-semibold">₺{(p.toplam_kar / 1000000).toFixed(2)}M</TableCell>
                  <TableCell className="text-right">
                    <Badge color="emerald">%{p.ort_kar_marji}</Badge>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </Card>

        <Card>
          <Title className="text-rose-600">⚠️ En Düşük Karlı 10 Ürün</Title>
          <Table className="mt-4">
            <TableHead>
              <TableRow>
                <TableHeaderCell>Ürün</TableHeaderCell>
                <TableHeaderCell className="text-right">Brüt Kar</TableHeaderCell>
                <TableHeaderCell className="text-right">Marj</TableHeaderCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {bottomProducts.map((p) => (
                <TableRow key={p.urun_adi}>
                  <TableCell>
                    <div>
                      <span className="font-medium">{p.urun_adi}</span>
                      <span className="text-xs text-slate-400 ml-2">{p.kategori}</span>
                    </div>
                  </TableCell>
                  <TableCell className="text-right text-rose-600 font-semibold">₺{(p.toplam_kar / 1000000).toFixed(2)}M</TableCell>
                  <TableCell className="text-right">
                    <Badge color={p.ort_kar_marji < 25 ? "rose" : "amber"}>%{p.ort_kar_marji}</Badge>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </Card>
      </div>
    </div>
  );
}
