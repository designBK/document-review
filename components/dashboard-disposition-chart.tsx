"use client";

import { Area, AreaChart, CartesianGrid, XAxis, YAxis } from "recharts";
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
import type { DispositionMixPoint } from "@/lib/dashboard-kpis";

const dispositionChartConfig = {
  open: {
    label: "Open",
    color: "var(--chart-3)",
  },
  awaiting_client: {
    label: "Awaiting client",
    color: "var(--chart-2)",
  },
  manager_review: {
    label: "Manager review",
    color: "var(--primary)",
  },
  accepted: {
    label: "Accepted",
    color: "var(--chart-1)",
  },
  declined: {
    label: "Declined",
    color: "var(--destructive)",
  },
} satisfies ChartConfig;

type DashboardDispositionChartProps = {
  data: DispositionMixPoint[];
};

export function DashboardDispositionChart({
  data,
}: DashboardDispositionChartProps) {
  return (
    <Card>
      <CardHeader className="border-b">
        <CardTitle>Packet disposition mix</CardTitle>
        <CardDescription>
          Monthly volume by outcome across the review queue
        </CardDescription>
        <CardAction>
          <span className="rounded-md border border-border px-2 py-0.5 text-[0.625rem] font-medium text-muted-foreground">
            Area
          </span>
        </CardAction>
      </CardHeader>
      <CardContent className="pt-(--card-spacing)">
        <ChartContainer
          config={dispositionChartConfig}
          className="aspect-auto h-56 w-full"
        >
          <AreaChart
            data={data}
            margin={{ left: 0, right: 8, top: 8, bottom: 0 }}
          >
            <CartesianGrid vertical={false} strokeDasharray="3 3" />
            <XAxis
              dataKey="label"
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
            <Area
              type="monotone"
              dataKey="open"
              stackId="disposition"
              stroke="var(--color-open)"
              fill="var(--color-open)"
              fillOpacity={0.35}
            />
            <Area
              type="monotone"
              dataKey="awaiting_client"
              stackId="disposition"
              stroke="var(--color-awaiting_client)"
              fill="var(--color-awaiting_client)"
              fillOpacity={0.4}
            />
            <Area
              type="monotone"
              dataKey="manager_review"
              stackId="disposition"
              stroke="var(--color-manager_review)"
              fill="var(--color-manager_review)"
              fillOpacity={0.4}
            />
            <Area
              type="monotone"
              dataKey="accepted"
              stackId="disposition"
              stroke="var(--color-accepted)"
              fill="var(--color-accepted)"
              fillOpacity={0.45}
            />
            <Area
              type="monotone"
              dataKey="declined"
              stackId="disposition"
              stroke="var(--color-declined)"
              fill="var(--color-declined)"
              fillOpacity={0.35}
            />
          </AreaChart>
        </ChartContainer>
      </CardContent>
    </Card>
  );
}
