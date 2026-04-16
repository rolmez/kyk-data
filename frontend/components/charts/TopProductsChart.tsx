"use client";

import { BarChart, Card, Title, Subtitle } from "@tremor/react";
import { ProductTrend } from "@/lib/api";

export function TopProductsChart({ data, title, subtitle }: { data: ProductTrend[], title: string, subtitle: string }) {
  return (
    <Card>
      <Title>{title}</Title>
      <Subtitle>{subtitle}</Subtitle>
      <BarChart
        className="mt-6 h-72"
        data={data}
        index="urun_adi"
        categories={["hacim_cur", "hacim_prev"]}
        colors={["blue", "slate"]}
        valueFormatter={(number) => Intl.NumberFormat("tr").format(number).toString() + " kg"}
        yAxisWidth={64}
      />
    </Card>
  );
}
