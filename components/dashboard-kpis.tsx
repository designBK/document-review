import {
  Card,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import type { DashboardKpi } from "@/lib/dashboard-kpis";

type DashboardKpisProps = {
  kpis: DashboardKpi[];
  loading?: boolean;
};

export function DashboardKpis({ kpis, loading = false }: DashboardKpisProps) {
  return (
    <div className="grid grid-cols-2 gap-3 lg:grid-cols-5">
      {kpis.map((kpi) => (
        <Card key={kpi.id} size="sm">
          <CardHeader>
            <CardDescription title={kpi.description}>{kpi.label}</CardDescription>
            <CardTitle className="text-2xl tabular-nums tracking-tight">
              {loading ? "—" : kpi.count}
            </CardTitle>
          </CardHeader>
        </Card>
      ))}
    </div>
  );
}
