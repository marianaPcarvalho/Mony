import { useStore } from "@/lib/store";
import { Card } from "@/components/ui/card";
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from "recharts";
import { TrendingDown, PiggyBank, Wallet } from "lucide-react";

const PT_MONTHS = ["Janeiro", "Fevereiro", "Março", "Abril", "Maio", "Junho", "Julho", "Agosto", "Setembro", "Outubro", "Novembro", "Dezembro"];

const COLORS = [
  "hsl(var(--chart-1))",
  "hsl(var(--chart-2))",
  "hsl(var(--chart-3))",
  "hsl(var(--chart-4))",
  "hsl(var(--chart-5))",
  "hsl(var(--chart-6))",
];

export function HomeHero() {
  const { data, selectedMonth, getCategorySpent, getSalary, getTotalSpent, getActualSavedTotal } = useStore();

  // Always display the current month in Portugal (Europe/Lisbon)
  const now = new Date();
  const ptMonthName = PT_MONTHS[now.getMonth()];
  const ptYear = now.getFullYear();

  const salary = getSalary(selectedMonth);
  const spent = getTotalSpent(selectedMonth);
  const current = salary - spent;

  const pieData = data.categories
    .map((c, i) => ({
      name: c.name,
      icon: c.icon,
      value: getCategorySpent(c.id, selectedMonth),
      color: COLORS[i % COLORS.length],
    }))
    .filter(d => d.value > 0);

  const fmt = (v: number) => `€${v.toLocaleString("en", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

  const savings = getActualSavedTotal();
  const stats = [
    { label: "Current", value: fmt(current), icon: Wallet, tone: current >= 0 ? "success" : "destructive" as const },
    { label: "Total spent", value: fmt(spent), icon: TrendingDown, tone: "destructive" as const },
    { label: "Current savings", value: fmt(savings), icon: PiggyBank, tone: "success" as const },
  ];

  return (
    <Card className="glass-card p-6">
      <div className="flex items-baseline justify-between gap-3 mb-5">
        <h2 className="text-2xl font-bold tracking-tight text-foreground capitalize">
          {ptMonthName}<span className="text-muted-foreground font-medium ml-2 text-base">{ptYear}</span>
        </h2>
      </div>

      <div className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-center">
          {/* Donut */}
          <div className="relative">
            {pieData.length > 0 ? (
              <>
                <ResponsiveContainer width="100%" height={260}>
                  <PieChart>
                    <Pie
                      data={pieData}
                      cx="50%" cy="50%"
                      innerRadius={75} outerRadius={115}
                      dataKey="value" paddingAngle={0} strokeWidth={0}
                      isAnimationActive={false}
                      style={{ pointerEvents: "none", outline: "none" }}
                    >
                      {pieData.map((entry, i) => <Cell key={i} fill={entry.color} style={{ outline: "none" }} />)}
                    </Pie>
                    <Tooltip
                      wrapperStyle={{ outline: "none", fontSize: 11 }}
                      contentStyle={{ padding: "4px 8px", borderRadius: 6, fontSize: 11 }}
                      formatter={(value: number, _name, item: any) => {
                        const total = pieData.reduce((s, p) => s + p.value, 0);
                        const pct = total > 0 ? (value / total) * 100 : 0;
                        return [`€${value.toFixed(2)} (${pct.toFixed(1)}%)`, item?.payload?.name];
                      }}
                    />
                  </PieChart>
                </ResponsiveContainer>
                <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none" style={{ height: 260 }}>
                  <span className="text-[10px] uppercase tracking-wider text-muted-foreground">Spent</span>
                  <span className="font-mono font-bold text-xl text-foreground">{fmt(spent)}</span>
                </div>
              </>
            ) : (
              <div className="h-[260px] flex items-center justify-center text-sm text-muted-foreground">
                No expenses yet this month
              </div>
            )}
          </div>

          {/* Legend list on the right */}
          {pieData.length > 0 ? (
            <ul className="space-y-1.5" aria-label="Spending breakdown">
              {pieData
                .slice()
                .sort((a, b) => b.value - a.value)
                .map((d, i) => {
                  const total = pieData.reduce((s, p) => s + p.value, 0);
                  const pct = total > 0 ? (d.value / total) * 100 : 0;
                  return (
                    <li key={i} className="flex items-center justify-between gap-3 px-3 py-2 rounded-lg hover:bg-muted/50 transition-colors">
                      <div className="flex items-center gap-2.5 min-w-0">
                        <span className="w-2.5 h-2.5 rounded-full flex-shrink-0" style={{ background: d.color }} aria-hidden="true" />
                        <span className="text-sm font-medium text-foreground truncate">{d.icon} {d.name}</span>
                      </div>
                      <div className="flex items-center gap-2 flex-shrink-0">
                        <span className="font-mono text-sm font-semibold text-foreground">{fmt(d.value)}</span>
                        <span className="text-xs text-muted-foreground tabular-nums w-10 text-right">{pct.toFixed(1)}%</span>
                      </div>
                    </li>
                  );
                })}
            </ul>
          ) : (
            <div className="text-sm text-muted-foreground">Add an expense to see your breakdown.</div>
          )}
        </div>

        {/* Stats row */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          {stats.map(s => (
            <div key={s.label} className="flex items-center justify-between p-4 rounded-xl bg-muted/50 border border-border">
              <div className="flex items-center gap-3">
                <div className={`h-9 w-9 rounded-lg flex items-center justify-center ${s.tone === "success" ? "bg-success/15 text-success" : "bg-destructive/15 text-destructive"}`}>
                  <s.icon className="h-4 w-4" />
                </div>
                <span className="text-xs uppercase tracking-wider text-muted-foreground font-medium">{s.label}</span>
              </div>
              <span className={`font-mono font-bold text-base ${s.tone === "success" ? "text-success" : "text-destructive"}`}>
                {s.value}
              </span>
            </div>
          ))}
        </div>
      </div>
    </Card>
  );
}
