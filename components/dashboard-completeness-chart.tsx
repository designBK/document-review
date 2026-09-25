"use client";

import { Bar, BarChart, CartesianGrid, XAxis, YAxis } from "recharts";
import {
  Card,
  CardAction,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  ChartContainer,
  ChartLegend,
  ChartLegendContent,
  ChartTooltip,
  ChartTooltipContent,
  type ChartConfig,
} from "@/components/ui/chart";
import type { DocumentCompletenessPoint } from "@/lib/dashboard-kpis";

const completenessChartConfig = {
  found: {
    label: "Found",
    color: "var(--chart-2)",
  },
  missing: {
    label: "Missing",
    color: "var(--destructive)",
  },
} satisfies ChartConfig;

type DashboardCompletenessChartProps = {
  data: DocumentCompletenessPoint[];
};

export function DashboardCompletenessChart({
  data,
}: DashboardCompletenessChartProps) {
  return (
    <Card>
      <CardHeader className="border-b">
        <CardTitle>Document completeness</CardTitle>
        <CardDescription>Found vs. missing by doc type</CardDescription>
        <CardAction>
          <span className="rounded-md border border-border px-2 py-0.5 text-[0.625rem] font-medium text-muted-foreground">
            Bar
          </span>
        </CardAction>
      </CardHeader>
      <CardContent className="pt-(--card-spacing)">
        <ChartContainer
          config={completenessChartConfig}
          className="aspect-auto h-56 w-full"
        >
          <BarChart
            data={data}
            margin={{ left: 0, right: 8, top: 8, bottom: 0 }}
          >
            <CartesianGrid vertical={false} strokeDasharray="3 3" />
            <XAxis
              dataKey="docType"
              tickLine={false}
              axisLine={false}
              tickMargin={8}
            />
            <YAxis
              tickLine={false}
              axisLine={false}
              tickMargin={8}
              allowDecimals={false}
              width={28}
            />
            <ChartTooltip content={<ChartTooltipContent />} />
            <ChartLegend content={<ChartLegendContent />} />
            <Bar
              dataKey="found"
              fill="var(--color-found)"
              radius={[3, 3, 0, 0]}
            />
            <Bar
              dataKey="missing"
              fill="var(--color-missing)"
              radius={[3, 3, 0, 0]}
            />
          </BarChart>
        </ChartContainer>
      </CardContent>
    </Card>
  );
}
