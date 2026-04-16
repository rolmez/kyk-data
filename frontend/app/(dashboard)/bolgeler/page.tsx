"use client";

import { useEffect, useState } from "react";
import { fetchRegionsData, RegionalSalesItem } from "@/lib/api";
import TurkeyMap from "@/components/map/TurkeyMap";
import { Card, Title, Subtitle, DonutChart, List, ListItem, Bold } from "@tremor/react";

export default function BolgelerPage() {
  const [selectedYear, setSelectedYear] = useState<number>(2024);
  const [regions, setRegions] = useState<RegionalSalesItem[]>([]);

  useEffect(() => {
    const loadData = async () => {
      try {
        const data = await fetchRegionsData(selectedYear);
        setRegions(data);
      } catch(err) {
        console.error("Regions fetch err", err);
      }
    };
    loadData();
  }, [selectedYear]);

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
              colors={["blue", "cyan", "indigo", "violet", "fuchsia"]}
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
    </div>
  );
}
