"use client";

import { useEffect, useState } from "react";
import { fetchRegionsData, fetchRegionalYoY, fetchRegionCategoryBreakdown, RegionalSalesItem, RegionalYoY, RegionCategoryItem } from "@/lib/api";
import TurkeyMap from "@/components/map/TurkeyMap";
import { Card, Title, Subtitle, DonutChart, List, ListItem, Bold, BarChart, Table, TableHead, TableRow, TableHeaderCell, TableBody, TableCell, Badge } from "@tremor/react";

export default function BolgelerPage() {
  const [selectedYear, setSelectedYear] = useState<number>(2024);
  const [regions, setRegions] = useState<RegionalSalesItem[]>([]);
  const [yoyData, setYoyData] = useState<RegionalYoY[]>([]);
  const [categoryBreakdown, setCategoryBreakdown] = useState<RegionCategoryItem[]>([]);
  const [selectedRegion, setSelectedRegion] = useState<string>("");

  useEffect(() => {
    const loadData = async () => {
      try {
        const [regData, yoy, catBreak] = await Promise.all([
          fetchRegionsData(selectedYear),
          fetchRegionalYoY(selectedYear),
          fetchRegionCategoryBreakdown(selectedYear),
        ]);
        setRegions(regData);
        setYoyData(yoy);
        setCategoryBreakdown(catBreak);
      } catch(err) {
        console.error("Regions fetch err", err);
      }
    };
    loadData();
  }, [selectedYear]);

  const yoyBarData = yoyData.map(r => ({
    bolge: r.bolge_adi,
    "YoY Değişim (%)": r.degisim_pct,
  }));

  // Seçili bölgenin kategori kırılımı
  const filteredCategories = selectedRegion
    ? categoryBreakdown.filter(c => c.bolge_adi === selectedRegion)
    : [];

  // Tüm unique bölge isimleri
  const regionNames = Array.from(new Set(categoryBreakdown.map(c => c.bolge_adi)));

  return (
    <div className="p-8 space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-slate-800 dark:text-slate-100">Bölgesel Ciro Analizi</h1>
          <p className="text-slate-500">Türkiye üzerindeki ana satış merkezlerinin yıllık performans dağılımı.</p>
        </div>
        <div className="flex items-center gap-2 bg-white dark:bg-slate-800 p-2 rounded-md shadow-sm border border-slate-200 dark:border-slate-700">
            <label className="text-sm font-medium pl-2">Gösterge Yılı:</label>
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

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* HARİTA 2 KOLON YER KAPLAR */}
        <Card className="lg:col-span-2">
          <Title>Türkiye Koordinat Haritası (Ciroya Göre Boyutlandırılmış Merkezler)</Title>
          <Subtitle>Merkezlere yaklaşarak ciro ve hacim hareketlerini Tooltipden inceleyebilirsiniz.</Subtitle>
          <div className="mt-4 border border-slate-100 dark:border-slate-800 rounded-lg overflow-hidden bg-slate-50 dark:bg-[#0b1120]">
            <TurkeyMap data={regions} />
          </div>
        </Card>

        {/* LİSTE/DONUT 1 KOLON YER KAPLAR */}
        <div className="space-y-6">
          <Card>
            <Title>Bölge Payları</Title>
            <DonutChart
              className="mt-6"
              data={regions}
              category="toplam_ciro"
              index="bolge_adi"
              valueFormatter={(val) => `₺${(val/1000000).toFixed(1)}M`}
              colors={["blue", "cyan", "indigo", "violet", "fuchsia", "emerald", "amber", "rose"]}
            />
          </Card>
          <Card>
             <Title>Ciro Listesi</Title>
             <List className="mt-4">
               {regions.map((item) => (
                 <ListItem key={item.bolge_kodu}>
                   <span>{item.bolge_adi}</span>
                   <Bold>₺{(item.toplam_ciro/1000000).toFixed(2)}M</Bold>
                 </ListItem>
               ))}
             </List>
          </Card>
        </div>
      </div>

      {/* YoY Bölgesel Büyüme */}
      {selectedYear !== 2022 && yoyBarData.length > 0 && (
        <Card>
          <Title>Bölgesel YoY Ciro Değişimi (%)</Title>
          <Subtitle>{selectedYear} vs {selectedYear - 1} — Hangi bölge büyüyor, hangisi geriliyor?</Subtitle>
          <BarChart
            className="h-72 mt-4"
            data={yoyBarData}
            index="bolge"
            categories={["YoY Değişim (%)"]}
            colors={["blue"]}
            valueFormatter={(v) => `${v > 0 ? '+' : ''}${v}%`}
            yAxisWidth={56}
          />
        </Card>
      )}

      {/* Bölge Bazlı Kategori Dağılımı */}
      <Card>
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-4">
          <div>
            <Title>Bölge Bazlı Kategori Dağılımı</Title>
            <Subtitle>Seçili bölgedeki ürün kategorilerinin ciro kırılımı</Subtitle>
          </div>
          <select
            value={selectedRegion}
            onChange={e => setSelectedRegion(e.target.value)}
            className="border p-2 rounded-md bg-white dark:bg-slate-800 sm:w-64"
          >
            <option value="">Bölge seçiniz...</option>
            {regionNames.map(name => (
              <option key={name} value={name}>{name}</option>
            ))}
          </select>
        </div>

        {selectedRegion ? (
          <Table className="mt-2">
            <TableHead>
              <TableRow>
                <TableHeaderCell>Kategori</TableHeaderCell>
                <TableHeaderCell className="text-right">Ciro</TableHeaderCell>
                <TableHeaderCell className="text-right">Hacim (KG)</TableHeaderCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {filteredCategories.map((c) => (
                <TableRow key={c.kategori}>
                  <TableCell>
                    <Badge color="blue">{c.kategori}</Badge>
                  </TableCell>
                  <TableCell className="text-right font-semibold">₺{(c.ciro / 1000000).toFixed(2)}M</TableCell>
                  <TableCell className="text-right">{Intl.NumberFormat("tr").format(c.hacim)} kg</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        ) : (
          <div className="py-8 text-center text-slate-400 text-sm">
            Yukarıdan bir bölge seçerek o bölgenin kategori bazlı ciro dağılımını görüntüleyin.
          </div>
        )}
      </Card>
    </div>
  );
}
