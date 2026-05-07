import { useMemo } from "react";
import { useStore } from "@/lib/store";
import { Card } from "@/components/ui/card";
import {
  ResponsiveContainer, ComposedChart, Line, Area, XAxis, YAxis,
  CartesianGrid, Tooltip, Legend,
} from "recharts";
import { TrendingUp } from "lucide-react";

const fmt = (v: number) =>
  `€${v.toLocaleString("en", { minimumFractionDigits: 0, maximumFractionDigits: 0 })}`;
const fmt2 = (v: number) =>
  `€${v.toLocaleString("en", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

const MONTHS_BACK = 11; // show 12 buckets including current month

export function SavingsTrendChart() {
  const { data } = useStore();

  const series = useMemo(() => {
    const now = new Date();
    const buckets: { key: string; label: string; date: Date }[] = [];
    for (let i = MONTHS_BACK; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
      buckets.push({
        key: `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`,
        label: d.toLocaleDateString("en-GB", { month: "short", year: "2-digit" }),
        date: d,
      });
    }

    // Sum all fund entries per month
    const monthlyAdds: Record<string, number> = {};
    for (const g of data.savingsGoals) {
      for (const e of g.fundHistory ?? []) {
        const d = new Date(e.date);
        const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
        monthlyAdds[key] = (monthlyAdds[key] ?? 0) + e.amount;
      }
    }

    // Total saved today
    const totalSavedNow = data.savingsGoals.reduce((s, g) => s + g.currentAmount, 0);
    // Total contributions captured in history within window
    const addsInWindow = buckets.reduce((s, b) => s + (monthlyAdds[b.key] ?? 0), 0);
    // Baseline = saved before the window started
    const baseline = Math.max(0, totalSavedNow - addsInWindow);

    let running = baseline;
    const todayKey = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;

    // Target trajectory (linear from baseline at first bucket → totalTarget at latest target date)
    const totalTarget = data.savingsGoals.reduce((s, g) => s + g.targetAmount, 0);
    const latestTargetDate = data.savingsGoals
      .map(g => g.targetDate ? new Date(g.targetDate) : null)
      .filter((d): d is Date => !!d)
      .sort((a, b) => b.getTime() - a.getTime())[0];

    const startMs = buckets[0].date.getTime();
    const endMs = latestTargetDate ? latestTargetDate.getTime() : null;
    const totalSpan = endMs && endMs > startMs ? endMs - startMs : null;

    return buckets.map(b => {
      const isFuture = b.key > todayKey;
      const isCurrent = b.key === todayKey;
      const add = monthlyAdds[b.key] ?? 0;
      if (!isFuture) running += add;

      let target: number | null = null;
      if (totalSpan && totalTarget > 0) {
        const t = Math.min(1, Math.max(0, (b.date.getTime() - startMs) / totalSpan));
        target = baseline + (totalTarget - baseline) * t;
      }

      return {
        label: b.label,
        saved: isFuture ? null : Math.round(running * 100) / 100,
        target: target !== null ? Math.round(target * 100) / 100 : null,
        marker: isCurrent ? running : null,
      };
    });
  }, [data.savingsGoals]);

  const hasAnyTarget = series.some(s => s.target !== null);
  const hasAnyData = data.savingsGoals.length > 0;

  return (
    <Card className="glass-card p-5 space-y-3">
      <div className="flex items-center justify-between">
        <h3 className="section-title flex items-center gap-2">
          <TrendingUp className="h-4 w-4 text-muted-foreground" /> Savings over time
        </h3>
        <span className="text-[10px] uppercase tracking-wider text-muted-foreground">Last 12 months</span>
      </div>

      {hasAnyData ? (
        <div role="img" aria-label="Savings over the last 12 months, with optional target trajectory.">
          <ResponsiveContainer width="100%" height={240} minWidth={0}>
            <ComposedChart data={series} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
              <defs>
                <linearGradient id="savedFill" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="hsl(var(--savings))" stopOpacity={0.35} />
                  <stop offset="100%" stopColor="hsl(var(--savings))" stopOpacity={0.02} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" opacity={0.6} />
              <XAxis dataKey="label" tick={{ fontSize: 11, fill: "hsl(var(--muted-foreground))" }} tickLine={false} axisLine={false} interval="preserveStartEnd" />
              <YAxis
                tick={{ fontSize: 11, fill: "hsl(var(--muted-foreground))" }}
                tickFormatter={(v) => fmt(v)}
                tickLine={false} axisLine={false} width={55}
              />
              <Tooltip
                wrapperStyle={{ outline: "none", fontSize: 12 }}
                contentStyle={{
                  padding: "6px 10px", borderRadius: 8, fontSize: 12,
                  background: "hsl(var(--popover))", color: "hsl(var(--popover-foreground))",
                  border: "1px solid hsl(var(--border))",
                }}
                formatter={(value: any, name: string) => {
                  if (value === null || value === undefined) return ["—", name];
                  return [fmt2(Number(value)), name];
                }}
              />
              <Legend wrapperStyle={{ fontSize: 12, paddingTop: 6 }} iconType="line" />
              <Area
                type="monotone"
                dataKey="saved"
                name="Saved"
                stroke="hsl(var(--savings))"
                strokeWidth={2.5}
                fill="url(#savedFill)"
                connectNulls={false}
                dot={{ r: 2.5, fill: "hsl(var(--savings))", strokeWidth: 0 }}
                activeDot={{ r: 4 }}
                isAnimationActive={false}
              />
              {hasAnyTarget && (
                <Line
                  type="monotone"
                  dataKey="target"
                  name="Target trajectory"
                  stroke="hsl(var(--foreground))"
                  strokeOpacity={0.7}
                  strokeWidth={1.75}
                  strokeDasharray="5 4"
                  dot={false}
                  activeDot={false}
                  isAnimationActive={false}
                />
              )}
            </ComposedChart>
          </ResponsiveContainer>
        </div>
      ) : (
        <div className="h-[240px] flex items-center justify-center text-sm text-muted-foreground">
          Add a savings goal to see your trajectory.
        </div>
      )}
    </Card>
  );
}
