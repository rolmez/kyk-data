"use client";

import React, { useEffect, useState } from "react";
import ReactECharts from "echarts-for-react";
import * as echarts from "echarts";
import { RegionalSalesItem } from "@/lib/api";

const REGION_COORDINATES: Record<string, [number, number]> = {
  "İstanbul Bölge": [28.9784, 41.0082],
  "İzmir / Aydın Bölge": [27.1384, 38.4237],
  "Ankara Bölge": [32.8597, 39.9334],
  "Antalya Bölge": [30.7133, 36.8969],
  "Adana Bölge": [35.3213, 37.0000],
  "Samsun Bölge": [36.3361, 41.2867],
  "Diyarbakır Bölge": [40.2306, 37.9144],
  "Eskişehir (Merkez)": [30.5256, 39.7767]
};

export default function TurkeyMap({ data }: { data: RegionalSalesItem[] }) {
  const [mapLoaded, setMapLoaded] = useState(false);

  useEffect(() => {
    fetch("/turkey.json")
      .then((res) => res.json())
      .then((geoJson) => {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        echarts.registerMap("turkey", geoJson as any);
        setMapLoaded(true);
      });
  }, []);

  if (!mapLoaded) {
    return <div className="h-[450px] w-full flex items-center justify-center text-slate-500">Harita Yüklendi, Konfigüre ediliyor...</div>;
  }

  // Calculate dynamic point sizing
  const maxRevenue = data.length > 0 ? Math.max(...data.map(d => d.toplam_ciro)) : 1000000;

  const scatterData = data.map((item) => {
    const coords = REGION_COORDINATES[item.bolge_adi] || [35, 39];
    return {
      name: item.bolge_adi,
      value: [...coords, item.toplam_ciro], // Format: [Longitude, Latitude, ValueToDisplay]
      ciro: item.toplam_ciro,
      miktar: item.toplam_miktar
    };
  });

  const options = {
    backgroundColor: 'transparent',
    tooltip: {
      trigger: 'item',
      backgroundColor: 'rgba(15, 23, 42, 0.95)',
      borderColor: '#334155',
      textStyle: { color: '#f8fafc' },
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      formatter: function (params: any) {
        if (!params.data) return '';
        const ciroM = (params.data.ciro / 1000000).toFixed(2) + "M TL";
        return `<div class="font-bold text-lg mb-2">${params.name}</div>
                <div class="text-sm text-slate-300">Ciro Katkısı: <span class="text-blue-400 font-bold">${ciroM}</span></div>
                <div class="text-sm text-slate-300 mt-1">Hacim: <span class="text-slate-100">${params.data.miktar.toLocaleString('tr-TR')} KG</span></div>`;
      }
    },
    geo: {
      map: 'turkey',
      roam: true,
      zoom: 1.4,
      scaleLimit: { min: 1, max: 4 },
      itemStyle: {
        areaColor: '#1e293b', 
        borderColor: '#334155', 
        borderWidth: 1.5
      },
      emphasis: {
        itemStyle: {
          areaColor: '#0f172a'
        },
        label: {
          show: false
        }
      }
    },
    series: [
      {
        name: 'Bölgeler',
        type: 'effectScatter',
        coordinateSystem: 'geo',
        data: scatterData,
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        symbolSize: function (val: any) {
          const ratio = val[2] / maxRevenue;
          return Math.max(12, Math.min(35, Math.round(ratio * 35)));
        },
        itemStyle: {
          color: '#38bdf8', // Light Blue 400
          shadowBlur: 10,
          shadowColor: '#38bdf8'
        },
        emphasis: {
          itemStyle: {
             color: '#7dd3fc', // Light Blue 300
             borderColor: '#fff',
             borderWidth: 2
          }
        }
      }
    ]
  };

  return <ReactECharts option={options} style={{ height: "450px", width: "100%" }} />;
}
